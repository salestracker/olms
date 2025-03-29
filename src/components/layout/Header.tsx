import React from 'react';
import { clearAuth, getCurrentUser } from '../../utils/auth';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const user = getCurrentUser();

  const handleLogout = () => {
    clearAuth();
    onLogout();
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 24px',
      backgroundColor: '#f0f2f5',
      borderBottom: '1px solid #e8e8e8',
      marginBottom: '24px'
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '18px', color: '#1890ff' }}>
          Zenith Order Lifecycle Management
        </h1>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {user && (
          <>
            <div style={{
              backgroundColor: '#e6f7ff',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#1890ff',
              textTransform: 'capitalize'
            }}>
              {user.role}
            </div>
            
            <div style={{ fontSize: '14px' }}>
              <strong>User:</strong> {user.name}
            </div>
            
            <button 
              onClick={handleLogout}
              style={{
                backgroundColor: '#ff4d4f',
                color: 'white',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
