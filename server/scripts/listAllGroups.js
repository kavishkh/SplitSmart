import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Khanna:Kavish12@splitwiseapp.9r9zryh.mongodb.net/splitwiseApp?retryWrites=true&w=majority';
const DATABASE_NAME = process.env.DATABASE_NAME || 'splitwiseApp';

async function listAllGroups() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    
    // List all groups
    const groupsCollection = db.collection('groups');
    const allGroups = await groupsCollection.find({}).toArray();
    
    console.log(`\nFound ${allGroups.length} groups in the database:`);
    
    if (allGroups.length === 0) {
      console.log('No groups found in the database');
      return;
    }
    
    allGroups.forEach((group, index) => {
      console.log(`\n${index + 1}. ${group.name}`);
      console.log(`   ID: ${group.id}`);
      console.log(`   Description: ${group.description || 'No description'}`);
      console.log(`   Members: ${group.members ? group.members.length : 0}`);
      console.log(`   Created: ${group.createdAt || 'Unknown'}`);
      console.log(`   Total Spent: ${group.totalAmount || group.totalSpent || 0}`);
    });
    
    // Also list associated expenses and settlements count
    console.log('\n--- Associated Data ---');
    for (const group of allGroups) {
      const expensesCollection = db.collection('expenses');
      const settlementsCollection = db.collection('settlements');
      
      const expenseCount = await expensesCollection.countDocuments({ groupId: group.id });
      const settlementCount = await settlementsCollection.countDocuments({ groupId: group.id });
      
      console.log(`\n${group.name}:`);
      console.log(`   Expenses: ${expenseCount}`);
      console.log(`   Settlements: ${settlementCount}`);
    }
    
  } catch (error) {
    console.error('❌ Error listing groups:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n❌ MongoDB connection closed');
    }
  }
}

// Run the listing
listAllGroups();