import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./use-auth";

// Get backend URL - handle both absolute and relative URLs
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // If VITE_API_URL is an absolute URL (starts with http:// or https://)
  if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
    return apiUrl.replace(/\/api\/?$/, ''); // Remove /api suffix if present
  }
  
  // If VITE_API_URL is a relative path (like /api), use current origin
  if (apiUrl && apiUrl.startsWith('/')) {
    // In production, use the same origin (window.location.origin)
    // Socket.IO connects to the same server, so we use the origin
    return window.location.origin;
  }
  
  // Fallback to localhost for development
  return "http://localhost:3001";
};

const SOCKET_URL = getSocketUrl();

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
      
      console.log("🔌 Connecting to Socket.IO at:", SOCKET_URL);
      globalSocket = io(SOCKET_URL, socketOptions);
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
        console.error("Socket URL:", SOCKET_URL);
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

    // Listen for direct messages
    const handleDirectMessage = (data) => {
      const { onMessage: handleMessage } = callbacksRef.current;
      if (
        handleMessage &&
        (data.recipientEmail === user.email || data.senderEmail === user.email)
      ) {
        handleMessage(data.message);
      }
    };

    // Listen for channel messages
    const handleChannelMessage = (data) => {
      const { onChannelMessage: handleChannelMessage } = callbacksRef.current;
      if (handleChannelMessage) {
        handleChannelMessage(data.channelId, data.message);
      }
    };

    // Listen for notifications
    const handleNotification = (data) => {
      const { onNotification: handleNotificationCallback } =
        callbacksRef.current;
      if (handleNotificationCallback) {
        handleNotificationCallback(data);
      }
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
