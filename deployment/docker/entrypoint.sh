#!/bin/sh

# Exit on any error
set -e

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to wait for backend
wait_for_backend() {
    log "Waiting for backend to be ready..."
    until curl -f http://backend:3001/api/health >/dev/null 2>&1; do
        log "Backend not ready, waiting..."
        sleep 2
    done
    log "Backend is ready!"
}

# Function to substitute environment variables in nginx config
setup_nginx_config() {
    log "Setting up nginx configuration..."
    
    # Create nginx config from template if it exists
    if [ -f "/etc/nginx/nginx.conf.template" ]; then
        envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
        log "Nginx configuration updated with environment variables"
    fi
    
    # Test nginx configuration
    nginx -t
    log "Nginx configuration test passed"
}

# Function to start nginx
start_nginx() {
    log "Starting nginx..."
    exec nginx -g "daemon off;"
}

# Main execution
main() {
    log "Starting EMS Frontend container..."
    
    # Wait for backend if BACKEND_URL is set
    if [ -n "${BACKEND_URL}" ]; then
        wait_for_backend
    fi
    
    # Setup nginx configuration
    setup_nginx_config
    
    # Start nginx
    start_nginx
}

# Handle shutdown signals
trap 'log "Received shutdown signal, stopping nginx..."; nginx -s quit' TERM INT

# Run main function
main "$@"