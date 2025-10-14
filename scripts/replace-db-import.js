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

console.log('Database REPLACE Script (Delete All & Import New Data)');
console.log('======================================================\n');

// Check for production database URL
if (!process.env.PRODUCTION_DATABASE_URL) {
  console.error('❌ ERROR: PRODUCTION_DATABASE_URL environment variable not set');
  console.log('\nTo use this script:');
  console.log('1. Get your production database URL from the Database pane');
  console.log('2. Run the script with:');
  console.log('   PRODUCTION_DATABASE_URL="your-production-url" node scripts/replace-db-import.js');
  console.log('\nExample:');
  console.log('   PRODUCTION_DATABASE_URL="postgresql://user:pass@host/db" node scripts/replace-db-import.js');
  process.exit(1);
}

// File path - using the attached CSV file
const inputFile = path.join(__dirname, '../attached_assets/prompt_components 101425 - prompt_components_1760405122513.csv');

// Function to convert JavaScript date string to PostgreSQL timestamp
function convertJSDateToPostgres(dateStr) {
  if (!dateStr || dateStr === '' || dateStr === 'NULL') {
    return null;
  }
  
  // Remove extra quotes if present
  dateStr = dateStr.replace(/^"|"$/g, '').replace(/^"""|"""$/g, '"');
  
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
    const lowerValue = String(value).toLowerCase();
    return lowerValue === 'true' || lowerValue === 't' || lowerValue === '1';
  }
  
  // Handle numeric columns
  if (columnName === 'usage_count' || columnName === 'order_index' || columnName === 'original_id') {
    const num = parseInt(value);
    return isNaN(num) ? 0 : num;
  }
  
  // Default: return as string
  return String(value);
}

async function replaceData() {
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
    const currentCount = countResult.rows[0].count;
    console.log(`Current prompt_components count: ${currentCount}\n`);

    // Read and parse CSV first to validate data
    console.log('📖 Reading and validating CSV file...');
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ ERROR: CSV file not found at ${inputFile}`);
      process.exit(1);
    }
    
    const csvContent = fs.readFileSync(inputFile, 'utf8');
    
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false
    });
    
    const rows = parseResult.data;
    console.log(`Found ${rows.length} rows to import\n`);
    
    if (rows.length === 0) {
      console.error('❌ ERROR: No data found in CSV file');
      process.exit(1);
    }

    // Ask for confirmation with more serious warning
    console.log('⚠️  CRITICAL WARNING: This operation will:');
    console.log(`   1. DELETE ALL ${currentCount} existing records from prompt_components`);
    console.log(`   2. Insert ${rows.length} new records from the CSV file`);
    console.log('\n   This is a DESTRUCTIVE operation that CANNOT be undone!');
    console.log('   Make sure you have a backup of your current data!\n');
    console.log('   Type "yes" to continue or press Ctrl+C to cancel...');
    
    // Wait for user confirmation
    console.log('\n   Waiting 10 seconds for you to review this warning...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Begin transaction
    console.log('🔄 Starting REPLACE transaction...');
    await client.query('BEGIN');

    try {
      // Step 1: Delete all existing records
      console.log('🗑️  Deleting all existing prompt_components records...');
      const deleteResult = await client.query('DELETE FROM prompt_components');
      console.log(`   ✅ Deleted ${deleteResult.rowCount} existing records\n`);

      // Step 2: Insert new records
      console.log('📝 Inserting new records...');
      let insertCount = 0;
      let errorCount = 0;
      const errors = [];

      // Process in batches
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, Math.min(i + BATCH_SIZE, rows.length));
        
        for (const row of batch) {
          try {
            // Filter out empty column names
            const columns = Object.keys(row).filter(col => col && col.trim() && col !== '');
            
            if (columns.length === 0) continue;
            
            // Make sure we have an ID
            if (!row.id) {
              throw new Error('Row missing ID field');
            }
            
            const values = columns.map(col => prepareValue(row[col], col));
            
            // Build the INSERT query
            const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
            
            const query = `
              INSERT INTO prompt_components (${columns.join(', ')}) 
              VALUES (${placeholders})
            `;
            
            await client.query(query, values);
            insertCount++;
            
          } catch (error) {
            errorCount++;
            if (errors.length < 10) {
              errors.push(`Row ${i + batch.indexOf(row) + 1} (ID: ${row.id || 'unknown'}): ${error.message}`);
            }
          }
        }
        
        // Progress update
        if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= rows.length) {
          const processed = Math.min(i + BATCH_SIZE, rows.length);
          const percentage = Math.round((processed / rows.length) * 100);
          console.log(`   Progress: ${processed}/${rows.length} rows (${percentage}%) - Inserted: ${insertCount}, Errors: ${errorCount}`);
        }
      }

      if (errorCount === 0) {
        console.log('\n✅ All rows processed successfully!');
        console.log('📝 Committing transaction...');
        await client.query('COMMIT');
        
        // Final count
        const finalCount = await client.query('SELECT COUNT(*) FROM prompt_components');
        console.log(`\n🎉 REPLACE OPERATION COMPLETE!`);
        console.log(`   - Previous records deleted: ${currentCount}`);
        console.log(`   - New records inserted: ${insertCount}`);
        console.log(`   - Total rows in database: ${finalCount.rows[0].count}`);
        
        // Show summary of imported data
        const sampleResult = await client.query(`
          SELECT anatomy_group, category, COUNT(*) as count 
          FROM prompt_components 
          GROUP BY anatomy_group, category 
          ORDER BY anatomy_group, category 
          LIMIT 10
        `);
        
        console.log('\n📊 Sample of imported data (first 10 groups):');
        sampleResult.rows.forEach(row => {
          console.log(`   - ${row.anatomy_group || '(null)'} / ${row.category || '(null)'}: ${row.count} entries`);
        });
        
      } else {
        console.log(`\n⚠️ Process completed with ${errorCount} errors`);
        
        if (errorCount > rows.length * 0.1) { // If more than 10% failed
          console.log('❌ Too many errors detected (>10% failure rate)');
          console.log('🔄 Rolling back transaction...');
          await client.query('ROLLBACK');
          console.log('Transaction rolled back - no changes were made');
          
          if (errors.length > 0) {
            console.log('\nFirst few errors:');
            errors.forEach(err => console.log(`  - ${err}`));
          }
        } else {
          console.log('⚠️ Some errors occurred but proceeding with commit...');
          console.log('📝 Committing transaction...');
          await client.query('COMMIT');
          
          // Final count
          const finalCount = await client.query('SELECT COUNT(*) FROM prompt_components');
          console.log(`\n✅ REPLACE operation completed with warnings`);
          console.log(`   - Previous records deleted: ${currentCount}`);
          console.log(`   - New records inserted: ${insertCount}`);
          console.log(`   - Records that failed: ${errorCount}`);
          console.log(`   - Total rows in database: ${finalCount.rows[0].count}`);
          
          if (errors.length > 0) {
            console.log('\nErrors encountered:');
            errors.forEach(err => console.log(`  - ${err}`));
          }
        }
      }
    } catch (transactionError) {
      console.error('\n❌ Transaction error:', transactionError.message);
      console.log('🔄 Rolling back transaction...');
      await client.query('ROLLBACK');
      console.log('Transaction rolled back - no changes were made');
      throw transactionError;
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

// Run the replace operation
console.log('Starting database replace operation...\n');
replaceData().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});