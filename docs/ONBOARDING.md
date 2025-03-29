# Zenith OLMS Developer Onboarding Guide

Welcome to the Zenith Order Lifecycle Management System (OLMS) project! This guide will help you get set up and productive quickly, whether you're just starting with JavaScript/TypeScript development or looking to grow into a senior or tech lead role.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Development Environment Setup](#development-environment-setup)
3. [Architecture Overview](#architecture-overview)
4. [Key Technologies](#key-technologies)
5. [Development Workflow](#development-workflow)
6. [Common Tasks](#common-tasks)
7. [Testing](#testing)
8. [Debugging](#debugging)
9. [Best Practices](#best-practices)
10. [Growth Path](#growth-path)
11. [Resources](#resources)

## Project Overview

Zenith OLMS is a role-based order management system designed to track the entire lifecycle of orders from creation to delivery. The system supports multiple user roles (Admin, Factory Staff, Customer), each with specific permissions and views.

### Core Concepts

- **Order Lifecycle**: An order progresses through various states (processing, manufacturing, quality check, shipped, delivered)
- **Role-Based Access**: Different users have different capabilities based on their roles
- **ERP Integration**: The system connects with external ERP systems for inventory and production management

## Development Environment Setup

### Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)
- Git
- A code editor (we recommend VS Code)

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd zenith_poc
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development servers
   ```bash
   ./start-zenith.sh
   ```

4. Open your browser to:
   - Frontend: http://localhost:3000
   - API Test Interface: http://localhost:4000/test-api.html

## Architecture Overview

Zenith OLMS uses a modern web architecture:

```
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│               │      │               │      │               │
│  React UI     │◄────►│  TRPC API     │◄────►│  SQLite DB    │
│  (Frontend)   │      │  (Backend)    │      │  (Data)       │
│               │      │               │      │               │
└───────────────┘      └───────────────┘      └───────────────┘
                              │
                              ▼
                       ┌───────────────┐
                       │  ERP Systems  │
                       │  (Integration)│
                       │               │
                       └───────────────┘
```

### Key Components

- **Frontend**: React application with component-based architecture
- **Backend**: Express.js server with TRPC for type-safe APIs
- **Database**: SQLite for persistent storage
- **Auth**: JWT-based authentication with custom middleware
- **ERP Integration**: REST APIs to external ERP systems

## Key Technologies

### Frontend

- **React**: UI library for component-based development
- **TypeScript**: Static typing for safer code
- **React Hooks**: For state management and side effects
- **Fetch API**: For client-side API requests

### Backend

- **Express**: Web framework for Node.js
- **TRPC**: End-to-end typesafe APIs
- **SQLite**: Lightweight relational database
- **JWT**: JSON Web Tokens for authentication

### Tools

- **Vite**: Frontend build tool and dev server
- **ts-node**: TypeScript execution environment
- **ESLint/Prettier**: Code quality and formatting
- **VS Code**: Recommended editor with extensions for React/TypeScript

## Development Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for feature work
- `feature/*`: Individual feature branches
- `bugfix/*`: Bug fix branches

### Typical Workflow

1. Pull latest changes from `develop`
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Create a pull request to `develop`
6. Address review feedback
7. Merge to `develop`

## Common Tasks

### Adding a New API Endpoint

1. Define the endpoint in the appropriate TRPC router (e.g., in `src/modules/orders.ts`)
2. Implement any required database operations in the repository
3. Add authentication/authorization checks
4. Test using the API testing interface

### Creating a New React Component

1. Create the component file in `src/components/`
2. Use proper TypeScript interfaces for props
3. Implement the component with React hooks (if needed)
4. Pay careful attention to dependencies in useEffect hooks
5. Add the component to the relevant parent component

### Database Operations

1. Define the operations in the appropriate repository (e.g., `src/database/orderRepository.ts`)
2. Use proper SQL queries with parameterized inputs
3. Add error handling and transaction support if needed

## Testing

### API Testing

Use the API testing interface at `http://localhost:4000/test-api.html` to:
- Test authentication
- Verify API endpoints
- Check role-based access control

### Frontend Testing

For the login flow and dashboard components:
- Use the standalone test page at `test-login-fix.html`
- Test with different user roles to ensure proper access control
- Verify that the fix for the login loop issue is working correctly

## Debugging

### Backend Debugging

1. Check server logs in the terminal
2. Use `console.log` statements for temporary debugging
3. For more complex issues, use VS Code's Node.js debugger

### Frontend Debugging

1. Use browser DevTools (F12 or Ctrl+Shift+I)
2. Check the Console tab for errors
3. Use React DevTools for component inspection
4. Check Network tab for API requests

### Login Loop Issue Debugging

We've created special debugging tools for the login loop issue:
- `demo-login-loop-fix.html`: Shows the broken vs. fixed implementation
- `debug-login-loop.js`: Contains debugging utilities
- Check console logs for repetitive API calls

## Best Practices

### React Component Development

1. **State Management**: Use React hooks (useState, useContext) appropriately
2. **Side Effects**: Be careful with useEffect dependencies
   - Use primitive values in dependency arrays (e.g., `user.id` instead of `user`)
   - Add proper cleanup functions
   - Use fetch state tracking to prevent concurrent requests
3. **Component Structure**: Keep components focused and reusable

### API Development

1. **Type Safety**: Leverage TRPC for type-safe APIs
2. **Authorization**: Always check user roles before data access
3. **Error Handling**: Provide meaningful error messages
4. **Validation**: Validate all inputs on the server side

### Database Operations

1. **Parameterization**: Always use parameterized queries to prevent SQL injection
2. **Transactions**: Use transactions for multi-step operations
3. **Error Handling**: Handle database errors properly

## Growth Path

### Junior to Mid-Level

Focus areas:
- Solid understanding of React hooks and component lifecycle
- TypeScript proficiency
- Understanding of REST API principles
- Basic database operations and SQL

Suggested tasks:
- Implement new UI components
- Add features to existing API endpoints
- Fix bugs in the codebase
- Add tests for existing features

### Mid-Level to Senior

Focus areas:
- Advanced React patterns
- Performance optimization
- API design and architecture
- Database optimization

Suggested tasks:
- Design and implement new features end-to-end
- Optimize component performance
- Improve API structure and error handling
- Enhance database queries and schema

### Senior to Tech Lead

Focus areas:
- Architecture design
- Team mentoring
- Technical decision making
- Project planning

Suggested tasks:
- Lead the design of new system components
- Guide junior developers
- Make architecture decisions
- Improve development processes

## Resources

### React & TypeScript

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [React Hooks in Depth](https://www.youtube.com/watch?v=KJP1E-Y-xyo)

### TRPC & API Design

- [TRPC Documentation](https://trpc.io/docs/)
- [REST API Design Best Practices](https://stackoverflow.blog/2020/03/02/best-practices-for-rest-api-design/)
- [TypeScript Express Tutorial](https://wanago.io/2018/12/03/typescript-express-tutorial-routing-controllers-middleware/)

### Database & SQL

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [SQL Tutorial](https://www.w3schools.com/sql/)
- [SQL Best Practices](https://www.sqlshack.com/sql-best-practices-for-relational-database-design/)

### React Optimization

- [React Performance Optimization](https://reactjs.org/docs/optimizing-performance.html)
- [React Profiler](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html)
- [When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
