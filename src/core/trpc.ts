import { createRouter, createMiddleware } from 'lumos-ts';
import { verifyToken } from '../auth/jwt';
import { userRepository } from '../database/userRepository';

// Define our authenticated user type.
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

// Create a TRPC-like router with a context that includes the Express request and response plus an optional user.
export const t = createRouter<{ req: any; res: any; user?: AuthUser }>();

// Define a "public" procedure that does not require authentication.
export const publicProcedure = t.procedure;

// Export the router for building further procedures.
export const router = t.router;

// Export the middleware creator from lumos-ts.
export const middleware = createMiddleware;

// Create and export a context creation function that extracts HTTP info and attempts authentication.
export const createContext = async ({ req, res }: { req: any; res: any }) => {
  const ctx = { req, res, user: undefined as AuthUser | undefined };
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = verifyToken(token);
      const user = await userRepository.findById(decoded.sub);
      if (user) {
        ctx.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        };
      }
    } catch (error) {
      // If token verification fails, context remains unauthenticated.
    }
  }
  return ctx;
};

// Create an authentication middleware that validates the JWT token and enriches the context with the authenticated user.
export const authMiddleware = createMiddleware(async ({ req, res, ctx }, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new Error('UNAUTHORIZED: Authentication token missing');
  }
  try {
    const decoded = verifyToken(token);
    const user = await userRepository.findById(decoded.sub);
    if (!user) {
      throw new Error('UNAUTHORIZED: User not found');
    }
    // Extend the context with authenticated user details.
    const newCtx = {
      ...ctx,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
    };
    return next({ ctx: newCtx });
  } catch (error) {
    throw new Error('UNAUTHORIZED: Invalid or expired token');
  }
});

// Create a protected procedure by using the auth middleware.
export const protectedProcedure = publicProcedure.use(authMiddleware);

// Create and export a role-based middleware that checks if the user has one of the allowed roles.
export const roleMiddleware = (allowedRoles: string[]) =>
  createMiddleware(async ({ ctx }, next) => {
    if (!ctx.user) {
      throw new Error('UNAUTHORIZED: Authentication required');
    }
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new Error('FORBIDDEN: Insufficient permissions');
    }
    return next();
  });