import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { verifyToken } from '../auth/jwt';
import { userRepository } from '../database/userRepository';
import { createRouter, createMiddleware } from 'lumos-ts';

// Define our auth user type (extending lumos-ts types)
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

// Initialize TRPC with context type
const t = initTRPC.context<{ user?: AuthUser }>().create();

// Export base procedures
export const publicProcedure = t.procedure;
export const router = t.router;
export const middleware = t.middleware;

// Auth middleware - validates JWT token and adds user to context
export const authMiddleware = middleware(async ({ ctx, next }) => {
  const token = ctx.req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication token missing',
    });
  }
  
  try {
    // Verify token and get user ID
    const decoded = verifyToken(token);
    const userId = decoded.sub;
    
    // Get user from repository
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }
    
    // Add user to context
    return next({
      ctx: {
        ...ctx,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        },
      },
    });
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }
});

// Create protected procedure with auth middleware
export const protectedProcedure = publicProcedure.use(authMiddleware);

// Role-based access control middleware
export const roleMiddleware = (allowedRoles: string[]) => {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }
    
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }
    
    return next();
  });
};