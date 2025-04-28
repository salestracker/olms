/**
 * Authentication utility functions for the frontend
 */

// Local storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'current_user';

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer' | 'factory';
}

/**
 * Store authentication token and user info in local storage
 */
export const storeAuth = (token: string, user: User): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Get the stored auth token from local storage
 */
export const getToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  // Log token presence (not the actual token) for debugging
  console.log('Auth token exists in localStorage:', !!token);
  return token;
};

/**
 * Get the current user from local storage
 */
export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson) as User;
  } catch (e) {
    console.error('Error parsing user data from local storage', e);
    return null;
  }
};

/**
 * Check if the user is authenticated (client-side only)
 */
export const isAuthenticated = (): boolean => {
  return !!getToken() && !!getCurrentUser();
};

/**
 * Clear authentication data from local storage (logout)
 */
export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Check if the current user has a specific role
 */
export const hasRole = (role: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  return user.role === role;
};

/**
 * Get authorization headers for API requests
 */
export const getAuthHeaders = (): { Authorization?: string } => {
  const token = getToken();
  
  if (!token) {
    console.warn('No auth token found when creating auth headers');
    return {};
  }
  
  // Ensure token is properly formatted with 'Bearer ' prefix
  const authHeader = `Bearer ${token}`;
  console.log('Auth header created:', authHeader.substring(0, 15) + '...');
  return { Authorization: authHeader };
};
