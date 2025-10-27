#!/bin/bash

# Simple Visitor Track Test

API_URL="${1:-http://localhost:3000}"

echo "🎯 Tracking a test visit..."
echo "API URL: $API_URL"
echo ""

curl -v -X POST "$API_URL/api/visitor/track" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Test-Browser/1.0" \
  2>&1 | grep -E "HTTP|success|message"

echo ""
echo "✅ Done! Check backend logs for confirmation."
