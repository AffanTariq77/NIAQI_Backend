#!/bin/bash

# Kill any existing processes on port 5000
echo "Killing any processes on port 5000..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 1

# Start the backend server
echo "Starting NIAQI Backend Server..."
cd /Users/mac/Documents/GitHub/NIAQI/NIAQI_Backend
npm run start:dev

