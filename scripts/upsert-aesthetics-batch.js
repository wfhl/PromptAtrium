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
const BATCH_SIZE = 50; // Process 50 rows per transaction for speed

console.log('Aesthetics Database BATCH UPSERT Script');
console.log('========================================\n');

// Determine which database to use
const isDevelopment = process.env.USE_DEVELOPMENT === 'true';
const dbUrl = isDevelopment ? process.env.DATABASE_URL : process.env.PRODUCTION_DATABASE_URL;
const dbType = isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION';

if (!dbUrl) {
  console.error(`❌ ERROR: ${isDevelopment ? 'DATABASE_URL' : 'PRODUCTION_DATABASE_URL'} environment variable not set`);
  console.log('\nFor PRODUCTION database:');
  console.log('  PRODUCTION_DATABASE_URL="your-production-url" node scripts/upsert-aesthetics-batch.js');
  console.log('\nFor DEVELOPMENT database:');
  console.log('  USE_DEVELOPMENT=true node scripts/upsert-aesthetics-batch.js');
  process.exit(1);
}

// File path
const inputFile = path.join(__dirname, '../attached_assets/aesthetics_database_latests - Sheet1_1760288491982.csv');

// Column mapping from CSV to database
const COLUMN_MAPPING = {
  'reference example images': 'reference_images',
};

// Function to prepare value for database
function prepareValue(value, columnName) {
  if (value === null || value === undefined || value === '' || value === 'NULL') {
    return null;
  }
  
  // Handle numeric columns
  if (columnName === 'original_id' || columnName === 'usage_count' || columnName === 'popularity') {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  
  // Handle timestamp columns
  if (columnName === 'imported_at' || columnName === 'created_at' || columnName === 'updated_at') {
    return new Date().toISOString();
  }
  
  // Default: return as string
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
    console.log(`✅ Connected successfully!\n`);

    // Check table structure
    const tableCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'aesthetics' 
      ORDER BY ordinal_position
    `);
    
    if (tableCheck.rows.length === 0) {
      console.error('❌ ERROR: aesthetics table not found');
      process.exit(1);
    }
    
    const dbColumns = tableCheck.rows.map(row => row.column_name);
    console.log(`Database has ${dbColumns.length} columns\n`);
    
    // Check current count
    const countBefore = await client.query('SELECT COUNT(*) FROM aesthetics');
    console.log(`Starting count: ${countBefore.rows[0].count}`);

    // Read CSV
    console.log('📖 Reading CSV file...');
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ CSV file not found`);
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

    // Ask for confirmation unless --force flag
    const forceFlag = process.argv.includes('--force');
    if (!forceFlag) {
      console.log('⚠️  This will update/insert data.');
      console.log('Press Ctrl+C to cancel, or wait 3 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    // Process in batches with individual transactions
    console.log('🔄 Processing in batches...\n');
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, Math.min(i + BATCH_SIZE, rows.length));
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
      
      try {
        // Start transaction for this batch
        await client.query('BEGIN');
        
        let batchInserted = 0;
        let batchUpdated = 0;
        
        for (const row of batch) {
          try {
            const recordData = {};
            
            // Generate ID if needed
            if (dbColumns.includes('id') && !row.id) {
              recordData.id = generateUUID();
            }
            
            // Map CSV columns to database columns
            const csvColumns = Object.keys(row).filter(col => col && col.trim());
            
            for (const csvCol of csvColumns) {
              const dbCol = COLUMN_MAPPING[csvCol] || csvCol;
              
              if (!dbColumns.includes(dbCol)) {
                continue;
              }
              
              recordData[dbCol] = prepareValue(row[csvCol], dbCol);
            }
            
            // Add timestamps if missing
            if (dbColumns.includes('imported_at') && !recordData.imported_at) {
              recordData.imported_at = new Date().toISOString();
            }
            if (dbColumns.includes('created_at') && !recordData.created_at) {
              recordData.created_at = new Date().toISOString();
            }
            if (dbColumns.includes('updated_at')) {
              recordData.updated_at = new Date().toISOString();
            }
            
            if (!recordData.original_id) {
              throw new Error('Missing original_id');
            }
            
            const columns = Object.keys(recordData);
            const values = columns.map(col => recordData[col]);
            const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
            
            // Build UPDATE clause (exclude IDs)
            const updateClauses = columns
              .filter(col => col !== 'original_id' && col !== 'id')
              .map(col => `${col} = $${columns.indexOf(col) + 1}`)
              .join(', ');
            
            const query = `
              INSERT INTO aesthetics (${columns.join(', ')}) 
              VALUES (${placeholders})
              ON CONFLICT (original_id) 
              DO UPDATE SET ${updateClauses}
              RETURNING (xmax = 0) AS inserted
            `;
            
            const result = await client.query(query, values);
            
            if (result.rows[0].inserted) {
              batchInserted++;
            } else {
              batchUpdated++;
            }
          } catch (error) {
            totalErrors++;
            // Continue processing other rows in batch
          }
        }
        
        // Commit this batch
        await client.query('COMMIT');
        totalInserted += batchInserted;
        totalUpdated += batchUpdated;
        
        // Progress update
        const percentage = Math.round(((i + batch.length) / rows.length) * 100);
        console.log(`Batch ${batchNum}/${totalBatches} (${percentage}%) - Inserted: ${batchInserted}, Updated: ${batchUpdated}`);
        
      } catch (batchError) {
        // Rollback this batch
        await client.query('ROLLBACK');
        console.log(`❌ Batch ${batchNum} failed, continuing with next batch...`);
      }
    }

    // Final count
    const countAfter = await client.query('SELECT COUNT(*) FROM aesthetics');
    
    console.log(`\n✅ BATCH UPSERT COMPLETE!`);
    console.log(`   - Total inserted: ${totalInserted}`);
    console.log(`   - Total updated: ${totalUpdated}`);
    console.log(`   - Total errors: ${totalErrors}`);
    console.log(`   - Final count: ${countAfter.rows[0].count}`);
    console.log(`   - Net change: +${countAfter.rows[0].count - countBefore.rows[0].count} rows`);

  } catch (error) {
    console.error(`\n❌ Fatal error:`, error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log(`\n👋 Database connection closed`);
  }
}

// Run the import
upsertData().catch(console.error);