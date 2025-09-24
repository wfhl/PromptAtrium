import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Papa from 'papaparse';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read all CSV files from database_exports directory
const exportDir = path.join(__dirname, '../database_exports');
const outputFile = path.join(exportDir, 'production-import.sql');

console.log('Generating SQL INSERT statements with proper CSV parsing...');

// Table mappings with their import order (respecting foreign key dependencies)
const tableFiles = [
  { table: 'character_presets', file: 'character_presets.csv' },
  { table: 'codex_categories', file: 'codex_categories.csv' },
  { table: 'codex_terms', file: 'codex_terms.csv' },
  { table: 'prompt_stylerule_templates', file: 'prompt_stylerule_templates.csv' },
  { table: 'prompt_styles', file: 'prompt_styles.csv' },
  { table: 'categories', file: 'categories.csv' },
  { table: 'prompt_types', file: 'prompt_types.csv' },
  { table: 'recommended_models', file: 'recommended_models.csv' },
  { table: 'intended_generators', file: 'intended_generators.csv' },
  { table: 'aesthetics', file: 'aesthetics.csv' },
  { table: 'prompt_components', file: 'prompt_components.csv' }
];

let sqlContent = '-- Production Database Import\n';
sqlContent += '-- Generated: ' + new Date().toISOString() + '\n';
sqlContent += '-- This file contains INSERT statements for migrating data to production\n\n';
sqlContent += '-- IMPORTANT: Run these commands in order to respect foreign key constraints\n\n';

let totalInserts = 0;
let errors = [];

// Function to escape SQL values properly
function escapeSqlValue(value) {
  if (value === null || value === undefined || value === '' || value === 'NULL') {
    return 'NULL';
  }
  
  // Handle boolean values
  if (value === 't' || value === 'true' || value === true) {
    return "'t'";
  }
  if (value === 'f' || value === 'false' || value === false) {
    return "'f'";
  }
  
  // Escape single quotes and wrap in quotes
  // Also preserve newlines and other special characters
  return "'" + String(value).replace(/'/g, "''") + "'";
}

// Process each table
for (const { table: tableName, file: fileName } of tableFiles) {
  const filePath = path.join(exportDir, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Warning: ${fileName} not found, skipping ${tableName}`);
    continue;
  }
  
  console.log(`Processing ${tableName}...`);
  
  try {
    const csvContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse CSV with papaparse
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep everything as strings to control conversion
      complete: function(results) {
        if (results.errors.length > 0) {
          console.log(`Warnings in ${fileName}:`, results.errors);
        }
      }
    });
    
    const rows = parseResult.data;
    
    if (rows.length > 0) {
      sqlContent += `-- INSERT statements for ${tableName}\n`;
      
      for (const row of rows) {
        // Filter out empty column names (sometimes CSVs have trailing commas)
        const columns = Object.keys(row).filter(col => col && col.trim());
        const values = columns.map(col => escapeSqlValue(row[col]));
        
        if (columns.length > 0) {
          const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          sqlContent += insertSQL;
          totalInserts++;
        }
      }
      
      sqlContent += '\n';
      console.log(`  - Generated ${rows.length} INSERT statements for ${tableName}`);
    } else {
      console.log(`  - No data found in ${fileName}`);
    }
  } catch (error) {
    errors.push(`Error processing ${fileName}: ${error.message}`);
    console.error(`Error processing ${fileName}:`, error.message);
  }
}

// Add helpful footer
sqlContent += '\n-- End of import file\n';
sqlContent += `-- Total INSERT statements: ${totalInserts}\n`;

// Write the SQL file
fs.writeFileSync(outputFile, sqlContent);

console.log(`\n✅ SQL file generated: ${outputFile}`);
console.log(`📊 Generated ${totalInserts} INSERT statements`);

if (errors.length > 0) {
  console.log('\n⚠️ Errors encountered:');
  errors.forEach(err => console.log(`  - ${err}`));
}

console.log('\n📋 Next Steps:');
console.log('1. Review the generated SQL file: database_exports/production-import.sql');
console.log('2. Open the Database pane in Replit');
console.log('3. Switch to the Production database tab');
console.log('4. Copy and paste the SQL statements from the file');
console.log('5. Execute the SQL to import your data');
console.log('\nNote: The INSERT statements are ordered to respect foreign key constraints.');