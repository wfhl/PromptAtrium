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

// File path
const inputFile = path.join(__dirname, '../attached_assets/aesthetics_database_latests - Sheet1_1760288491982.csv');

async function checkMissing() {
  const dbUrl = process.env.DATABASE_URL;
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    console.log('Connected to database\n');
    
    // Read CSV
    const csvContent = fs.readFileSync(inputFile, 'utf8');
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true
    });
    
    const rows = parseResult.data;
    console.log(`CSV has ${rows.length} rows`);
    
    // Get all original_ids from database
    const dbResult = await client.query('SELECT original_id FROM aesthetics ORDER BY original_id');
    const dbIds = new Set(dbResult.rows.map(r => r.original_id));
    console.log(`Database has ${dbIds.size} unique original_ids\n`);
    
    // Find missing records
    const missing = [];
    const nullIds = [];
    
    for (const row of rows) {
      const originalId = row.original_id;
      if (!originalId || originalId === '' || originalId === 'NULL') {
        nullIds.push(row);
      } else {
        const id = parseInt(originalId);
        if (!dbIds.has(id)) {
          missing.push({ ...row, parsed_id: id });
        }
      }
    }
    
    console.log(`Missing records: ${missing.length}`);
    console.log(`Records with NULL/empty original_id: ${nullIds.length}`);
    
    if (missing.length > 0) {
      console.log('\nFirst 10 missing original_ids:');
      missing.slice(0, 10).forEach(r => {
        console.log(`  - ${r.parsed_id}: ${r.name}`);
      });
    }
    
    if (nullIds.length > 0) {
      console.log('\nFirst 5 records with NULL/empty original_id:');
      nullIds.slice(0, 5).forEach(r => {
        console.log(`  - ${r.name}: ${r.description?.substring(0, 50)}...`);
      });
    }
    
    // Check for duplicates in CSV
    const csvOriginalIds = rows
      .map(r => r.original_id)
      .filter(id => id && id !== '' && id !== 'NULL')
      .map(id => parseInt(id));
    
    const csvIdCounts = {};
    csvOriginalIds.forEach(id => {
      csvIdCounts[id] = (csvIdCounts[id] || 0) + 1;
    });
    
    const csvDuplicates = Object.entries(csvIdCounts)
      .filter(([id, count]) => count > 1)
      .map(([id, count]) => ({ id: parseInt(id), count }));
    
    if (csvDuplicates.length > 0) {
      console.log(`\n⚠️  CSV has ${csvDuplicates.length} duplicate original_ids:`);
      csvDuplicates.slice(0, 5).forEach(dup => {
        console.log(`  - original_id ${dup.id} appears ${dup.count} times`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkMissing().catch(console.error);