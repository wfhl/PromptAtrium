import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Papa from 'papaparse';

const { Client } = pg;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const BATCH_SIZE = 100; // Insert 100 rows at a time

console.log('Direct Database Import Script');
console.log('=============================\n');

// Check for production database URL
if (!process.env.PRODUCTION_DATABASE_URL) {
  console.error('❌ ERROR: PRODUCTION_DATABASE_URL environment variable not set');
  console.log('\nTo use this script:');
  console.log('1. Get your production database URL from the Database pane');
  console.log('2. Run the script with:');
  console.log('   PRODUCTION_DATABASE_URL="your-production-url" node scripts/direct-db-import.js');
  console.log('\nExample:');
  console.log('   PRODUCTION_DATABASE_URL="postgresql://user:pass@host/db" node scripts/direct-db-import.js');
  process.exit(1);
}

// File path
const inputFile = path.join(__dirname, '../attached_assets/Prompt Components 092025 - prompt_components_1758729460833.csv');

// Function to convert JavaScript date string to PostgreSQL timestamp
function convertJSDateToPostgres(dateStr) {
  if (!dateStr || dateStr === '' || dateStr === 'NULL') {
    return null;
  }
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  } catch (error) {
    return null;
  }
}

// Function to prepare value for database
function prepareValue(value, columnName) {
  if (value === null || value === undefined || value === '' || value === 'NULL') {
    return null;
  }
  
  // Handle date columns
  if (columnName === 'imported_at' || columnName === 'created_at' || columnName === 'updated_at') {
    return convertJSDateToPostgres(value);
  }
  
  // Handle boolean columns
  if (columnName === 'is_default' || columnName === 'is_nsfw') {
    return value === 'true' || value === true || value === 't';
  }
  
  // Handle numeric columns
  if (columnName === 'usage_count' || columnName === 'order_index' || columnName === 'original_id') {
    const num = parseInt(value);
    return isNaN(num) ? 0 : num;
  }
  
  // Default: return as string
  return String(value);
}

async function importData() {
  const client = new Client({
    connectionString: process.env.PRODUCTION_DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Neon/production databases
    }
  });

  try {
    console.log('📡 Connecting to production database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Check current count
    const countResult = await client.query('SELECT COUNT(*) FROM prompt_components');
    console.log(`Current prompt_components count: ${countResult.rows[0].count}\n`);

    // Ask for confirmation
    console.log('⚠️  WARNING: This will add data to your production database.');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Read and parse CSV
    console.log('📖 Reading CSV file...');
    const csvContent = fs.readFileSync(inputFile, 'utf8');
    
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false
    });
    
    const rows = parseResult.data;
    console.log(`Found ${rows.length} rows to import\n`);

    // Begin transaction
    console.log('🔄 Starting import transaction...');
    await client.query('BEGIN');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process in batches
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, Math.min(i + BATCH_SIZE, rows.length));
      
      for (const row of batch) {
        try {
          const columns = Object.keys(row).filter(col => col && col.trim());
          
          if (columns.length === 0) continue;
          
          const values = columns.map(col => prepareValue(row[col], col));
          
          const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
          const query = `INSERT INTO prompt_components (${columns.join(', ')}) VALUES (${placeholders})`;
          
          await client.query(query, values);
          successCount++;
        } catch (error) {
          errorCount++;
          if (errors.length < 10) {
            errors.push(`Row ${i + batch.indexOf(row) + 1}: ${error.message}`);
          }
        }
      }
      
      // Progress update
      if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= rows.length) {
        const processed = Math.min(i + BATCH_SIZE, rows.length);
        const percentage = Math.round((processed / rows.length) * 100);
        console.log(`Progress: ${processed}/${rows.length} rows (${percentage}%)`);
      }
    }

    if (errorCount === 0) {
      console.log('\n✅ All rows imported successfully!');
      console.log('📝 Committing transaction...');
      await client.query('COMMIT');
      
      // Final count
      const finalCount = await client.query('SELECT COUNT(*) FROM prompt_components');
      console.log(`\n✅ Import complete!`);
      console.log(`   - Rows imported: ${successCount}`);
      console.log(`   - Total rows now: ${finalCount.rows[0].count}`);
    } else {
      console.log(`\n⚠️ Import had ${errorCount} errors`);
      console.log('Rolling back transaction...');
      await client.query('ROLLBACK');
      
      if (errors.length > 0) {
        console.log('\nFirst few errors:');
        errors.forEach(err => console.log(`  - ${err}`));
      }
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      // Ignore rollback errors
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

// Run the import
importData().catch(console.error);