#!/bin/bash

# Tea Timer App - Startup Script
# Starts the backend (Express) server which also serves the frontend

set -e

# Get the script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/server"

# Load configuration
source "$SCRIPT_DIR/config.sh"

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Tea Timer App - Starting Services${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Kill any orphaned ts-node/tsx server processes
pkill -f "ts-node.*server/index.ts" 2>/dev/null || true
pkill -f "tsx.*server/index.ts" 2>/dev/null || true

echo -e "${GREEN}Ports are clear. Starting services...${NC}"
echo ""

# Start Backend Server
echo -e "${GREEN}Starting Server (Express on port $BACKEND_PORT)...${NC}"
# Run from PROJECT_ROOT so backend can find the 'dist' folder for serving the frontend
cd "$PROJECT_ROOT"
NODE_ENV=production npx tsx server/index.ts > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
echo ""

# Wait for server to initialize
sleep 3

# Check if process is still running
if ! ps -p $BACKEND_PID > /dev/null; then
    echo -e "${RED}Error: Backend server failed to start. Check $SCRIPT_DIR/backend.log${NC}"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Services Started Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "App is available at: http://localhost:$BACKEND_PORT"
echo ""
echo "Logs:"
echo "  Server:  $SCRIPT_DIR/backend.log"
echo ""
echo "To stop services, run: .scripts/shutdown.sh"
echo ""
