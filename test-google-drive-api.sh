#!/bin/bash

# Google Drive Sync API Test Script
# Run this after starting the backend server

BASE_URL="http://localhost:5000"

echo "🚀 Testing Google Drive Sync API"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Trigger Manual Sync
echo -e "${YELLOW}Test 1: Triggering manual sync...${NC}"
SYNC_RESPONSE=$(curl -s -X GET "$BASE_URL/documents/sync/now")
echo "$SYNC_RESPONSE" | jq '.'
echo ""

# Wait a moment for sync to complete
sleep 2

# Test 2: List All Documents
echo -e "${YELLOW}Test 2: Listing all documents...${NC}"
DOCS_RESPONSE=$(curl -s -X GET "$BASE_URL/documents")
echo "$DOCS_RESPONSE" | jq '.'
DOCUMENT_COUNT=$(echo "$DOCS_RESPONSE" | jq -r '.count')
echo -e "${GREEN}Found $DOCUMENT_COUNT documents${NC}"
echo ""

# Test 3: Download First Document (if exists)
if [ "$DOCUMENT_COUNT" -gt 0 ]; then
    FIRST_DOC_ID=$(echo "$DOCS_RESPONSE" | jq -r '.data[0].id')
    FIRST_DOC_NAME=$(echo "$DOCS_RESPONSE" | jq -r '.data[0].name')
    
    echo -e "${YELLOW}Test 3: Downloading document: $FIRST_DOC_NAME${NC}"
    curl -s -X GET "$BASE_URL/documents/$FIRST_DOC_ID" \
         -o "downloaded_$FIRST_DOC_NAME"
    
    if [ -f "downloaded_$FIRST_DOC_NAME" ]; then
        FILE_SIZE=$(ls -lh "downloaded_$FIRST_DOC_NAME" | awk '{print $5}')
        echo -e "${GREEN}✓ Downloaded successfully ($FILE_SIZE)${NC}"
        echo "  Saved as: downloaded_$FIRST_DOC_NAME"
    else
        echo -e "${RED}✗ Download failed${NC}"
    fi
else
    echo -e "${YELLOW}No documents found to download${NC}"
fi

echo ""
echo "=================================="
echo -e "${GREEN}✓ All tests completed!${NC}"
