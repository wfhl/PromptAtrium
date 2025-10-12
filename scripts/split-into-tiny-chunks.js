import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Papa from 'papaparse';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration - Much smaller chunks
const CHUNK_SIZE = 1000; // Only 1000 rows per chunk

// File paths
const inputFile = path.join(__dirname, '../attached_assets/Prompt Components 092025 - prompt_components_1758729460833.csv');
const outputDir = path.join(__dirname, '../database_exports/small_chunks');

console.log('Splitting prompt_components into small chunks of', CHUNK_SIZE, 'rows...');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to convert JavaScript date string to PostgreSQL timestamp
function convertJSDateToPostgres(dateStr) {
  if (!dateStr || dateStr === '' || dateStr === 'NULL') {
    return 'NULL';
  }
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'NULL';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `'${year}-${month}-${day} ${hours}:${minutes}:${seconds}'`;
  } catch (error) {
    return 'NULL';
  }
}

// Function to escape SQL values properly
function escapeSqlValue(value, columnName) {
  if (value === null || value === undefined || value === '' || value === 'NULL') {
    return 'NULL';
  }
  
  // Handle date columns
  if (columnName === 'imported_at' || columnName === 'created_at' || columnName === 'updated_at') {
    return convertJSDateToPostgres(value);
  }
  
  // Handle boolean columns
  if (columnName === 'is_default' || columnName === 'is_nsfw') {
    if (value === 'true' || value === true || value === 't') {
      return "'t'";
    }
    if (value === 'false' || value === false || value === 'f') {
      return "'f'";
    }
  }
  
  // Handle numeric columns
  if (columnName === 'usage_count' || columnName === 'order_index' || columnName === 'original_id') {
    const num = parseInt(value);
    if (!isNaN(num)) {
      return num.toString();
    }
    return '0';
  }
  
  // Default: escape single quotes and wrap in quotes
  return "'" + String(value).replace(/'/g, "''") + "'";
}

// Check if input file exists
if (!fs.existsSync(inputFile)) {
  console.error(`Error: Input file not found at ${inputFile}`);
  process.exit(1);
}

console.log(`Reading CSV from: ${inputFile}`);

try {
  const csvContent = fs.readFileSync(inputFile, 'utf8');
  
  // Parse CSV with papaparse
  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    complete: function(results) {
      if (results.errors.length > 0 && results.errors.length <= 5) {
        console.log(`CSV parsing warnings:`, results.errors);
      }
    }
  });
  
  const rows = parseResult.data;
  const totalRows = rows.length;
  const totalChunks = Math.ceil(totalRows / CHUNK_SIZE);
  
  console.log(`Found ${totalRows} rows to split into ${totalChunks} chunks`);
  
  const chunkFiles = [];
  
  // Process chunks
  for (let chunkNumber = 1; chunkNumber <= totalChunks; chunkNumber++) {
    const startIdx = (chunkNumber - 1) * CHUNK_SIZE;
    const endIdx = Math.min(startIdx + CHUNK_SIZE, totalRows);
    const chunkRows = rows.slice(startIdx, endIdx);
    const startRow = startIdx + 1;
    const endRow = endIdx;
    
    if (chunkNumber % 5 === 1) {
      console.log(`\nProcessing chunks ${chunkNumber}-${Math.min(chunkNumber + 4, totalChunks)}...`);
    }
    
    // Initialize chunk SQL content - minimal header for size
    let sqlContent = `-- Chunk ${String(chunkNumber).padStart(2, '0')} of ${totalChunks} (rows ${startRow}-${endRow})\n`;
    
    if (chunkNumber === 1) {
      sqlContent += `-- Optional: TRUNCATE TABLE prompt_components CASCADE;\n\n`;
    }
    
    sqlContent += `BEGIN;\n`;
    
    // Process rows in this chunk
    for (const row of chunkRows) {
      // Filter out empty column names
      const columns = Object.keys(row).filter(col => col && col.trim());
      
      if (columns.length === 0) {
        continue;
      }
      
      // Map column values with proper escaping
      const values = columns.map(col => escapeSqlValue(row[col], col));
      
      const insertSQL = `INSERT INTO prompt_components (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
      sqlContent += insertSQL;
    }
    
    sqlContent += `COMMIT;\n`;
    sqlContent += `-- Run after this chunk: SELECT COUNT(*) FROM prompt_components;\n`;
    
    // Write chunk file with padded numbers for proper sorting
    const chunkFileName = `chunk_${String(chunkNumber).padStart(2, '0')}.sql`;
    const chunkFilePath = path.join(outputDir, chunkFileName);
    fs.writeFileSync(chunkFilePath, sqlContent);
    chunkFiles.push(chunkFileName);
  }
  
  // Create a simple master script that lists all files
  let masterScript = `-- Master Import Script\n`;
  masterScript += `-- Total: ${totalRows} rows in ${totalChunks} chunks of ${CHUNK_SIZE} rows each\n\n`;
  masterScript += `-- Import Order:\n`;
  
  for (let i = 0; i < chunkFiles.length; i++) {
    const startRow = i * CHUNK_SIZE + 1;
    const endRow = Math.min((i + 1) * CHUNK_SIZE, totalRows);
    masterScript += `-- ${i + 1}. ${chunkFiles[i]} (rows ${startRow}-${endRow})\n`;
  }
  
  masterScript += `\n-- Each file is small enough to paste into the Database pane.\n`;
  masterScript += `-- Import them in numerical order.\n`;
  
  const masterFilePath = path.join(outputDir, '00_README.txt');
  fs.writeFileSync(masterFilePath, masterScript);
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ SUCCESSFULLY CREATED SMALL CHUNKS`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📊 Summary:`);
  console.log(`  - Total rows: ${totalRows}`);
  console.log(`  - Chunks created: ${totalChunks}`);
  console.log(`  - Rows per chunk: ${CHUNK_SIZE}`);
  console.log(`\n📁 Files created in database_exports/small_chunks/`);
  console.log(`  - ${totalChunks} SQL files (chunk_01.sql through chunk_${String(totalChunks).padStart(2, '0')}.sql)`);
  console.log(`  - Each file is only ~${Math.round(CHUNK_SIZE * 0.15)}KB (small enough to paste)`);
  console.log(`\n📋 Import Instructions:`);
  console.log(`1. Open database_exports/small_chunks/`);
  console.log(`2. Start with chunk_01.sql`);
  console.log(`3. Copy the entire file content`);
  console.log(`4. Paste into Production Database pane and run`);
  console.log(`5. Repeat for each chunk in order`);
  console.log(`\n💡 Each chunk takes only 10-30 seconds to import!`);
  
} catch (error) {
  console.error('Fatal error:', error);
  process.exit(1);
}