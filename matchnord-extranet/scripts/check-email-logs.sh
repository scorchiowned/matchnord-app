#!/bin/bash

# Check Resend Email Logs Script
# Usage: ./scripts/check-email-logs.sh [limit]

# Default values
LIMIT=${1:-10}

# Load API key from environment
if [ -f ../.env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

API_KEY=${RESEND_API_KEY:-""}

if [ -z "$API_KEY" ]; then
    echo -e "${RED}❌ RESEND_API_KEY not found in .env.local${NC}"
    echo -e "${YELLOW}Please add RESEND_API_KEY to your .env.local file${NC}"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📧 Resend Email Logs${NC}"
echo -e "${BLUE}===================${NC}"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is not installed. Please install it first:${NC}"
    echo -e "${YELLOW}  brew install jq${NC}"
    exit 1
fi

echo -e "${YELLOW}Fetching last $LIMIT emails from Resend...${NC}"
echo ""

# Fetch emails from Resend API
RESPONSE=$(curl -s -X GET "https://api.resend.com/emails" \
  -H "Authorization: Bearer $API_KEY")

# Check if the request was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully fetched email logs${NC}"
    echo ""
    
    # Parse and display emails
    echo "$RESPONSE" | jq -r --argjson limit "$LIMIT" '
        .data[0:$limit] | .[] | 
        "📧 " + (.subject // "No Subject") + 
        "\n   To: " + (.to | join(", ")) + 
        "\n   Status: " + (.last_event // "Unknown") + 
        "\n   Sent: " + (.created_at // "Unknown") + 
        "\n   ID: " + (.id // "Unknown") + 
        "\n"
    '
    
    # Show summary
    TOTAL_EMAILS=$(echo "$RESPONSE" | jq '.data | length')
    echo -e "${BLUE}📊 Summary:${NC}"
    echo -e "   Total emails in log: $TOTAL_EMAILS"
    echo -e "   Showing last: $LIMIT"
    
    # Count by status
    echo ""
    echo -e "${BLUE}📈 Status Breakdown:${NC}"
    echo "$RESPONSE" | jq -r '.data | group_by(.last_event) | .[] | "   " + (.[0].last_event // "Unknown") + ": " + (length | tostring) + " emails"'
    
else
    echo -e "${RED}❌ Failed to fetch email logs${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}💡 To send a test email, run: ./scripts/test-email.sh${NC}"
