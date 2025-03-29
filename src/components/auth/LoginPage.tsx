import React, { useState, useEffect } from 'react';
import { storeAuth } from '../../utils/auth';
import { loginService } from '../../utils/trpc';

interface LoginPageProps {
  onLogin: () => void;
  error?: string | null; // Add error prop for authentication errors
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error: authError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use effect to set the local error state from the passed auth error
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Get test accounts for display
  const testAccounts = loginService.getTestAccounts();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Log the request for debugging
      console.log('Attempting login with credentials:', { email });
      
      const result = await loginService.login(email, password);
      
      if (result?.token && result?.user) {
        // Log the token format for debugging
        const isValidJwtFormat = result.token.split('.').length === 3;
        console.log('Login successful, token info:', {
          preview: result.token.substring(0, 15) + '...',
          length: result.token.length,
          isValidJwtFormat
        });
        
        // Store authentication data
        storeAuth(result.token, result.user);
        // Trigger parent component callback
        onLogin();
      } else {
        console.error('Invalid login response:', result);
        setError('Invalid login response');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick login with test credentials
  const handleQuickLogin = async (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
    
    try {
      setLoading(true);
      setError(null);
      
      // Log the request for debugging
      console.log('Attempting quick login with credentials:', { testEmail });
      
      const result = await loginService.login(testEmail, testPassword);
      
      if (result?.token && result?.user) {
        // Log the token format for debugging
        const isValidJwtFormat = result.token.split('.').length === 3;
        console.log('Quick login successful, token info:', {
          preview: result.token.substring(0, 15) + '...',
          length: result.token.length,
          isValidJwtFormat
        });
        
        // Store authentication data
        storeAuth(result.token, result.user);
        // Trigger parent component callback
        onLogin();
      } else {
        console.error('Invalid login response from quick login:', result);
        setError('Invalid login response');
      }
    } catch (err: any) {
      console.error('Quick login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Function to run auth diagnostics
  const runAuthDiagnostics = () => {
    // Display current auth state
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('current_user');
    
    // Create a pre-formatted display
    const diagElement = document.createElement('pre');
    diagElement.textContent = JSON.stringify({
      tokenExists: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
      tokenLength: token?.length,
      isJwtFormat: token?.split('.').length === 3,
      userExists: !!user,
      timestamp: new Date().toISOString()
    }, null, 2);
    
    // Clear previous result
    const container = document.getElementById('auth-diagnostics');
    if (container) {
      container.innerHTML = '';
      container.appendChild(diagElement);
    }
  };

  // Function to clear auth storage
  const clearAuthStorage = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    const container = document.getElementById('auth-diagnostics');
    if (container) {
      container.innerHTML = '<div style="color: green">Auth storage cleared!</div>';
    }
  };

  // Function to test backend auth
  const testBackendAuth = () => {
    // Test backend authentication
    fetch('http://localhost:4000/trpc/users.me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ json: {} })
    })
    .then(response => response.json())
    .then(data => {
      const container = document.getElementById('auth-diagnostics');
      if (container) {
        container.innerHTML = '<h4>Backend Auth Test:</h4>';
        const diagElement = document.createElement('pre');
        diagElement.textContent = JSON.stringify(data, null, 2);
        container.appendChild(diagElement);
      }
    })
    .catch(err => {
      const container = document.getElementById('auth-diagnostics');
      if (container) {
        container.innerHTML = `<div style="color: red">Error: ${err.message}</div>`;
      }
    });
  };

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '40px 20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        color: '#1890ff', 
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: '16px',
        marginBottom: '24px'
      }}>
        Zenith Order Lifecycle Management System
      </h1>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        gap: '40px',
        flexWrap: 'wrap'
      }}>
        {/* Login Form */}
        <div style={{ 
          flex: '1', 
          minWidth: '300px',
          backgroundColor: '#f8f8f8',
          padding: '24px',
          borderRadius: '8px'
        }}>
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9'
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9'
                }}
                required
              />
            </div>

            {error && (
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#fff1f0', 
                color: '#f5222d',
                borderRadius: '4px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ 
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                width: '100%',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        {/* Test Account Information */}
        <div style={{ 
          flex: '1.5', 
          minWidth: '300px'
        }}>
          <div style={{ 
            padding: '20px',
            border: '1px solid #f0f0f0',
            borderRadius: '8px',
            backgroundColor: '#fafafa' 
          }}>
            <h2>Testing Instructions</h2>
            <p>
              This prototype demonstrates the Zenith Order Lifecycle Management System with
              role-based access control, JWT authentication, and SQLite persistent storage.
            </p>
            <p>
              You can test different user roles using the following accounts:
            </p>

            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              {testAccounts.map((account, index) => (
                <div key={index} style={{ 
                  marginBottom: '20px',
                  padding: '16px',
                  borderRadius: '4px',
                  backgroundColor: index % 2 === 0 ? '#f0f8ff' : '#fff',
                  border: '1px solid #d9d9d9'
                }}>
                  <h3 style={{ marginTop: 0, color: '#1890ff', textTransform: 'capitalize' }}>
                    {account.role}
                  </h3>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Email:</strong> {account.email}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Password:</strong> {account.password}
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <strong>Capabilities:</strong> {account.description}
                  </div>
                  <button
                    onClick={() => handleQuickLogin(account.email, account.password)}
                    style={{ 
                      backgroundColor: '#52c41a',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                    disabled={loading}
                  >
                    Login as {account.role}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ 
              backgroundColor: '#fffbe6', 
              padding: '16px', 
              borderRadius: '4px',
              border: '1px solid #ffe58f'
            }}>
              <h3 style={{ margin: 0, marginBottom: '8px' }}>Implementation Notes</h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>JWT authentication with persistent storage</li>
                <li>Role-based access control for all endpoints</li>
                <li>SQLite database for storing users, orders, and order timeline</li>
                <li>Custom RBAC middleware for enhanced security</li>
                <li>Full ERP system integration APIs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    
      {/* Authentication Diagnostics Panel */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        backgroundColor: '#fafafa'
      }}>
        <h3 style={{ marginTop: 0 }}>Authentication Diagnostics</h3>
        <button
          onClick={runAuthDiagnostics}
          style={{
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          Run Auth Diagnostics
        </button>
        
        <button
          onClick={clearAuthStorage}
          style={{
            backgroundColor: '#ff4d4f',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: '10px',
            marginBottom: '10px'
          }}
        >
          Clear Auth Storage
        </button>
        
        <button
          onClick={testBackendAuth}
          style={{
            backgroundColor: '#52c41a',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: '10px',
            marginBottom: '10px'
          }}
        >
          Test Backend Auth
        </button>
        
        <div id="auth-diagnostics" style={{ 
          minHeight: '100px',
          backgroundColor: '#fff',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #d9d9d9'
        }}>
          Diagnostic results will appear here...
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
