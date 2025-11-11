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

async function deleteTestGroups() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    
    // Find and delete test groups
    const groupsCollection = db.collection('groups');
    
    // Find groups with "test" in their name (case insensitive)
    const testGroups = await groupsCollection.find({
      name: { $regex: /test/i }
    }).toArray();
    
    console.log(`Found ${testGroups.length} test groups`);
    
    if (testGroups.length === 0) {
      console.log('No test groups found to delete');
      return;
    }
    
    // Display the groups that will be deleted
    console.log('\nTest groups to be deleted:');
    testGroups.forEach(group => {
      console.log(`- ${group.name} (ID: ${group.id})`);
    });
    
    // Confirm deletion
    console.log('\nDeleting test groups...');
    
    // Delete test groups
    const groupIds = testGroups.map(group => group.id);
    const deleteResult = await groupsCollection.deleteMany({
      id: { $in: groupIds }
    });
    
    console.log(`✅ Deleted ${deleteResult.deletedCount} test groups`);
    
    // Also delete associated expenses and settlements
    if (groupIds.length > 0) {
      const expensesCollection = db.collection('expenses');
      const settlementsCollection = db.collection('settlements');
      
      // Delete associated expenses
      const expenseDeleteResult = await expensesCollection.deleteMany({
        groupId: { $in: groupIds }
      });
      console.log(`🗑️ Deleted ${expenseDeleteResult.deletedCount} associated expenses`);
      
      // Delete associated settlements
      const settlementDeleteResult = await settlementsCollection.deleteMany({
        groupId: { $in: groupIds }
      });
      console.log(`🗑️ Deleted ${settlementDeleteResult.deletedCount} associated settlements`);
    }
    
    console.log('\n🎉 Test group cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during test group deletion:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('❌ MongoDB connection closed');
    }
  }
}

// Run the deletion
deleteTestGroups();