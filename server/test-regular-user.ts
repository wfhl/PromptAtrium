// Test script to verify regular user community access
import { storage } from './storage';

async function testRegularUserAccess() {
  const regularUserId = 'lCYNu6'; // Our test regular user with role='user'
  
  console.log('\n========== Testing Regular User Community Access ==========');
  console.log(`Testing user ID: ${regularUserId}`);
  
  // Get user details
  const user = await storage.getUser(regularUserId);
  console.log(`User role: ${user?.role}`);
  console.log(`Username: ${user?.username}`);
  
  // Test getUserCommunities
  console.log('\n--- Testing getUserCommunities ---');
  const userCommunities = await storage.getUserCommunities(regularUserId);
  console.log(`Found ${userCommunities.length} community memberships:`);
  userCommunities.forEach(uc => {
    console.log(`  - Community ID: ${uc.communityId}, Role: ${uc.role}, Status: ${uc.status}`);
  });
  
  // Test getUserPrivateCommunities
  console.log('\n--- Testing getUserPrivateCommunities ---');
  const privateCommunities = await storage.getUserPrivateCommunities(regularUserId);
  console.log(`Found ${privateCommunities.length} private communities:`);
  privateCommunities.forEach(c => {
    console.log(`  - ${c.name} (${c.slug}) - ID: ${c.id}`);
  });
  
  // Test what the /api/communities endpoint would return
  console.log('\n--- Simulating /api/communities response ---');
  const globalCommunity = await storage.getGlobalCommunity();
  const communities = globalCommunity ? [globalCommunity] : [];
  
  if (user?.role === 'super_admin' || user?.role === 'global_admin' || user?.role === 'developer') {
    const allPrivateCommunities = await storage.getAllPrivateCommunities();
    communities.push(...allPrivateCommunities);
    console.log(`Admin user would see ${communities.length} total communities`);
  } else {
    const userPrivateCommunities = await storage.getUserPrivateCommunities(regularUserId);
    communities.push(...userPrivateCommunities);
    console.log(`Regular user sees ${communities.length} total communities:`);
    communities.forEach(c => {
      console.log(`  - ${c.name} (${c.slug})`);
    });
  }
  
  console.log('\n========== Test Complete ==========\n');
}

// Run the test
testRegularUserAccess().catch(console.error);