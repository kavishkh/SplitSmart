import mongoose from 'mongoose';

// MongoDB connection string from user preferences
const MONGODB_URI = 'mongodb+srv://kavishkhanna06_db_user:Kavish12@splitwise.wgwkhfv.mongodb.net/splitwise?retryWrites=true&w=majority&appName=SplitSmart';

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      // Add connection options to help with SSL issues
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    // Continue without database connection for demo purposes
    console.log('Running in demo mode without database connection');
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

export default connectDatabase;