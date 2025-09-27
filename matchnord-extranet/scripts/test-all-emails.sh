#!/bin/bash

# Test All Email Types Script
# Usage: ./scripts/test-all-emails.sh [recipient_email]

# Default values
RECIPIENT_EMAIL=${1:-"manttila83@gmail.com"}
API_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Email types to test
EMAIL_TYPES=("test" "registration" "status" "announcement" "match" "team-manager-welcome")

echo -e "${BLUE}🧪 Testing All Email Types${NC}"
echo -e "${BLUE}==========================${NC}"
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

echo -e "${YELLOW}Testing emails to: $RECIPIENT_EMAIL${NC}"
echo ""

# Test each email type
for email_type in "${EMAIL_TYPES[@]}"; do
    echo -e "${BLUE}Testing: $email_type${NC}"
    
    # Send the email
    RESPONSE=$(curl -s -X POST "$API_URL/api/test-email" \
      -H "Content-Type: application/json" \
      -d "{\"type\": \"$email_type\", \"to\": \"$RECIPIENT_EMAIL\"}")
    
    # Check if the request was successful
    if [ $? -eq 0 ]; then
        # Check if the response contains success
        if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
            echo -e "${GREEN}  ✅ Success${NC}"
        else
            echo -e "${RED}  ❌ Failed${NC}"
            echo -e "${RED}  Response: $RESPONSE${NC}"
        fi
    else
        echo -e "${RED}  ❌ Request failed${NC}"
    fi
    
    # Add a small delay between requests
    sleep 1
done

echo ""
echo -e "${YELLOW}💡 Check your email inbox and spam folder${NC}"
echo -e "${YELLOW}💡 To check Resend logs, run: ./scripts/check-email-logs.sh${NC}"
echo -e "${YELLOW}💡 To test individual emails, run: ./scripts/test-email.sh [type] [email]${NC}"
