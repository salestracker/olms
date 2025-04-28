# Zenith OLMS Deployment Guide

This document outlines the steps to deploy the Zenith OLMS application to production environments.

## Architecture

The application consists of two main components:
1. **Frontend**: React application hosted on GitHub Pages
2. **Backend**: Node.js/Express/tRPC API hosted on Render

## Frontend Deployment (GitHub Pages)

The frontend is automatically deployed to GitHub Pages when changes are pushed to the main branch.

### Manual Deployment

To manually deploy the frontend:

1. Ensure all changes are committed
2. Run the deployment script:
   ```bash
   npm run deploy
   ```

This will build the application and push it to the `gh-pages` branch, which is configured to serve the application at https://salestracker.github.io/olms/

## Backend Deployment (Render)

The backend is deployed to Render using the following steps:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service with these settings:
   - **Name**: olms
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build:server`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV`: production
     - `PORT`: 4000 (Render will override this)
     - `JWT_SECRET`: [generate a secure random string]
     - `CORS_ORIGIN`: https://salestracker.github.io

### Database Considerations

The application uses SQLite, which stores data in a file. On Render's free tier, the filesystem is ephemeral, meaning data will be lost when the service restarts.

For production use, consider:
1. Using Render's persistent disk add-on
2. Migrating to a hosted database service (PostgreSQL, MySQL)
3. Implementing a backup strategy for the SQLite database

## Configuration Files

The following files contain deployment-specific configuration:

- `src/utils/apiConfig.ts`: Contains the backend API URL
- `vite.config.ts`: Contains the base path for GitHub Pages
- `package.json`: Contains the homepage URL for GitHub Pages
- `src/index.ts`: Contains CORS configuration
- `render.yaml`: Contains Render deployment configuration

## Troubleshooting

### CORS Issues

If you encounter CORS issues:
1. Check that the `CORS_ORIGIN` environment variable is set correctly on Render
2. Verify that the frontend is making requests to the correct backend URL
3. Check the browser console for specific CORS error messages

### API Connection Issues

If the frontend cannot connect to the backend:
1. Verify that the backend is running (check Render dashboard)
2. Check that the API URL in `src/utils/apiConfig.ts` is correct
3. Test the API directly using a tool like Postman or curl

### Authentication Issues

If users cannot log in:
1. Check that the JWT_SECRET environment variable is set on Render
2. Verify that the token is being correctly passed in the Authorization header
3. Check the server logs for authentication errors