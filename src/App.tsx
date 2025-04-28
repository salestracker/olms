import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Simple App component for GitHub Pages
const App: React.FC = () => {
  return (
    <Router basename="/olms">
      <div style={{ 
        fontFamily: 'Arial, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px'
      }}>
        <header style={{ 
          background: '#f0f2f5', 
          padding: '20px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h1>Zenith Order Lifecycle Management</h1>
          <nav>
            <ul style={{ 
              display: 'flex', 
              listStyle: 'none', 
              gap: '20px',
              padding: 0
            }}>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/login">Login</Link></li>
            </ul>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <footer style={{ 
          marginTop: '40px', 
          padding: '20px', 
          borderTop: '1px solid #eee',
          textAlign: 'center'
        }}>
          <p>© 2025 Zenith Manufacturing. All rights reserved.</p>
          <p>
            <a href="https://olms-dqtb.onrender.com" target="_blank" rel="noopener noreferrer">
              Backend API
            </a>
          </p>
        </footer>
      </div>
    </Router>
  );
};

// Simple page components
const Home = () => (
  <div>
    <h2>Welcome to Zenith Order Lifecycle Management</h2>
    <p>This is a demo of the GitHub Pages deployment.</p>
    <p>The actual application requires authentication.</p>
    <p>Please visit the <Link to="/login">login page</Link> to access the full application.</p>
  </div>
);

const About = () => (
  <div>
    <h2>About Zenith OLMS</h2>
    <p>Zenith Order Lifecycle Management System (OLMS) is a comprehensive solution for tracking and managing manufacturing orders.</p>
    <p>Key features include:</p>
    <ul>
      <li>Real-time order tracking</li>
      <li>Status updates and notifications</li>
      <li>Quality control integration</li>
      <li>Customer communication portal</li>
      <li>Analytics and reporting</li>
    </ul>
  </div>
);

const Login = () => (
  <div>
    <h2>Login</h2>
    <p>This is a demo page. In the real application, you would see a login form here.</p>
    <p>The backend API is hosted at: <a href="https://olms-dqtb.onrender.com" target="_blank" rel="noopener noreferrer">https://olms-dqtb.onrender.com</a></p>
  </div>
);

const NotFound = () => (
  <div>
    <h2>404 - Page Not Found</h2>
    <p>The page you are looking for does not exist.</p>
    <p><Link to="/">Go back to the homepage</Link></p>
  </div>
);

export default App;