
const fs = require('fs');
const path = require('path');

// Read all CSV files from database_exports directory
const exportDir = path.join(__dirname, '../database_exports');
const outputFile = path.join(exportDir, 'production-import.sql');

console.log('Generating SQL INSERT statements...');

// Table mappings
const tableFiles = {
  'character_presets': 'character_presets.csv',
  'codex_categories': 'codex_categories.csv', 
  'codex_terms': 'codex_terms.csv',
  'prompt_stylerule_templates': 'prompt_stylerule_templates.csv',
  'prompt_styles': 'prompt_styles.csv',
  'categories': 'categories.csv',
  'prompt_types': 'prompt_types.csv',
  'recommended_models': 'recommended_models.csv',
  'intended_generators': 'intended_generators.csv',
  'aesthetics': 'aesthetics.csv',
  'prompt_components': 'prompt_components.csv'
};

let sqlContent = '-- Production Database Import\n-- Generated: ' + new Date().toISOString() + '\n\n';
let totalInserts = 0;

// Function to escape SQL values
function escapeSqlValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'NULL';
  }
  // Escape single quotes and wrap in quotes
  return "'" + String(value).replace(/'/g, "''") + "'";
}

// Function to parse CSV
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      rows.push(row);
    }
  }
  
  return rows;
}

// Process each table
for (const [tableName, fileName] of Object.entries(tableFiles)) {
  const filePath = path.join(exportDir, fileName);
  
  if (fs.existsSync(filePath)) {
    console.log(`Processing ${tableName}...`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const rows = parseCSV(content);
    
    if (rows.length > 0) {
      sqlContent += `-- ${tableName} data\n`;
      
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = columns.map(col => escapeSqlValue(row[col]));
        
        const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        sqlContent += insertSQL;
        totalInserts++;
      }
      
      sqlContent += '\n';
    }
  } else {
    console.log(`Warning: ${fileName} not found, skipping ${tableName}`);
  }
}

// Write the SQL file
fs.writeFileSync(outputFile, sqlContent);

console.log(`\nSQL file generated: ${outputFile}`);
console.log(`Generated ${totalInserts} INSERT statements`);
