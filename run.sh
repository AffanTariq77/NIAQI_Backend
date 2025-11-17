#!/bin/bash
set -e

cd "$(dirname "$0")"
echo "Working directory: $(pwd)"

echo "Building application..."
npm run build

echo "Starting server..."
node dist/src/main.js &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Keep script running
wait $SERVER_PID
