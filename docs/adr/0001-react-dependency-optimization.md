# ADR 0001: React useEffect Dependency Optimization

## Status
Accepted

## Date
2025-03-29

## Context
The Zenith OLMS dashboard component was experiencing an infinite API call loop after user login. Upon investigation, we found that the component was making excessive and repetitive API calls to the backend, causing performance issues and potential server overload.

The root cause was identified in the Dashboard component's useEffect hook:

```typescript
// Original problematic code in Dashboard.tsx
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      // API calls to fetch data
      const fetchedOrders = await ordersService.getAllOrders();
      setOrders(fetchedOrders);
      
      const analyticsData = await ordersService.getAnalytics();
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, [user]); // Dependency on entire user object
```

The issue had several aspects:
1. The useEffect dependency array included the entire `user` object, which is compared by reference in React, not by value.
2. Each re-render of the component would create a new reference for the user object, triggering the effect again.
3. The effect had no mechanism to prevent concurrent fetch operations.
4. Each state update (`setOrders`, `setAnalytics`) would trigger a re-render, creating a chain reaction of re-renders and API calls.

## Decision Drivers
- Need to maintain proper data fetching when user changes
- Prevent unnecessary API calls
- Ensure good user experience without performance degradation
- Follow React best practices for dependency management

## Options Considered

### Option 1: Use Object.is or Deep Comparison
Use a deep comparison or `Object.is` to compare the previous and current user object to determine if a fetch is needed.

Pros:
- Keeps the existing structure
- Would detect actual changes to the user object

Cons:
- Adds complexity
- Still doesn't address the fundamental React pattern issue
- Performance cost of deep comparisons

### Option 2: Use useRef to Store User Object
Store the user object in a ref and manually check if relevant properties have changed.

Pros:
- Avoids dependency array issues
- Gives fine-grained control over when to refetch

Cons:
- More complex code
- Manual implementation of change detection
- Diverges from standard React patterns

### Option 3: Use Primitive Values in Dependencies
Change the dependency array to use primitive values (like `user.id`) instead of the entire object.

Pros:
- Aligns with React best practices
- Simple implementation
- Primitive values are compared by value, not reference
- Still properly refetches when the user ID changes

Cons:
- Might miss changes to other user properties if they become relevant

### Option 4: Add Fetch State Tracking
Implement a fetch state tracking mechanism to prevent concurrent requests.

Pros:
- Prevents duplicate requests during state updates
- Simple implementation with useState
- Works well with the selected dependency solution

Cons:
- Additional state to manage

## Decision
We decided to implement a combination of Option 3 (primitive values in dependencies) and Option 4 (fetch state tracking):

```typescript
// Fixed code in Dashboard.tsx
// Track if data is currently being fetched to prevent duplicate calls
const [isFetching, setIsFetching] = useState(false);

// Load orders based on user role
useEffect(() => {
  // Skip if already fetching or no user
  if (isFetching || !user) return;
  
  const fetchData = async () => {
    setIsFetching(true);
    setLoading(true);
    setError(null);
    
    try {
      // API calls here
      // ...
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  fetchData();
}, [user?.id]); // Only depend on user.id, not the entire user object
```

This solution incorporates three key improvements:
1. **Primitive Value Dependency**: Using `[user?.id]` instead of `[user]` prevents unnecessary effect re-executions
2. **Fetch State Management**: Using `isFetching` state to track ongoing API calls prevents concurrent operations
3. **Early Return Guards**: Adding condition checks avoids processing when a fetch is in progress or no user data exists

## Consequences

### Positive
- Eliminates the infinite API call loop
- Reduces server load by preventing duplicate requests
- Improves application performance
- Follows React best practices
- Provides a clear pattern for future data fetching implementations

### Negative
- Might require similar changes in other components if they follow the same anti-pattern
- If user properties other than ID become important for data fetching, the dependencies will need to be updated

### Neutral
- The solution doesn't change the overall architecture but does establish a pattern for proper React data fetching

## Validation
The solution was validated through:
1. Manual testing with different user roles
2. A standalone demo page that visually shows the difference between broken and fixed implementations
3. Console logging to verify the number of API calls
4. Backend logs to confirm the reduction in API requests

## Related Documents
- [React Hooks Documentation](https://reactjs.org/docs/hooks-effect.html)
- [React Dependency Array Best Practices](https://reactjs.org/docs/hooks-reference.html#conditionally-firing-an-effect)
