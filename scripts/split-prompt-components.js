import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Papa from 'papaparse';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CHUNK_SIZE = 5000;

// File paths
const inputFile = path.join(__dirname, '../attached_assets/Prompt Components 092025 - prompt_components_1758729460833.csv');
const outputDir = path.join(__dirname, '../database_exports/prompt_components_chunks');

console.log('Splitting prompt_components into chunks of', CHUNK_SIZE, 'rows...');

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
    console.warn(`Error parsing date: ${dateStr}`);
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

// Function to create SQL header for each chunk
function createChunkHeader(chunkNumber, totalChunks, startRow, endRow, totalRows) {
  let header = `-- Prompt Components Import - Chunk ${chunkNumber} of ${totalChunks}\n`;
  header += `-- Generated: ${new Date().toISOString()}\n`;
  header += `-- Rows ${startRow} to ${endRow} of ${totalRows} total\n\n`;
  header += `-- INSTRUCTIONS:\n`;
  header += `-- 1. Import chunks in order (chunk_1, chunk_2, etc.)\n`;
  header += `-- 2. Each chunk is wrapped in a transaction for safety\n`;
  header += `-- 3. If a chunk fails, you can retry it without affecting other chunks\n\n`;
  
  if (chunkNumber === 1) {
    header += `-- OPTIONAL: Clear existing data before importing chunk 1\n`;
    header += `-- Uncomment the next line only if you want to replace ALL existing data:\n`;
    header += `-- TRUNCATE TABLE prompt_components CASCADE;\n\n`;
  }
  
  header += `BEGIN;\n\n`;
  header += `-- INSERT statements for prompt_components (chunk ${chunkNumber})\n`;
  
  return header;
}

// Function to create SQL footer for each chunk
function createChunkFooter(chunkNumber, successCount) {
  let footer = `\n-- End of chunk ${chunkNumber}\n`;
  footer += `-- Rows in this chunk: ${successCount}\n\n`;
  footer += `COMMIT;\n\n`;
  footer += `-- After running this chunk, you can verify with:\n`;
  footer += `-- SELECT COUNT(*) FROM prompt_components;\n`;
  
  return footer;
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
  
  let globalSuccessCount = 0;
  let globalErrorCount = 0;
  const chunkFiles = [];
  
  // Process chunks
  for (let chunkNumber = 1; chunkNumber <= totalChunks; chunkNumber++) {
    const startIdx = (chunkNumber - 1) * CHUNK_SIZE;
    const endIdx = Math.min(startIdx + CHUNK_SIZE, totalRows);
    const chunkRows = rows.slice(startIdx, endIdx);
    const startRow = startIdx + 1;
    const endRow = endIdx;
    
    console.log(`\nProcessing chunk ${chunkNumber}: rows ${startRow}-${endRow}`);
    
    // Initialize chunk SQL content
    let sqlContent = createChunkHeader(chunkNumber, totalChunks, startRow, endRow, totalRows);
    
    let chunkSuccessCount = 0;
    let chunkErrorCount = 0;
    
    // Process rows in this chunk
    for (let i = 0; i < chunkRows.length; i++) {
      const row = chunkRows[i];
      const globalRowNumber = startIdx + i + 1;
      
      try {
        // Filter out empty column names
        const columns = Object.keys(row).filter(col => col && col.trim());
        
        if (columns.length === 0) {
          continue;
        }
        
        // Map column values with proper escaping
        const values = columns.map(col => escapeSqlValue(row[col], col));
        
        const insertSQL = `INSERT INTO prompt_components (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        sqlContent += insertSQL;
        chunkSuccessCount++;
        globalSuccessCount++;
        
        // Add progress indicator every 500 rows within chunk
        if ((i + 1) % 500 === 0) {
          sqlContent += `-- Progress: ${i + 1} / ${chunkRows.length} rows in this chunk\n`;
        }
      } catch (error) {
        chunkErrorCount++;
        globalErrorCount++;
        console.error(`Error at row ${globalRowNumber}:`, error.message);
      }
    }
    
    // Add chunk footer
    sqlContent += createChunkFooter(chunkNumber, chunkSuccessCount);
    
    // Write chunk file
    const chunkFileName = `prompt_components_chunk_${chunkNumber}.sql`;
    const chunkFilePath = path.join(outputDir, chunkFileName);
    fs.writeFileSync(chunkFilePath, sqlContent);
    chunkFiles.push(chunkFileName);
    
    console.log(`  ✅ Created ${chunkFileName} with ${chunkSuccessCount} INSERT statements`);
  }
  
  // Create a master index file with instructions
  let indexContent = `-- Prompt Components Import - Master Index\n`;
  indexContent += `-- Generated: ${new Date().toISOString()}\n`;
  indexContent += `-- Total rows: ${totalRows}\n`;
  indexContent += `-- Total chunks: ${totalChunks}\n`;
  indexContent += `-- Chunk size: ${CHUNK_SIZE} rows per chunk\n\n`;
  
  indexContent += `-- IMPORT INSTRUCTIONS:\n`;
  indexContent += `-- ================================================\n\n`;
  
  indexContent += `-- 1. Open the Database pane in Replit\n`;
  indexContent += `-- 2. Switch to the Production database tab\n`;
  indexContent += `-- 3. Import each chunk file in order:\n\n`;
  
  for (let i = 0; i < chunkFiles.length; i++) {
    const startRow = i * CHUNK_SIZE + 1;
    const endRow = Math.min((i + 1) * CHUNK_SIZE, totalRows);
    indexContent += `--    ${i + 1}. ${chunkFiles[i]} (rows ${startRow}-${endRow})\n`;
  }
  
  indexContent += `\n-- 4. After each chunk, verify the import with:\n`;
  indexContent += `--    SELECT COUNT(*) FROM prompt_components;\n\n`;
  
  indexContent += `-- 5. If a chunk fails, you can retry it without affecting other chunks\n`;
  indexContent += `--    since each chunk is wrapped in its own transaction\n\n`;
  
  indexContent += `-- FILE LIST:\n`;
  indexContent += `-- ================================================\n`;
  chunkFiles.forEach((file, idx) => {
    indexContent += `-- ${idx + 1}. prompt_components_chunks/${file}\n`;
  });
  
  const indexFilePath = path.join(outputDir, '_INDEX.txt');
  fs.writeFileSync(indexFilePath, indexContent);
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ SUCCESSFULLY SPLIT PROMPT_COMPONENTS DATA`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📊 Summary:`);
  console.log(`  - Total rows: ${totalRows}`);
  console.log(`  - Chunks created: ${totalChunks}`);
  console.log(`  - Rows per chunk: ${CHUNK_SIZE} (last chunk: ${totalRows - (totalChunks - 1) * CHUNK_SIZE})`);
  console.log(`  - Successful INSERTs: ${globalSuccessCount}`);
  console.log(`  - Errors: ${globalErrorCount}`);
  console.log(`\n📁 Files created in database_exports/prompt_components_chunks/:`);
  chunkFiles.forEach((file, idx) => {
    const startRow = idx * CHUNK_SIZE + 1;
    const endRow = Math.min((idx + 1) * CHUNK_SIZE, totalRows);
    console.log(`  ${idx + 1}. ${file} (rows ${startRow}-${endRow})`);
  });
  console.log(`\n📋 Next Steps:`);
  console.log(`1. Navigate to database_exports/prompt_components_chunks/`);
  console.log(`2. Read _INDEX.txt for detailed import instructions`);
  console.log(`3. Import each chunk file in order through the Production Database pane`);
  console.log(`\n💡 Tip: Each chunk is independent and wrapped in a transaction,`);
  console.log(`   so you can take breaks between imports without issues!`);
  
} catch (error) {
  console.error('Fatal error:', error);
  process.exit(1);
}