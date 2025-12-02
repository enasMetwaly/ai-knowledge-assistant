#!/bin/bash

echo "1. Testing login..."
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=password123" \
  | jq -r '.access_token')

echo "Token: $TOKEN"
echo ""

echo "2. Testing docs endpoint..."
curl -X GET http://localhost:8000/docs \
  -H "Authorization: Bearer $TOKEN" \
  | jq .

echo ""
echo "3. Testing upload..."
echo "test content" > test.txt
curl -X POST http://localhost:8000/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.txt"

echo ""
echo "4. Check docs again..."
curl -X GET http://localhost:8000/docs \
  -H "Authorization: Bearer $TOKEN" \
  | jq .