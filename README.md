# Zenith Order Lifecycle Management System (OLMS)

A role-based order management system with JWT authentication, persistent storage, and real-time analytics.

## Features

- **JWT Authentication** with role-based access control
- **SQLite Persistent Storage** for all data
- **Role-Based Access Control** (Admin, Factory Staff, Customer)
- **Order Timeline Tracking**
- **Real-time Analytics Dashboard**
- **ERP Integration** (LogicMate and Suntec)
- **Optimized React Components** with proper dependency management

## Test Users

| Role | Email | Password | Capabilities |
|------|-------|----------|--------------|
| Admin | admin@zenith.com | admin123 | Full access to all orders, users, and ERP integrations |
| Factory | factory@zenith.com | factory123 | View manufacturing orders, add production suggestions |
| Customer | customer@zenith.com | customer123 | View only own orders, track status |

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start both backend and frontend: `./start-zenith.sh`
   - Backend will run on: http://localhost:4000
   - Frontend will run on: http://localhost:3000

## Project Structure

```
zenith_poc/
├── data/                 # SQLite database files
├── public/               # Static assets and test files
├── src/
│   ├── auth/             # Authentication logic
│   ├── components/       # React components
│   ├── core/             # Core application logic
│   ├── database/         # Database repositories
│   ├── integrations/     # ERP integrations
│   ├── modules/          # Business logic modules
│   ├── pages/            # Page components
│   ├── providers/        # Data providers
│   ├── repositories/     # Data access layer
│   └── utils/            # Utility functions
├── test-api.html         # API testing interface
├── test-login-fix.html   # Login loop fix demo
└── demo-login-loop-fix.html  # Standalone demo for the login loop fix
```

## Development

### Running the Application

The easiest way to start both backend and frontend servers is:

```bash
./start-zenith.sh
```

Alternatively, you can start them separately:

```bash
# Backend (from project root)
npx ts-node src/index.ts

# Frontend (from project root)
npx vite
```

### Testing

#### API Testing
You can test the API directly using the API testing interface:
http://localhost:4000/test-api.html

#### Login Fix Testing
To verify the login loop fix implementation:
- http://localhost:3000/ - Test with the actual application
- file:///path/to/demo-login-loop-fix.html - Standalone demo comparing broken vs fixed implementation

## Architecture

- **Backend**: Express + TRPC + SQLite
- **Frontend**: React with Component-based architecture
- **Authentication**: JWT tokens with custom auth middleware
- **State Management**: React hooks and context
- **API**: TRPC for type-safe API calls
- **Database**: SQLite with repository pattern

## ERP Integration

The system integrates with two ERP systems:
- **LogicMate**: Handles inventory & invoicing
- **Suntec**: Manages factory operations

## Recent Improvements

- Fixed React dependency management in Dashboard component
- Improved authentication flow and token handling
- Added comprehensive testing tools for API endpoints
- Created detailed documentation for developers
- Optimized database queries for better performance

## Documentation

See additional documentation in the `/docs` directory:
- [Onboarding Guide](./docs/ONBOARDING.md)
- [Architecture Decision Records](./docs/adr/)
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
- [Project Evolution](./docs/PROJECT_EVOLUTION.md)
