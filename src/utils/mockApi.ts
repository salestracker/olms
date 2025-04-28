// Mock API service for GitHub Pages deployment
import { v4 as uuidv4 } from 'uuid';

// Mock user data
const mockUsers = [
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@zenith.com',
    role: 'admin',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'factory-1',
    name: 'Factory Manager',
    email: 'factory@zenith.com',
    role: 'factory',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'customer-1',
    name: 'Customer',
    email: 'customer@zenith.com',
    role: 'customer',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  }
];

// Mock order data
const mockOrders = [
  {
    id: 'order-1',
    user_id: 'customer-1',
    status: 'pending',
    customer_name: 'Customer 1',
    amount: 1000,
    details: 'Order details for order 1',
    suggestion: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'order-2',
    user_id: 'customer-1',
    status: 'manufacturing',
    customer_name: 'Customer 1',
    amount: 2000,
    details: 'Order details for order 2',
    suggestion: null,
    created_at: '2025-01-02T00:00:00.000Z',
    updated_at: '2025-01-02T00:00:00.000Z'
  },
  {
    id: 'order-3',
    user_id: 'customer-1',
    status: 'quality_check',
    customer_name: 'Customer 1',
    amount: 3000,
    details: 'Order details for order 3',
    suggestion: null,
    created_at: '2025-01-03T00:00:00.000Z',
    updated_at: '2025-01-03T00:00:00.000Z'
  },
  {
    id: 'order-4',
    user_id: 'customer-1',
    status: 'shipping',
    customer_name: 'Customer 1',
    amount: 4000,
    details: 'Order details for order 4',
    suggestion: null,
    created_at: '2025-01-04T00:00:00.000Z',
    updated_at: '2025-01-04T00:00:00.000Z'
  },
  {
    id: 'order-5',
    user_id: 'customer-1',
    status: 'delivered',
    customer_name: 'Customer 1',
    amount: 5000,
    details: 'Order details for order 5',
    suggestion: null,
    created_at: '2025-01-05T00:00:00.000Z',
    updated_at: '2025-01-05T00:00:00.000Z'
  }
];

// Mock authentication
export const mockAuth = {
  login: (email: string, password: string) => {
    // In a real app, we would validate the password
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate a mock token
    const token = `mock-token-${user.id}-${Date.now()}`;
    
    return {
      user,
      token
    };
  },
  
  getCurrentUser: (token: string) => {
    // In a real app, we would validate the token
    if (!token || !token.startsWith('mock-token-')) {
      return null;
    }
    
    // Extract the user ID from the token
    const parts = token.split('-');
    const userId = parts[2];
    
    return mockUsers.find(u => u.id === userId) || null;
  }
};

// Mock order service
export const mockOrderService = {
  getAll: () => {
    return [...mockOrders];
  },
  
  getByUserId: (userId: string) => {
    return mockOrders.filter(o => o.user_id === userId);
  },
  
  getByStatus: (status: string) => {
    return mockOrders.filter(o => o.status === status);
  },
  
  getById: (id: string) => {
    return mockOrders.find(o => o.id === id) || null;
  },
  
  create: (orderData: any) => {
    const newOrder = {
      id: `order-${uuidv4()}`,
      ...orderData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockOrders.push(newOrder);
    return newOrder;
  },
  
  update: (id: string, orderData: any) => {
    const index = mockOrders.findIndex(o => o.id === id);
    if (index === -1) {
      throw new Error('Order not found');
    }
    
    mockOrders[index] = {
      ...mockOrders[index],
      ...orderData,
      updated_at: new Date().toISOString()
    };
    
    return mockOrders[index];
  },
  
  getAnalytics: () => {
    // Count orders by status
    const statusCounts = mockOrders.reduce((acc: any, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    
    // Convert to array format
    const analytics = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));
    
    return {
      statusCounts: analytics,
      totalOrders: mockOrders.length,
      totalAmount: mockOrders.reduce((sum, order) => sum + order.amount, 0)
    };
  }
};

// Determine if we should use mock API
export const shouldUseMockApi = (): boolean => {
  // In server-side context, never use mock API
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Only use mock API on GitHub Pages
  return window.location.hostname.includes('github.io');
};