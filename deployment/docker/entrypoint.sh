#!/bin/sh
set -e

# Default values
export BACKEND_URL=${BACKEND_URL:-http://backend:3001}

echo "Starting nginx with backend URL: $BACKEND_URL"

# Substitute environment variables in nginx config
envsubst '$BACKEND_URL' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Test nginx configuration
nginx -t

# Start nginx
echo "Starting nginx..."
exec nginx -g 'daemon off;'