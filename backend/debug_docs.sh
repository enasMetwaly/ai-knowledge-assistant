#!/bin/bash
echo "1. Login..."
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=password123" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

echo "Token: $TOKEN"
echo ""
echo "2. Raw /docs response:"
curl -s -X GET http://localhost:8000/docs \
  -H "Authorization: Bearer $TOKEN"