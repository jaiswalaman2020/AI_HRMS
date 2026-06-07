import { io } from 'socket.io-client';

let socket = null;

// Lazily create an authenticated socket connection.
export function getSocket() {
  const token = localStorage.getItem('hrms_token');
  if (!token) return null;
  if (socket && socket.connected) return socket;
  socket = io('/', { auth: { token }, transports: ['websocket', 'polling'] });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
