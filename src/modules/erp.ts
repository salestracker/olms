import { z } from 'zod';
import { 
  adminProcedure, 
  factoryProcedure, 
  createAuthRouter
} from 'lumos-ts';
import { erpService } from '../integrations/erp';
import { TRPCError } from '@trpc/server';

// TRPC Router for ERP integration (leveraging lumos-ts patterns)
export const erpRouter = createAuthRouter({
  // Get status from LogicMate ERP (admin/factory only)
  getLogicMateStatus: adminProcedure
    .query(async () => {
      try {
        const status = await erpService.logicMate.syncOrders();
        return {
          connected: true,
          lastSync: new Date().toISOString(),
          data: status
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect to LogicMate ERP'
        });
      }
    }),

  // Get Suntec factory status (admin/factory only)
  getSuntecStatus: factoryProcedure
    .query(async () => {
      try {
        const status = await erpService.suntec.getFactoryStatus();
        return {
          connected: true,
          lastSync: new Date().toISOString(),
          data: status
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect to Suntec ERP'
        });
      }
    }),

  // Get order details from both ERPs
  getOrderERPDetails: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await erpService.getOrderDetails(input.orderId);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch ERP order details'
        });
      }
    }),

  // Sync all ERP systems
  syncAll: adminProcedure
    .mutation(async () => {
      try {
        const result = await erpService.syncAllSystems();
        return {
          success: true,
          timestamp: new Date().toISOString(),
          data: result
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'ERP sync failed'
        });
      }
    }),

  // Update inventory in LogicMate
  updateInventory: adminProcedure
    .input(z.object({
      productId: z.string(),
      quantity: z.number().int().positive()
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await erpService.logicMate.updateInventory(
          input.productId,
          input.quantity
        );
        return {
          success: result,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update inventory'
        });
      }
    }),

  // Update order status in Suntec factory
  updateFactoryStatus: factoryProcedure
    .input(z.object({
      orderId: z.string(),
      status: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await erpService.suntec.updateOrderStatus(
          input.orderId,
          input.status
        );
        return {
          success: result,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update factory status'
        });
      }
    })
});
