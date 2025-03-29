#!/bin/bash

# Zenith application startup script

echo "Starting Zenith OLMS application..."

# Start the backend server first (on port 4000)
echo "Starting backend server on port 4000..."
cd "$(dirname "$0")"
# Use ts-node or npx ts-node if available, otherwise try to run JavaScript version
if command -v npx &> /dev/null; then
  echo "Using npx ts-node to run TypeScript..."
  npx ts-node src/index.ts &
  BACKEND_PID=$!
else
  echo "Fallback to JavaScript file if compiled..."
  if [ -f src/index.js ]; then
    node src/index.js &
    BACKEND_PID=$!
  else
    echo "ERROR: Cannot run TypeScript directly. Please compile with tsc first or install ts-node."
    exit 1
  fi
fi

echo "Backend server started with PID: $BACKEND_PID"

# Wait a moment for the server to initialize
echo "Waiting for server initialization..."
sleep 3

# Start the frontend dev server (on port 3000)
echo "Starting frontend dev server on port 3000..."
npx vite &
FRONTEND_PID=$!

echo "Frontend server started with PID: $FRONTEND_PID"
echo "----------------------------------------"
echo "Zenith OLMS application is now running:"
echo "Backend: http://localhost:4000"
echo "Frontend: http://localhost:3000"
echo "----------------------------------------"
echo "Press Ctrl+C to stop both servers"

# Wait for user to press Ctrl+C
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
