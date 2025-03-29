# Zenith OLMS Troubleshooting Guide

This guide covers common issues you might encounter when developing or using the Zenith Order Lifecycle Management System, along with their solutions.

## Table of Contents

1. [Frontend Issues](#frontend-issues)
   - [Login Loop Issue](#login-loop-issue)
   - [Authentication Problems](#authentication-problems)
   - [React Rendering Issues](#react-rendering-issues)
   - [Component State Management](#component-state-management)

2. [Backend Issues](#backend-issues)
   - [API Endpoint Errors](#api-endpoint-errors)
   - [Database Connection Problems](#database-connection-problems)
   - [Authentication Middleware Issues](#authentication-middleware-issues)
   - [TRPC Router Errors](#trpc-router-errors)

3. [Development Environment](#development-environment)
   - [Setup Issues](#setup-issues)
   - [Build Errors](#build-errors)
   - [TypeScript Errors](#typescript-errors)

4. [Debugging Tools](#debugging-tools)
   - [Browser DevTools](#browser-devtools)
   - [API Testing Interface](#api-testing-interface)
   - [Login Loop Test Page](#login-loop-test-page)
   - [Backend Logs](#backend-logs)

---

## Frontend Issues

### Login Loop Issue

**Symptoms:**
- Excessive API calls after login
- Browser performance degradation
- Network tab shows repeating API requests
- Console logs show multiple fetch operations

**Potential Causes:**
- React useEffect hook with improper dependencies
- Object reference comparison issues
- Missing fetch state tracking
- Circular dependency between state updates and effects

**Solutions:**
1. **Check useEffect Dependencies**
   - Use primitive values (e.g., `user.id` instead of `user`) in dependency arrays
   - Example:
     ```typescript
     // ❌ Bad: Using object references
     useEffect(() => {
       fetchData();
     }, [user]);
     
     // ✅ Good: Using primitive values
     useEffect(() => {
       fetchData();
     }, [user?.id]);
     ```

2. **Add Fetch State Tracking**
   - Use a state variable to track ongoing fetch operations
   - Skip new fetches if one is already in progress
   - Example:
     ```typescript
     const [isFetching, setIsFetching] = useState(false);
     
     useEffect(() => {
       if (isFetching) return;
       
       const fetchData = async () => {
         setIsFetching(true);
         try {
           // API calls...
         } finally {
           setIsFetching(false);
         }
       };
       
       fetchData();
     }, [user?.id]);
     ```

3. **Add Early Return Guards**
   - Skip effect execution when conditions aren't met
   - Example:
     ```typescript
     useEffect(() => {
       if (!user) return;
       // Rest of effect...
     }, [user?.id]);
     ```

4. **Use the Test Page**
   - Open `demo-login-loop-fix.html` to compare broken vs. fixed implementations
   - Check the network tab to verify reduced API calls

### Authentication Problems

**Symptoms:**
- "Authentication token missing" errors
- Repeated login prompts
- Unable to access protected routes
- Unauthorized API responses

**Potential Causes:**
- Token storage issues in localStorage
- Token expiration
- Missing or malformed Authorization header
- CORS issues with Authorization header

**Solutions:**
1. **Check Token Storage**
   - Verify token is properly stored in localStorage:
     ```javascript
     // Check if token exists
     console.log('Token exists:', !!localStorage.getItem('auth_token'));
     
     // Inspect token content
     console.log('Token:', localStorage.getItem('auth_token'));
     ```

2. **Verify Token Format**
   - Ensure the token is properly formatted in Authorization header:
     ```javascript
     // Should be: Bearer <token>
     console.log('Auth header:', `Bearer ${localStorage.getItem('auth_token')}`);
     ```

3. **Check for Token Expiration**
   - JWT tokens have an expiration claim
   - Implement token refresh if needed
   - Use JWT debugging tools (e.g., jwt.io) to check claims

4. **Test with API Interface**
   - Use `test-api.html` to verify authentication works directly

### React Rendering Issues

**Symptoms:**
- Components not updating with new data
- UI out of sync with application state
- Excessive rendering (check with React DevTools)
- Missing or outdated information

**Potential Causes:**
- Improper dependency arrays in hooks
- Missing key props in lists
- State update batching issues
- Object reference equality issues

**Solutions:**
1. **Check React DevTools**
   - Install React DevTools browser extension
   - Use the Profiler tab to identify re-renders
   - Check component props and state

2. **Review Hook Dependencies**
   - Ensure all dependencies are properly listed
   - Watch out for missing or unnecessary dependencies

3. **Use Functional Updates**
   - For state that depends on previous state:
     ```javascript
     // ❌ Bad: Depends on closure value of count
     setCount(count + 1);
     
     // ✅ Good: Uses functional update
     setCount(prevCount => prevCount + 1);
     ```

4. **Fix List Keys**
   - Ensure lists have stable, unique keys:
     ```jsx
     // ❌ Bad: Using index as key
     {items.map((item, index) => <div key={index}>{item.name}</div>)}
     
     // ✅ Good: Using stable ID
     {items.map(item => <div key={item.id}>{item.name}</div>)}
     ```

### Component State Management

**Symptoms:**
- State not persisting between renders
- Components losing state unexpectedly
- State updates not reflecting in UI
- Inconsistent behavior across components

**Potential Causes:**
- State initialized inside component body (outside hooks)
- Side effects modifying state directly
- Missing state lifting
- Complex state interactions

**Solutions:**
1. **Move State to Hooks**
   - Always use useState or useReducer for component state
   - Don't define state variables outside hooks

2. **Consider State Lifting**
   - Lift shared state to common ancestor
   - Use context for widely shared state

3. **Use Immutable Updates**
   - Never modify state directly
   - Create new objects/arrays when updating state
   - Example:
     ```javascript
     // ❌ Bad: Mutating state directly
     const newOrders = orders;
     newOrders.push(newOrder);
     setOrders(newOrders);
     
     // ✅ Good: Creating new array
     setOrders([...orders, newOrder]);
     ```

---

## Backend Issues

### API Endpoint Errors

**Symptoms:**
- HTTP error responses (4xx, 5xx)
- Endpoints returning unexpected data
- Missing response fields
- Timeout errors

**Potential Causes:**
- Incorrect route definitions
- Missing/incorrect parameters
- Database query errors
- Authentication/authorization issues

**Solutions:**
1. **Check API Logs**
   - Review server logs for error messages
   - Look for database query errors or exceptions

2. **Test with API Interface**
   - Use `test-api.html` to test endpoints directly
   - Verify parameters and response format

3. **Check TRPC Procedure Definitions**
   - Ensure input validation is correct
   - Verify authorization checks
   - Check for proper error handling

4. **Verify Request Format**
   - Use browser Network tab to inspect request
   - Ensure parameters match API expectations

### Database Connection Problems

**Symptoms:**
- "Database file not found" errors
- Query execution failures
- Timeout errors on database operations
- Empty or incomplete query results

**Potential Causes:**
- Missing database file
- Incorrect connection path
- Permission issues
- SQLite lock errors

**Solutions:**
1. **Check Database File**
   - Verify SQLite database file exists:
     ```bash
     ls -la data/zenith.db
     ```

2. **Check Permissions**
   - Ensure the database file is readable/writable:
     ```bash
     chmod 666 data/zenith.db
     ```

3. **Rebuild Database**
   - The application can recreate the database schema:
     ```bash
     rm data/zenith.db
     ./start-zenith.sh
     ```

4. **Check Query Execution**
   - Review SQL queries in the repository files
   - Add console logs for query parameters
   - Test queries directly with SQLite CLI

### Authentication Middleware Issues

**Symptoms:**
- All requests returning 401 Unauthorized
- Authentication working for some routes but not others
- Token verification failures
- Missing role-based access control

**Potential Causes:**
- JWT secret mismatch
- Incorrect middleware ordering
- Missing role checks
- Token parsing errors

**Solutions:**
1. **Check JWT Configuration**
   - Verify JWT secret is consistent
   - Check token generation and verification logic

2. **Review Middleware Stack**
   - Ensure authentication middleware runs before route handlers
   - Check for middleware ordering issues

3. **Test Different User Roles**
   - Login with each user role (Admin, Factory, Customer)
   - Verify appropriate access controls

4. **Check Headers in Requests**
   - Ensure Authorization header is present and formatted correctly
   - Look for CORS issues with Authorization header

### TRPC Router Errors

**Symptoms:**
- "Procedure not found" errors
- Type compatibility issues
- Missing or invalid input parsing
- Unexpected procedure behavior

**Potential Causes:**
- Router configuration issues
- Procedure input/output type mismatches
- Missing input validation
- Incorrect middleware application

**Solutions:**
1. **Check Router Definition**
   - Verify procedure names and paths
   - Ensure input parsers are correct

2. **Review Type Definitions**
   - Check input/output type compatibility
   - Verify zod schemas match expected types

3. **Test Procedures Directly**
   - Use the `test-api.html` interface
   - Check browser console for detailed error messages

4. **Check Middleware Application**
   - Ensure the correct middleware is applied to each procedure
   - Verify that authorization checks are correct for each role

---

## Development Environment

### Setup Issues

**Symptoms:**
- Module not found errors
- Command not found errors
- Development server won't start
- TypeScript compilation errors

**Potential Causes:**
- Missing dependencies
- Node.js/npm version mismatches
- Environment configuration issues
- Path configuration problems

**Solutions:**
1. **Reinstall Dependencies**
   ```bash
   rm -rf node_modules
   npm install
   ```

2. **Check Node.js Version**
   ```bash
   node -v
   # Should be v16 or later
   ```

3. **Verify npm Scripts**
   - Check package.json for correct script definitions
   - Try running scripts individually:
     ```bash
     npx ts-node src/index.ts  # Backend
     npx vite                 # Frontend
     ```

4. **Check TypeScript Configuration**
   - Review tsconfig.json for correct settings
   - Verify include/exclude paths

### Build Errors

**Symptoms:**
- Build process fails
- "Cannot find module" errors
- Type errors during build
- Missing output files

**Potential Causes:**
- TypeScript errors
- Module resolution issues
- Missing dependencies
- Configuration errors

**Solutions:**
1. **Run TypeScript Compiler**
   ```bash
   npx tsc --noEmit
   ```

2. **Check Import Paths**
   - Verify that import paths are correct
   - Check for case sensitivity issues

3. **Update TypeScript**
   ```bash
   npm update typescript
   ```

4. **Check Build Configuration**
   - Review build scripts in package.json
   - Check for environment-specific issues

### TypeScript Errors

**Symptoms:**
- Red squiggly lines in editor
- Type compatibility errors
- "Cannot find name" errors
- Interface property errors

**Potential Causes:**
- Missing type definitions
- Incorrect type assertions
- Interface mismatches
- Missing or incorrect imports

**Solutions:**
1. **Check Type Definitions**
   - Ensure types are properly defined
   - Use explicit type annotations where needed

2. **Install Missing Type Packages**
   ```bash
   npm install --save-dev @types/node @types/react @types/express
   ```

3. **Use Type Assertions Carefully**
   - Avoid `any` type when possible
   - Use proper type guards

4. **Check Interface Compatibility**
   - Ensure objects match their interfaces
   - Verify property names and types

---

## Debugging Tools

### Browser DevTools

The browser's built-in DevTools are essential for debugging:

- **Console Tab**: View logs, errors, and warnings
  - Use `console.log()` statements strategically
  - Look for error messages and stack traces

- **Network Tab**: Monitor API requests
  - Check request/response headers and bodies
  - Look for failing requests (red) or unexpected calls
  - Monitor for repeated requests (login loop issue)

- **Application Tab**: Inspect storage
  - Check localStorage for auth tokens
  - Verify cookies and session storage
  - Test clearing storage for authentication issues

- **React DevTools**: Debug React components
  - Install the React DevTools browser extension
  - Inspect component props and state
  - Use the Profiler to identify performance issues

### API Testing Interface

The `test-api.html` file provides a dedicated interface for testing API endpoints:

- Open http://localhost:4000/test-api.html when the server is running
- Test authentication with different user roles
- Verify endpoint behavior directly
- Check response data and formats

### Login Loop Test Page

Use the `demo-login-loop-fix.html` file to visualize and debug the login loop issue:

- Open this file directly in a browser
- Toggle between broken and fixed implementations
- Compare API call patterns
- Monitor state updates and render cycles

### Backend Logs

Server logs provide crucial information about backend operations:

- Check the terminal where the server is running
- Look for error messages and stack traces
- Monitor database query execution
- Watch for authentication/authorization issues

**Enable Verbose Logging:**
To enable more detailed logging, modify the logging level in `src/index.ts`:

```typescript
// Add this to enable verbose logging
process.env.DEBUG = 'zenith:*';
```

This troubleshooting guide should help you resolve most common issues encountered when working with the Zenith OLMS project. If you encounter an issue not covered here, please consider adding it to this guide after resolution to help future developers.
