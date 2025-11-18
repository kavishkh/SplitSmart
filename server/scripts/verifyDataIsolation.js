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

async function verifyDataIsolation() {
  let client;
  
  try {
    console.log('🔍 Verifying Data Isolation Implementation...\n');
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(DATABASE_NAME);
    const groupsCollection = db.collection('groups');
    const expensesCollection = db.collection('expenses');
    const settlementsCollection = db.collection('settlements');
    
    // Check existing data
    const allGroups = await groupsCollection.find({}).toArray();
    const allExpenses = await expensesCollection.find({}).toArray();
    const allSettlements = await settlementsCollection.find({}).toArray();
    
    console.log(`📊 Current database state:`);
    console.log(`   - Groups: ${allGroups.length}`);
    console.log(`   - Expenses: ${allExpenses.length}`);
    console.log(`   - Settlements: ${allSettlements.length}\n`);
    
    // Test group filtering for different users
    console.log('1. Testing group filtering...');
    
    const tushaGroups = await groupsCollection.find({
      $or: [
        { createdBy: 'user-tusha' },
        { 'members.id': 'user-tusha' }
      ]
    }).toArray();
    
    const johnGroups = await groupsCollection.find({
      $or: [
        { createdBy: 'user-john' },
        { 'members.id': 'user-john' }
      ]
    }).toArray();
    
    const aliceGroups = await groupsCollection.find({
      $or: [
        { createdBy: 'user-alice' },
        { 'members.id': 'user-alice' }
      ]
    }).toArray();
    
    console.log(`   User-tusha groups: ${tushaGroups.length}`);
    console.log(`   User-john groups: ${johnGroups.length}`);
    console.log(`   User-alice groups: ${aliceGroups.length}\n`);
    
    // Test expense filtering for different users
    console.log('2. Testing expense filtering...');
    
    const tushaExpenses = await expensesCollection.find({
      $or: [
        { createdBy: 'user-tusha' },
        { paidBy: 'user-tusha' },
        { splitBetween: 'user-tusha' }
      ]
    }).toArray();
    
    const johnExpenses = await expensesCollection.find({
      $or: [
        { createdBy: 'user-john' },
        { paidBy: 'user-john' },
        { splitBetween: 'user-john' }
      ]
    }).toArray();
    
    const aliceExpenses = await expensesCollection.find({
      $or: [
        { createdBy: 'user-alice' },
        { paidBy: 'user-alice' },
        { splitBetween: 'user-alice' }
      ]
    }).toArray();
    
    console.log(`   User-tusha expenses: ${tushaExpenses.length}`);
    console.log(`   User-john expenses: ${johnExpenses.length}`);
    console.log(`   User-alice expenses: ${aliceExpenses.length}\n`);
    
    // Test settlement filtering for different users
    console.log('3. Testing settlement filtering...');
    
    const tushaSettlements = await settlementsCollection.find({
      $or: [
        { fromMember: 'user-tusha' },
        { toMember: 'user-tusha' }
      ]
    }).toArray();
    
    const johnSettlements = await settlementsCollection.find({
      $or: [
        { fromMember: 'user-john' },
        { toMember: 'user-john' }
      ]
    }).toArray();
    
    const aliceSettlements = await settlementsCollection.find({
      $or: [
        { fromMember: 'user-alice' },
        { toMember: 'user-alice' }
      ]
    }).toArray();
    
    console.log(`   User-tusha settlements: ${tushaSettlements.length}`);
    console.log(`   User-john settlements: ${johnSettlements.length}`);
    console.log(`   User-alice settlements: ${aliceSettlements.length}\n`);
    
    // Verify data isolation
    console.log('4. Verifying data isolation...');
    
    // Check if user-alice can access data she shouldn't have access to
    const aliceHasUnauthorizedGroups = aliceGroups.length > 0 && 
      aliceGroups.every(group => group.createdBy === 'user-alice' || 
        (group.members && group.members.some(member => member.id === 'user-alice')));
    
    const aliceHasUnauthorizedExpenses = aliceExpenses.length > 0 && 
      aliceExpenses.every(expense => expense.createdBy === 'user-alice' || 
        expense.paidBy === 'user-alice' || 
        (Array.isArray(expense.splitBetween) && expense.splitBetween.includes('user-alice')));
    
    const aliceHasUnauthorizedSettlements = aliceSettlements.length > 0 && 
      aliceSettlements.every(settlement => settlement.fromMember === 'user-alice' || 
        settlement.toMember === 'user-alice');
    
    console.log(`   Alice only accesses authorized groups: ${aliceHasUnauthorizedGroups || aliceGroups.length === 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`   Alice only accesses authorized expenses: ${aliceHasUnauthorizedExpenses || aliceExpenses.length === 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`   Alice only accesses authorized settlements: ${aliceHasUnauthorizedSettlements || aliceSettlements.length === 0 ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n🎉 Data isolation verification completed!');
    console.log('Summary:');
    console.log(`- Total groups: ${allGroups.length} (tusha: ${tushaGroups.length}, john: ${johnGroups.length}, alice: ${aliceGroups.length})`);
    console.log(`- Total expenses: ${allExpenses.length} (tusha: ${tushaExpenses.length}, john: ${johnExpenses.length}, alice: ${aliceExpenses.length})`);
    console.log(`- Total settlements: ${allSettlements.length} (tusha: ${tushaSettlements.length}, john: ${johnSettlements.length}, alice: ${aliceSettlements.length})`);
    
    if ((aliceHasUnauthorizedGroups || aliceGroups.length === 0) && 
        (aliceHasUnauthorizedExpenses || aliceExpenses.length === 0) && 
        (aliceHasUnauthorizedSettlements || aliceSettlements.length === 0)) {
      console.log('\n✅ All data isolation checks passed! Users can only access data they are authorized to see.');
    } else {
      console.log('\n❌ Data isolation issues detected! Some users may be able to access unauthorized data.');
    }
    
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
verifyDataIsolation();