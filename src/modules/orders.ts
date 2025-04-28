import { z } from 'zod';
import { 
  adminProcedure, 
  factoryProcedure, 
  customerProcedure, 
  protectedProcedure, 
  createAuthRouter
} from '../core/trpc';
import { orderRepository } from '../database/orderRepository';

// Define the schema for order status using Zod validation
const orderStatusSchema = z.enum([
  'pending',
  'processing',
  'manufacturing',
  'quality_check',
  'shipped',
  'delivered',
  'cancelled'
]);

// Define the orders router with role-based access control
// Now using SQLite persistent storage
export const ordersRouter = createAuthRouter({
  // Admin-only: Get all orders from database 
  getAll: adminProcedure
    .query(() => {
      return orderRepository.getAll();
    }),

  // Protected: Get orders by user ID with role-based access control
  getByUserId: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input, ctx }) => {
      // If customer, can only see their own orders
      if (ctx.user?.role === 'customer' && ctx.user.id !== input.userId) {
        throw new Error('Access denied: Cannot view other customers\' orders');
      }
      
      return orderRepository.getByUserId(input.userId);
    }),

  // Factory staff: Get orders by status 
  getByStatus: factoryProcedure
    .input(z.object({ status: orderStatusSchema }))
    .query(({ input }) => {
      return orderRepository.getByStatus(input.status);
    }),

  // Protected: Get a single order by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      const order = orderRepository.getById(input.id);
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      // Role-based access check
      if (ctx.user?.role === 'customer' && order.user_id !== ctx.user.id) {
        throw new Error('Access denied: Cannot view this order');
      }
      
      return order;
    }),
    
  // Get order timeline - for tracking status changes
  getOrderTimeline: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(({ input, ctx }) => {
      // Get the order first to check permission
      const order = orderRepository.getById(input.orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      // Role-based access check
      if (ctx.user?.role === 'customer' && order.user_id !== ctx.user.id) {
        throw new Error('Access denied: Cannot view this order timeline');
      }
      
      // Get the timeline
      return orderRepository.getOrderTimeline(input.orderId);
    }),

  // Admin-only: Update order status with description
  updateStatus: adminProcedure
    .input(z.object({ 
      id: z.string(),
      status: orderStatusSchema,
      description: z.string().optional()
    }))
    .mutation(({ input }) => {
      const result = orderRepository.updateStatus(input.id, input.status, input.description);
      
      if (!result) {
        throw new Error('Order not found or update failed');
      }
      
      return result;
    }),

  // Factory staff: Add a suggestion to an order
  addSuggestion: factoryProcedure
    .input(z.object({
      id: z.string(),
      suggestion: z.string()
    }))
    .mutation(({ input }) => {
      const result = orderRepository.addSuggestion(input.id, input.suggestion);
      
      if (!result) {
        throw new Error('Order not found or suggestion failed');
      }
      
      return result;
    }),

  // Admin-only: Get analytics data using SQL aggregation
  getAnalytics: adminProcedure
    .query(() => {
      return orderRepository.getAnalytics();
    }),
    
  // Admin-only: Create a new order
  createOrder: adminProcedure
    .input(z.object({
      user_id: z.string(),
      status: orderStatusSchema,
      customer_name: z.string(),
      amount: z.number().positive(),
      details: z.any().optional()
    }))
    .mutation(({ input }) => {
      // Stringify the details if it's an object
      const details = input.details ? 
        (typeof input.details === 'string' ? 
          input.details : 
          JSON.stringify(input.details)
        ) : undefined;
      
      return orderRepository.create({
        user_id: input.user_id,
        status: input.status,
        customer_name: input.customer_name,
        amount: input.amount,
        details
      });
    }),
    
  // Admin-only: Delete an order (dangerous operation)
  deleteOrder: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const success = orderRepository.delete(input.id);
      
      if (!success) {
        throw new Error('Order not found or delete failed');
      }
      
      return { success };
    })
});
