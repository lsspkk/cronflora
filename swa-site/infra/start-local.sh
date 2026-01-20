#!/bin/bash
# Start local development environment with hot reload

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

cleanup() {
  echo ""
  echo "Stopping development servers..."
  kill $API_PID 2>/dev/null || true
  kill $SWA_PID 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM

# Kill any existing processes
echo "Stopping any existing processes..."
pkill -f "func start" 2>/dev/null || true
pkill -f "swa start" 2>/dev/null || true
lsof -ti:7071 | xargs kill -9 2>/dev/null || true
lsof -ti:4280 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 1

# Start API (Azure Functions)
echo "Starting API..."
cd api2
npm run dev &
API_PID=$!
cd ..

# Wait for API to start
sleep 3

# Start SWA CLI with hot reload
echo "Starting SWA emulator..."
npm run dev:swa &
SWA_PID=$!

echo ""
echo "Development servers running:"
echo "  Frontend: http://localhost:4280"
echo "  API:      http://localhost:7071"
echo ""
echo "Press Ctrl+C to stop all servers"

wait
