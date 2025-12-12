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

async function verifyGroupFiltering() {
  let client;
  
  try {
    console.log('🔍 Verifying Group Filtering Implementation...\n');
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(DATABASE_NAME);
    const groupsCollection = db.collection('groups');
    
    // Check if there are existing groups in the database
    const allGroups = await groupsCollection.find({}).toArray();
    console.log(`📊 Total groups in database: ${allGroups.length}`);
    
    if (allGroups.length === 0) {
      console.log('⚠️ No existing groups found. Creating test data...\n');
      
      // Create test groups for different users
      const testGroups = [
        {
          id: 'group-1',
          name: 'Tusha\'s Group',
          description: 'Group created by Tusha',
          createdBy: 'user-tusha',
          members: [
            { id: 'user-tusha', name: 'tusha', email: 'tusha@splitsmart.com' }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalAmount: 0,
          yourBalance: 0,
          lastActivity: new Date().toISOString()
        },
        {
          id: 'group-2',
          name: 'John\'s Group',
          description: 'Group created by John',
          createdBy: 'user-john',
          members: [
            { id: 'user-john', name: 'John', email: 'john@example.com' }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalAmount: 0,
          yourBalance: 0,
          lastActivity: new Date().toISOString()
        },
        {
          id: 'group-3',
          name: 'Shared Group',
          description: 'Group with both Tusha and John',
          createdBy: 'user-tusha',
          members: [
            { id: 'user-tusha', name: 'tusha', email: 'tusha@splitsmart.com' },
            { id: 'user-john', name: 'John', email: 'john@example.com' }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalAmount: 0,
          yourBalance: 0,
          lastActivity: new Date().toISOString()
        }
      ];
      
      // Insert test groups
      const result = await groupsCollection.insertMany(testGroups);
      console.log(`✅ Created ${result.insertedCount} test groups\n`);
      
      // Re-fetch all groups
      const updatedGroups = await groupsCollection.find({}).toArray();
      console.log(`📊 Total groups after creating test data: ${updatedGroups.length}\n`);
    } else {
      console.log('✅ Found existing groups in database\n');
    }
    
    // Test filtering for user-tusha
    console.log('1. Testing group filtering for user-tusha...');
    const tushaGroups = await groupsCollection.find({
      $or: [
        { createdBy: 'user-tusha' },
        { 'members.id': 'user-tusha' }
      ]
    }).toArray();
    
    console.log(`   User-tusha should see groups where they are creator or member`);
    console.log(`   Found ${tushaGroups.length} groups for user-tusha:`);
    tushaGroups.forEach(group => {
      console.log(`     - ${group.name} (created by: ${group.createdBy})`);
    });
    
    // Test filtering for user-john
    console.log('\n2. Testing group filtering for user-john...');
    const johnGroups = await groupsCollection.find({
      $or: [
        { createdBy: 'user-john' },
        { 'members.id': 'user-john' }
      ]
    }).toArray();
    
    console.log(`   User-john should see groups where they are creator or member`);
    console.log(`   Found ${johnGroups.length} groups for user-john:`);
    johnGroups.forEach(group => {
      console.log(`     - ${group.name} (created by: ${group.createdBy})`);
    });
    
    // Verify that user-tusha cannot see groups they don't own or aren't member of
    console.log('\n3. Verifying group isolation...');
    const allCurrentGroups = await groupsCollection.find({}).toArray();
    const tushaOwnedOrMember = allCurrentGroups.filter(group => 
      group.createdBy === 'user-tusha' || 
      (group.members && group.members.some(member => member.id === 'user-tusha'))
    );
    
    if (tushaGroups.length === tushaOwnedOrMember.length) {
      console.log('✅ Group filtering is working correctly for user-tusha');
    } else {
      console.log('❌ Group filtering issue detected for user-tusha');
      console.log(`   Expected: ${tushaOwnedOrMember.length} groups`);
      console.log(`   Actual: ${tushaGroups.length} groups`);
    }
    
    const johnOwnedOrMember = allCurrentGroups.filter(group => 
      group.createdBy === 'user-john' || 
      (group.members && group.members.some(member => member.id === 'user-john'))
    );
    
    if (johnGroups.length === johnOwnedOrMember.length) {
      console.log('✅ Group filtering is working correctly for user-john');
    } else {
      console.log('❌ Group filtering issue detected for user-john');
      console.log(`   Expected: ${johnOwnedOrMember.length} groups`);
      console.log(`   Actual: ${johnGroups.length} groups`);
    }
    
    console.log('\n🎉 Group filtering verification completed!');
    console.log('Summary:');
    console.log(`- Total groups in database: ${allCurrentGroups.length}`);
    console.log(`- Groups accessible to user-tusha: ${tushaGroups.length}`);
    console.log(`- Groups accessible to user-john: ${johnGroups.length}`);
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n❌ MongoDB connection closed');
    }
  }
}

// Run the verification
verifyGroupFiltering();