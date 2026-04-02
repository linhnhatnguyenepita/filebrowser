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
    local max_wait="${3:-15}"
    local waited=0
    while [ $waited -lt $max_wait ]; do
        if nc -z "$host" "$port" 2>/dev/null; then
            return 0
        fi
        waited=$((waited + 1))
        sleep 1
    done
    echo "WARNING: Port $port not ready after ${max_wait}s"
    return 1
}

# Start Go backend in background
echo "Starting filebrowser backend on port 8080..."
./filebrowser &
BACKEND_PID=$!

# Wait for backend to initialize
wait_for_port 127.0.0.1 8080 15 || echo "Backend may still be starting..."

# Create nginx runtime directories (nginx runs as non-root user filebrowser)
mkdir -p /var/lib/nginx/tmp/client_body /var/lib/nginx/proxy /var/lib/nginx/fastcgi /var/lib/nginx/uwsgi /var/lib/nginx/scgi
mkdir -p /var/log/nginx

# Start nginx in foreground (replaces current process)
echo "Starting nginx on port 80..."
exec nginx -c /etc/nginx/nginx.conf
