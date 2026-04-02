#!/bin/sh
set -e

# Start Go backend in background
echo "Starting filebrowser backend on port 8080..."
./filebrowser &
BACKEND_PID=$!

# Wait for backend to initialize
sleep 2

# Start serve for React SPA in background
echo "Starting React SPA server on port 3000..."
serve -s dist -l 3000 &
SERVE_PID=$!

# Wait for serve to start
sleep 1

# Start nginx in foreground (replaces current process)
echo "Starting nginx on port 80..."
exec nginx -c /etc/nginx/nginx.conf
