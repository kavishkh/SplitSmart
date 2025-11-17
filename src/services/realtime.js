import { io } from 'socket.io-client';

// Create Socket.IO client connection
const SOCKET_URL = 'http://localhost:40001';

class RealtimeService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
  }

  // Connect to the Socket.IO server
  connect() {
    if (this.socket) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to real-time server');
      this.isConnected = true;
      this.emit('subscribe', ['users', 'groups', 'expenses', 'settlements']);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from real-time server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Real-time connection error:', error);
      this.isConnected = false;
    });

    // Listen for data updates
    this.socket.on('data_update', (data) => {
      console.log('🔄 Received real-time update:', data);
      this.handleDataUpdate(data);
    });

    // Handle subscription confirmation
    this.socket.on('subscribed', (data) => {
      console.log('📌 Subscribed to collections:', data.collections);
    });
  }

  // Disconnect from the Socket.IO server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('❌ Disconnected from real-time server');
    }
  }

  // Subscribe to specific collections
  subscribe(collections) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe', collections);
    }
  }

  // Handle incoming data updates
  handleDataUpdate(data) {
    const { type, operation, data: updateData } = data;
    
    // Notify all listeners for this data type
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => {
        try {
          callback(operation, updateData);
        } catch (error) {
          console.error(`Error in ${type} listener:`, error);
        }
      });
    }
  }

  // Add a listener for a specific data type
  addListener(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
  }

  // Remove a listener for a specific data type
  removeListener(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback);
      // Clean up empty listener sets
      if (this.listeners.get(type).size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  // Remove all listeners
  removeAllListeners() {
    this.listeners.clear();
  }

  // Check if connected
  get connected() {
    return this.isConnected;
  }
}

// Create a singleton instance
const realtimeService = new RealtimeService();

export default realtimeService;