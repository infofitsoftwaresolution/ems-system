<<<<<<< HEAD
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./use-auth";

// Get backend URL - use explicit localhost:3001 for development
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
=======
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './use-auth';

const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
>>>>>>> 6c6bd6c72613766ae6e6cf0e8d97c1fbdbd053bc

// Singleton socket instance to prevent multiple connections
let globalSocket = null;

<<<<<<< HEAD
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
=======
export function useSocket(onMessage, onChannelMessage) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const callbacksRef = useRef({ onMessage, onChannelMessage });

  // Update callbacks ref when they change (without reconnecting)
  useEffect(() => {
    callbacksRef.current = { onMessage, onChannelMessage };
  }, [onMessage, onChannelMessage]);
>>>>>>> 6c6bd6c72613766ae6e6cf0e8d97c1fbdbd053bc

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
      globalSocket = io(SOCKET_URL, {
<<<<<<< HEAD
        transports: ["polling", "websocket"],
=======
        transports: ['polling', 'websocket'], // Try polling first, then websocket
>>>>>>> 6c6bd6c72613766ae6e6cf0e8d97c1fbdbd053bc
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
<<<<<<< HEAD
        upgrade: true,
        rememberUpgrade: true,
      });
      socketRef.current = globalSocket;

      // Connection event - basic test
      globalSocket.on("connect", () => {
        console.log("✅ Connected", globalSocket.id);
        console.log("Socket transport:", globalSocket.io.engine.transport.name);
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
=======
        upgrade: true, // Allow upgrade from polling to websocket
        rememberUpgrade: true, // Remember websocket preference
      });
      socketRef.current = globalSocket;

      // Connection event
      globalSocket.on('connect', () => {
        console.log('Socket connected:', globalSocket.id);
      });

      // Error handling
      globalSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      globalSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
>>>>>>> 6c6bd6c72613766ae6e6cf0e8d97c1fbdbd053bc
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
<<<<<<< HEAD
      if (
        handleMessage &&
        (data.recipientEmail === user.email || data.senderEmail === user.email)
      ) {
=======
      if (handleMessage && (data.recipientEmail === user.email || data.senderEmail === user.email)) {
>>>>>>> 6c6bd6c72613766ae6e6cf0e8d97c1fbdbd053bc
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

<<<<<<< HEAD
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
=======
    socket.on('new-direct-message', handleDirectMessage);
    socket.on('new-channel-message', handleChannelMessage);
>>>>>>> 6c6bd6c72613766ae6e6cf0e8d97c1fbdbd053bc

    // Cleanup: remove listeners but don't disconnect (keep connection alive)
    return () => {
      if (socket) {
<<<<<<< HEAD
        socket.off("new-direct-message", handleDirectMessage);
        socket.off("new-channel-message", handleChannelMessage);
        socket.off("new-notification", handleNotification);
=======
        socket.off('new-direct-message', handleDirectMessage);
        socket.off('new-channel-message', handleChannelMessage);
>>>>>>> 6c6bd6c72613766ae6e6cf0e8d97c1fbdbd053bc
      }
    };
  }, [user?.email]);

  return socketRef.current;
}
<<<<<<< HEAD
=======

>>>>>>> 6c6bd6c72613766ae6e6cf0e8d97c1fbdbd053bc
