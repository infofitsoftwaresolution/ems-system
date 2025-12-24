import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./use-auth";

// Get backend URL - handle both absolute and relative URLs
// This function must be called at runtime, not at module load time
const getSocketUrl = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return "http://localhost:3001";
  }
  
  const apiUrl = import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Detect production: not localhost, not 127.0.0.1, and not a local IP
  const isLocalhost = hostname === 'localhost' || 
                      hostname === '127.0.0.1' || 
                      hostname.startsWith('192.168.') ||
                      hostname.startsWith('10.') ||
                      hostname.endsWith('.local');
  const isProduction = !isLocalhost;
  
  // In production, ALWAYS use the same origin (Socket.IO is served from the same server via nginx)
  if (isProduction) {
    const origin = window.location.origin;
    console.log('🔌 Production detected, using origin:', origin);
    return origin;
  }
  
  // Development: If VITE_API_URL is an absolute URL (starts with http:// or https://)
  if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
    return apiUrl.replace(/\/api\/?$/, ''); // Remove /api suffix if present
  }
  
  // Development: If VITE_API_URL is a relative path (like /api), use current origin
  if (apiUrl && apiUrl.startsWith('/')) {
    return window.location.origin;
  }
  
  // Development fallback to localhost
  return "http://localhost:3001";
};

// Singleton socket instance to prevent multiple connections
let globalSocket = null;

// Export function to get the global socket instance
export function getGlobalSocket() {
  return globalSocket;
}

export function useSocket(onMessage, onChannelMessage, onNotification) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const callbacksRef = useRef({ onMessage, onChannelMessage, onNotification });

  // Update callbacks ref when they change (without reconnecting)
  useEffect(() => {
    callbacksRef.current = { onMessage, onChannelMessage, onNotification };
  }, [onMessage, onChannelMessage, onNotification]);

  useEffect(() => {
    if (!user?.email) {
      // Disconnect if user logs out
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        socketRef.current = null;
      }
      return;
    }

    // Use singleton socket to prevent multiple connections
    if (!globalSocket || !globalSocket.connected) {
      // Initialize socket connection
      // Use polling first, then upgrade to websocket if available
      const socketOptions = {
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
        upgrade: true,
        rememberUpgrade: true,
      };
      
      // In production, if using same origin, Socket.IO should work without explicit path
      // But if backend is on a different port/path, we might need to specify path
      // For now, let Socket.IO auto-detect the path
      
      // Get Socket URL at runtime (not at module load time)
      const socketUrl = getSocketUrl();
      console.log("🔌 Socket.IO Connection Details:");
      console.log("  - Socket URL:", socketUrl);
      console.log("  - VITE_API_URL:", import.meta.env.VITE_API_URL);
      console.log("  - PROD mode:", import.meta.env.PROD);
      console.log("  - window.location.origin:", typeof window !== 'undefined' ? window.location.origin : 'N/A');
      console.log("  - window.location.hostname:", typeof window !== 'undefined' ? window.location.hostname : 'N/A');
      
      // Socket.IO connection options with explicit path for production
      const finalSocketOptions = {
        ...socketOptions,
        path: "/socket.io/",
        withCredentials: true,
      };
      
      globalSocket = io(socketUrl, finalSocketOptions);
      socketRef.current = globalSocket;

      // Connection event - basic test
      globalSocket.on("connect", () => {
        const socketId = globalSocket.id || "connecting...";
        console.log("✅ Connected", socketId);
        if (globalSocket.io?.engine?.transport) {
          console.log(
            "Socket transport:",
            globalSocket.io.engine.transport.name
          );
        }
      });

      // Listen for test message from server
      globalSocket.on("test", (data) => {
        console.log("✅ Test message from server:", data);
      });

      // Error handling with detailed logging
      globalSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        console.error("Error type:", error.type);
        console.error("Error message:", error.message);
        console.error("Socket URL:", socketUrl);
        console.error("VITE_API_URL:", import.meta.env.VITE_API_URL);
        console.error("window.location.origin:", typeof window !== 'undefined' ? window.location.origin : 'N/A');
      });

      globalSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        // Reconnection will happen automatically
      });
    } else {
      // Reuse existing connection
      socketRef.current = globalSocket;
    }

    const socket = socketRef.current;

    // Listen for direct messages - optimized with deferred execution
    const handleDirectMessage = (data) => {
      // Use setTimeout to push to next event loop tick for better performance
      setTimeout(() => {
        const { onMessage: handleMessage } = callbacksRef.current;
        if (
          handleMessage &&
          (data.recipientEmail === user.email || data.senderEmail === user.email)
        ) {
          handleMessage(data.message);
        }
      }, 0);
    };

    // Listen for channel messages - optimized with deferred execution
    const handleChannelMessage = (data) => {
      // Use setTimeout to push to next event loop tick for better performance
      setTimeout(() => {
        const { onChannelMessage: handleChannelMessage } = callbacksRef.current;
        if (handleChannelMessage) {
          handleChannelMessage(data.channelId, data.message);
        }
      }, 0);
    };

    // Listen for notifications - optimized with deferred execution
    const handleNotification = (data) => {
      // Use setTimeout to push to next event loop tick for better performance
      setTimeout(() => {
        const { onNotification: handleNotificationCallback } =
          callbacksRef.current;
        if (handleNotificationCallback) {
          handleNotificationCallback(data);
        }
      }, 0);
    };

    socket.on("new-direct-message", handleDirectMessage);
    socket.on("new-channel-message", handleChannelMessage);
    socket.on("new-notification", handleNotification);

    // Cleanup: remove listeners but don't disconnect (keep connection alive)
    return () => {
      if (socket) {
        socket.off("new-direct-message", handleDirectMessage);
        socket.off("new-channel-message", handleChannelMessage);
        socket.off("new-notification", handleNotification);
      }
    };
  }, [user?.email]);

  return socketRef.current;
}
