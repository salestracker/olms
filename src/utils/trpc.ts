import { createTRPCClient, lumosLoginService, lumosOrdersService } from 'lumos-ts';
import superjson from 'superjson';

// Create a TRPC client using lumos-ts's built-in services for authentication and order management.
export const trpcClient = createTRPCClient({
  url: '/api/trpc',
  transformer: superjson,
  loginService: lumosLoginService,
  ordersService: lumosOrdersService,
});

// Re-export login and orders services for component-level usage.
export const loginService = lumosLoginService;
export const ordersService = lumosOrdersService;

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