#!/bin/bash
echo "Starting Backend Server..."
echo ""
cd "$(dirname "$0")"
node src/server.js

