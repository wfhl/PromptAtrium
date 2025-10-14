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
const BATCH_SIZE = 10; // Smaller batch size since we have fewer records

console.log('Character Presets SYNC Script (Upsert/Sync with Production)');
console.log('===========================================================\n');

// Check for production database URL
if (!process.env.PRODUCTION_DATABASE_URL) {
  console.error('❌ ERROR: PRODUCTION_DATABASE_URL environment variable not set');
  console.log('\nTo use this script:');
  console.log('1. Get your production database URL from the Database pane');
  console.log('2. Run the script with:');
  console.log('   PRODUCTION_DATABASE_URL="your-production-url" node scripts/sync-character-presets.js');
  console.log('\nExample:');
  console.log('   PRODUCTION_DATABASE_URL="postgresql://user:pass@host/db" node scripts/sync-character-presets.js');
  process.exit(1);
}

// File path - using the attached CSV file
const inputFile = path.join(__dirname, '../attached_assets/character_presets_1760406098827.csv');

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
  
  // Handle date columns (map snake_case to camelCase)
  if (columnName === 'created_at' || columnName === 'updated_at') {
    return convertJSDateToPostgres(value);
  }
  
  // Handle boolean columns (map snake_case to camelCase)
  if (columnName === 'is_favorite' || columnName === 'is_global') {
    const lowerValue = String(value).toLowerCase();
    return lowerValue === 'true' || lowerValue === 't' || lowerValue === '1';
  }
  
  // user_id can be null (empty in CSV shows as double comma)
  if (columnName === 'user_id' && (!value || value === '')) {
    return null;
  }
  
  // Default: return as string
  return String(value);
}

// Map CSV column names to database column names
function mapColumnName(csvColumn) {
  const columnMap = {
    'is_favorite': 'isFavorite',
    'user_id': 'userId',
    'is_global': 'isGlobal',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt'
  };
  
  return columnMap[csvColumn] || csvColumn;
}

async function syncData() {
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
    const countResult = await client.query('SELECT COUNT(*) FROM character_presets');
    const currentCount = countResult.rows[0].count;
    console.log(`Current character_presets count: ${currentCount}\n`);

    // Read and parse CSV
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
    console.log(`Found ${rows.length} character presets to sync\n`);
    
    if (rows.length === 0) {
      console.error('❌ ERROR: No data found in CSV file');
      process.exit(1);
    }

    // Show preview of data to be synced
    console.log('📋 Character presets to sync:');
    rows.forEach(row => {
      console.log(`   - ${row.name} (${row.role}) - ${row.gender || 'Any'}`);
    });
    console.log('');

    // Ask for confirmation
    console.log('⚠️  WARNING: This will sync character presets to your production database.');
    console.log('   - Existing presets with matching IDs will be UPDATED');
    console.log('   - New presets will be INSERTED');
    console.log('   - Other existing presets will remain unchanged\n');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Begin transaction
    console.log('🔄 Starting SYNC transaction...');
    await client.query('BEGIN');

    let insertCount = 0;
    let updateCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each row
    for (const row of rows) {
      try {
        // Map CSV columns to database columns
        const mappedRow = {};
        for (const [csvCol, value] of Object.entries(row)) {
          const dbCol = mapColumnName(csvCol);
          mappedRow[dbCol] = prepareValue(value, csvCol);
        }
        
        // Make sure we have an ID
        if (!mappedRow.id) {
          throw new Error('Row missing ID field');
        }
        
        // Make sure we have a name
        if (!mappedRow.name) {
          throw new Error('Row missing name field');
        }
        
        // Build the column lists
        const columns = Object.keys(mappedRow).filter(col => col !== '');
        const values = columns.map(col => mappedRow[col]);
        
        // Build the UPSERT query
        const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
        
        // Build the UPDATE clause for conflicts (using proper camelCase column names)
        const updateClauses = columns
          .filter(col => col !== 'id') // Don't update the ID
          .map((col) => {
            const valueIndex = columns.indexOf(col) + 1;
            return `"${col}" = $${valueIndex}`;
          })
          .join(', ');
        
        // Use proper camelCase column names in the query
        const columnList = columns.map(col => `"${col}"`).join(', ');
        
        const query = `
          INSERT INTO character_presets (${columnList}) 
          VALUES (${placeholders})
          ON CONFLICT (id) 
          DO UPDATE SET ${updateClauses}, "updatedAt" = CURRENT_TIMESTAMP
          RETURNING (xmax = 0) AS inserted
        `;
        
        const result = await client.query(query, values);
        
        // Check if it was an insert or update
        if (result.rows[0].inserted) {
          insertCount++;
          console.log(`   ✅ Inserted: ${mappedRow.name}`);
        } else {
          updateCount++;
          console.log(`   🔄 Updated: ${mappedRow.name}`);
        }
      } catch (error) {
        errorCount++;
        const errorMsg = `${row.name || 'Unknown'}: ${error.message}`;
        errors.push(errorMsg);
        console.log(`   ❌ Error: ${errorMsg}`);
      }
    }

    if (errorCount === 0) {
      console.log('\n✅ All presets processed successfully!');
      console.log('📝 Committing transaction...');
      await client.query('COMMIT');
      
      // Final count and sample
      const finalCount = await client.query('SELECT COUNT(*) FROM character_presets');
      const sampleResult = await client.query(`
        SELECT id, name, role, gender, "isGlobal", "isFavorite" 
        FROM character_presets 
        ORDER BY "createdAt" DESC
        LIMIT 10
      `);
      
      console.log(`\n🎉 SYNC OPERATION COMPLETE!`);
      console.log(`   - New presets inserted: ${insertCount}`);
      console.log(`   - Existing presets updated: ${updateCount}`);
      console.log(`   - Errors: ${errorCount}`);
      console.log(`   - Total presets in database: ${finalCount.rows[0].count}`);
      
      console.log('\n📊 Current character presets in database:');
      sampleResult.rows.forEach(preset => {
        const flags = [];
        if (preset.isGlobal) flags.push('Global');
        if (preset.isFavorite) flags.push('Favorite');
        const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
        console.log(`   - ${preset.name} (${preset.role}) - ${preset.gender || 'Any'}${flagStr}`);
      });
      
    } else {
      console.log(`\n⚠️ Process had ${errorCount} errors`);
      console.log('Rolling back transaction...');
      await client.query('ROLLBACK');
      console.log('Transaction rolled back - no changes were made');
      
      if (errors.length > 0) {
        console.log('\nErrors encountered:');
        errors.forEach(err => console.log(`  - ${err}`));
      }
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
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

// Run the sync operation
console.log('Starting character presets sync operation...\n');
syncData().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});