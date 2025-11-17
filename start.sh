#!/bin/bash

export BACKEND_DIR="/Users/mac/Documents/GitHub/NIAQI/NIAQI_Backend"
cd "$BACKEND_DIR" || exit 1

echo "📂 Current directory: $(pwd)"
echo "🔨 Building application..."
npm run build

echo "🚀 Starting server..."
npm run start:prod
