# Database Migration Instructions: Development to Production

## Overview
This guide will help you migrate your data from the development database to production. You have significant data that needs to be migrated:

- **1,874 rows** in aesthetics table
- **24,817 rows** in prompt_components table  
- **16 rows** in codex_terms
- **8 rows** in codex_categories
- **6 rows** in prompt_stylerule_templates
- **5 rows** in character_presets
- **11 rows** in prompt_styles

## Important Note
⚠️ **I cannot directly access your production database**. According to Replit's security model, production database operations must be performed by you through the Database pane to prevent accidental data corruption.

## Step 1: Export Data from Development

Run these SQL queries in the shell to export your data:

```bash
# Export smaller tables first (run these commands in the shell)
psql $DATABASE_URL -c "\COPY (SELECT * FROM character_presets ORDER BY id) TO 'database_exports/character_presets.csv' WITH CSV HEADER;"
psql $DATABASE_URL -c "\COPY (SELECT * FROM codex_categories ORDER BY id) TO 'database_exports/codex_categories.csv' WITH CSV HEADER;"
psql $DATABASE_URL -c "\COPY (SELECT * FROM codex_terms ORDER BY id) TO 'database_exports/codex_terms.csv' WITH CSV HEADER;"
psql $DATABASE_URL -c "\COPY (SELECT * FROM prompt_stylerule_templates ORDER BY id) TO 'database_exports/prompt_stylerule_templates.csv' WITH CSV HEADER;"
psql $DATABASE_URL -c "\COPY (SELECT * FROM prompt_styles ORDER BY id) TO 'database_exports/prompt_styles.csv' WITH CSV HEADER;"
psql $DATABASE_URL -c "\COPY (SELECT * FROM categories ORDER BY id) TO 'database_exports/categories.csv' WITH CSV HEADER;"
psql $DATABASE_URL -c "\COPY (SELECT * FROM prompt_types ORDER BY id) TO 'database_exports/prompt_types.csv' WITH CSV HEADER;"
psql $DATABASE_URL -c "\COPY (SELECT * FROM recommended_models ORDER BY id) TO 'database_exports/recommended_models.csv' WITH CSV HEADER;"
psql $DATABASE_URL -c "\COPY (SELECT * FROM intended_generators ORDER BY id) TO 'database_exports/intended_generators.csv' WITH CSV HEADER;"

# Export larger tables
psql $DATABASE_URL -c "\COPY (SELECT * FROM aesthetics ORDER BY id) TO 'database_exports/aesthetics.csv' WITH CSV HEADER;"
psql $DATABASE_URL -c "\COPY (SELECT * FROM prompt_components ORDER BY id) TO 'database_exports/prompt_components.csv' WITH CSV HEADER;"
```

## Step 2: Access Production Database

1. Open your Replit workspace
2. Navigate to the **Database** pane (you'll see it in the Tools section)
3. Switch to the **Production** database tab
4. You'll see a SQL query editor where you can run commands

## Step 3: Import Data to Production

In the production Database pane, run these commands in order:

### 3.1 Clear existing data (if needed)
```sql
-- Only run this if you want to replace all existing data
-- Be careful! This will delete existing production data
TRUNCATE TABLE character_presets CASCADE;
TRUNCATE TABLE codex_categories CASCADE;
TRUNCATE TABLE codex_terms CASCADE;
TRUNCATE TABLE prompt_stylerule_templates CASCADE;
TRUNCATE TABLE prompt_styles CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE prompt_types CASCADE;
TRUNCATE TABLE recommended_models CASCADE;
TRUNCATE TABLE intended_generators CASCADE;
TRUNCATE TABLE aesthetics CASCADE;
TRUNCATE TABLE prompt_components CASCADE;
```

### 3.2 Import the data
For each CSV file exported, you'll need to:

1. Download the CSV files from `database_exports/` folder
2. In the production Database pane, use the import feature or run COPY commands

Example for importing via SQL (you'll need to upload files first):
```sql
-- Import smaller tables first
\COPY character_presets FROM 'character_presets.csv' WITH CSV HEADER;
\COPY codex_categories FROM 'codex_categories.csv' WITH CSV HEADER;
\COPY codex_terms FROM 'codex_terms.csv' WITH CSV HEADER;
\COPY prompt_stylerule_templates FROM 'prompt_stylerule_templates.csv' WITH CSV HEADER;
\COPY prompt_styles FROM 'prompt_styles.csv' WITH CSV HEADER;
\COPY categories FROM 'categories.csv' WITH CSV HEADER;
\COPY prompt_types FROM 'prompt_types.csv' WITH CSV HEADER;
\COPY recommended_models FROM 'recommended_models.csv' WITH CSV HEADER;
\COPY intended_generators FROM 'intended_generators.csv' WITH CSV HEADER;

-- Import larger tables
\COPY aesthetics FROM 'aesthetics.csv' WITH CSV HEADER;
\COPY prompt_components FROM 'prompt_components.csv' WITH CSV HEADER;
```

## Alternative Method: Using SQL INSERT Statements

If the CSV import doesn't work, I can generate SQL INSERT statements for you. Just let me know and I'll create SQL files with INSERT statements that you can run directly in the production Database pane.

## Step 4: Verify Migration

After importing, run these queries in production to verify:

```sql
SELECT COUNT(*) as count, 'aesthetics' as table_name FROM aesthetics
UNION ALL
SELECT COUNT(*), 'prompt_components' FROM prompt_components
UNION ALL
SELECT COUNT(*), 'codex_terms' FROM codex_terms
UNION ALL
SELECT COUNT(*), 'codex_categories' FROM codex_categories
UNION ALL
SELECT COUNT(*), 'prompt_stylerule_templates' FROM prompt_stylerule_templates
UNION ALL
SELECT COUNT(*), 'character_presets' FROM character_presets;
```

## Need Help?

If you encounter any issues or prefer SQL INSERT statements instead of CSV files, let me know and I can generate those for you!