import fetch from 'node-fetch';

async function testGroupCreation() {
  console.log('🧪 Testing Group Creation Fix...\n');
  
  try {
    // Test: Create a group with multiple members
    console.log('1. Creating a group with multiple members...');
    const groupData = {
      name: 'Test Group for Duplicate Fix',
      description: 'Testing the fix for duplicate group creation',
      createdBy: 'user-tusha',
      members: [
        { id: 'user-tusha', name: 'tusha', email: 'tusha@splitsmart.com' },
        { id: 'user-john', name: 'John', email: 'john@example.com' },
        { id: 'user-alice', name: 'Alice', email: 'alice@example.com' }
      ],
      color: 'from-blue-500 to-purple-600'
    };
    
    const response = await fetch('http://localhost:40001/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(groupData),
    });
    
    const createdGroup = await response.json();
    console.log(`   Created group: ${createdGroup.name} (ID: ${createdGroup.id})`);
    console.log(`   Group has ${createdGroup.members.length} members`);
    
    // Test: Verify group is only created once by fetching all groups
    console.log('2. Verifying only one group was created...');
    const groupsResponse = await fetch('http://localhost:40001/api/groups?userId=user-tusha');
    const groups = await groupsResponse.json();
    
    const testGroups = groups.filter(group => group.name.includes('Test Group for Duplicate Fix'));
    console.log(`   Found ${testGroups.length} group(s) with the test name`);
    
    if (testGroups.length === 1) {
      console.log('   ✅ SUCCESS: Only one group was created (no duplicates)');
    } else {
      console.log('   ❌ ISSUE: Duplicate groups detected');
    }
    
    console.log('\n🎉 Group creation test completed!');
    console.log('Summary:');
    console.log(`- Created group "${createdGroup.name}" with ${createdGroup.members.length} members`);
    console.log(`- Verified that only ${testGroups.length} group(s) exist with this name`);
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Run the test
testGroupCreation();