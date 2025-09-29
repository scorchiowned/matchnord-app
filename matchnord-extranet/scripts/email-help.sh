#!/bin/bash

# Email Testing Help Script
# Usage: ./scripts/email-help.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}📧 Email Testing Help${NC}"
echo -e "${BLUE}====================${NC}"
echo ""

echo -e "${CYAN}Available Scripts:${NC}"
echo ""
echo -e "${GREEN}1. test-email.sh${NC}"
echo -e "   Test a specific email type"
echo -e "   Usage: ${YELLOW}./scripts/test-email.sh [type] [email]${NC}"
echo -e "   Example: ${YELLOW}./scripts/test-email.sh team-manager-welcome manttila83@gmail.com${NC}"
echo ""

echo -e "${GREEN}2. test-all-emails.sh${NC}"
echo -e "   Test all available email types"
echo -e "   Usage: ${YELLOW}./scripts/test-all-emails.sh [email]${NC}"
echo -e "   Example: ${YELLOW}./scripts/test-all-emails.sh manttila83@gmail.com${NC}"
echo ""

echo -e "${GREEN}3. check-email-logs.sh${NC}"
echo -e "   Check Resend email delivery logs"
echo -e "   Usage: ${YELLOW}./scripts/check-email-logs.sh [limit]${NC}"
echo -e "   Example: ${YELLOW}./scripts/check-email-logs.sh 5${NC}"
echo ""

echo -e "${CYAN}Available Email Types:${NC}"
echo ""
echo -e "${GREEN}• test${NC} - Basic connectivity test"
echo -e "${GREEN}• registration${NC} - Tournament registration confirmation"
echo -e "${GREEN}• status${NC} - Registration status update"
echo -e "${GREEN}• announcement${NC} - Tournament announcement"
echo -e "${GREEN}• match${NC} - Match notification"
echo -e "${GREEN}• team-manager-welcome${NC} - Team Manager welcome email"
echo ""

echo -e "${CYAN}Common Issues & Solutions:${NC}"
echo ""
echo -e "${YELLOW}❌ Domain Verification Error:${NC}"
echo -e "   Problem: 'You can only send testing emails to your own email address'"
echo -e "   Solution: Verify your domain at resend.com/domains"
echo -e "   Workaround: Use manttila83@gmail.com for testing"
echo ""

echo -e "${YELLOW}❌ Server Not Running:${NC}"
echo -e "   Problem: 'Server is not running at http://localhost:3000'"
echo -e "   Solution: Start the server with ${YELLOW}npm run dev${NC}"
echo ""

echo -e "${YELLOW}❌ jq Not Installed:${NC}"
echo -e "   Problem: 'jq is not installed'"
echo -e "   Solution: Install jq with ${YELLOW}brew install jq${NC}"
echo ""

echo -e "${CYAN}Quick Commands:${NC}"
echo ""
echo -e "${YELLOW}# Test basic email to Gmail${NC}"
echo -e "   ./scripts/test-email.sh test manttila83@gmail.com"
echo ""
echo -e "${YELLOW}# Test all emails to Gmail${NC}"
echo -e "   ./scripts/test-all-emails.sh manttila83@gmail.com"
echo ""
echo -e "${YELLOW}# Check recent email logs${NC}"
echo -e "   ./scripts/check-email-logs.sh 10"
echo ""

echo -e "${CYAN}Environment Configuration:${NC}"
echo ""
echo -e "Make sure your ${YELLOW}.env.local${NC} file contains:"
echo -e "   ${GREEN}RESEND_API_KEY=re_MfR1N29p_2VLYHC2pjKpJqnCK6YRxUm6C${NC}"
echo -e "   ${GREEN}EMAIL_FROM=support@braketly.com${NC}"
echo ""

echo -e "${CYAN}For Production:${NC}"
echo ""
echo -e "1. Verify your domain at ${YELLOW}resend.com/domains${NC}"
echo -e "2. Update ${YELLOW}EMAIL_FROM${NC} to use your verified domain"
echo -e "3. Test with any email address"
echo ""

