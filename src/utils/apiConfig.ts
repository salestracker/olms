// API configuration for different environments

// Determine the base API URL based on the environment
export const getApiBaseUrl = (): string => {
  // For local development
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    return 'http://localhost:4000';
  }
  
  // For production - using Render for backend hosting
  return 'https://olms-dqtb.onrender.com';
};

// Get the full API URL for a specific endpoint
export const getApiUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${path}`;
};

// Get the TRPC URL
export const getTrpcUrl = (): string => {
  return getApiUrl('/trpc');
};