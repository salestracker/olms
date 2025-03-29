import React, { useState, useEffect } from 'react';
import { getCurrentUser, hasRole, getToken } from '../../utils/auth';
import { ordersService } from '../../utils/trpc';

interface Order {
  id: string;
  user_id: string;
  status: string;
  customer_name: string;
  amount: number;
  details?: string;
  suggestion?: string;
  created_at?: string;
  updated_at?: string;
}

interface StatusCount {
  status: string;
  count: number;
  percentage: number;
}

const Dashboard: React.FC = () => {
  const user = getCurrentUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalOrders: number;
    byStatus: Record<string, number>;
    pieChartData: StatusCount[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestionText, setSuggestionText] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Status color mapping
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: '#1890ff',
      processing: '#52c41a',
      manufacturing: '#faad14',
      quality_check: '#722ed1',
      shipped: '#13c2c2',
      delivered: '#52c41a',
      cancelled: '#f5222d'
    };
    return colorMap[status] || '#8c8c8c';
  };

  const getStatusBgColor = (status: string) => {
    const bgColorMap: Record<string, string> = {
      pending: '#e6f7ff',
      processing: '#f6ffed',
      manufacturing: '#fff7e6',
      quality_check: '#f9f0ff',
      shipped: '#e6fffb',
      delivered: '#f6ffed',
      cancelled: '#fff1f0'
    };
    return bgColorMap[status] || '#f5f5f5';
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Track if data is currently being fetched to prevent duplicate calls
  const [isFetching, setIsFetching] = useState(false);
  
  // Debug lifecycle hooks
  useEffect(() => {
    console.log('Dashboard component mounted');
    return () => console.log('Dashboard component unmounted');
  }, []);

  // Load orders based on user role
  useEffect(() => {
    // Skip if already fetching or no user
    if (isFetching || !user) return;
    
    const fetchData = async () => {
      setIsFetching(true);
      setLoading(true);
      setError(null);
      
      try {
        if (!user) {
          console.error('No user data available for fetching orders');
          setError('Authentication error: Please log in again');
          return;
        }

        // Check if token exists
        const token = getToken();
        if (!token) {
          console.error('No authentication token available');
          setError('Authentication error: Please log in again');
          return;
        }

        let fetchedOrders: Order[] = [];
        
        console.log('Fetching data for role:', user.role);
        
        // Role-based data fetching
        if (hasRole('admin')) {
          // Admin sees all orders
          console.log('Fetching all orders (admin view)');
          fetchedOrders = await ordersService.getAllOrders();
          
          // Also fetch analytics
          console.log('Fetching analytics data');
          try {
            const analyticsData = await ordersService.getAnalytics();
            setAnalytics(analyticsData);
          } catch (analyticsErr) {
            console.error('Error fetching analytics:', analyticsErr);
            // Set default analytics to prevent UI crashes
            setAnalytics({
              totalOrders: fetchedOrders.length,
              byStatus: {},
              pieChartData: []
            });
          }
        } else if (hasRole('factory')) {
          // Factory staff sees orders in manufacturing or quality_check
          console.log('Fetching factory production orders');
          try {
            const manufacturingOrders = await ordersService.getOrdersByStatus('manufacturing');
            const qualityCheckOrders = await ordersService.getOrdersByStatus('quality_check');
            fetchedOrders = [...manufacturingOrders, ...qualityCheckOrders];
          } catch (factoryErr) {
            console.error('Error fetching factory orders:', factoryErr);
            setError('Failed to load factory orders. Please try again.');
          }
        } else if (hasRole('customer') && user) {
          // Customers only see their own orders
          console.log('Fetching customer orders for user ID:', user.id);
          fetchedOrders = await ordersService.getOrdersByUserId(user.id);
        }
        
        console.log(`Fetched ${fetchedOrders.length} orders`);
        setOrders(fetchedOrders);
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError('Failed to load order data. Please refresh the page or log in again.');
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    };

    fetchData();
  }, [user?.id]); // Only depend on user.id, not the entire user object

  // Handle adding a suggestion (factory staff only)
  const handleAddSuggestion = async () => {
    if (!selectedOrderId || !suggestionText.trim()) return;
    
    try {
      setLoading(true);
      await ordersService.addSuggestion(selectedOrderId, suggestionText);
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrderId 
            ? { ...order, suggestion: suggestionText }
            : order
        )
      );
      
      setSuggestionText('');
      setSelectedOrderId(null);
      setSuccessMessage('Suggestion added successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error adding suggestion:', err);
      setError('Failed to add suggestion');
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Show different views based on role
  const renderRoleBasedContent = () => {
    if (!user) return <div>No user data available</div>;

    return (
      <>
        {/* Admin Analytics Section */}
        {hasRole('admin') && analytics && (
          <div style={{ marginBottom: '40px' }}>
            <h2>Order Analytics</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '20px',
              marginTop: '20px'
            }}>
              {Object.entries(analytics.byStatus).map(([status, count]) => (
                <div key={status} style={{ 
                  backgroundColor: getStatusBgColor(status), 
                  padding: '20px', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: `1px solid ${getStatusColor(status)}30`
                }}>
                  <h3 style={{ 
                    margin: '0 0 10px 0', 
                    color: getStatusColor(status),
                    textTransform: 'capitalize'
                  }}>{status}</h3>
                  <div style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    color: getStatusColor(status) 
                  }}>{count}</div>
                </div>
              ))}
              <div style={{ 
                backgroundColor: '#f0f5ff', 
                padding: '20px', 
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #d6e4ff'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1890ff' }}>Total Orders</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff' }}>
                  {analytics.totalOrders}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Factory Staff Suggestion Form */}
        {hasRole('factory') && selectedOrderId && (
          <div style={{ 
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#f9f0ff',
            borderRadius: '4px',
            border: '1px solid #d3adf7'
          }}>
            <h3>Add Suggestion for Order #{selectedOrderId}</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                placeholder="Enter your production suggestion here..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9'
                }}
              />
              <button
                onClick={handleAddSuggestion}
                disabled={!suggestionText.trim() || loading}
                style={{
                  backgroundColor: '#722ed1',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  opacity: !suggestionText.trim() || loading ? 0.7 : 1
                }}
              >
                Add Suggestion
              </button>
              <button
                onClick={() => {
                  setSelectedOrderId(null);
                  setSuggestionText('');
                }}
                style={{
                  backgroundColor: '#f5f5f5',
                  color: '#595959',
                  border: '1px solid #d9d9d9',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Notification Messages */}
        {successMessage && (
          <div style={{
            padding: '10px 16px',
            backgroundColor: '#f6ffed',
            color: '#52c41a',
            borderRadius: '4px',
            marginBottom: '16px',
            border: '1px solid #b7eb8f'
          }}>
            {successMessage}
          </div>
        )}

        {error && (
          <div style={{
            padding: '10px 16px',
            backgroundColor: '#fff1f0',
            color: '#f5222d',
            borderRadius: '4px',
            marginBottom: '16px',
            border: '1px solid #ffa39e'
          }}>
            {error}
          </div>
        )}

        {/* Orders Table */}
        <h2>
          {hasRole('admin') 
            ? 'All Orders' 
            : hasRole('factory') 
              ? 'Factory Production Orders' 
              : 'My Orders'}
        </h2>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#1890ff' }}>
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            backgroundColor: '#fafafa',
            borderRadius: '4px',
            color: '#8c8c8c'
          }}>
            No orders found
          </div>
        ) : (
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            marginTop: '20px',
            border: '1px solid #f0f0f0'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#fafafa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>Order ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>Customer</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>Created Date</th>
                {hasRole('factory') && (
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>{order.id}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>{order.customer_name}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ 
                      backgroundColor: getStatusBgColor(order.status), 
                      color: getStatusColor(order.status), 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      textTransform: 'capitalize'
                    }}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                    ${order.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                    {formatDate(order.created_at)}
                  </td>
                  {hasRole('factory') && (
                    <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                      <button
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setSuggestionText(order.suggestion || '');
                        }}
                        style={{
                          backgroundColor: '#722ed1',
                          color: 'white',
                          border: 'none',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {order.suggestion ? 'Edit Suggestion' : 'Add Suggestion'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Order Details Section - Show suggestions for Admin/Customer */}
        {!hasRole('factory') && orders.some(order => order.suggestion) && (
          <div style={{ marginTop: '40px' }}>
            <h2>Production Notes</h2>
            <div style={{ marginTop: '16px' }}>
              {orders.filter(order => order.suggestion).map(order => (
                <div 
                  key={`suggestion-${order.id}`}
                  style={{
                    padding: '16px',
                    backgroundColor: '#f9f0ff',
                    borderRadius: '4px',
                    marginBottom: '16px',
                    border: '1px solid #d3adf7'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <strong>Order ID:</strong> {order.id}
                    </div>
                    <div>
                      <span style={{ 
                        backgroundColor: getStatusBgColor(order.status), 
                        color: getStatusColor(order.status), 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        textTransform: 'capitalize'
                      }}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Customer:</strong> {order.customer_name}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Date:</strong> {formatDate(order.updated_at)}
                  </div>
                  <div style={{ 
                    backgroundColor: 'white',
                    padding: '12px',
                    borderRadius: '4px',
                    marginTop: '12px',
                    border: '1px solid #f0f0f0'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#722ed1' }}>
                      Factory Suggestion:
                    </div>
                    <div>{order.suggestion}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div style={{ padding: '0 24px 40px' }}>
      {renderRoleBasedContent()}

      <div style={{ marginTop: '40px', fontSize: '14px', color: '#8c8c8c' }}>
        <p>This is a working prototype of the Zenith Order Lifecycle Management System.</p>
        <p>
          {hasRole('admin') ? (
            'You are currently logged in as an admin with full access to all system features.'
          ) : hasRole('factory') ? (
            'You are currently logged in as factory staff. You can view orders in production and add suggestions.'
          ) : (
            'You are currently logged in as a customer. You can view your orders and track their status.'
          )}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
