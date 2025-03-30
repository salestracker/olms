import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { verifyToken } from '../auth/jwt';
import { userRepository } from '../database/userRepository';
import { createRouter, createMiddleware, createContext as lumosCreateContext } from 'lumos-ts';

// Define our auth user type (extending lumos-ts types)
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer' | 'factory';
}

// Define context shape
export interface Context {
  user?: AuthUser | null;
  isAuthenticated: boolean;
}

// Create the auth context from request
export const createAuthContext = (req: any): Context => {
  // Extract authorization header
  const authHeader = req.headers.authorization;
  
  // Debug information for request headers
  console.log('Request headers:', {
    auth: authHeader ? `${authHeader.substring(0, 15)}...` : 'none',
    contentType: req.headers['content-type']
  });
  
  if (!authHeader) {
    console.warn('Authentication failed: No authorization header');
    return { isAuthenticated: false };
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    console.warn('Authentication failed: Invalid authorization format (should start with "Bearer ")');
    return { isAuthenticated: false };
  }
  
  // Extract token
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    console.warn('Authentication failed: Empty token');
    return { isAuthenticated: false };
  }
  
  // Verify token
  const payload = verifyToken(token);
  if (!payload) {
    console.warn('Authentication failed: Invalid or expired token');
    return { isAuthenticated: false };
  }
  
  // Get the user from the database
  const user = userRepository.getById(payload.id);
  
  if (!user) {
    console.warn(`Authentication failed: User id ${payload.id} not found in database`);
    return { isAuthenticated: false };
  }
  
  console.log(`User authenticated: ${user.email} (${user.role})`);
  
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'admin' | 'customer' | 'factory'
    },
    isAuthenticated: true
  };
};

// Create the base context function
export const createContext = async ({ req, res }: any) => {
  return createAuthContext(req);
};

// Initialize TRPC with our context and error formatting
export const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    console.error('TRPC Error:', error);
    return {
      ...shape,
      message: error.message,
      code: shape.code,
      data: {
        ...shape.data,
        stack: error.stack,
      }
    };
  },
});

// Create middleware for authorization
export const isAuthorized = t.middleware(({ ctx, next }) => {
  if (!ctx.isAuthenticated) {
    console.error('Authorization failed: Not authenticated');
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource'
    });
  }
  return next();
});

// Role-based middleware (simulating lumos-ts's withAuth)
export const withAuth = (roles?: string[]) => {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.isAuthenticated) {
      console.error('Authentication required for role access');
      throw new TRPCError({ 
        code: 'UNAUTHORIZED', 
        message: 'Authentication required to access this resource'
      });
    }
    
    if (roles && roles.length > 0 && ctx.user && !roles.includes(ctx.user.role)) {
      console.error(`Role permission denied: ${ctx.user?.role} tried to access endpoint requiring ${roles.join(', ')}`);
      throw new TRPCError({ 
        code: 'FORBIDDEN', 
        message: `Access denied: Your role (${ctx.user?.role}) does not have permission for this operation.` 
      });
    }
    
    return next();
  });
};

// Create procedures with different auth requirements
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthorized);
export const adminProcedure = protectedProcedure.use(withAuth(['admin']));
export const factoryProcedure = protectedProcedure.use(withAuth(['factory']));
export const customerProcedure = protectedProcedure.use(withAuth(['customer']));

// This simulates lumos-ts's router factory pattern
export const createAuthRouter = t.router;
