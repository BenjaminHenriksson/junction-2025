#!/bin/bash

# Frontend Deployment Script
# This script builds and deploys the Figma Make frontend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="/var/www/etymologer.com/frontend"
BUILD_DIR="$FRONTEND_DIR/build"

echo -e "${GREEN}Starting deployment...${NC}"

# Navigate to frontend directory
cd "$FRONTEND_DIR" || {
    echo -e "${RED}Error: Could not navigate to $FRONTEND_DIR${NC}"
    exit 1
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${YELLOW}Building frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi

# Check if build directory exists and has content
if [ ! -d "$BUILD_DIR" ] || [ -z "$(ls -A $BUILD_DIR)" ]; then
    echo -e "${RED}Error: Build directory is empty or doesn't exist${NC}"
    exit 1
fi

echo -e "${GREEN}Build completed successfully!${NC}"
echo -e "${GREEN}Build output: $BUILD_DIR${NC}"

# Optional: Reload nginx (commented out by default since nginx auto-serves the build folder)
# Uncomment the following lines if you want to reload nginx after each deployment
# echo -e "${YELLOW}Reloading nginx...${NC}"
# if sudo systemctl reload nginx; then
#     echo -e "${GREEN}Nginx reloaded successfully${NC}"
# else
#     echo -e "${YELLOW}Warning: Could not reload nginx (may need sudo)${NC}"
# fi

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Frontend is now live at: http://etymologer.com${NC}"
