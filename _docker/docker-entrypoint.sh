#!/bin/sh
set -e

# Signal trap for graceful shutdown
cleanup() {
    echo "Received shutdown signal, stopping services..."
    if [ -n "$BACKEND_PID" ]; then
        echo "Stopping filebrowser (PID $BACKEND_PID)..."
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
    fi
    echo "All services stopped."
    exit 0
}
trap cleanup TERM INT

# Wait for a port to be ready (avoids arbitrary sleep delays)
wait_for_port() {
    local host="$1"
    local port="$2"
    local max_wait="${3:-30}"
    local waited=0
    while [ $waited -lt $max_wait ]; do
        if nc -z "$host" "$port" 2>/dev/null; then
            echo "Port $port is ready after ${waited}s"
            return 0
        fi
        waited=$((waited + 1))
        sleep 1
    done
    echo "WARNING: Port $port not ready after ${max_wait}s"
    return 1
}

# Start Go backend in background (listens on internal port 8080)
echo "Starting filebrowser backend on port 8080..."
./filebrowser &
BACKEND_PID=$!

# Wait for backend to be ready on port 8080 (the correct internal port)
wait_for_port 127.0.0.1 8080 30 || echo "Backend may still be starting..."

# Nginx runtime directories are created at build time (in Dockerfile),
# so no runtime mkdir needed here.

# Start nginx in foreground (replaces current process)
echo "Starting nginx on port 80..."
exec nginx -c /etc/nginx/nginx.conf
