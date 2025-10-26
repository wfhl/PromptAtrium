#!/usr/bin/env tsx
// Migration script to update existing communities with sub-community hierarchy fields
// This script safely migrates existing communities to the new hierarchy system

import { db } from "../server/db";
import { communities, communityAdmins, userCommunities, prompts } from "@shared/schema";
import { eq, isNull, or, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Migration configuration
const MIGRATION_CONFIG = {
  dryRun: false, // Set to true to test without making changes
  verbose: true,
  batchSize: 100,
};

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

// Migration statistics
interface MigrationStats {
  communitiesChecked: number;
  communitiesUpdated: number;
  alreadyMigrated: number;
  errors: Array<{ id: string; name: string; error: string }>;
  promptsWithoutSubCommunity: number;
  userMemberships: number;
  adminRelationships: number;
  startTime: number;
  endTime?: number;
}

class SubCommunityMigration {
  private stats: MigrationStats = {
    communitiesChecked: 0,
    communitiesUpdated: 0,
    alreadyMigrated: 0,
    errors: [],
    promptsWithoutSubCommunity: 0,
    userMemberships: 0,
    adminRelationships: 0,
    startTime: Date.now(),
  };

  log(message: string, type: "info" | "success" | "warning" | "error" = "info") {
    const prefix = {
      info: `${colors.blue}[INFO]${colors.reset}`,
      success: `${colors.green}[SUCCESS]${colors.reset}`,
      warning: `${colors.yellow}[WARNING]${colors.reset}`,
      error: `${colors.red}[ERROR]${colors.reset}`,
    };

    console.log(`${prefix[type]} ${message}`);
  }

  // Check if migration is needed
  async checkMigrationStatus() {
    this.log("Checking migration status...");

    // Get communities without hierarchy fields properly set
    const needsMigration = await db
      .select({
        id: communities.id,
        name: communities.name,
        level: communities.level,
        path: communities.path,
        parentCommunityId: communities.parentCommunityId,
      })
      .from(communities)
      .where(
        or(
          isNull(communities.level),
          isNull(communities.path),
          eq(communities.path, "")
        )
      );

    const alreadyMigrated = await db
      .select({
        id: communities.id,
        name: communities.name,
        level: communities.level,
        path: communities.path,
      })
      .from(communities)
      .where(
        and(
          eq(communities.level, 0),
          isNull(communities.parentCommunityId)
        )
      );

    // Check prompts without subCommunityId
    const promptsWithoutSub = await db
      .select({ count: sql<number>`count(*)` })
      .from(prompts)
      .where(isNull(prompts.subCommunityId));

    this.stats.promptsWithoutSubCommunity = Number(promptsWithoutSub[0]?.count || 0);

    // Check user memberships
    const memberships = await db
      .select({ count: sql<number>`count(*)` })
      .from(userCommunities);
    
    this.stats.userMemberships = Number(memberships[0]?.count || 0);

    // Check admin relationships
    const admins = await db
      .select({ count: sql<number>`count(*)` })
      .from(communityAdmins);
    
    this.stats.adminRelationships = Number(admins[0]?.count || 0);

    this.log(`Communities needing migration: ${needsMigration.length}`, "info");
    this.log(`Communities already migrated: ${alreadyMigrated.length}`, "info");
    this.log(`Prompts without subCommunityId: ${this.stats.promptsWithoutSubCommunity}`, "info");
    this.log(`User memberships: ${this.stats.userMemberships}`, "info");
    this.log(`Admin relationships: ${this.stats.adminRelationships}`, "info");

    return {
      needsMigration,
      alreadyMigrated,
      totalCommunities: needsMigration.length + alreadyMigrated.length,
    };
  }

  // Migrate communities to hierarchy
  async migrateCommunities() {
    this.log("Starting community migration...", "info");

    const { needsMigration } = await this.checkMigrationStatus();

    if (needsMigration.length === 0) {
      this.log("No communities need migration!", "success");
      return;
    }

    // Process communities in batches
    for (let i = 0; i < needsMigration.length; i += MIGRATION_CONFIG.batchSize) {
      const batch = needsMigration.slice(i, i + MIGRATION_CONFIG.batchSize);
      
      this.log(
        `Processing batch ${Math.floor(i / MIGRATION_CONFIG.batchSize) + 1} ` +
        `(${i + 1}-${Math.min(i + MIGRATION_CONFIG.batchSize, needsMigration.length)} ` +
        `of ${needsMigration.length})`,
        "info"
      );

      for (const community of batch) {
        await this.migrateCommunity(community);
      }
    }

    this.log(`Migration completed!`, "success");
  }

  // Migrate a single community
  async migrateCommunity(community: any) {
    this.stats.communitiesChecked++;

    try {
      // Default values for top-level communities
      const migrationData = {
        level: 0,
        path: `/${community.id}/`,
        parentCommunityId: null,
      };

      if (MIGRATION_CONFIG.verbose) {
        this.log(
          `Migrating community: ${community.name} (${community.id})`,
          "info"
        );
      }

      if (!MIGRATION_CONFIG.dryRun) {
        // Update community with hierarchy fields
        await db
          .update(communities)
          .set(migrationData)
          .where(eq(communities.id, community.id));

        this.stats.communitiesUpdated++;
        
        if (MIGRATION_CONFIG.verbose) {
          this.log(
            `  ✓ Updated with level=${migrationData.level}, path=${migrationData.path}`,
            "success"
          );
        }
      } else {
        this.log(`  [DRY RUN] Would update with: ${JSON.stringify(migrationData)}`, "info");
        this.stats.communitiesUpdated++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.stats.errors.push({
        id: community.id,
        name: community.name,
        error: errorMessage,
      });
      this.log(`  ✗ Error migrating ${community.name}: ${errorMessage}`, "error");
    }
  }

  // Validate migration
  async validateMigration() {
    this.log("Validating migration...", "info");

    // Check all communities have required fields
    const invalidCommunities = await db
      .select({
        id: communities.id,
        name: communities.name,
        level: communities.level,
        path: communities.path,
      })
      .from(communities)
      .where(
        or(
          isNull(communities.level),
          isNull(communities.path),
          eq(communities.path, "")
        )
      );

    if (invalidCommunities.length > 0) {
      this.log(
        `Found ${invalidCommunities.length} communities with invalid hierarchy fields:`,
        "error"
      );
      invalidCommunities.forEach(c => {
        this.log(`  - ${c.name} (${c.id}): level=${c.level}, path=${c.path}`, "error");
      });
      return false;
    }

    // Check top-level communities
    const topLevelCommunities = await db
      .select({ count: sql<number>`count(*)` })
      .from(communities)
      .where(
        and(
          eq(communities.level, 0),
          isNull(communities.parentCommunityId)
        )
      );

    // Check sub-communities (should be 0 after migration)
    const subCommunities = await db
      .select({ count: sql<number>`count(*)` })
      .from(communities)
      .where(sql`${communities.level} > 0`);

    const topLevelCount = Number(topLevelCommunities[0]?.count || 0);
    const subCount = Number(subCommunities[0]?.count || 0);

    this.log(`Validation results:`, "info");
    this.log(`  - Top-level communities: ${topLevelCount}`, "info");
    this.log(`  - Sub-communities: ${subCount}`, "info");
    this.log(`  - Communities with invalid fields: 0`, "success");

    // Check that existing relationships are intact
    const currentMemberships = await db
      .select({ count: sql<number>`count(*)` })
      .from(userCommunities);
    
    const currentAdmins = await db
      .select({ count: sql<number>`count(*)` })
      .from(communityAdmins);

    const membershipCount = Number(currentMemberships[0]?.count || 0);
    const adminCount = Number(currentAdmins[0]?.count || 0);

    if (membershipCount !== this.stats.userMemberships) {
      this.log(
        `  ⚠ User memberships changed: ${this.stats.userMemberships} → ${membershipCount}`,
        "warning"
      );
    } else {
      this.log(`  ✓ User memberships preserved: ${membershipCount}`, "success");
    }

    if (adminCount !== this.stats.adminRelationships) {
      this.log(
        `  ⚠ Admin relationships changed: ${this.stats.adminRelationships} → ${adminCount}`,
        "warning"
      );
    } else {
      this.log(`  ✓ Admin relationships preserved: ${adminCount}`, "success");
    }

    return invalidCommunities.length === 0;
  }

  // Generate migration report
  generateReport() {
    this.stats.endTime = Date.now();
    const duration = ((this.stats.endTime - this.stats.startTime) / 1000).toFixed(2);

    const report = {
      success: this.stats.errors.length === 0,
      summary: {
        communitiesChecked: this.stats.communitiesChecked,
        communitiesUpdated: this.stats.communitiesUpdated,
        alreadyMigrated: this.stats.alreadyMigrated,
        errors: this.stats.errors.length,
        duration: `${duration}s`,
      },
      details: {
        promptsWithoutSubCommunity: this.stats.promptsWithoutSubCommunity,
        userMemberships: this.stats.userMemberships,
        adminRelationships: this.stats.adminRelationships,
      },
      errors: this.stats.errors,
      timestamp: new Date().toISOString(),
    };

    this.log("\n" + "=".repeat(60), "info");
    this.log(`${colors.bright}MIGRATION REPORT${colors.reset}`, "info");
    this.log("=".repeat(60), "info");
    this.log(`Status: ${report.success ? "✓ SUCCESS" : "✗ FAILED"}`, 
      report.success ? "success" : "error");
    this.log(`Duration: ${duration} seconds`, "info");
    this.log(`Communities checked: ${report.summary.communitiesChecked}`, "info");
    this.log(`Communities updated: ${report.summary.communitiesUpdated}`, "info");
    this.log(`Already migrated: ${report.summary.alreadyMigrated}`, "info");
    this.log(`Errors: ${report.summary.errors}`, 
      report.summary.errors > 0 ? "error" : "info");
    
    if (report.errors.length > 0) {
      this.log("\nErrors encountered:", "error");
      report.errors.forEach(e => {
        this.log(`  - ${e.name} (${e.id}): ${e.error}`, "error");
      });
    }

    this.log("\nData preservation:", "info");
    this.log(`  - Prompts without subCommunityId: ${report.details.promptsWithoutSubCommunity}`, "info");
    this.log(`  - User memberships: ${report.details.userMemberships}`, "info");
    this.log(`  - Admin relationships: ${report.details.adminRelationships}`, "info");
    this.log("=".repeat(60) + "\n", "info");

    return report;
  }

  // Main migration runner
  async run() {
    this.log(`${colors.bright}Starting Sub-Community Migration${colors.reset}`, "info");
    this.log(`Mode: ${MIGRATION_CONFIG.dryRun ? "DRY RUN" : "LIVE"}`, 
      MIGRATION_CONFIG.dryRun ? "warning" : "info");
    this.log("=".repeat(60) + "\n", "info");

    try {
      // Step 1: Check current status
      await this.checkMigrationStatus();

      // Step 2: Run migration
      await this.migrateCommunities();

      // Step 3: Validate results
      if (!MIGRATION_CONFIG.dryRun) {
        const isValid = await this.validateMigration();
        if (!isValid) {
          this.log("Migration validation failed!", "error");
        }
      }

      // Step 4: Generate report
      return this.generateReport();
    } catch (error) {
      this.log(`Migration failed: ${error}`, "error");
      throw error;
    }
  }
}

// Command-line argument parsing
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isVerbose = args.includes("--verbose");
const showHelp = args.includes("--help");

if (showHelp) {
  console.log(`
${colors.bright}Sub-Community Migration Script${colors.reset}

Usage: tsx scripts/migrateToSubCommunities.ts [options]

Options:
  --dry-run   Run migration in test mode without making changes
  --verbose   Show detailed progress for each community
  --help      Show this help message

This script migrates existing communities to support the new sub-community
hierarchy system. All existing communities become top-level communities.

${colors.yellow}Important:${colors.reset} 
- Always run with --dry-run first to preview changes
- Backup your database before running the migration
- The migration is idempotent and can be run multiple times
`);
  process.exit(0);
}

// Update configuration based on arguments
if (isDryRun) {
  MIGRATION_CONFIG.dryRun = true;
}
if (isVerbose) {
  MIGRATION_CONFIG.verbose = true;
}

// Run migration
async function main() {
  const migration = new SubCommunityMigration();
  
  try {
    const report = await migration.run();
    
    // Exit with appropriate code
    process.exit(report.success ? 0 : 1);
  } catch (error) {
    console.error("Migration failed with error:", error);
    process.exit(1);
  }
}

// Execute if run directly
// Check if this file is being run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(console.error);
}

// Export for use in other scripts
export { SubCommunityMigration, MIGRATION_CONFIG };