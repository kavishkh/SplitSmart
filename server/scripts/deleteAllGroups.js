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

async function deleteAllGroups() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    
    // Count groups before deletion
    const groupsCollection = db.collection('groups');
    const initialGroupCount = await groupsCollection.countDocuments();
    
    if (initialGroupCount === 0) {
      console.log('No groups found to delete');
      return;
    }
    
    console.log(`Found ${initialGroupCount} groups in the database`);
    
    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will delete ALL groups and their associated data!');
    console.log('This action cannot be undone.\n');
    
    // In a script environment, we'll proceed with deletion
    console.log('Deleting all groups...');
    
    // Delete all groups
    const deleteResult = await groupsCollection.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} groups`);
    
    // Delete all associated expenses
    const expensesCollection = db.collection('expenses');
    const expenseDeleteResult = await expensesCollection.deleteMany({});
    console.log(`🗑️ Deleted ${expenseDeleteResult.deletedCount} associated expenses`);
    
    // Delete all associated settlements
    const settlementsCollection = db.collection('settlements');
    const settlementDeleteResult = await settlementsCollection.deleteMany({});
    console.log(`🗑️ Deleted ${settlementDeleteResult.deletedCount} associated settlements`);
    
    console.log('\n🎉 Complete database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('❌ MongoDB connection closed');
    }
  }
}

// Run the deletion
deleteAllGroups();