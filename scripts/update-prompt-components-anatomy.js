import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Papa from 'papaparse';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// File paths
const inputFile = path.join(__dirname, '../attached_assets/Prompt Components 092025 - prompt_components_1760307975997.csv');
const outputFile = path.join(__dirname, '../database_exports/update_prompt_anatomy_groups.sql');

console.log('Generating SQL UPDATE statements for prompt_components anatomy_group and category fields...');

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
function escapeSqlValue(value) {
  if (value === null || value === undefined || value === '' || value === 'NULL') {
    return 'NULL';
  }
  
  // Escape single quotes and wrap in quotes
  return "'" + String(value).replace(/'/g, "''") + "'";
}

// Read and parse CSV
const csvData = fs.readFileSync(inputFile, 'utf8');

Papa.parse(csvData, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    const data = results.data;
    console.log(`Parsed ${data.length} rows from CSV`);
    
    // Start SQL file with transaction and initial comment
    let sql = `-- Update anatomy_group and category fields for prompt_components
-- Generated on: ${new Date().toISOString()}
-- Total records to update: ${data.length}

BEGIN;

`;

    // Group updates by anatomy_group and category for efficiency
    const updateGroups = {};
    
    data.forEach((row) => {
      const anatomyGroup = row.anatomy_group?.trim() || null;
      const category = row.category?.trim() || null;
      const id = row.id;
      
      if (id && (anatomyGroup || category)) {
        const key = `${anatomyGroup || 'NULL'}_${category || 'NULL'}`;
        if (!updateGroups[key]) {
          updateGroups[key] = {
            anatomyGroup,
            category,
            ids: []
          };
        }
        updateGroups[key].ids.push(id);
      }
    });
    
    // Generate batch UPDATE statements
    Object.values(updateGroups).forEach(group => {
      const setClause = [];
      
      if (group.anatomyGroup) {
        setClause.push(`anatomy_group = ${escapeSqlValue(group.anatomyGroup)}`);
      }
      if (group.category) {
        setClause.push(`category = ${escapeSqlValue(group.category)}`);
      }
      
      if (setClause.length > 0) {
        // Split into batches of 100 IDs for better performance
        const batchSize = 100;
        for (let i = 0; i < group.ids.length; i += batchSize) {
          const batch = group.ids.slice(i, i + batchSize);
          const idList = batch.map(id => escapeSqlValue(id)).join(', ');
          
          sql += `UPDATE prompt_components
SET ${setClause.join(', ')}
WHERE id IN (${idList});

`;
        }
      }
    });
    
    // Also update any NULL anatomy_groups based on the category mappings from the CSV
    sql += `-- Update remaining NULL anatomy_groups based on category patterns
UPDATE prompt_components 
SET anatomy_group = 'Action & Movement'
WHERE anatomy_group IS NULL 
  AND category = 'Action';

UPDATE prompt_components 
SET anatomy_group = 'Style & Medium'
WHERE anatomy_group IS NULL 
  AND category IN ('Art Style', 'Style', 'Medium', 'Art Movement');

UPDATE prompt_components 
SET anatomy_group = 'Environment & Setting'
WHERE anatomy_group IS NULL 
  AND category IN ('Environment', 'Setting', 'Location', 'Scene', 'Background', 'Landscape', 'Weather', 'Time');

UPDATE prompt_components 
SET anatomy_group = 'Subject'
WHERE anatomy_group IS NULL 
  AND category IN ('Characters', 'Character', 'Creatures', 'Creature', 'Animals', 'Animal', 'People', 'Person', 'Objects', 'Object');

UPDATE prompt_components 
SET anatomy_group = 'Lighting'
WHERE anatomy_group IS NULL 
  AND category IN ('Lighting', 'Light', 'Illumination');

UPDATE prompt_components 
SET anatomy_group = 'Camera & Composition'
WHERE anatomy_group IS NULL 
  AND category IN ('Camera', 'Angle', 'Shot', 'Composition', 'Perspective', 'Framing');

UPDATE prompt_components 
SET anatomy_group = 'Color & Mood'
WHERE anatomy_group IS NULL 
  AND category IN ('Color', 'Colors', 'Colour', 'Colours', 'Mood', 'Emotion', 'Atmosphere', 'Tone');

UPDATE prompt_components 
SET anatomy_group = 'Details & Textures'
WHERE anatomy_group IS NULL 
  AND category IN ('Details', 'Detail', 'Texture', 'Textures', 'Material', 'Materials', 'Quality');

UPDATE prompt_components 
SET anatomy_group = 'Special Effects'
WHERE anatomy_group IS NULL 
  AND category IN ('Effects', 'Effect', 'Special', 'FX', 'VFX', 'Magic', 'Particle');

`;

    sql += `COMMIT;

-- Verification query to check the updates
-- SELECT anatomy_group, category, COUNT(*) as count 
-- FROM prompt_components 
-- GROUP BY anatomy_group, category 
-- ORDER BY anatomy_group, category;`;

    // Write SQL to file
    fs.writeFileSync(outputFile, sql);
    console.log(`✓ SQL file generated: ${outputFile}`);
    console.log(`✓ Created update statements for ${Object.keys(updateGroups).length} unique anatomy_group/category combinations`);
    console.log('\nNext steps:');
    console.log('1. Review the generated SQL file');
    console.log('2. Run in development database: npm run db:execute database_exports/update_prompt_anatomy_groups.sql');
    console.log('3. For production: Execute the SQL file through the Database pane');
  },
  error: (error) => {
    console.error('Error parsing CSV:', error);
    process.exit(1);
  }
});