import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../index';
// Import superjson for serialization
import superjson from 'superjson';
import { getToken, getAuthHeaders } from './auth';

// Create a TRPC client
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:4000/trpc',
      headers: () => {
        const token = getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
  transformer: superjson,
});

// Simple service implementations
export const loginService = {
  login: async (email: string, password: string) => {
    try {
      console.log('Sending login request with:', { email, password });
      
      // Use the TRPC client directly for proper handling
      const result = await trpcClient.users.login.mutate({ email, password });
      console.log('Login result:', result);
      return result;
    } catch (error) {
      console.error('Login error in service:', error);
      throw error;
    }
  },
  getCurrentUser: async () => {
    try {
      console.log('Fetching current user');
      const token = getToken();
      if (!token) {
        console.warn('No token available for getCurrentUser');
        return null;
      }
      
      // Use the TRPC client directly for proper handling
      try {
        // Use the query endpoint (GET request)
        console.log('Trying to fetch user with token:', token ? 'Token exists' : 'No token');
        return await trpcClient.users.me.query();
      } catch (error) {
        console.error('Error fetching current user with query:', error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  },
  getTestAccounts: () => {
    return [
      {
        role: 'admin',
        email: 'admin@zenith.com',
        password: 'admin123',
        description: 'Full access to all features, including user management and ERP integration.'
      },
      {
        role: 'factory',
        email: 'factory@zenith.com',
        password: 'factory123',
        description: 'Access to manufacturing data, order status updates, and factory operations.'
      },
      {
        role: 'customer',
        email: 'customer@zenith.com',
        password: 'customer123',
        description: 'Limited access to view and track their own orders only.'
      }
    ];
  }
};

export const ordersService = {
  getAllOrders: async () => {
    try {
      console.log('Fetching all orders');
      // Use the TRPC client directly for proper handling
      return await trpcClient.orders.getAll.query();
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return [];
    }
  },
  
  getOrdersByStatus: async (status: string) => {
    try {
      console.log(`Fetching orders with status: ${status}`);
      // Use the TRPC client directly for proper input handling
      return await trpcClient.orders.getByStatus.query({ status });
    } catch (error) {
      console.error(`Error fetching orders with status ${status}:`, error);
      return [];
    }
  },
  
  getOrdersByUserId: async (userId: string) => {
    try {
      console.log(`Fetching orders for user: ${userId}`);
      // Use the TRPC client directly for proper handling
      return await trpcClient.orders.getByUserId.query({ userId });
    } catch (error) {
      console.error(`Error fetching orders for user ${userId}:`, error);
      return [];
    }
  },
  
  getAnalytics: async () => {
    try {
      console.log('Fetching order analytics');
      // Use the TRPC client directly for proper handling
      return await trpcClient.orders.getAnalytics.query();
    } catch (error) {
      console.error('Error fetching order analytics:', error);
      return {
        totalOrders: 0,
        byStatus: {},
        pieChartData: []
      };
    }
  },
  
  addSuggestion: async (orderId: string, suggestion: string) => {
    try {
      console.log(`Adding suggestion to order ${orderId}: ${suggestion}`);
      // Use the TRPC client directly for proper handling
      return await trpcClient.orders.addSuggestion.mutate({ 
        id: orderId, 
        suggestion 
      });
    } catch (error) {
      console.error('Error adding suggestion:', error);
      throw error;
    }
  },
  
  // Keep the original methods for backward compatibility
  getAll: async () => {
    return trpcClient.orders.getAll.query();
  },
  getById: async (id: string) => {
    return trpcClient.orders.getById.query({ id });
  }
};

// Helper function to handle API errors consistently
export const handleApiError = (error: unknown): { message: string; code?: string } => {
  console.error('API Error:', error);
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return {
      message: String(error.message),
      code: 'code' in error ? String(error.code) : 'UNKNOWN_ERROR'
    };
  }
  
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  };
};

// Type definitions for API responses
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

// Async wrapper for trpc calls with consistent error handling
export async function safeApiCall<T>(
  apiCall: () => Promise<T>
): Promise<ApiResponse<T>> {
  try {
    const data = await apiCall();
    return { data };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}