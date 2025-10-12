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
const BATCH_SIZE = 100; // Insert/update 100 rows at a time

console.log('Aesthetics Database UPSERT Script (Fixed Column Mapping)');
console.log('=========================================================\n');

// Determine which database to use
const isDevelopment = process.env.USE_DEVELOPMENT === 'true';
const dbUrl = isDevelopment ? process.env.DATABASE_URL : process.env.PRODUCTION_DATABASE_URL;
const dbType = isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION';

if (!dbUrl) {
  console.error(`❌ ERROR: ${isDevelopment ? 'DATABASE_URL' : 'PRODUCTION_DATABASE_URL'} environment variable not set`);
  console.log('\nTo use this script:');
  console.log('\nFor PRODUCTION database:');
  console.log('  PRODUCTION_DATABASE_URL="your-production-url" node scripts/upsert-aesthetics-fixed.js');
  console.log('\nFor DEVELOPMENT database:');
  console.log('  USE_DEVELOPMENT=true node scripts/upsert-aesthetics-fixed.js');
  console.log('\nTo update BOTH databases:');
  console.log('  Run the script twice, once for each environment');
  process.exit(1);
}

// File path
const inputFile = path.join(__dirname, '../attached_assets/aesthetics_database_latests - Sheet1_1760288491982.csv');

// Column mapping from CSV to database
const COLUMN_MAPPING = {
  'reference example images': 'reference_images',
  // Add any other column mappings here if needed
};

// Function to prepare value for database
function prepareValue(value, columnName) {
  if (value === null || value === undefined || value === '' || value === 'NULL') {
    return null;
  }
  
  // Handle numeric columns
  if (columnName === 'original_id' || columnName === 'usage_count' || columnName === 'order_index' || columnName === 'popularity') {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  
  // Handle boolean columns if any
  if (columnName === 'is_active' || columnName === 'is_featured') {
    return value === 'true' || value === true || value === 't';
  }
  
  // Handle timestamp columns
  if (columnName === 'imported_at' || columnName === 'created_at' || columnName === 'updated_at') {
    // Return current timestamp for these fields
    return new Date().toISOString();
  }
  
  // Default: return as string (handles all text fields)
  return String(value);
}

// Function to generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function upsertData() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: !isDevelopment ? { rejectUnauthorized: false } : undefined
  });

  try {
    console.log(`📡 Connecting to ${dbType} database...`);
    await client.connect();
    console.log(`✅ Connected to ${dbType} database successfully!\n`);

    // Check if aesthetics table exists and get its structure
    const tableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'aesthetics' 
      ORDER BY ordinal_position
    `);
    
    if (tableCheck.rows.length === 0) {
      console.error('❌ ERROR: aesthetics table not found in database');
      process.exit(1);
    }
    
    // Get column names from database
    const dbColumns = tableCheck.rows.map(row => row.column_name);
    console.log('Database columns found:', dbColumns.length);
    console.log('Columns:', dbColumns.join(', '), '\n');
    
    // Check current count
    const countResult = await client.query('SELECT COUNT(*) FROM aesthetics');
    console.log(`Current aesthetics count: ${countResult.rows[0].count}\n`);

    // Ask for confirmation
    console.log(`⚠️  WARNING: This will update/insert data in your ${dbType} database.`);
    console.log('   - Existing records will be UPDATED based on original_id');
    console.log('   - New records will be INSERTED');
    console.log('   - No duplicates will be created\n');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Read and parse CSV
    console.log('📖 Reading CSV file...');
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
    console.log(`Found ${rows.length} rows to process\n`);
    
    // Show column mapping being used
    console.log('Column mappings:');
    for (const [csvCol, dbCol] of Object.entries(COLUMN_MAPPING)) {
      console.log(`  "${csvCol}" → "${dbCol}"`);
    }
    console.log('');

    // Begin transaction
    console.log('🔄 Starting UPSERT transaction...');
    await client.query('BEGIN');

    let insertCount = 0;
    let updateCount = 0;
    let errorCount = 0;
    const errors = [];
    const skippedColumns = new Set();

    // Process in batches
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, Math.min(i + BATCH_SIZE, rows.length));
      
      for (const row of batch) {
        try {
          // Map CSV columns to database columns
          const recordData = {};
          
          // Handle ID - if table has 'id' column and not in CSV, generate one
          if (dbColumns.includes('id') && !row.id) {
            recordData.id = generateUUID();
          } else if (row.id) {
            recordData.id = row.id;
          }
          
          // Map the CSV columns to database columns
          const csvColumns = Object.keys(row).filter(col => col && col.trim());
          
          for (const csvCol of csvColumns) {
            // Check if this column needs mapping
            const dbCol = COLUMN_MAPPING[csvCol] || csvCol;
            
            // Skip if column doesn't exist in database
            if (!dbColumns.includes(dbCol)) {
              if (dbCol !== '' && csvCol !== '') { // Skip empty column names
                skippedColumns.add(csvCol);
              }
              continue;
            }
            
            recordData[dbCol] = prepareValue(row[csvCol], dbCol);
          }
          
          // Add timestamps if they're in the database but not in the CSV
          if (dbColumns.includes('imported_at') && !recordData.imported_at) {
            recordData.imported_at = new Date().toISOString();
          }
          if (dbColumns.includes('created_at') && !recordData.created_at) {
            recordData.created_at = new Date().toISOString();
          }
          if (dbColumns.includes('updated_at') && !recordData.updated_at) {
            recordData.updated_at = new Date().toISOString();
          }
          
          // Make sure we have an original_id
          if (!recordData.original_id) {
            throw new Error('Row missing original_id field');
          }
          
          const columns = Object.keys(recordData);
          const values = columns.map(col => recordData[col]);
          
          // Build the UPSERT query - using original_id for conflict resolution
          const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
          
          // Build the UPDATE clause for conflicts
          const updateClauses = columns
            .filter(col => col !== 'original_id' && col !== 'id') // Don't update the IDs
            .map(col => {
              const valueIndex = columns.indexOf(col) + 1;
              return `${col} = $${valueIndex}`;
            })
            .join(', ');
          
          // Determine conflict column based on what exists in the database
          const conflictColumn = dbColumns.includes('original_id') ? 'original_id' : 'id';
          
          const query = `
            INSERT INTO aesthetics (${columns.join(', ')}) 
            VALUES (${placeholders})
            ON CONFLICT (${conflictColumn}) 
            DO UPDATE SET ${updateClauses}
            RETURNING (xmax = 0) AS inserted
          `;
          
          const result = await client.query(query, values);
          
          // Check if it was an insert or update
          if (result.rows[0].inserted) {
            insertCount++;
          } else {
            updateCount++;
          }
        } catch (error) {
          errorCount++;
          const rowNum = i + batch.indexOf(row) + 1;
          if (errors.length < 10) {
            errors.push(`Row ${rowNum} (original_id: ${row.original_id || 'N/A'}): ${error.message}`);
          }
        }
      }
      
      // Progress update
      if ((i + BATCH_SIZE) % 200 === 0 || i + BATCH_SIZE >= rows.length) {
        const processed = Math.min(i + BATCH_SIZE, rows.length);
        const percentage = Math.round((processed / rows.length) * 100);
        console.log(`Progress: ${processed}/${rows.length} rows (${percentage}%) - Inserted: ${insertCount}, Updated: ${updateCount}`);
      }
    }

    // Report skipped columns
    if (skippedColumns.size > 0) {
      console.log('\n📝 CSV columns not found in database (skipped):');
      skippedColumns.forEach(col => console.log(`  - "${col}"`));
    }

    if (errorCount === 0) {
      console.log('\n✅ All rows processed successfully!');
      console.log('📝 Committing transaction...');
      await client.query('COMMIT');
      
      // Final count
      const finalCount = await client.query('SELECT COUNT(*) FROM aesthetics');
      console.log(`\n✅ UPSERT complete in ${dbType} database!`);
      console.log(`   - New rows inserted: ${insertCount}`);
      console.log(`   - Existing rows updated: ${updateCount}`);
      console.log(`   - Errors: ${errorCount}`);
      console.log(`   - Total rows in database: ${finalCount.rows[0].count}`);
    } else {
      console.log(`\n⚠️ Process had ${errorCount} errors`);
      console.log('Rolling back transaction...');
      await client.query('ROLLBACK');
      
      if (errors.length > 0) {
        console.log('\nFirst few errors:');
        errors.forEach(err => console.log(`  - ${err}`));
      }
      console.log('\nPlease fix the errors and try again.');
    }

  } catch (error) {
    console.error(`\n❌ Fatal error in ${dbType} database:`, error.message);
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      // Ignore rollback errors
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log(`\n👋 ${dbType} database connection closed`);
  }
}

// Run the import
upsertData().catch(console.error);