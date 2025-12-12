import { io } from 'socket.io-client';

// Connect to the Socket.IO server
const socket = io('http://localhost:40001', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

console.log('🔄 Connecting to Socket.IO server...');

socket.on('connect', () => {
  console.log('✅ Connected to real-time server');
  console.log('Socket ID:', socket.id);
  
  // Subscribe to collections
  socket.emit('subscribe', ['users', 'groups', 'expenses', 'settlements']);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from real-time server');
});

socket.on('connect_error', (error) => {
  console.error('❌ Real-time connection error:', error);
});

// Listen for data updates
socket.on('data_update', (data) => {
  console.log('🔄 Received real-time update:', data);
});

// Handle subscription confirmation
socket.on('subscribed', (data) => {
  console.log('📌 Subscribed to collections:', data.collections);
});

// Keep the process running
process.on('SIGINT', () => {
  console.log('🛑 Shutting down test client...');
  socket.disconnect();
  process.exit(0);
});