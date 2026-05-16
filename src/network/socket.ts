import { io, Socket } from 'socket.io-client';
import { CONFIG } from '../constants/config';

let socket: Socket | null = null;

export const connectSocket = (
  userId: string,
  onForceLogout?: () => void,
) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(CONFIG.SOCKET_URL, {
    transports: ['websocket'],
    query: {
      userId,
    },
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', reason => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', error => {
    console.log('Socket connect error:', error.message);
  });

  socket.on('new_message', message => {
    console.log('New message:', message);
  });

  socket.on('push_notification', notification => {
    console.log('Push notification:', notification);
  });

  socket.on('force_logout', () => {
    console.log('Force logout received');
    onForceLogout?.();
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};