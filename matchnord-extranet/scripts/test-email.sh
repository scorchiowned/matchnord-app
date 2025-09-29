#!/bin/bash

# Email Testing Script for Tournament Management System
# Usage: ./scripts/test-email.sh [email_type] [recipient_email]

# Default values
EMAIL_TYPE=${1:-"test"}
RECIPIENT_EMAIL=${2:-"manttila83@gmail.com"}
API_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Email Testing Script${NC}"
echo -e "${BLUE}========================${NC}"
echo ""

# Check if server is running
echo -e "${YELLOW}Checking if server is running...${NC}"
if ! curl -s "$API_URL/api/health" > /dev/null; then
    echo -e "${RED}❌ Server is not running at $API_URL${NC}"
    echo -e "${YELLOW}Please start the server with: npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Available email types
echo -e "${BLUE}Available email types:${NC}"
echo "  - test: Basic connectivity test"
echo "  - registration: Tournament registration confirmation"
echo "  - status: Registration status update"
echo "  - announcement: Tournament announcement"
echo "  - match: Match notification"
echo "  - team-manager-welcome: Team Manager welcome email"
echo ""

echo -e "${YELLOW}Sending $EMAIL_TYPE email to $RECIPIENT_EMAIL...${NC}"

# Send the email
RESPONSE=$(curl -s -X POST "$API_URL/api/test-email" \
  -H "Content-Type: application/json" \
  -d "{\"type\": \"$EMAIL_TYPE\", \"to\": \"$RECIPIENT_EMAIL\"}")

# Check if the request was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Email request sent successfully${NC}"
    echo ""
    echo -e "${BLUE}Response:${NC}"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
    echo -e "${RED}❌ Failed to send email request${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}💡 Tip: Check your email inbox and spam folder${NC}"
echo -e "${YELLOW}💡 To check Resend logs, run: ./scripts/check-email-logs.sh${NC}"

