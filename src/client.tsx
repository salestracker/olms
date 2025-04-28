import process from 'process/browser';
if (typeof window !== 'undefined') {
  window.process = process;
}

import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { isAuthenticated, clearAuth, getToken, getCurrentUser } from "./utils/auth";
import { loginService } from "./utils/trpc";
import LoginPage from "./components/auth/LoginPage";
import Header from "./components/layout/Header";
import Dashboard from "./components/layout/Dashboard";

/**
 * Main application component with authentication state management
 */
const App: React.FC = () => {
  // Authentication state
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  // Add loading state to prevent flashing content
  const [loading, setLoading] = useState<boolean>(true);
  // Add error state for authentication issues
  const [authError, setAuthError] = useState<string | null>(null);
  // Add tracker for auth check
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(false);
  
  // Check authentication on mount with enhanced error handling
  useEffect(() => {
    console.log('App component mounted');
    
    // Check authentication status
    const checkAuth = async () => {
      // Prevent multiple concurrent auth checks
      if (isCheckingAuth) return;
      
      setIsCheckingAuth(true);
      try {
        // Get token and verify it exists
        const token = getToken();
        if (!token) {
          console.warn('No authentication token found');
          setAuthError('Authentication token missing. Please log in again.');
          setAuthenticated(false);
          setLoading(false);
          return;
        }
        
        console.log('Auth check: token exists, checking validity');
        
        // First check if we have a user in localStorage
        const localUser = getCurrentUser();
        if (!localUser) {
          console.warn('No user data in localStorage');
          setAuthenticated(false);
          setAuthError('Your session has expired. Please log in again.');
          setLoading(false);
          return;
        }
        
        // Set authenticated based on local data
        setAuthenticated(true);
        setAuthError(null);
        
        // Try to validate with the server in the background
        try {
          const apiUser = await loginService.getCurrentUser();
          if (apiUser) {
            console.log('Authentication validated with server');
          }
        } catch (apiError) {
          console.warn('Server validation failed, but continuing with local auth:', apiError);
        }
        
        console.log('Authentication successful');
      } catch (error) {
        console.error('Authentication check error:', error);
        setAuthError('Authentication error. Please try again.');
        setAuthenticated(false);
      } finally {
        setLoading(false);
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
    
    // Set up periodic auth check every 5 minutes
    const authCheckInterval = setInterval(checkAuth, 5 * 60 * 1000);
    
    return () => {
      console.log('App component unmounting, clearing interval');
      clearInterval(authCheckInterval);
    };
  }, [isCheckingAuth]); // Only re-run if isCheckingAuth changes
  
  // Handle successful login
  const handleLogin = () => {
    console.log('Login successful');
    setAuthError(null);
    setAuthenticated(true);
  };
  
  // Handle logout with enhanced cleanup
  const handleLogout = () => {
    console.log('Logging out user');
    clearAuth();
    setAuthenticated(false);
    // Clear any cached data or state that should be reset on logout
    // This helps prevent any data leakage between user sessions
  };
  
  // Show loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif' 
      }}>
        <div>
          <div style={{ textAlign: 'center', color: '#1890ff' }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }
  
  // Render based on authentication state
  return authenticated ? (
    // Authenticated view with header and dashboard
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif"
    }}>
      <Header onLogout={handleLogout} />
      <main style={{ flex: 1 }}>
        <Dashboard />
      </main>
    </div>
  ) : (
    // Login page for unauthenticated users
    <LoginPage 
      onLogin={handleLogin} 
      error={authError} // Pass error state to login page
    />
  );
};

// Mount the app to DOM
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
