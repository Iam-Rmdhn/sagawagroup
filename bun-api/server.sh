#!/bin/bash

# Server management script for Sagawa Group API
# Use environment variable or default to 3000 for dev, 5000 for production
NODE_ENV=${NODE_ENV:-development}
if [ "$NODE_ENV" = "production" ]; then
    PORT=5000
else
    PORT=3000
fi

case "$1" in
    start)
        echo "Starting Sagawa Group API server..."
        cd /root/sagawagroup/bun-api
        
        # Check if port is already in use
        if netstat -tlnp | grep -q ":$PORT "; then
            echo "Port $PORT is already in use!"
            echo "Use './server.sh stop' to stop the existing server first."
            exit 1
        fi
        
        # Start server in background with proper environment
        export NODE_ENV=$NODE_ENV
        export PORT=$PORT
        nohup bun run index.ts > server.log 2>&1 &
        SERVER_PID=$!
        echo $SERVER_PID > server.pid
        
        echo "Server started with PID: $SERVER_PID"
        echo "Server running on http://0.0.0.0:$PORT"
        echo "Logs are in server.log"
        
        # Wait a moment and test connection
        sleep 3
        if curl -s http://localhost:$PORT/api/health > /dev/null; then
            echo "✅ Server is responding correctly!"
        else
            echo "❌ Server may have failed to start. Check server.log"
        fi
        ;;
        
    stop)
        echo "Stopping Sagawa Group API server..."
        
        # Kill by PID file if exists
        if [ -f server.pid ]; then
            PID=$(cat server.pid)
            if kill -0 $PID 2>/dev/null; then
                kill -9 $PID
                echo "Server with PID $PID stopped."
            else
                echo "Server with PID $PID is not running."
            fi
            rm -f server.pid
        fi
        
        # Kill any remaining bun processes on the port
        EXISTING_PID=$(netstat -tlnp 2>/dev/null | grep ":$PORT " | awk '{print $7}' | cut -d'/' -f1)
        if [ ! -z "$EXISTING_PID" ]; then
            kill -9 $EXISTING_PID 2>/dev/null
            echo "Killed process $EXISTING_PID using port $PORT"
        fi
        
        echo "✅ Server stopped."
        ;;
        
    restart)
        echo "Restarting Sagawa Group API server..."
        $0 stop
        sleep 2
        $0 start
        ;;
        
    status)
        echo "Checking server status..."
        
        if [ -f server.pid ]; then
            PID=$(cat server.pid)
            if kill -0 $PID 2>/dev/null; then
                echo "✅ Server is running with PID: $PID"
            else
                echo "❌ Server PID file exists but process is not running"
                rm -f server.pid
            fi
        else
            echo "❌ No PID file found"
        fi
        
        # Check port
        if netstat -tlnp | grep -q ":$PORT "; then
            echo "✅ Port $PORT is in use"
            PROC_INFO=$(netstat -tlnp 2>/dev/null | grep ":$PORT ")
            echo "Process info: $PROC_INFO"
        else
            echo "❌ Port $PORT is not in use"
        fi
        
        # Test connection
        if curl -s http://localhost:$PORT/api/health > /dev/null; then
            echo "✅ Server is responding to requests"
            echo "Health check response:"
            curl -s http://localhost:$PORT/api/health | jq . 2>/dev/null || curl -s http://localhost:$PORT/api/health
        else
            echo "❌ Server is not responding to requests"
        fi
        ;;
        
    logs)
        echo "Showing server logs (last 50 lines)..."
        if [ -f /root/sagawagroup/bun-api/server.log ]; then
            tail -50 /root/sagawagroup/bun-api/server.log
        else
            echo "No log file found at /root/sagawagroup/bun-api/server.log"
        fi
        ;;
        
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the API server in background"
        echo "  stop    - Stop the API server"
        echo "  restart - Restart the API server"
        echo "  status  - Check server status and connectivity"
        echo "  logs    - Show recent server logs"
        exit 1
        ;;
esac