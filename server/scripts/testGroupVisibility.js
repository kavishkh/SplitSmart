import fetch from 'node-fetch';

async function testGroupVisibility() {
  console.log('🧪 Testing Group Visibility Fix...\n');
  
  try {
    // Test 1: Fetch groups for user-tusha (should only get groups created by or belonging to this user)
    console.log('1. Fetching groups for user-tusha...');
    const response1 = await fetch('http://localhost:40001/api/groups?userId=user-tusha');
    const groups1 = await response1.json();
    console.log(`   Found ${groups1.length} groups for user-tusha`);
    
    // Test 2: Fetch groups for a different user (should get different results)
    console.log('2. Fetching groups for user-john...');
    const response2 = await fetch('http://localhost:40001/api/groups?userId=user-john');
    const groups2 = await response2.json();
    console.log(`   Found ${groups2.length} groups for user-john`);
    
    // Test 3: Create a new group for user-tusha
    console.log('3. Creating a new group for user-tusha...');
    const createResponse = await fetch('http://localhost:40001/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Group Visibility',
        description: 'Group to test visibility filtering',
        createdBy: 'user-tusha',
        members: [
          { id: 'user-tusha', name: 'tusha', email: 'tusha@splitsmart.com' }
        ]
      }),
    });
    
    const newGroup = await createResponse.json();
    console.log(`   Created group: ${newGroup.name} (ID: ${newGroup.id})`);
    
    // Test 4: Verify user-tusha can see the new group
    console.log('4. Verifying user-tusha can see the new group...');
    const response3 = await fetch('http://localhost:40001/api/groups?userId=user-tusha');
    const groups3 = await response3.json();
    const hasNewGroup = groups3.some(group => group.id === newGroup.id);
    console.log(`   User-tusha can see new group: ${hasNewGroup ? '✅ YES' : '❌ NO'}`);
    
    // Test 5: Verify user-john cannot see the new group
    console.log('5. Verifying user-john cannot see the new group...');
    const response4 = await fetch('http://localhost:40001/api/groups?userId=user-john');
    const groups4 = await response4.json();
    const johnHasNewGroup = groups4.some(group => group.id === newGroup.id);
    console.log(`   User-john can see new group: ${johnHasNewGroup ? '❌ YES (ERROR!)' : '✅ NO (CORRECT)'}`);
    
    console.log('\n🎉 Group visibility test completed!');
    console.log('Summary:');
    console.log(`- User-tusha has access to ${groups1.length} groups initially`);
    console.log(`- User-john has access to ${groups2.length} groups initially`);
    console.log(`- After creating a group for user-tusha:`);
    console.log(`  • User-tusha can see the new group: ${hasNewGroup ? '✅ YES' : '❌ NO'}`);
    console.log(`  • User-john cannot see the new group: ${!johnHasNewGroup ? '✅ YES' : '❌ NO'}`);
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Run the test
testGroupVisibility();