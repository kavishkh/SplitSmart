import { MongoClient } from 'mongodb';

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Khanna:Kavish12@splitwiseapp.9r9zryh.mongodb.net/splitwiseApp?retryWrites=true&w=majority';
const DATABASE_NAME = process.env.DATABASE_NAME || 'splitwiseApp';

let client;
let db;
let changeStreams = {};
let isDatabaseConnected = false;
let connectionRetryCount = 0;
const MAX_RETRY_ATTEMPTS = 5;

const connectDatabase = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//[USERNAME]:[PASSWORD]@')); // Hide credentials in logs
    console.log('Database Name:', DATABASE_NAME);
    
    // Create MongoDB client with proper options for change streams
    client = new MongoClient(MONGODB_URI, {
      // Required options for change streams
      monitorCommands: true,
      serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
      connectTimeoutMS: 20000, // Connection timeout after 20s
      maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
      retryWrites: true,
      retryReads: true,
      // Add connection pool options
      maxPoolSize: 10,
      minPoolSize: 5,
      maxConnecting: 10
    });
    
    // Connect to MongoDB
    await client.connect();
    console.log('✅ MongoDB Connected');
    isDatabaseConnected = true;
    connectionRetryCount = 0; // Reset retry count on successful connection
    
    // Set the database
    db = client.db(DATABASE_NAME);
    
    // Test the connection by listing collections
    const collections = await db.listCollections().toArray();
    console.log(`📁 Database: ${DATABASE_NAME}`);
    console.log(`📋 Collections: ${collections.map(c => c.name).join(', ') || 'None'}`);
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    
    // Provide more specific error messages
    if (error.message.includes('bad auth')) {
      console.error('🔐 Authentication failed. Please check your MongoDB username and password.');
      console.error('   Make sure to URL encode special characters in your password.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🌐 DNS lookup failed. Please check your MongoDB URI.');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('🔌 Connection refused. MongoDB server may be down or unreachable.');
    }
    
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    isDatabaseConnected = false;
    
    // Increment retry count and schedule retry if under limit
    connectionRetryCount++;
    if (connectionRetryCount <= MAX_RETRY_ATTEMPTS) {
      console.log(`🔄 Retry attempt ${connectionRetryCount}/${MAX_RETRY_ATTEMPTS} in 5 seconds...`);
    }
    
    return null;
  }
};

const getDatabase = () => db;

const isDatabaseAvailable = () => isDatabaseConnected;

const closeDatabase = async () => {
  // Close all change streams
  for (const [collectionName, stream] of Object.entries(changeStreams)) {
    if (stream) {
      stream.close();
      console.log(`❌ Closed change stream for ${collectionName}`);
    }
  }
  
  if (client) {
    await client.close();
    console.log('❌ MongoDB connection closed');
  }
  isDatabaseConnected = false;
  connectionRetryCount = 0;
};

// Function to create a change stream for a collection
const createChangeStream = (collectionName, callback) => {
  if (!db) {
    console.error('❌ Database not connected');
    return null;
  }
  
  try {
    const collection = db.collection(collectionName);
    const changeStream = collection.watch();
    
    changeStream.on('change', (change) => {
      console.log(`🔄 Change detected in ${collectionName}:`, change.operationType);
      callback(change);
    });
    
    changeStream.on('error', (error) => {
      console.error(`❌ Change stream error for ${collectionName}:`, error);
    });
    
    changeStream.on('close', () => {
      console.log(`❌ Change stream closed for ${collectionName}`);
      delete changeStreams[collectionName];
    });
    
    // Store the change stream
    changeStreams[collectionName] = changeStream;
    
    console.log(`✅ Change stream created for ${collectionName}`);
    return changeStream;
  } catch (error) {
    console.error(`❌ Failed to create change stream for ${collectionName}:`, error);
    return null;
  }
};

// Function to get active change streams
const getChangeStreams = () => changeStreams;

export { connectDatabase, getDatabase, closeDatabase, createChangeStream, getChangeStreams, isDatabaseAvailable };