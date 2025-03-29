# Frontend Architecture Patterns

This document outlines the key architectural patterns used in the Zenith OLMS frontend to ensure consistency, maintainability, and performance across the application.

## Table of Contents

1. [Controlled Effects](#controlled-effects)
2. [Fetch Lifecycle Management](#fetch-lifecycle-management)
3. [LocalStorage + React Sync Strategies](#localstorage--react-sync-strategies)
4. [Component Design Patterns](#component-design-patterns)
5. [State Management Patterns](#state-management-patterns)
6. [Performance Optimization Patterns](#performance-optimization-patterns)

---

## Controlled Effects

React's useEffect hook is powerful but requires careful implementation to avoid issues like the login loop problem. Follow these patterns for controlled, predictable side effects:

### Primitive-Value Dependencies

```typescript
// ❌ Avoid: Object dependencies
useEffect(() => {
  // Effect logic
}, [user]);

// ✅ Better: Primitive value dependencies
useEffect(() => {
  // Effect logic
}, [user?.id]);
```

**Why**: React compares dependency array items by reference for objects and by value for primitives. Using primitive values (strings, numbers, booleans) ensures the effect only runs when the value actually changes.

### Fetch State Tracking

```typescript
// State to track fetch operation status
const [isFetching, setIsFetching] = useState(false);

useEffect(() => {
  // Skip if already fetching
  if (isFetching) return;
  
  const fetchData = async () => {
    setIsFetching(true);
    try {
      // API calls
    } finally {
      setIsFetching(false);
    }
  };
  
  fetchData();
}, [dependencies]);
```

**Why**: Prevents concurrent fetch operations and provides a clear way to track loading states.

### Early Return Guards

```typescript
useEffect(() => {
  // Skip when conditions aren't met
  if (!user) return;
  if (isFetching) return;
  if (!isEnabled) return;
  
  // Main effect logic
}, [user?.id, isFetching, isEnabled]);
```

**Why**: Early returns make the code more readable and prevent unnecessary work when preconditions aren't met.

### Cleanup Functions

```typescript
useEffect(() => {
  const controller = new AbortController();
  const signal = controller.signal;
  
  fetchData(signal);
  
  // Cleanup function
  return () => {
    controller.abort();
  };
}, [dependencies]);
```

**Why**: Proper cleanup prevents memory leaks and handles component unmounting gracefully.

---

## Fetch Lifecycle Management

Managing the complete lifecycle of data fetching operations is critical for a robust application.

### Complete Fetch State Pattern

```typescript
// State for the complete fetch lifecycle
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
const [isFetching, setIsFetching] = useState(false);

const fetchData = async () => {
  // Don't start a new fetch if one is in progress
  if (isFetching) return;
  
  // Reset states at the beginning
  setIsFetching(true);
  setIsLoading(data === null); // Only show loading on initial fetch
  setError(null);
  
  try {
    const response = await api.fetchSomething();
    setData(response);
  } catch (err) {
    setError(err.message || 'An error occurred');
    // Optional: Keep old data or clear it on error
    // setData(null);
  } finally {
    setIsLoading(false);
    setIsFetching(false);
  }
};
```

**Why**: This pattern handles all possible states of a fetch operation, providing clear indicators for UI state management.

### Reusable Fetch Hook

```typescript
function useDataFetch(fetchFn, dependencies = []) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      if (isFetching) return;
      
      setIsFetching(true);
      setIsLoading(data === null);
      setError(null);
      
      try {
        const result = await fetchFn(signal);
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted && !signal.aborted) {
          setError(err.message || 'An error occurred');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsFetching(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, dependencies);

  return { data, isLoading, error, refetch: () => setIsFetching(false) };
}
```

**Example Usage**:
```typescript
const { data: orders, isLoading, error } = useDataFetch(
  () => ordersService.getAllOrders(),
  [user?.id]
);
```

**Why**: Encapsulates the fetch lifecycle pattern for reuse across components, ensuring consistent behavior.

### Request Deduplication

```typescript
// Cache for pending promises
const pendingRequests = {};

function fetchWithDeduplication(url, options = {}) {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  
  // Return existing promise if a request is already in-flight
  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey];
  }
  
  // Create a new promise for this request
  const promise = fetch(url, options)
    .then(response => response.json())
    .finally(() => {
      // Remove from pending requests after completion
      delete pendingRequests[cacheKey];
    });
  
  // Store the promise
  pendingRequests[cacheKey] = promise;
  
  return promise;
}
```

**Why**: Prevents duplicate API calls for the same data, especially useful in applications with multiple components that might request the same data.

---

## LocalStorage + React Sync Strategies

Keeping localStorage and React state in sync requires careful implementation to ensure consistency across the application.

### Basic localStorage Hook

```typescript
function useLocalStorage(key, initialValue) {
  // Initialize state with value from localStorage or initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = value => {
    try {
      // Allow value to be a function
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
```

**Example Usage**:
```typescript
const [token, setToken] = useLocalStorage('auth_token', null);
```

**Why**: Provides a seamless way to use localStorage with React state, keeping them automatically synchronized.

### Authentication State Sync

```typescript
// AuthContext.js
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [token, setToken] = useLocalStorage('auth_token', null);
  const [user, setUser] = useLocalStorage('user', null);
  
  // Derived authentication state
  const isAuthenticated = !!token;
  
  // Login function
  const login = async (credentials) => {
    try {
      const response = await api.login(credentials);
      setToken(response.token);
      setUser(response.user);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
  };
  
  // Context value
  const value = {
    token,
    user,
    isAuthenticated,
    login,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using the auth context
function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**Why**: Centralizes authentication state management and localStorage synchronization, providing a clean API for components to interact with authentication.

### Cross-Tab Synchronization

```typescript
function useSyncedLocalStorage(key, initialValue) {
  const [value, setValue] = useLocalStorage(key, initialValue);
  
  // Listen for changes in other tabs/windows
  useEffect(() => {
    function handleStorageChange(event) {
      if (event.key === key) {
        try {
          setValue(event.newValue ? JSON.parse(event.newValue) : initialValue);
        } catch (e) {
          console.error(`Error parsing localStorage value for ${key}:`, e);
        }
      }
    }
    
    // Add event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, setValue, initialValue]);
  
  return [value, setValue];
}
```

**Why**: Ensures that changes to localStorage in one tab are reflected in all other open tabs of the application, providing a consistent experience.

### Persistent Form State

```typescript
function usePersistentForm(formKey, initialValues) {
  const [values, setValues] = useLocalStorage(`form_${formKey}`, initialValues);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const resetForm = () => {
    setValues(initialValues);
  };
  
  return {
    values,
    handleChange,
    resetForm,
    setValues
  };
}
```

**Why**: Useful for multi-step forms or forms that users might want to continue later, preserving form state across page refreshes or navigation.

---

## Component Design Patterns

### Container/Presenter Pattern

```typescript
// Container component - handles data and logic
function OrdersContainer() {
  const { data: orders, isLoading, error } = useDataFetch(
    () => ordersService.getAllOrders(),
    [user?.id]
  );
  
  // Additional logic, handlers, etc.
  
  // Render the presenter with data
  return (
    <OrdersList
      orders={orders}
      isLoading={isLoading}
      error={error}
      onOrderSelect={handleSelectOrder}
    />
  );
}

// Presenter component - purely for display
function OrdersList({ orders, isLoading, error, onOrderSelect }) {
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!orders?.length) return <EmptyState message="No orders found" />;
  
  return (
    <div className="orders-list">
      {orders.map(order => (
        <OrderItem 
          key={order.id}
          order={order}
          onClick={() => onOrderSelect(order)}
        />
      ))}
    </div>
  );
}
```

**Why**: Separates concerns between data management and presentation, making components more maintainable and testable.

### Compound Components

```typescript
// Main component
const Tabs = ({ children, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs-container">
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// Sub-components
Tabs.TabList = ({ children }) => <div className="tab-list">{children}</div>;

Tabs.Tab = ({ children, value }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  
  return (
    <div 
      className={`tab ${activeTab === value ? 'active' : ''}`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </div>
  );
};

Tabs.TabContent = ({ children, value }) => {
  const { activeTab } = useContext(TabsContext);
  
  if (activeTab !== value) return null;
  
  return <div className="tab-content">{children}</div>;
};
```

**Usage**:
```jsx
<Tabs defaultTab="admin">
  <Tabs.TabList>
    <Tabs.Tab value="admin">Admin</Tabs.Tab>
    <Tabs.Tab value="factory">Factory</Tabs.Tab>
    <Tabs.Tab value="customer">Customer</Tabs.Tab>
  </Tabs.TabList>
  
  <Tabs.TabContent value="admin">Admin content here</Tabs.TabContent>
  <Tabs.TabContent value="factory">Factory content here</Tabs.TabContent>
  <Tabs.TabContent value="customer">Customer content here</Tabs.TabContent>
</Tabs>
```

**Why**: Creates intuitive, composable components with shared state while maintaining a clean API.

---

## State Management Patterns

### Context with Reducer Pattern

```typescript
// Create context
const OrdersContext = createContext();

// Action types
const ACTIONS = {
  FETCH_START: 'FETCH_START',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_ERROR: 'FETCH_ERROR',
  ADD_ORDER: 'ADD_ORDER',
  UPDATE_ORDER: 'UPDATE_ORDER',
  DELETE_ORDER: 'DELETE_ORDER'
};

// Reducer function
function ordersReducer(state, action) {
  switch (action.type) {
    case ACTIONS.FETCH_START:
      return { ...state, loading: true, error: null };
    case ACTIONS.FETCH_SUCCESS:
      return { ...state, loading: false, orders: action.payload };
    case ACTIONS.FETCH_ERROR:
      return { ...state, loading: false, error: action.payload };
    case ACTIONS.ADD_ORDER:
      return { ...state, orders: [...state.orders, action.payload] };
    case ACTIONS.UPDATE_ORDER:
      return {
        ...state,
        orders: state.orders.map(order => 
          order.id === action.payload.id ? action.payload : order
        )
      };
    case ACTIONS.DELETE_ORDER:
      return {
        ...state,
        orders: state.orders.filter(order => order.id !== action.payload)
      };
    default:
      return state;
  }
}

// Provider component
function OrdersProvider({ children }) {
  const [state, dispatch] = useReducer(ordersReducer, {
    orders: [],
    loading: false,
    error: null
  });
  
  // API functions
  const fetchOrders = async () => {
    dispatch({ type: ACTIONS.FETCH_START });
    try {
      const orders = await ordersService.getAllOrders();
      dispatch({ type: ACTIONS.FETCH_SUCCESS, payload: orders });
    } catch (error) {
      dispatch({ type: ACTIONS.FETCH_ERROR, payload: error.message });
    }
  };
  
  const addOrder = async (orderData) => {
    const newOrder = await ordersService.createOrder(orderData);
    dispatch({ type: ACTIONS.ADD_ORDER, payload: newOrder });
  };
  
  // Other CRUD functions...
  
  return (
    <OrdersContext.Provider value={{ 
      ...state,
      fetchOrders,
      addOrder,
      // other functions...
    }}>
      {children}
    </OrdersContext.Provider>
  );
}

// Custom hook
function useOrders() {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
}
```

**Usage**:
```jsx
function OrdersPage() {
  const { orders, loading, error, fetchOrders } = useOrders();
  
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  // Render using the state...
}
```

**Why**: Provides predictable state management for complex state logic, with clear actions and state transitions.

### Optimistic Updates

```typescript
function useOptimisticUpdate() {
  const [pendingUpdates, setPendingUpdates] = useState([]);
  
  // Add a pending update
  const addPendingUpdate = (id, updateFn, rollbackFn) => {
    setPendingUpdates(prev => [...prev, { id, updateFn, rollbackFn }]);
  };
  
  // Remove a pending update
  const removePendingUpdate = (id) => {
    setPendingUpdates(prev => prev.filter(update => update.id !== id));
  };
  
  // Apply optimistic update
  const optimisticUpdate = async (id, updateFn, apiCall, rollbackFn) => {
    // Apply optimistic update
    updateFn();
    
    // Add to pending updates
    addPendingUpdate(id, updateFn, rollbackFn);
    
    try {
      // Make the actual API call
      await apiCall();
      
      // Remove from pending updates on success
      removePendingUpdate(id);
    } catch (error) {
      // Rollback on error
      rollbackFn();
      
      // Remove from pending updates
      removePendingUpdate(id);
      
      // Re-throw for error handling
      throw error;
    }
  };
  
  return {
    pendingUpdates,
    optimisticUpdate
  };
}
```

**Example Usage**:
```typescript
function OrderStatusToggle({ order }) {
  const { orders, updateOrderStatus } = useOrders();
  const { optimisticUpdate } = useOptimisticUpdate();
  
  const toggleStatus = async () => {
    const newStatus = order.status === 'active' ? 'completed' : 'active';
    const oldStatus = order.status;
    
    // Use optimistic update
    await optimisticUpdate(
      order.id,
      // Update function
      () => updateOrderStatus(order.id, newStatus),
      // API call
      () => api.updateOrderStatus(order.id, newStatus),
      // Rollback function
      () => updateOrderStatus(order.id, oldStatus)
    );
  };
  
  return (
    <button onClick={toggleStatus}>
      Toggle Status
    </button>
  );
}
```

**Why**: Provides immediate feedback to users while still handling network operations in the background, with proper rollback on errors.

---

## Performance Optimization Patterns

### Memoization Pattern

```typescript
// Memoize expensive calculations
const memoizedValue = useMemo(() => {
  return expensiveCalculation(dependency1, dependency2);
}, [dependency1, dependency2]);

// Memoize callback functions
const memoizedCallback = useCallback(() => {
  doSomething(dependency1, dependency2);
}, [dependency1, dependency2]);

// Memoize components
const MemoizedComponent = React.memo(function MyComponent(props) {
  // Only re-renders if props change
  return <div>{props.value}</div>;
});
```

**Why**: Prevents unnecessary re-calculations, function recreations, and component re-renders, improving performance.

### Virtualization for Large Lists

```typescript
import { FixedSizeList as List } from 'react-window';

function VirtualizedOrderList({ orders }) {
  const Row = ({ index, style }) => {
    const order = orders[index];
    return (
      <div style={style} className="order-item">
        {order.id} - {order.customerName}
      </div>
    );
  };
  
  return (
    <List
      height={400}
      width="100%"
      itemCount={orders.length}
      itemSize={50}
    >
      {Row}
    </List>
  );
}
```

**Why**: Renders only the visible items in a long list, dramatically improving performance for large datasets.

### Code Splitting

```typescript
// Dynamic import for route-based code splitting
const OrdersPage = React.lazy(() => import('./pages/OrdersPage'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </Suspense>
  );
}
```

**Why**: Reduces initial bundle size by loading components only when needed, improving application startup time.

These patterns form the foundation of our frontend architecture, providing consistent, maintainable, and performant components across the application.
