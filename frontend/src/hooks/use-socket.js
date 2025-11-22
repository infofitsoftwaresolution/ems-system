import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './use-auth';

const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

// Singleton socket instance to prevent multiple connections
let globalSocket = null;

export function useSocket(onMessage, onChannelMessage) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const callbacksRef = useRef({ onMessage, onChannelMessage });

  // Update callbacks ref when they change (without reconnecting)
  useEffect(() => {
    callbacksRef.current = { onMessage, onChannelMessage };
  }, [onMessage, onChannelMessage]);

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
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
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
      if (handleMessage && (data.recipientEmail === user.email || data.senderEmail === user.email)) {
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

    socket.on('new-direct-message', handleDirectMessage);
    socket.on('new-channel-message', handleChannelMessage);

    // Cleanup: remove listeners but don't disconnect (keep connection alive)
    return () => {
      if (socket) {
        socket.off('new-direct-message', handleDirectMessage);
        socket.off('new-channel-message', handleChannelMessage);
      }
    };
  }, [user?.email]);

  return socketRef.current;
}

