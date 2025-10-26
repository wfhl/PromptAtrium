// Test utilities for sub-community access controls
import type { User, Community, Prompt, SubCommunityInvite, UserRole } from "@shared/schema";

// Test user generators
export const generateTestUsers = () => {
  const timestamp = Date.now();
  
  return {
    superAdmin: {
      id: `super_admin_${timestamp}`,
      email: `super_admin_${timestamp}@test.com`,
      username: `super_admin_${timestamp}`,
      role: "super_admin" as UserRole,
      firstName: "Super",
      lastName: "Admin",
    },
    communityAdmin: {
      id: `comm_admin_${timestamp}`,
      email: `comm_admin_${timestamp}@test.com`,
      username: `comm_admin_${timestamp}`,
      role: "community_admin" as UserRole,
      firstName: "Community",
      lastName: "Admin",
    },
    subCommunityAdmin: {
      id: `sub_admin_${timestamp}`,
      email: `sub_admin_${timestamp}@test.com`,
      username: `sub_admin_${timestamp}`,
      role: "sub_community_admin" as UserRole,
      firstName: "SubCommunity",
      lastName: "Admin",
    },
    regularMember: {
      id: `member_${timestamp}`,
      email: `member_${timestamp}@test.com`,
      username: `member_${timestamp}`,
      role: "user" as UserRole,
      firstName: "Regular",
      lastName: "Member",
    },
    nonMember: {
      id: `non_member_${timestamp}`,
      email: `non_member_${timestamp}@test.com`,
      username: `non_member_${timestamp}`,
      role: "user" as UserRole,
      firstName: "Non",
      lastName: "Member",
    },
  };
};

// Test community generators
export const generateTestCommunities = () => {
  const timestamp = Date.now();
  
  return {
    parentCommunity: {
      id: `parent_comm_${timestamp}`,
      name: `Test Parent Community ${timestamp}`,
      description: "Parent community for testing",
      slug: `test-parent-${timestamp}`,
      isActive: true,
      level: 0,
      parentCommunityId: null,
    },
    publicSubCommunity: {
      id: `public_sub_${timestamp}`,
      name: `Public Sub-Community ${timestamp}`,
      description: "Public sub-community for testing",
      slug: `public-sub-${timestamp}`,
      isActive: true,
      level: 1,
      parentCommunityId: `parent_comm_${timestamp}`,
    },
    privateSubCommunity: {
      id: `private_sub_${timestamp}`,
      name: `Private Sub-Community ${timestamp}`,
      description: "Private sub-community for testing",
      slug: `private-sub-${timestamp}`,
      isActive: true,
      level: 1,
      parentCommunityId: `parent_comm_${timestamp}`,
    },
  };
};

// Test prompt generators
export const generateTestPrompts = (userId: string, subCommunityId: string) => {
  const timestamp = Date.now();
  const promptId = Math.random().toString(36).substring(2, 12);
  
  return {
    publicPrompt: {
      id: promptId,
      name: `Public Prompt ${timestamp}`,
      description: "Public prompt visible to all",
      promptContent: "Public test prompt content",
      userId,
      subCommunityId,
      subCommunityVisibility: "public" as const,
      isPublic: true,
      status: "published" as const,
    },
    parentCommunityPrompt: {
      id: Math.random().toString(36).substring(2, 12),
      name: `Parent Community Prompt ${timestamp}`,
      description: "Prompt visible to parent community members",
      promptContent: "Parent community test prompt content",
      userId,
      subCommunityId,
      subCommunityVisibility: "parent_community" as const,
      isPublic: false,
      status: "published" as const,
    },
    privatePrompt: {
      id: Math.random().toString(36).substring(2, 12),
      name: `Private Prompt ${timestamp}`,
      description: "Private prompt for sub-community members only",
      promptContent: "Private test prompt content",
      userId,
      subCommunityId,
      subCommunityVisibility: "private" as const,
      isPublic: false,
      status: "published" as const,
    },
  };
};

// Test invite generator
export const generateTestInvite = (
  subCommunityId: string,
  createdBy: string,
  maxUses = 5,
  role: "member" | "admin" = "member"
) => {
  const code = `TEST_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days
  
  return {
    code,
    subCommunityId,
    createdBy,
    maxUses,
    currentUses: 0,
    expiresAt,
    isActive: true,
    role,
  };
};

// Mock session helpers
export const mockUserSession = (user: any) => {
  return {
    isAuthenticated: true,
    user: {
      claims: {
        sub: user.id,
        email: user.email,
      },
    },
    userRole: user.role,
  };
};

// Permission check helpers
export interface PermissionTestCase {
  description: string;
  user: any;
  resource: string;
  action: string;
  expectedResult: boolean;
  expectedStatus?: number;
}

export const createPermissionTestCases = (testData: any): PermissionTestCase[] => {
  const { users, communities, prompts } = testData;
  
  return [
    // Super admin tests
    {
      description: "Super admin can access everything",
      user: users.superAdmin,
      resource: `/api/sub-communities/${communities.privateSubCommunity.id}/members`,
      action: "GET",
      expectedResult: true,
      expectedStatus: 200,
    },
    {
      description: "Super admin can manage sub-community settings",
      user: users.superAdmin,
      resource: `/api/sub-communities/${communities.privateSubCommunity.id}/settings`,
      action: "PUT",
      expectedResult: true,
      expectedStatus: 200,
    },
    
    // Community admin tests
    {
      description: "Community admin can manage sub-communities under their community",
      user: users.communityAdmin,
      resource: `/api/sub-communities/${communities.publicSubCommunity.id}/settings`,
      action: "PUT",
      expectedResult: true,
      expectedStatus: 200,
    },
    {
      description: "Community admin can create invites for sub-communities",
      user: users.communityAdmin,
      resource: `/api/sub-communities/${communities.privateSubCommunity.id}/invites`,
      action: "POST",
      expectedResult: true,
      expectedStatus: 200,
    },
    
    // Sub-community admin tests
    {
      description: "Sub-community admin can only manage their assigned sub-community",
      user: users.subCommunityAdmin,
      resource: `/api/sub-communities/${communities.privateSubCommunity.id}/members`,
      action: "GET",
      expectedResult: true,
      expectedStatus: 200,
    },
    {
      description: "Sub-community admin cannot manage other sub-communities",
      user: users.subCommunityAdmin,
      resource: `/api/sub-communities/${communities.publicSubCommunity.id}/settings`,
      action: "PUT",
      expectedResult: false,
      expectedStatus: 403,
    },
    
    // Regular member tests
    {
      description: "Regular member can view public sub-community content",
      user: users.regularMember,
      resource: `/api/sub-communities/${communities.publicSubCommunity.id}/prompts`,
      action: "GET",
      expectedResult: true,
      expectedStatus: 200,
    },
    {
      description: "Regular member cannot access private sub-community without membership",
      user: users.regularMember,
      resource: `/api/sub-communities/${communities.privateSubCommunity.id}/prompts`,
      action: "GET",
      expectedResult: false,
      expectedStatus: 403,
    },
    {
      description: "Regular member cannot create invites",
      user: users.regularMember,
      resource: `/api/sub-communities/${communities.privateSubCommunity.id}/invites`,
      action: "POST",
      expectedResult: false,
      expectedStatus: 403,
    },
    
    // Non-member tests
    {
      description: "Non-member cannot access private sub-community content",
      user: users.nonMember,
      resource: `/api/sub-communities/${communities.privateSubCommunity.id}/prompts`,
      action: "GET",
      expectedResult: false,
      expectedStatus: 403,
    },
    {
      description: "Non-member can view public prompts only",
      user: users.nonMember,
      resource: `/api/prompts?subCommunityId=${communities.publicSubCommunity.id}`,
      action: "GET",
      expectedResult: true,
      expectedStatus: 200,
    },
  ];
};

// Content visibility test cases
export const createVisibilityTestCases = (testData: any) => {
  const { users, prompts, communities } = testData;
  
  return [
    {
      description: "Private prompt only visible to sub-community members",
      prompt: prompts.privatePrompt,
      viewer: users.regularMember,
      isMember: true,
      expectedVisible: true,
    },
    {
      description: "Private prompt not visible to non-members",
      prompt: prompts.privatePrompt,
      viewer: users.nonMember,
      isMember: false,
      expectedVisible: false,
    },
    {
      description: "Parent community prompt visible to parent members",
      prompt: prompts.parentCommunityPrompt,
      viewer: users.regularMember,
      isParentMember: true,
      expectedVisible: true,
    },
    {
      description: "Public prompt visible to everyone",
      prompt: prompts.publicPrompt,
      viewer: users.nonMember,
      isMember: false,
      expectedVisible: true,
    },
  ];
};

// Invite test cases
export const createInviteTestCases = (testData: any) => {
  const { users, communities, invites } = testData;
  
  return [
    {
      description: "Valid invite can be used",
      invite: invites.memberInvite,
      user: users.nonMember,
      expectedResult: true,
      expectedRole: "member",
    },
    {
      description: "Expired invite cannot be used",
      invite: { ...invites.memberInvite, expiresAt: new Date('2020-01-01') },
      user: users.nonMember,
      expectedResult: false,
      expectedError: "Invite has expired",
    },
    {
      description: "Max use limit is enforced",
      invite: { ...invites.memberInvite, maxUses: 1, currentUses: 1 },
      user: users.nonMember,
      expectedResult: false,
      expectedError: "Invite has reached maximum uses",
    },
    {
      description: "Admin invite grants admin role",
      invite: invites.adminInvite,
      user: users.nonMember,
      expectedResult: true,
      expectedRole: "admin",
    },
  ];
};

// Test result logger
export class TestResultLogger {
  private results: Array<{
    test: string;
    status: 'PASS' | 'FAIL';
    error?: string;
    duration: number;
  }> = [];
  
  logTest(test: string, passed: boolean, error?: string, duration?: number) {
    this.results.push({
      test,
      status: passed ? 'PASS' : 'FAIL',
      error,
      duration: duration || 0,
    });
    
    const statusEmoji = passed ? '✅' : '❌';
    const statusText = passed ? 'PASS' : 'FAIL';
    console.log(`${statusEmoji} ${test}: ${statusText}${error ? ` - ${error}` : ''}`);
  }
  
  generateReport() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const totalDuration = this.results.reduce((acc, r) => acc + r.duration, 0);
    
    return {
      summary: {
        total: this.results.length,
        passed,
        failed,
        passRate: `${((passed / this.results.length) * 100).toFixed(1)}%`,
        totalDuration: `${totalDuration.toFixed(2)}ms`,
      },
      results: this.results,
    };
  }
  
  exportMarkdown() {
    const report = this.generateReport();
    
    let markdown = '# Sub-Community Access Control Test Results\n\n';
    markdown += `## Summary\n\n`;
    markdown += `- Total Tests: ${report.summary.total}\n`;
    markdown += `- Passed: ${report.summary.passed}\n`;
    markdown += `- Failed: ${report.summary.failed}\n`;
    markdown += `- Pass Rate: ${report.summary.passRate}\n`;
    markdown += `- Total Duration: ${report.summary.totalDuration}\n\n`;
    
    markdown += `## Test Results\n\n`;
    markdown += '| Test | Status | Duration | Error |\n';
    markdown += '|------|--------|----------|-------|\n';
    
    for (const result of this.results) {
      markdown += `| ${result.test} | ${result.status} | ${result.duration.toFixed(2)}ms | ${result.error || '-'} |\n`;
    }
    
    return markdown;
  }
}

// API call helper
export async function makeAuthenticatedRequest(
  url: string,
  method: string,
  user: any,
  body?: any
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Test-User-Id': user.id,
    'X-Test-User-Role': user.role,
  };
  
  const options: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    return {
      status: response.status,
      ok: response.ok,
      data: response.ok ? await response.json() : null,
      error: !response.ok ? await response.text() : null,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}