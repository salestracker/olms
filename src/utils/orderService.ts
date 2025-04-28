import { trpcClient } from './trpc';
import { mockOrderService, shouldUseMockApi } from './mockApi';

// Order service with GitHub Pages support
export const orderService = {
  getAll: async () => {
    try {
      // Use mock API when deployed on GitHub Pages
      if (shouldUseMockApi()) {
        console.log('Using mock API for getAll orders');
        return mockOrderService.getAll();
      }
      
      // Use the TRPC client for real API
      return await trpcClient.orders.getAll.query();
    } catch (error) {
      console.error('Error getting all orders:', error);
      return [];
    }
  },
  
  getByUserId: async (userId: string) => {
    try {
      // Use mock API when deployed on GitHub Pages
      if (shouldUseMockApi()) {
        console.log('Using mock API for getByUserId');
        return mockOrderService.getByUserId(userId);
      }
      
      // Use the TRPC client for real API
      return await trpcClient.orders.getByUserId.query({ userId });
    } catch (error) {
      console.error('Error getting orders by user ID:', error);
      return [];
    }
  },
  
  getByStatus: async (status: string) => {
    try {
      // Use mock API when deployed on GitHub Pages
      if (shouldUseMockApi()) {
        console.log('Using mock API for getByStatus');
        return mockOrderService.getByStatus(status);
      }
      
      // Use the TRPC client for real API
      return await trpcClient.orders.getByStatus.query({ status });
    } catch (error) {
      console.error('Error getting orders by status:', error);
      return [];
    }
  },
  
  getById: async (id: string) => {
    try {
      // Use mock API when deployed on GitHub Pages
      if (shouldUseMockApi()) {
        console.log('Using mock API for getById');
        return mockOrderService.getById(id);
      }
      
      // Use the TRPC client for real API
      return await trpcClient.orders.getById.query({ id });
    } catch (error) {
      console.error('Error getting order by ID:', error);
      return null;
    }
  },
  
  create: async (orderData: any) => {
    try {
      // Use mock API when deployed on GitHub Pages
      if (shouldUseMockApi()) {
        console.log('Using mock API for create order');
        return mockOrderService.create(orderData);
      }
      
      // Use the TRPC client for real API
      return await trpcClient.orders.create.mutate(orderData);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },
  
  update: async (id: string, orderData: any) => {
    try {
      // Use mock API when deployed on GitHub Pages
      if (shouldUseMockApi()) {
        console.log('Using mock API for update order');
        return mockOrderService.update(id, orderData);
      }
      
      // Use the TRPC client for real API
      return await trpcClient.orders.update.mutate({ id, ...orderData });
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },
  
  getAnalytics: async () => {
    try {
      // Use mock API when deployed on GitHub Pages
      if (shouldUseMockApi()) {
        console.log('Using mock API for getAnalytics');
        return mockOrderService.getAnalytics();
      }
      
      // Use the TRPC client for real API
      return await trpcClient.orders.getAnalytics.query();
    } catch (error) {
      console.error('Error getting order analytics:', error);
      return {
        statusCounts: [],
        totalOrders: 0,
        totalAmount: 0
      };
    }
  }
};