import { Server } from 'socket.io';
import { verifyToken } from '../utils/token.js';

let io = null;

// Initialise Socket.io and authenticate each connection via JWT.
export function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || '*', credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const decoded = verifyToken(token);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // Each user joins a personal room and a role room for targeted pushes.
    socket.join(`user:${socket.user.id}`);
    socket.join(`role:${socket.user.role}`);
    socket.emit('connected', { id: socket.user.id, role: socket.user.role });
  });

  return io;
}

// Emit an event to every socket whose user has one of the given roles.
export function emitToRole(roles, event, payload) {
  if (!io) return;
  const list = Array.isArray(roles) ? roles : [roles];
  list.forEach((r) => io.to(`role:${r}`).emit(event, payload));
}

// Emit to a specific user.
export function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}
