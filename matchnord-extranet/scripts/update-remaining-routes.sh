#!/bin/bash
# Script to help identify and update remaining routes
# This is a helper script - actual updates should be done manually

echo "Finding routes that still need permission updates..."
grep -r "role === 'TEAM_MANAGER'\|role: { in: \['ADMIN', 'MANAGER'\]" src/app/api/v1 --include="*.ts" | wc -l
echo "Routes found that need updating"

