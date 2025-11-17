#!/bin/bash

# NIAQI Backend API Test Script
# This script tests all authentication endpoints

API_URL="http://localhost:5000/api"
EMAIL="test$(date +%s)@example.com"
PASSWORD="TestPassword123!"
NAME="Test User"

echo "🧪 Testing NIAQI Backend API"
echo "=============================="
echo ""

# Test 1: Sign Up
echo "1️⃣  Testing Sign Up..."
SIGNUP_RESPONSE=$(curl -s -X POST \
  "${API_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"${NAME}\",
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\",
    \"confirmPassword\": \"${PASSWORD}\"
  }")

echo "Response: ${SIGNUP_RESPONSE}"
echo ""

# Extract tokens and user ID
ACCESS_TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo $SIGNUP_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
  echo "✅ Sign Up Success - Access Token: ${ACCESS_TOKEN:0:20}..."
else
  echo "❌ Sign Up Failed"
fi
echo ""

# Test 2: Get Current User (with JWT)
echo "2️⃣  Testing Get Current User..."
ME_RESPONSE=$(curl -s -X GET \
  "${API_URL}/auth/me" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Response: ${ME_RESPONSE}"
echo ""

if echo $ME_RESPONSE | grep -q "\"email\":\"${EMAIL}\""; then
  echo "✅ Get Current User Success"
else
  echo "❌ Get Current User Failed"
fi
echo ""

# Test 3: Sign In
echo "3️⃣  Testing Sign In..."
SIGNIN_RESPONSE=$(curl -s -X POST \
  "${API_URL}/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\"
  }")

echo "Response: ${SIGNIN_RESPONSE}"
echo ""

if echo $SIGNIN_RESPONSE | grep -q "accessToken"; then
  echo "✅ Sign In Success"
else
  echo "❌ Sign In Failed"
fi
echo ""

# Test 4: Refresh Token
echo "4️⃣  Testing Refresh Token..."
REFRESH_RESPONSE=$(curl -s -X POST \
  "${API_URL}/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"${REFRESH_TOKEN}\"
  }")

echo "Response: ${REFRESH_RESPONSE}"
echo ""

if echo $REFRESH_RESPONSE | grep -q "accessToken"; then
  echo "✅ Refresh Token Success"
else
  echo "❌ Refresh Token Failed"
fi
echo ""

# Test 5: Forgot Password
echo "5️⃣  Testing Forgot Password..."
FORGOT_RESPONSE=$(curl -s -X POST \
  "${API_URL}/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\"
  }")

echo "Response: ${FORGOT_RESPONSE}"
echo ""

if echo $FORGOT_RESPONSE | grep -q "message"; then
  echo "✅ Forgot Password Success"
else
  echo "❌ Forgot Password Failed"
fi
echo ""

# Test 6: Invalid Login
echo "6️⃣  Testing Invalid Login..."
INVALID_LOGIN=$(curl -s -X POST \
  "${API_URL}/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"WrongPassword123!\"
  }")

echo "Response: ${INVALID_LOGIN}"
echo ""

if echo $INVALID_LOGIN | grep -q "Unauthorized\|Invalid credentials"; then
  echo "✅ Invalid Login Rejected (Expected behavior)"
else
  echo "❌ Invalid Login Test Failed"
fi
echo ""

echo "=============================="
echo "✅ API Tests Complete!"
echo "=============================="
echo ""
echo "Test User Created:"
echo "  Email: ${EMAIL}"
echo "  Password: ${PASSWORD}"
echo "  User ID: ${USER_ID}"
echo ""
