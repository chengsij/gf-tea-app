#!/bin/bash

# Tea Timer App - Shutdown Script
# Gracefully stops the server

# Get the script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Load configuration
source "$SCRIPT_DIR/config.sh"

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Tea Timer App - Stopping Services${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Kill any remaining processes on configured ports
echo -e "${BLUE}Checking for any remaining processes on configured ports...${NC}"
echo ""

# Kill any remaining process on backend port
BACKEND_PORT_PID=$(lsof -ti :$BACKEND_PORT 2>/dev/null || true)
if [ -n "$BACKEND_PORT_PID" ]; then
    echo -e "${YELLOW}Found process still running on backend port $BACKEND_PORT (PID: $BACKEND_PORT_PID). Force killing...${NC}"
    kill -9 $BACKEND_PORT_PID 2>/dev/null || true
    echo ""
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Services Stopped${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
