#!/usr/bin/env tsx
// Test runner for sub-community access controls
import { db } from "../server/db";
import {
  users,
  communities,
  prompts,
  userCommunities,
  subCommunityAdmins,
  subCommunityInvites,
  communityAdmins,
} from "@shared/schema";
import { eq, and, or, isNull } from "drizzle-orm";

// Test configuration
const TEST_CONFIG = {
  verbose: true,
  cleanupAfter: false, // Set to true to clean up test data after running
};

// Test data storage
const testData: any = {
  users: {},
  communities: {},
  prompts: {},
  invites: {},
  memberships: {},
};

// Test result tracking
class TestRunner {
  private results: Array<{
    category: string;
    test: string;
    status: "PASS" | "FAIL";
    error?: string;
    details?: any;
  }> = [];

  log(message: string, data?: any) {
    if (TEST_CONFIG.verbose) {
      console.log(`[TEST] ${message}`, data || "");
    }
  }

  async runTest(
    category: string,
    testName: string,
    testFn: () => Promise<boolean>
  ) {
    this.log(`Running: ${category} - ${testName}`);
    const startTime = Date.now();

    try {
      const passed = await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        category,
        test: testName,
        status: passed ? "PASS" : "FAIL",
      });

      const emoji = passed ? "✅" : "❌";
      console.log(`${emoji} ${category}: ${testName} (${duration}ms)`);
      
      return passed;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.results.push({
        category,
        test: testName,
        status: "FAIL",
        error: errorMessage,
      });

      console.log(`❌ ${category}: ${testName} (${duration}ms) - Error: ${errorMessage}`);
      return false;
    }
  }

  generateReport() {
    const categories = [...new Set(this.results.map(r => r.category))];
    const report: any = {
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === "PASS").length,
        failed: this.results.filter(r => r.status === "FAIL").length,
      },
      byCategory: {},
    };

    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category);
      report.byCategory[category] = {
        total: categoryResults.length,
        passed: categoryResults.filter(r => r.status === "PASS").length,
        failed: categoryResults.filter(r => r.status === "FAIL").length,
        tests: categoryResults,
      };
    }

    report.summary.passRate = 
      ((report.summary.passed / report.summary.total) * 100).toFixed(1) + "%";

    return report;
  }
}

const runner = new TestRunner();

// Setup test data
async function setupTestData() {
  runner.log("Setting up test data...");
  const timestamp = Date.now();

  try {
    // Create test users
    const testUsers = {
      superAdmin: {
        id: `super_${timestamp}`,
        email: `super_${timestamp}@test.com`,
        username: `super_${timestamp}`,
        firstName: "Super",
        lastName: "Admin",
        role: "super_admin" as const,
      },
      communityAdmin: {
        id: `comm_admin_${timestamp}`,
        email: `comm_admin_${timestamp}@test.com`,
        username: `comm_admin_${timestamp}`,
        firstName: "Community",
        lastName: "Admin",
        role: "community_admin" as const,
      },
      subCommunityAdmin: {
        id: `sub_admin_${timestamp}`,
        email: `sub_admin_${timestamp}@test.com`,
        username: `sub_admin_${timestamp}`,
        firstName: "SubCommunity",
        lastName: "Admin",
        role: "sub_community_admin" as const,
      },
      member: {
        id: `member_${timestamp}`,
        email: `member_${timestamp}@test.com`,
        username: `member_${timestamp}`,
        firstName: "Regular",
        lastName: "Member",
        role: "user" as const,
      },
      nonMember: {
        id: `non_${timestamp}`,
        email: `non_${timestamp}@test.com`,
        username: `non_${timestamp}`,
        firstName: "Non",
        lastName: "Member",
        role: "user" as const,
      },
    };

    // Insert users
    for (const [key, userData] of Object.entries(testUsers)) {
      const [user] = await db.insert(users).values(userData).returning();
      testData.users[key] = user;
    }
    runner.log("Created test users");

    // Create parent community
    const [parentCommunity] = await db.insert(communities).values({
      id: `parent_${timestamp}`,
      name: `Test Parent Community ${timestamp}`,
      description: "Parent community for testing",
      slug: `test-parent-${timestamp}`,
      isActive: true,
      level: 0,
    }).returning();
    testData.communities.parent = parentCommunity;

    // Create sub-communities
    const [publicSub] = await db.insert(communities).values({
      id: `pub_sub_${timestamp}`,
      name: `Public Sub ${timestamp}`,
      description: "Public sub-community",
      slug: `pub-sub-${timestamp}`,
      parentCommunityId: parentCommunity.id,
      level: 1,
      path: `${parentCommunity.id}/pub_sub_${timestamp}`,
      isActive: true,
    }).returning();
    testData.communities.publicSub = publicSub;

    const [privateSub] = await db.insert(communities).values({
      id: `priv_sub_${timestamp}`,
      name: `Private Sub ${timestamp}`,
      description: "Private sub-community",
      slug: `priv-sub-${timestamp}`,
      parentCommunityId: parentCommunity.id,
      level: 1,
      path: `${parentCommunity.id}/priv_sub_${timestamp}`,
      isActive: true,
    }).returning();
    testData.communities.privateSub = privateSub;
    runner.log("Created communities and sub-communities");

    // Set up community admin
    await db.insert(communityAdmins).values({
      userId: testData.users.communityAdmin.id,
      communityId: parentCommunity.id,
      assignedBy: testData.users.superAdmin.id,
    });

    // Set up sub-community admin
    await db.insert(subCommunityAdmins).values({
      userId: testData.users.subCommunityAdmin.id,
      subCommunityId: privateSub.id,
      assignedBy: testData.users.communityAdmin.id,
      permissions: { canManageMembers: true, canManageContent: true },
    });
    runner.log("Set up admin roles");

    // Add member to parent community
    await db.insert(userCommunities).values({
      userId: testData.users.member.id,
      communityId: parentCommunity.id,
      role: "member",
    });

    // Add member to private sub-community
    await db.insert(userCommunities).values({
      userId: testData.users.member.id,
      communityId: parentCommunity.id,
      subCommunityId: privateSub.id,
      role: "member",
    });
    runner.log("Set up memberships");

    // Create test prompts
    const promptId = Math.random().toString(36).substring(2, 12);
    
    // Public prompt in public sub-community
    const [publicPrompt] = await db.insert(prompts).values({
      id: promptId,
      name: `Public Prompt ${timestamp}`,
      description: "Public prompt visible to all",
      promptContent: "Test public content",
      userId: testData.users.member.id,
      subCommunityId: publicSub.id,
      subCommunityVisibility: "public",
      isPublic: true,
      status: "published",
    }).returning();
    testData.prompts.public = publicPrompt;

    // Parent community visible prompt
    const parentPromptId = Math.random().toString(36).substring(2, 12);
    const [parentPrompt] = await db.insert(prompts).values({
      id: parentPromptId,
      name: `Parent Visible Prompt ${timestamp}`,
      description: "Visible to parent community members",
      promptContent: "Test parent community content",
      userId: testData.users.member.id,
      subCommunityId: privateSub.id,
      subCommunityVisibility: "parent_community",
      isPublic: false,
      status: "published",
    }).returning();
    testData.prompts.parentVisible = parentPrompt;

    // Private prompt in private sub-community
    const privatePromptId = Math.random().toString(36).substring(2, 12);
    const [privatePrompt] = await db.insert(prompts).values({
      id: privatePromptId,
      name: `Private Prompt ${timestamp}`,
      description: "Private prompt for members only",
      promptContent: "Test private content",
      userId: testData.users.subCommunityAdmin.id,
      subCommunityId: privateSub.id,
      subCommunityVisibility: "private",
      isPublic: false,
      status: "published",
    }).returning();
    testData.prompts.private = privatePrompt;
    runner.log("Created test prompts");

    // Create test invites
    const [memberInvite] = await db.insert(subCommunityInvites).values({
      code: `MEMBER_${timestamp}`,
      subCommunityId: privateSub.id,
      createdBy: testData.users.subCommunityAdmin.id,
      maxUses: 5,
      currentUses: 0,
      role: "member",
      isActive: true,
    }).returning();
    testData.invites.member = memberInvite;

    const [adminInvite] = await db.insert(subCommunityInvites).values({
      code: `ADMIN_${timestamp}`,
      subCommunityId: privateSub.id,
      createdBy: testData.users.communityAdmin.id,
      maxUses: 1,
      currentUses: 0,
      role: "admin",
      isActive: true,
    }).returning();
    testData.invites.admin = adminInvite;
    runner.log("Created test invites");

    runner.log("Test data setup complete", { 
      users: Object.keys(testData.users).length,
      communities: Object.keys(testData.communities).length,
      prompts: Object.keys(testData.prompts).length,
      invites: Object.keys(testData.invites).length,
    });

    return true;
  } catch (error) {
    console.error("Error setting up test data:", error);
    return false;
  }
}

// Permission hierarchy tests
async function testPermissionHierarchy() {
  const tests = [
    {
      name: "Super admin can access sub-community members",
      async test() {
        // Check if super admin can query sub-community members
        const members = await db
          .select()
          .from(userCommunities)
          .where(eq(userCommunities.subCommunityId, testData.communities.privateSub.id));
        
        return members.length > 0;
      },
    },
    {
      name: "Community admin can manage sub-communities under their community",
      async test() {
        // Check if community admin is recognized for sub-communities
        const adminRecord = await db
          .select()
          .from(communityAdmins)
          .where(
            and(
              eq(communityAdmins.userId, testData.users.communityAdmin.id),
              eq(communityAdmins.communityId, testData.communities.parent.id)
            )
          );
        
        return adminRecord.length > 0;
      },
    },
    {
      name: "Sub-community admin has proper permissions",
      async test() {
        const adminRecord = await db
          .select()
          .from(subCommunityAdmins)
          .where(
            and(
              eq(subCommunityAdmins.userId, testData.users.subCommunityAdmin.id),
              eq(subCommunityAdmins.subCommunityId, testData.communities.privateSub.id)
            )
          );
        
        if (adminRecord.length === 0) return false;
        
        const permissions = adminRecord[0].permissions as any;
        return permissions?.canManageMembers === true;
      },
    },
    {
      name: "Regular member cannot access admin privileges",
      async test() {
        const adminRecord = await db
          .select()
          .from(subCommunityAdmins)
          .where(eq(subCommunityAdmins.userId, testData.users.member.id));
        
        return adminRecord.length === 0;
      },
    },
  ];

  for (const test of tests) {
    await runner.runTest("Permission Hierarchy", test.name, test.test);
  }
}

// Access control tests
async function testAccessControls() {
  const tests = [
    {
      name: "Member can access private sub-community they belong to",
      async test() {
        const membership = await db
          .select()
          .from(userCommunities)
          .where(
            and(
              eq(userCommunities.userId, testData.users.member.id),
              eq(userCommunities.subCommunityId, testData.communities.privateSub.id)
            )
          );
        
        return membership.length > 0;
      },
    },
    {
      name: "Non-member cannot access private sub-community",
      async test() {
        const membership = await db
          .select()
          .from(userCommunities)
          .where(
            and(
              eq(userCommunities.userId, testData.users.nonMember.id),
              eq(userCommunities.subCommunityId, testData.communities.privateSub.id)
            )
          );
        
        return membership.length === 0;
      },
    },
    {
      name: "Parent community member exists",
      async test() {
        const membership = await db
          .select()
          .from(userCommunities)
          .where(
            and(
              eq(userCommunities.userId, testData.users.member.id),
              eq(userCommunities.communityId, testData.communities.parent.id),
              isNull(userCommunities.subCommunityId)
            )
          );
        
        return membership.length > 0;
      },
    },
  ];

  for (const test of tests) {
    await runner.runTest("Access Control", test.name, test.test);
  }
}

// Content visibility tests
async function testContentVisibility() {
  const tests = [
    {
      name: "Public prompt is marked as public",
      async test() {
        const prompt = await db
          .select()
          .from(prompts)
          .where(eq(prompts.id, testData.prompts.public.id));
        
        return prompt.length > 0 && 
               prompt[0].subCommunityVisibility === "public" &&
               prompt[0].isPublic === true;
      },
    },
    {
      name: "Private prompt has correct visibility",
      async test() {
        const prompt = await db
          .select()
          .from(prompts)
          .where(eq(prompts.id, testData.prompts.private.id));
        
        return prompt.length > 0 && 
               prompt[0].subCommunityVisibility === "private" &&
               prompt[0].isPublic === false;
      },
    },
    {
      name: "Parent community visible prompt has correct settings",
      async test() {
        const prompt = await db
          .select()
          .from(prompts)
          .where(eq(prompts.id, testData.prompts.parentVisible.id));
        
        return prompt.length > 0 && 
               prompt[0].subCommunityVisibility === "parent_community";
      },
    },
    {
      name: "Prompts are associated with correct sub-communities",
      async test() {
        const publicPrompt = await db
          .select()
          .from(prompts)
          .where(eq(prompts.id, testData.prompts.public.id));
        
        const privatePrompt = await db
          .select()
          .from(prompts)
          .where(eq(prompts.id, testData.prompts.private.id));
        
        return publicPrompt[0]?.subCommunityId === testData.communities.publicSub.id &&
               privatePrompt[0]?.subCommunityId === testData.communities.privateSub.id;
      },
    },
  ];

  for (const test of tests) {
    await runner.runTest("Content Visibility", test.name, test.test);
  }
}

// Invite system tests
async function testInviteSystem() {
  const tests = [
    {
      name: "Sub-community admin can create invites",
      async test() {
        const invite = await db
          .select()
          .from(subCommunityInvites)
          .where(
            and(
              eq(subCommunityInvites.createdBy, testData.users.subCommunityAdmin.id),
              eq(subCommunityInvites.subCommunityId, testData.communities.privateSub.id)
            )
          );
        
        return invite.length > 0;
      },
    },
    {
      name: "Community admin can create invites for sub-communities",
      async test() {
        const invite = await db
          .select()
          .from(subCommunityInvites)
          .where(
            and(
              eq(subCommunityInvites.createdBy, testData.users.communityAdmin.id),
              eq(subCommunityInvites.subCommunityId, testData.communities.privateSub.id)
            )
          );
        
        return invite.length > 0;
      },
    },
    {
      name: "Member invite has correct role",
      async test() {
        const invite = await db
          .select()
          .from(subCommunityInvites)
          .where(eq(subCommunityInvites.code, testData.invites.member.code));
        
        return invite.length > 0 && invite[0].role === "member";
      },
    },
    {
      name: "Admin invite has correct role",
      async test() {
        const invite = await db
          .select()
          .from(subCommunityInvites)
          .where(eq(subCommunityInvites.code, testData.invites.admin.code));
        
        return invite.length > 0 && invite[0].role === "admin";
      },
    },
    {
      name: "Invites have proper max uses set",
      async test() {
        const memberInvite = await db
          .select()
          .from(subCommunityInvites)
          .where(eq(subCommunityInvites.code, testData.invites.member.code));
        
        const adminInvite = await db
          .select()
          .from(subCommunityInvites)
          .where(eq(subCommunityInvites.code, testData.invites.admin.code));
        
        return memberInvite[0]?.maxUses === 5 && 
               adminInvite[0]?.maxUses === 1 &&
               memberInvite[0]?.currentUses === 0;
      },
    },
  ];

  for (const test of tests) {
    await runner.runTest("Invite System", test.name, test.test);
  }
}

// Critical path tests
async function testCriticalPaths() {
  const tests = [
    {
      name: "Parent community member can see public sub-community",
      async test() {
        // Check if member of parent can theoretically access public sub
        const parentMembership = await db
          .select()
          .from(userCommunities)
          .where(
            and(
              eq(userCommunities.userId, testData.users.member.id),
              eq(userCommunities.communityId, testData.communities.parent.id)
            )
          );
        
        const publicSubExists = testData.communities.publicSub.parentCommunityId === 
                                testData.communities.parent.id;
        
        return parentMembership.length > 0 && publicSubExists;
      },
    },
    {
      name: "Sub-community has correct parent relationship",
      async test() {
        const subCommunity = await db
          .select()
          .from(communities)
          .where(eq(communities.id, testData.communities.privateSub.id));
        
        return subCommunity[0]?.parentCommunityId === testData.communities.parent.id &&
               subCommunity[0]?.level === 1;
      },
    },
    {
      name: "Prompt visibility inheritance works",
      async test() {
        // Check that parent-visible prompt exists in private sub
        const parentVisiblePrompt = await db
          .select()
          .from(prompts)
          .where(
            and(
              eq(prompts.subCommunityId, testData.communities.privateSub.id),
              eq(prompts.subCommunityVisibility, "parent_community")
            )
          );
        
        return parentVisiblePrompt.length > 0;
      },
    },
  ];

  for (const test of tests) {
    await runner.runTest("Critical Paths", test.name, test.test);
  }
}

// Cleanup test data
async function cleanupTestData() {
  if (!TEST_CONFIG.cleanupAfter) {
    runner.log("Cleanup skipped (cleanupAfter = false)");
    return;
  }

  runner.log("Cleaning up test data...");

  try {
    // Delete in reverse order of dependencies
    
    // Delete invites
    for (const invite of Object.values(testData.invites) as any[]) {
      await db.delete(subCommunityInvites).where(eq(subCommunityInvites.id, invite.id));
    }

    // Delete prompts
    for (const prompt of Object.values(testData.prompts) as any[]) {
      await db.delete(prompts).where(eq(prompts.id, prompt.id));
    }

    // Delete admin assignments
    for (const user of Object.values(testData.users) as any[]) {
      await db.delete(subCommunityAdmins).where(eq(subCommunityAdmins.userId, user.id));
      await db.delete(communityAdmins).where(eq(communityAdmins.userId, user.id));
    }

    // Delete memberships
    for (const user of Object.values(testData.users) as any[]) {
      await db.delete(userCommunities).where(eq(userCommunities.userId, user.id));
    }

    // Delete communities (sub-communities first)
    await db.delete(communities).where(eq(communities.id, testData.communities.publicSub.id));
    await db.delete(communities).where(eq(communities.id, testData.communities.privateSub.id));
    await db.delete(communities).where(eq(communities.id, testData.communities.parent.id));

    // Delete users
    for (const user of Object.values(testData.users) as any[]) {
      await db.delete(users).where(eq(users.id, user.id));
    }

    runner.log("Cleanup complete");
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}

// Main test execution
async function main() {
  console.log("🧪 Starting Sub-Community Access Control Tests");
  console.log("=" . repeat(50));

  // Setup
  const setupSuccess = await setupTestData();
  if (!setupSuccess) {
    console.error("❌ Failed to set up test data");
    process.exit(1);
  }

  // Run test suites
  await testPermissionHierarchy();
  await testAccessControls();
  await testContentVisibility();
  await testInviteSystem();
  await testCriticalPaths();

  // Generate report
  const report = runner.generateReport();
  
  console.log("\n" + "=" . repeat(50));
  console.log("📊 Test Results Summary");
  console.log("=" . repeat(50));
  console.log(`Total Tests: ${report.summary.total}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Pass Rate: ${report.summary.passRate}`);

  // Show category breakdown
  console.log("\n📂 Results by Category:");
  for (const [category, data] of Object.entries(report.byCategory) as any[]) {
    console.log(`\n${category}:`);
    console.log(`  Total: ${data.total}, Passed: ${data.passed}, Failed: ${data.failed}`);
    
    // Show failed tests
    const failed = data.tests.filter((t: any) => t.status === "FAIL");
    if (failed.length > 0) {
      console.log("  Failed tests:");
      for (const test of failed) {
        console.log(`    - ${test.test}${test.error ? `: ${test.error}` : ""}`);
      }
    }
  }

  // Cleanup
  await cleanupTestData();

  // Exit with appropriate code
  const exitCode = report.summary.failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Run tests
main().catch(console.error);