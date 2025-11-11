import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Khanna:9478934457@splitwiseapp.9r9zryh.mongodb.net/splitwiseApp?retryWrites=true&w=majority';
const DATABASE_NAME = process.env.DATABASE_NAME || 'splitwiseApp';

async function initDatabase() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    
    // Create collections
    console.log('Creating collections...');
    
    // Users collection
    const usersCollection = db.collection('users');
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ id: 1 }, { unique: true });
    console.log('✅ Users collection created with indexes');
    
    // Groups collection
    const groupsCollection = db.collection('groups');
    await groupsCollection.createIndex({ id: 1 }, { unique: true });
    await groupsCollection.createIndex({ created_by: 1 });
    console.log('✅ Groups collection created with indexes');
    
    // Expenses collection
    const expensesCollection = db.collection('expenses');
    await expensesCollection.createIndex({ id: 1 }, { unique: true });
    await expensesCollection.createIndex({ group_id: 1 });
    await expensesCollection.createIndex({ paid_by: 1 });
    console.log('✅ Expenses collection created with indexes');
    
    // Settlements collection
    const settlementsCollection = db.collection('settlements');
    await settlementsCollection.createIndex({ id: 1 }, { unique: true });
    await settlementsCollection.createIndex({ group_id: 1 });
    await settlementsCollection.createIndex({ from_user: 1 });
    await settlementsCollection.createIndex({ to_user: 1 });
    console.log('✅ Settlements collection created with indexes');
    
    console.log('🎉 Database initialization completed successfully!');
    console.log(`📁 Database: ${DATABASE_NAME}`);
    console.log('📋 Collections created: users, groups, expenses, settlements');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('❌ MongoDB connection closed');
    }
  }
}

// Run the initialization
initDatabase();