#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:2818/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "Testing image preview..."
curl -s "http://localhost:2818/api/resources/preview?path=/photo.jpg&source=/" \
  -H "Authorization: Bearer $TOKEN" -o /tmp/test-img.jpg \
  && echo "Image preview OK: $(wc -c < /tmp/test-img.jpg) bytes" || echo "Failed"

echo "Testing folder preview..."
curl -s "http://localhost:2818/api/resources/preview?path=/test-folder&source=/&atPercentage=0" \
  -H "Authorization: Bearer $TOKEN" -o /tmp/test-folder.jpg \
  && echo "Folder preview OK: $(wc -c < /tmp/test-folder.jpg) bytes" || echo "Failed"
