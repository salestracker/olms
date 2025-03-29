import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../index';
import { getAuthHeaders, getToken } from './auth';
import axios from 'axios';
import { loginService as lumosLoginService, ordersService as lumosOrdersService } from 'lumos-ts';

/**
 * Creates a TRPC client for making API calls to the backend
 */
export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:4000/trpc', // Match the port where the server is running
      // Include JWT token in headers for authenticated requests
      headers() {
        // Debug token presence
        const token = getToken();
        console.log('Auth token available:', !!token);
        
        const headers = {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        };
        
        console.log('Request headers:', headers);
        return headers;
      },
    }),
  ],
});

/**
 * Login service with error handling
 */
export const loginService = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string) {
    try {
      console.log('Attempting login with email:', email);
      
      // Create the payload in the proper TRPC format
      const payload = {
        json: { email, password }
      };
      console.log('Login request payload:', JSON.stringify(payload));
      
      // Use axios instead of fetch for better error handling
      const response = await axios.post('http://localhost:4000/trpc/users.login', payload, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      // Extract data from axios response
      const data = response.data;
      
      if (data.error) {
        console.error('Login error from server:', data.error);
        throw new Error(data.error.message || 'Authentication failed');
      }
      
      if (data.result?.data?.token) {
        // Check if it's a properly formatted JWT (should have 3 parts separated by dots)
        const token = data.result.data.token;
        const isValidJwtFormat = token.split('.').length === 3;
        
        console.log('Login successful, received token info:', {
          tokenPreview: token.substring(0, 15) + '...',
          length: token.length,
          isValidJwtFormat
        });
      } else {
        console.error('Login response missing token:', data);
      }
      
      return data.result.data;
    } catch (error: any) {
      console.error('Login process error:', error);
      throw new Error(error.message || 'Authentication failed');
    }
  },

  /**
   * Get current user info
   */
  async getCurrentUser() {
    try {
      // Verify token exists before making the request
      const token = getToken();
      if (!token) {
        console.error('No authentication token available for getCurrentUser request');
        return null;
      }
      
      return await trpc.users.me.query();
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  },

  /**
   * Test available accounts with mock credentials
   */
  getTestAccounts() {
    return [
      {
        role: 'admin',
        email: 'admin@zenith.com',
        password: 'admin123',
        description: 'Full access to all orders, users, and ERP integrations'
      },
      {
        role: 'factory',
        email: 'factory@zenith.com',
        password: 'factory123',
        description: 'View manufacturing orders, add production suggestions'
      },
      {
        role: 'customer',
        email: 'customer@zenith.com',
        password: 'customer123',
        description: 'View only own orders, track status'
      }
    ];
  }
};

/**
 * Orders service
 */
export const ordersService = {
  /**
   * Get all orders - admin only
   */
  async getAllOrders() {
    try {
      // Verify token exists before making the request
      const token = getToken();
      if (!token) {
        console.error('No authentication token available for getAllOrders request');
        return [];
      }
      
      return await trpc.orders.getAll.query();
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return [];
    }
  },

  /**
   * Get orders for a specific user ID
   */
  async getOrdersByUserId(userId: string) {
    try {
      // Make sure we have a token before making the request
      const token = getToken();
      if (!token) {
        console.error('No authentication token available for getOrdersByUserId request');
        return [];
      }
      
      return await trpc.orders.getByUserId.query({ userId });
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  },

  /**
   * Get orders by status - for factory staff
   */
  async getOrdersByStatus(status: string) {
    try {
      // Make sure we have a token before making the request
      const token = getToken();
      if (!token) {
        console.error('No authentication token available for getOrdersByStatus request');
        return [];
      }
      
      return await trpc.orders.getByStatus.query({ status: status as any });
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      return [];
    }
  },

  /**
   * Add a suggestion to an order - factory staff
   */
  async addSuggestion(orderId: string, suggestion: string) {
    try {
      // Make sure we have a token before making the request
      const token = getToken();
      if (!token) {
        console.error('No authentication token available for addSuggestion request');
        throw new Error('Authentication required');
      }
      
      return await trpc.orders.addSuggestion.mutate({
        id: orderId,
        suggestion
      });
    } catch (error) {
      console.error('Error adding suggestion:', error);
      throw error;
    }
  },

  /**
   * Get analytics data - admin only
   */
  async getAnalytics() {
    try {
      // Make sure we have a token before making the request
      const token = getToken();
      if (!token) {
        console.error('No authentication token available for analytics request');
        return {
          totalOrders: 0,
          byStatus: {},
          pieChartData: []
        };
      }
      
      return await trpc.orders.getAnalytics.query();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Return a fallback object to prevent UI crashes
      return {
        totalOrders: 0,
        byStatus: {},
        pieChartData: []
      };
    }
  }
};
