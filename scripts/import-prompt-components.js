import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Papa from 'papaparse';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// File paths
const inputFile = path.join(__dirname, '../attached_assets/Prompt Components 092025 - prompt_components_1758729460833.csv');
const outputFile = path.join(__dirname, '../database_exports/prompt_components_import.sql');

console.log('Generating SQL INSERT statements for prompt_components...');

// Function to convert JavaScript date string to PostgreSQL timestamp
function convertJSDateToPostgres(dateStr) {
  if (!dateStr || dateStr === '' || dateStr === 'NULL') {
    return 'NULL';
  }
  
  try {
    // Parse the date string
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'NULL';
    }
    
    // Format as PostgreSQL timestamp
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
    dynamicTyping: false, // Keep everything as strings to control conversion
    complete: function(results) {
      if (results.errors.length > 0) {
        console.log(`CSV parsing warnings:`, results.errors.slice(0, 5));
      }
    }
  });
  
  const rows = parseResult.data;
  console.log(`Found ${rows.length} rows to import`);
  
  let sqlContent = '-- Prompt Components Import\n';
  sqlContent += '-- Generated: ' + new Date().toISOString() + '\n';
  sqlContent += `-- Total rows: ${rows.length}\n\n`;
  
  // Optional: Add transaction wrapper for safety
  sqlContent += 'BEGIN;\n\n';
  
  // Optional: Clear existing data (commented out by default)
  sqlContent += '-- Uncomment the next line if you want to replace all existing prompt_components data:\n';
  sqlContent += '-- TRUNCATE TABLE prompt_components CASCADE;\n\n';
  
  sqlContent += '-- INSERT statements for prompt_components\n';
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
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
      successCount++;
      
      // Add progress indicator every 1000 rows
      if ((i + 1) % 1000 === 0) {
        sqlContent += `-- Progress: ${i + 1} / ${rows.length} rows\n`;
        console.log(`  Processed ${i + 1} / ${rows.length} rows`);
      }
    } catch (error) {
      errorCount++;
      errors.push(`Row ${i + 1}: ${error.message}`);
      if (errors.length <= 10) {
        console.error(`Error at row ${i + 1}:`, error.message);
      }
    }
  }
  
  // Add commit at the end
  sqlContent += '\nCOMMIT;\n';
  
  // Add summary
  sqlContent += '\n-- Import Summary\n';
  sqlContent += `-- Successfully processed: ${successCount} rows\n`;
  sqlContent += `-- Errors: ${errorCount} rows\n`;
  
  if (errors.length > 0) {
    sqlContent += '\n-- First 10 errors:\n';
    errors.slice(0, 10).forEach(err => {
      sqlContent += `-- ${err}\n`;
    });
  }
  
  // Write the SQL file
  fs.writeFileSync(outputFile, sqlContent);
  
  console.log(`\n✅ SQL file generated: ${outputFile}`);
  console.log(`📊 Statistics:`);
  console.log(`  - Total rows processed: ${rows.length}`);
  console.log(`  - Successful INSERTs: ${successCount}`);
  console.log(`  - Errors: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️ Some rows had errors. Check the SQL file for details.');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Review the generated SQL file: database_exports/prompt_components_import.sql');
  console.log('2. Open the Database pane in Replit');
  console.log('3. Switch to the Production database tab');
  console.log('4. Copy and paste the SQL statements from the file');
  console.log('5. Execute the SQL to import your prompt_components data');
  console.log('\nNote: The import is wrapped in a transaction (BEGIN/COMMIT) for safety.');
  console.log('If any error occurs during import, all changes will be rolled back.');
  
} catch (error) {
  console.error('Fatal error:', error);
  process.exit(1);
}