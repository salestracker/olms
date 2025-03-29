import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Mock user context - in a real app, this would come from an auth provider
type UserRole = 'admin' | 'customer' | 'factory';
const mockUser = {
  id: 'customer1',
  role: 'admin' as UserRole
};

// Mock API calls - in a real app, these would use trpc client
const fetchAllOrders = async () => {
  // This would be replaced with trpc.orders.getAll.query()
  const response = await fetch('http://localhost:4000/trpc/orders.getAll');
  const data = await response.json();
  return data.result.data;
};

const fetchOrdersByUserId = async (userId: string) => {
  // This would be replaced with trpc.orders.getByUserId.query({ userId })
  const response = await fetch(`http://localhost:4000/trpc/orders.getByUserId?input=${JSON.stringify({ userId })}`);
  const data = await response.json();
  return data.result.data;
};

const fetchFactoryOrders = async () => {
  // This would get all orders that are in production (not pending or cancelled)
  const statuses = ['processing', 'manufacturing', 'quality_check', 'shipped'];
  const allOrders = await fetchAllOrders();
  return allOrders.filter(order => statuses.includes(order.status));
};

const fetchAnalytics = async () => {
  // This would be replaced with trpc.orders.getAnalytics.query()
  const response = await fetch('http://localhost:4000/trpc/orders.getAnalytics');
  const data = await response.json();
  return data.result.data;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B'];

const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { role, id } = mockUser;

  // Track if already fetching data to prevent duplicate fetches
  const [isFetching, setIsFetching] = useState(false);
  
  // Add lifecycle logging for debugging
  useEffect(() => {
    console.log('Dashboard page component mounted');
    return () => console.log('Dashboard page component unmounted');
  }, []);

  useEffect(() => {
    // Skip if already fetching
    if (isFetching) return;
    
    const loadData = async () => {
      try {
        setIsFetching(true);
        setLoading(true);
        
        console.log('Dashboard page: loading data for role:', role);
        
        // Load appropriate orders based on user role
        let ordersData;
        if (role === 'admin') {
          ordersData = await fetchAllOrders();
        } else if (role === 'factory') {
          ordersData = await fetchFactoryOrders();
        } else {
          // Customer role
          ordersData = await fetchOrdersByUserId(id);
        }
        
        setOrders(ordersData);
        
        // Only load analytics for admin
        if (role === 'admin') {
          const analyticsData = await fetchAnalytics();
          setAnalytics(analyticsData);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    };
    
    loadData();
  }, [role, id, isFetching]);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Order Management Dashboard ({role})</h1>
      
      <div className="dashboard-content">
        <div className="orders-section">
          <h2>Orders ({orders.length})</h2>
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customerName}</td>
                    <td>{order.status}</td>
                    <td>${order.details.totalAmount}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      {role === 'admin' && (
                        <>
                          <button>View</button>
                          <button>Edit</button>
                        </>
                      )}
                      {role === 'factory' && (
                        <button>Add Suggestion</button>
                      )}
                      {role === 'customer' && order.status === 'pending' && (
                        <button>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {role === 'admin' && analytics && (
          <div className="analytics-section">
            <h2>Analytics</h2>
            <div className="kpi-cards">
              <div className="kpi-card">
                <h3>Total Orders</h3>
                <div className="kpi-value">{analytics.totalOrders}</div>
              </div>
              {Object.entries(analytics.byStatus).map(([status, count]: [string, any]) => (
                <div className="kpi-card" key={status}>
                  <h3>{status}</h3>
                  <div className="kpi-value">{count}</div>
                </div>
              ))}
            </div>
            
            <div className="chart-container">
              <h3>Orders by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                    label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
                  >
                    {analytics.pieChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
      
      {/* Styles would typically be in a separate CSS file or using a CSS-in-JS library */}
    </div>
  );
};

export default Dashboard;
