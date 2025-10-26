# Sub-Community Hierarchy Migration Guide

## Overview

This guide documents the migration process for updating existing communities to support the new sub-community hierarchy system. The migration is **non-destructive** and **idempotent** (safe to run multiple times).

## What This Migration Does

The migration updates all existing communities to become **top-level communities** in the new hierarchy system by:

1. Setting `level` to `0` (top-level)
2. Setting `parentCommunityId` to `null` (no parent)
3. Creating a unique `path` for each community (`/{communityId}/`)
4. Preserving all existing relationships and data

## Prerequisites

- **Super Admin** or **Developer** role required
- Backup your database before running the migration (recommended)
- Ensure the application is running and accessible

## Migration Methods

### Method 1: Using the Admin UI (Recommended)

1. **Login** as a Super Admin
2. Navigate to the **Admin Dashboard**
3. Find the **Data Migration** section
4. Click **"Check Migration Status"** to preview what will be migrated
5. Review the migration preview:
   - Number of communities to migrate
   - Current database statistics
   - Data integrity checks
6. Click **"Run Migration"** to start the process
7. Confirm the action in the dialog
8. Wait for the migration to complete
9. Review the migration report

### Method 2: Using the API

#### Check Migration Status
```bash
curl -X GET \
  https://your-app.com/api/admin/migrate-sub-communities/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Preview Migration (Dry Run)
```bash
curl -X GET \
  https://your-app.com/api/admin/migrate-sub-communities/preview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Run Migration
```bash
curl -X POST \
  https://your-app.com/api/admin/migrate-sub-communities \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Method 3: Using the CLI Script

```bash
# Preview migration (dry run)
npm run migrate:preview
# or
tsx scripts/migrateToSubCommunities.ts --dry-run

# Run actual migration
npm run migrate:run
# or
tsx scripts/migrateToSubCommunities.ts

# Run with verbose logging
tsx scripts/migrateToSubCommunities.ts --verbose
```

## What Changes for Existing Users

### No Breaking Changes

- ✅ All existing communities remain accessible
- ✅ All user memberships are preserved
- ✅ All admin permissions remain intact
- ✅ All prompts remain accessible
- ✅ All collections remain unchanged

### New Capabilities

After migration, communities gain these new features:

1. **Sub-Community Support**: Can create child communities
2. **Hierarchical Organization**: Better structure for large organizations
3. **Granular Permissions**: Sub-community specific admin roles
4. **Improved Navigation**: Path-based community browsing

## Migration Report

After running the migration, you'll receive a detailed report containing:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "preCheck": {
    "communitiesNeedingMigration": 10,
    "promptsWithoutSubCommunity": 50,
    "existingMemberships": 100,
    "existingAdmins": 5
  },
  "results": {
    "communitiesUpdated": 10,
    "errors": 0,
    "preservedMemberships": 100,
    "preservedAdmins": 5
  },
  "validation": {
    "allFieldsValid": true,
    "dataIntegrityMaintained": true
  }
}
```

## Validation Checks

The migration includes automatic validation to ensure:

1. **Field Validation**: All communities have required hierarchy fields
2. **Data Integrity**: No memberships or admin relationships lost
3. **Consistency**: Level 0 communities have no parent
4. **Path Uniqueness**: Each community has a unique path

## Troubleshooting

### Migration Shows "0 communities need migration"

This means all communities are already migrated. The system is working correctly.

### Migration Failed with Errors

1. Check the error message in the migration report
2. Verify database connectivity
3. Ensure you have Super Admin permissions
4. Try running the migration again (it's idempotent)

### Data Integrity Check Failed

This is rare but if it happens:

1. Review the migration report for specific issues
2. Check database logs for constraint violations
3. Contact support with the migration report

## Rollback Procedure

The migration is designed to be safe, but if you need to rollback:

### Option 1: Database Restore (If Backup Available)
```sql
-- Restore from your backup
-- This will revert all changes since the backup
```

### Option 2: Manual Rollback (Not Recommended)
```sql
-- Clear hierarchy fields (USE WITH CAUTION)
UPDATE communities 
SET 
  level = NULL,
  path = NULL,
  parent_community_id = NULL
WHERE parent_community_id IS NULL;
```

⚠️ **Warning**: Manual rollback should only be done with database administrator supervision.

## Post-Migration Steps

1. **Verify Access**: Check that all users can access their communities
2. **Test Features**: Verify community features work as expected
3. **Create Sub-Communities**: Start organizing with the new hierarchy
4. **Update Documentation**: Document your new community structure

## Best Practices

1. **Run During Low Traffic**: Choose a maintenance window if possible
2. **Backup First**: Always backup before major migrations
3. **Test in Staging**: If you have a staging environment, test there first
4. **Monitor After Migration**: Watch for any unusual activity
5. **Keep Migration Report**: Save the report for audit purposes

## FAQ

### Q: Is the migration reversible?
A: Yes, through database restore. The migration itself doesn't delete any data.

### Q: Can I run the migration multiple times?
A: Yes, the migration is idempotent. Running it multiple times is safe.

### Q: What happens to existing prompts?
A: All prompts remain accessible. They simply won't have a subCommunityId until assigned.

### Q: Will users notice any changes?
A: No, the migration is transparent to end users. All functionality remains the same.

### Q: How long does the migration take?
A: Typically under a minute for most databases. Large installations (1000+ communities) may take a few minutes.

### Q: What if new communities are created during migration?
A: New communities created after migration will automatically have the correct hierarchy fields.

## Support

If you encounter issues during migration:

1. Save the migration report
2. Check the application logs
3. Contact support with:
   - Migration report
   - Error messages
   - Number of communities affected

## Migration Checklist

Before migration:
- [ ] Backup database
- [ ] Notify team of maintenance (if needed)
- [ ] Test in staging environment (if available)
- [ ] Review current community count

During migration:
- [ ] Run preview/dry-run first
- [ ] Review migration preview
- [ ] Execute migration
- [ ] Monitor progress

After migration:
- [ ] Verify migration report shows success
- [ ] Test user access
- [ ] Test admin functions
- [ ] Save migration report
- [ ] Notify team of completion

## Technical Details

### Database Changes

The migration updates the `communities` table:

| Field | Before | After |
|-------|--------|-------|
| level | NULL | 0 |
| path | NULL | "/{id}/" |
| parent_community_id | NULL | NULL |

### API Endpoints

- `GET /api/admin/migrate-sub-communities/status` - Check migration status
- `GET /api/admin/migrate-sub-communities/preview` - Preview migration
- `POST /api/admin/migrate-sub-communities` - Run migration

### Required Permissions

- User role must be `super_admin` or `developer`
- Authentication required for all migration endpoints

---

**Last Updated**: December 2024
**Version**: 1.0.0