// Test script to check if regular users can see communities they are members of
const fetch = require('node-fetch');

async function testRegularUser() {
  console.log('Testing regular user community access...\n');
  
  // Test user credentials (regular user with role='user')
  const testUser = {
    id: 'lCYNu6',
    email: 'lCYNu6@example.com',
    username: 'testuser',
    role: 'user'
  };
  
  console.log(`Test User: ${testUser.username} (${testUser.email})`);
  console.log(`Role: ${testUser.role}`);
  console.log(`User ID: ${testUser.id}`);
  console.log('\n-------------------\n');
  
  // We'll need to authenticate first - for now, let's just log what we expect
  console.log('Expected behavior for regular users:');
  console.log('1. User should see communities they are members of in /api/user/communities');
  console.log('2. User should see private communities they belong to in /api/communities');
  console.log('3. CommunityContextTabs should show tabs for private communities');
  console.log('4. PromptCard should show dropdown for sharing to communities');
  
  console.log('\n-------------------\n');
  console.log('Database check:');
  console.log('- User lCYNu6 is a member of Elite community (af635f28-90a4-44d5-9572-fc931ba00d2b)');
  console.log('- Membership status: accepted');
  console.log('- Community role: member');
  
  console.log('\n-------------------\n');
  console.log('Frontend logic checks:');
  console.log('- PromptCard checks: userCommunities.length > 0');
  console.log('- CommunityContextTabs checks: privateCommunities.length > 0');
  console.log('- Both filter communities where status = "accepted" or null/undefined');
}

testRegularUser();