#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting NIAQI Backend with ngrok...${NC}\n"

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ ngrok not installed${NC}"
    echo -e "${YELLOW}Installing ngrok...${NC}"
    brew install ngrok/ngrok/ngrok
fi

# Check if ngrok is authenticated
if ! ngrok config check &> /dev/null; then
    echo -e "${YELLOW}⚠️  ngrok not authenticated${NC}"
    echo -e "${BLUE}Please follow these steps:${NC}"
    echo -e "1. Go to: ${GREEN}https://dashboard.ngrok.com/get-started/setup${NC}"
    echo -e "2. Sign up for free (GitHub login works)"
    echo -e "3. Copy your authtoken"
    echo -e "4. Run: ${GREEN}ngrok config add-authtoken <YOUR_TOKEN>${NC}"
    echo -e "\n${RED}Exiting...${NC}"
    exit 1
fi

# Start the NestJS server in background
echo -e "${YELLOW}📦 Starting NestJS server...${NC}"
npm run start:dev > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo -e "${YELLOW}⏳ Waiting for server to start...${NC}"
sleep 10

# Check if server is running
if ! curl -s http://localhost:5000/api > /dev/null; then
    echo -e "${RED}❌ Server failed to start${NC}"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ Server started on http://localhost:5000${NC}\n"

# Start ngrok tunnel
echo -e "${YELLOW}🌐 Starting ngrok tunnel...${NC}"
echo -e "${BLUE}Press Ctrl+C to stop both server and ngrok${NC}\n"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping server and ngrok...${NC}"
    kill $SERVER_PID 2>/dev/null
    pkill -f ngrok 2>/dev/null
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

trap cleanup INT TERM

# Start ngrok and capture output
ngrok http 5000 --log=stdout 2>&1 | while IFS= read -r line; do
    echo "$line"
    
    # Extract the public URL
    if [[ "$line" =~ url=https://([a-z0-9-]+\.ngrok-free\.app) ]]; then
        NGROK_URL="https://${BASH_REMATCH[1]}"
        echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}✅ ngrok tunnel active!${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}📋 Your public URLs:${NC}"
        echo -e "   Backend API: ${GREEN}${NGROK_URL}/api${NC}"
        echo -e "   OAuth URL:   ${GREEN}${NGROK_URL}/api/auth/google${NC}"
        echo -e "   Callback:    ${GREEN}${NGROK_URL}/api/auth/google/callback${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "\n${YELLOW}⚠️  IMPORTANT: Update Google Console${NC}"
        echo -e "1. Go to: ${BLUE}https://console.cloud.google.com/apis/credentials${NC}"
        echo -e "2. Add redirect URI: ${GREEN}${NGROK_URL}/api/auth/google/callback${NC}"
        echo -e "3. Add JavaScript origin: ${GREEN}${NGROK_URL}${NC}"
        echo -e "\n${YELLOW}⚠️  ALSO: Update your .env file${NC}"
        echo -e "   ${BLUE}GOOGLE_CALLBACK_URL${NC}=\"${GREEN}${NGROK_URL}/api/auth/google/callback${NC}\""
        echo -e "\n${YELLOW}⚠️  AND: Update frontend config.ts${NC}"
        echo -e "   Replace ${RED}172.16.0.29:5000${NC} with ${GREEN}${NGROK_URL#https://}${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    fi
done

# If ngrok exits, cleanup
cleanup
