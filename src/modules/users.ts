import { z } from 'zod';
import { 
  adminProcedure, 
  protectedProcedure, 
  publicProcedure, 
  createAuthRouter
} from '../core/trpc';
import { TRPCError } from '@trpc/server';
import { userRepository } from '../database/userRepository';
import { generateToken } from '../auth/jwt';

// User router with lumos-ts patterns - now using persistent storage via SQLite
export const usersRouter = createAuthRouter({
  // Public: Login with JWT token generation - temporarily simplified for debugging
  login: publicProcedure
    .input(z.any()) // Accept any input for debugging
    .mutation(async ({ input, ctx }) => {
      // Enhanced debugging logs - log everything
      console.log("Received login payload:", {
        rawInput: input,
        inputType: typeof input,
        inputKeys: input ? Object.keys(input) : [],
        contextInfo: ctx.isAuthenticated
      });
      
      // Extract email and password from various possible input formats
      let email, password;
      
      if (typeof input === 'object' && input !== null) {
        if (input.email && input.password) {
          // Format 1: { email, password }
          email = input.email;
          password = input.password;
        } else if (input.json && typeof input.json === 'object') {
          // Format 2: { json: { email, password } }
          email = input.json.email;
          password = input.json.password;
        }
      }
      
      console.log("Extracted credentials:", { email, password });
      // If we couldn't extract valid credentials, return an error early
      if (!email || !password) {
        console.error("Missing email or password in request");
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email and password are required'
        });
      }
      
      try {
        // Authenticate with database-backed repository using the extracted credentials
        const user = await userRepository.authenticate(email, password);
        
        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid credentials'
          });
        }
        
        // Generate JWT token
        const token = generateToken(user);
        
        return {
          user,
          token
        };
      } catch (error: any) {
        console.error("Authentication error:", error);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message || 'Authentication failed'
        });
      }
    }),
  
  // Protected: Get current user from JWT context
  me: protectedProcedure
    .query(({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        });
      }
      return ctx.user;
    }),
  
  // Admin: Get all users from database
  getAll: adminProcedure
    .query(() => {
      return userRepository.getAll();
    }),
  
  // Protected: Get user by ID with role-based access control
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      const user = userRepository.getById(input.id);
      
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }
      
      // Only admins or the user themselves can access user details
      if (ctx.user?.role !== 'admin' && ctx.user?.id !== input.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied'
        });
      }
      
      return user;
    }),
  
  // Admin: Create user in database
  createUser: adminProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string(),
      role: z.enum(['admin', 'customer', 'factory'])
    }))
    .mutation(async ({ input }) => {
      try {
        // This already handles hashing in the repository
        return userRepository.create({
          email: input.email,
          password: input.password,
          name: input.name,
          role: input.role
        });
      } catch (error: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to create user'
        });
      }
    }),
  
  // Admin: Update password in database with hashing
  updatePassword: adminProcedure
    .input(z.object({
      userId: z.string(),
      newPassword: z.string().min(6)
    }))
    .mutation(async ({ input }) => {
      try {
        const success = userRepository.updatePassword(
          input.userId, 
          input.newPassword
        );
        
        if (!success) {
          throw new Error('User not found');
        }
        
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to update password'
        });
      }
    })
});
