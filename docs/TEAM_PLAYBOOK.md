# Zenith OLMS Team Playbook

This playbook serves as the central reference for development practices, patterns, and workflows for the Zenith Order Lifecycle Management System team. It consolidates our collective knowledge and provides a clear path for consistent, high-quality development.

## Table of Contents

1. [Team Values](#team-values)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Key Architectural Patterns](#key-architectural-patterns) 
5. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
6. [Code Review Guidelines](#code-review-guidelines)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Process](#deployment-process)
9. [Performance Standards](#performance-standards)
10. [Learning Resources](#learning-resources)

---

## Team Values

Our team is guided by the following core values:

- **User-Centric Focus**: Every decision we make considers the end-user experience first
- **Quality Over Speed**: We prioritize robust, maintainable solutions over quick fixes
- **Continuous Learning**: We invest in our technical growth and share knowledge openly
- **Collaborative Problem-Solving**: We tackle complex issues together, valuing diverse perspectives
- **Technical Excellence**: We strive for elegance and simplicity in our solutions

## Development Workflow

### Git Workflow

1. **Branch Strategy**:
   - `main`: Production-ready code
   - `develop`: Integration branch
   - `feature/*`: Feature branches
   - `bugfix/*`: Bug fix branches

2. **Commit Guidelines**:
   - Use conventional commits (e.g., `feat:`, `fix:`, `docs:`, `refactor:`)
   - Keep commits focused and atomic
   - Reference issue numbers where applicable

3. **Pull Request Process**:
   - Create a PR against the `develop` branch
   - Fill out the PR template completely
   - Ensure tests pass and code meets standards
   - Request review from at least one team member
   - Address feedback promptly

### Task Management

1. **Issue Creation**:
   - Use the issue template
   - Add appropriate labels
   - Include acceptance criteria
   - Estimate complexity (T-shirt sizing)

2. **Task Breakdown**:
   - Break complex tasks into sub-tasks
   - Focus on vertical slices of functionality
   - Set clear completion criteria

3. **Sprint Cadence**:
   - Two-week sprints
   - Sprint planning on Monday morning
   - Daily standups at 10:00 AM
   - Sprint review and retrospective on Friday afternoon

## Code Standards

### TypeScript Best Practices

1. **Type Definitions**:
   - Define interfaces for all data structures
   - Use explicit return types for functions
   - Avoid `any` type wherever possible
   - Use type guards for type narrowing

2. **Code Organization**:
   - One component per file
   - Group related functionality in directories
   - Use barrel exports (index.ts) for cleaner imports
   - Keep files under 300 lines of code

3. **Naming Conventions**:
   - PascalCase for components, interfaces, and types
   - camelCase for variables, functions, and methods
   - ALL_CAPS for constants
   - Prefer descriptive names over abbreviations

4. **Code Formatting**:
   - Use ESLint and Prettier
   - Run linting before committing
   - Configure IDE for format-on-save

## Key Architectural Patterns

### React Component Patterns

**Always use these core patterns in our React components:**

1. **Controlled Effects**:
   - Use primitive values in dependency arrays
   - Add fetch state tracking 
   - Implement early return guards
   - Always add proper cleanup functions

   ```typescript
   // ✅ Correct pattern
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
     
     // Cleanup function
     return () => {
       // Cancel any pending operations
     };
   }, [user?.id]); // Primitive value dependency
   ```

2. **Fetch Lifecycle Management**:
   - Track all fetch states: loading, error, success
   - Handle fetch cancellation on unmount
   - Provide retry mechanisms
   - Use the `useDataFetch` hook for consistency

   ```typescript
   // ✅ Use our standard fetch hook
   const { data, isLoading, error, refetch } = useDataFetch(
     () => api.getOrders(),
     [user?.id]
   );
   ```

3. **LocalStorage + React Sync**:
   - Use the `useLocalStorage` hook
   - Implement cross-tab synchronization where needed
   - Handle serialization errors gracefully
   - Keep localStorage keys consistent and documented

   ```typescript
   // ✅ Correct pattern
   const [token, setToken] = useLocalStorage('auth_token', null);
   ```

### Component Structure

Organize components by responsibility:

1. **Container Components**:
   - Handle data fetching and state management
   - Connect to contexts/services
   - Pass data to presenter components
   - Minimal JSX

2. **Presenter Components**:
   - Focus on rendering UI
   - Receive data via props
   - Minimal direct state management
   - No direct API calls

3. **Custom Hooks**:
   - Extract complex logic into reusable hooks
   - Follow the "use" naming convention
   - Handle cleanup properly
   - Document parameters and return values

## Common Pitfalls & Solutions

### The Login Loop Problem

**Description**: Excessive API calls after login due to improper React dependencies.

**Root Causes**:
- Using object references in dependency arrays
- Missing fetch state tracking
- State updates triggering re-renders

**Solution Pattern**:
```typescript
// Track fetch state
const [isFetching, setIsFetching] = useState(false);

// Use early returns and primitive dependencies
useEffect(() => {
  if (isFetching || !user) return;
  
  const fetchData = async () => {
    setIsFetching(true);
    try {
      // API calls
    } finally {
      setIsFetching(false);
    }
  };
  
  fetchData();
}, [user?.id]); // Use primitive values, not objects
```

### Stale Closure Issues

**Description**: Function captures outdated state values.

**Solution Pattern**:
```typescript
// ❌ Problematic: count is captured by closure
const increment = () => {
  setCount(count + 1);
};

// ✅ Fixed: Use functional updates
const increment = () => {
  setCount(prevCount => prevCount + 1);
};
```

### Memory Leaks

**Description**: Setting state on unmounted components.

**Solution Pattern**:
```typescript
useEffect(() => {
  let isMounted = true;
  
  fetchData().then(data => {
    if (isMounted) {
      setState(data);
    }
  });
  
  return () => {
    isMounted = false;
  };
}, [dependencies]);
```

## Code Review Guidelines

### Review Focus Areas

1. **Correctness**:
   - Business logic implementation
   - Edge case handling
   - Error handling

2. **Architecture**:
   - Component structure
   - State management approach
   - API integration

3. **React Patterns**:
   - Proper hook usage
   - Dependency array correctness
   - Effect management

4. **Performance**:
   - Unnecessary re-renders
   - Expensive calculations
   - Large bundle impact

5. **Maintainability**:
   - Code clarity
   - Documentation
   - Test coverage

### PR Review Checklist

Before approving any PR, ensure:

- [ ] Code follows architectural patterns
- [ ] All effect hooks have proper dependencies
- [ ] State management is consistent with team patterns
- [ ] Tests cover critical functionality
- [ ] Performance considerations are addressed
- [ ] No TypeScript `any` usage without justification
- [ ] Error states and edge cases are handled
- [ ] Documentation is updated where necessary

## Testing Strategy

### Testing Pyramid

1. **Unit Tests**:
   - Focus on utility functions
   - Test hooks in isolation
   - Test state transitions
   - Use React Testing Library and Jest

2. **Component Tests**:
   - Test component rendering
   - Test user interactions
   - Mock external dependencies
   - Verify state updates

3. **Integration Tests**:
   - Test component compositions
   - Verify data flow between components
   - Test context providers with consumers

4. **End-to-End Tests**:
   - Cover critical user journeys
   - Test authentication flows
   - Verify form submissions
   - Use Cypress for E2E testing

### Testing Tools

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing
- **Mock Service Worker**: API mocking
- **Cypress**: End-to-end testing

## Deployment Process

### Environments

1. **Development**: Automatic deployment from `develop` branch
2. **Staging**: Manual promotion from development
3. **Production**: Manual promotion from staging with approval

### Deployment Checklist

Before deploying to production:

- [ ] Run full test suite
- [ ] Conduct performance audit
- [ ] Review feature flags
- [ ] Verify database migrations
- [ ] Conduct regression testing
- [ ] Check analytics instrumentation
- [ ] Update documentation

## Performance Standards

### Performance Budgets

- **Time to Interactive**: < 3 seconds on mid-tier mobile
- **Initial Bundle Size**: < 200KB gzipped
- **API Response Time**: < 300ms for critical endpoints
- **Memory Usage**: < 60MB heap usage
- **CPU Usage**: No frame drops during animations

### Optimization Techniques

1. **Code Splitting**:
   - Split code by route
   - Use dynamic imports for large features
   - Prefer lazy loading for modals and off-screen content

2. **Bundle Analysis**:
   - Review bundle size regularly
   - Monitor third-party dependencies
   - Remove unused code

3. **React Performance**:
   - Use React.memo for pure components
   - Use useMemo for expensive calculations
   - Use useCallback for event handlers
   - Virtualize long lists

4. **Network Performance**:
   - Implement request deduplication
   - Use optimistic updates
   - Cache responses where appropriate
   - Consider request batching

## Learning Resources

### Must-Read Articles

- [React useEffect Cleanup](https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup)
- [A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/)
- [React Performance Optimization](https://kentcdodds.com/blog/usememo-and-usecallback)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

### Books

- "Effective TypeScript" by Dan Vanderkam
- "React Design Patterns and Best Practices" by Michele Bertoli
- "Clean Code" by Robert C. Martin

### Internal Resources

- [Frontend Architecture Patterns](./FRONTEND_ARCHITECTURE_PATTERNS.md)
- [Login Loop Fix Documentation](./LOGIN_LOOP_FIX.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Project Evolution](./PROJECT_EVOLUTION.md)
- [Architecture Decision Records](./adr/)

### Team Mentoring

- Junior developers are paired with seniors
- Weekly knowledge sharing sessions
- Quarterly technical deep dives
- Open code review workshops
