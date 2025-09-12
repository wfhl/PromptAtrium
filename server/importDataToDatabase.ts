import { readFileSync } from 'fs';
import * as path from 'path';
import { db } from './db';
import { promptComponents, aesthetics } from '@shared/schema';
import { sql } from 'drizzle-orm';

// Configuration
const BATCH_SIZE = 500; // Process 500 records at a time
const PROGRESS_INTERVAL = 100; // Show progress every 100 records

// Statistics tracking
interface ImportStats {
  totalRead: number;
  totalProcessed: number;
  totalInserted: number;
  totalErrors: number;
  errors: Array<{ record: any; error: string }>;
  startTime: Date;
  endTime?: Date;
}

// Helper function to parse date strings
function parseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
}

// Helper function to parse boolean strings
function parseBoolean(value: string | boolean | undefined | null): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
}

// Helper function to parse integer safely
function parseInteger(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

// Helper function to clean and validate text
function cleanText(text: any): string | null {
  if (!text || text === '') return null;
  return String(text).trim();
}

// Process prompt components data
async function importPromptComponents() {
  console.log('\n=== Starting Prompt Components Import ===');
  
  const stats: ImportStats = {
    totalRead: 0,
    totalProcessed: 0,
    totalInserted: 0,
    totalErrors: 0,
    errors: [],
    startTime: new Date()
  };
  
  try {
    // Read the JSON file
    const filePath = path.join(process.cwd(), 'prompt_components_data.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!data.prompt_components || !Array.isArray(data.prompt_components)) {
      throw new Error('Invalid data structure: prompt_components array not found');
    }
    
    const components = data.prompt_components;
    stats.totalRead = components.length;
    
    console.log(`📚 Found ${stats.totalRead} prompt components to import`);
    console.log(`📦 Processing in batches of ${BATCH_SIZE}...`);
    
    // Process in batches
    for (let i = 0; i < components.length; i += BATCH_SIZE) {
      const batch = components.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(components.length / BATCH_SIZE);
      
      console.log(`\n🔄 Processing batch ${batchNumber}/${totalBatches} (records ${i + 1}-${Math.min(i + BATCH_SIZE, components.length)})`);
      
      const preparedRecords = [];
      
      for (const record of batch) {
        try {
          // Prepare the record for insertion
          const preparedRecord = {
            originalId: parseInteger(record.id),
            category: cleanText(record.category) || 'uncategorized',
            value: cleanText(record.value) || '',
            description: cleanText(record.description),
            subcategory: cleanText(record.subcategory),
            usageCount: parseInteger(record.usage_count) || 0,
            orderIndex: parseInteger(record.order) || 0,
            isDefault: parseBoolean(record.is_default),
            createdAt: parseDate(record.created_at),
            updatedAt: parseDate(record.updated_at),
            importedAt: new Date()
          };
          
          // Validate required fields
          if (!preparedRecord.value) {
            throw new Error('Missing required field: value');
          }
          
          preparedRecords.push(preparedRecord);
          stats.totalProcessed++;
          
          // Show progress
          if (stats.totalProcessed % PROGRESS_INTERVAL === 0) {
            const percentage = ((stats.totalProcessed / stats.totalRead) * 100).toFixed(1);
            console.log(`  ⏳ Progress: ${stats.totalProcessed}/${stats.totalRead} (${percentage}%)`);
          }
        } catch (error) {
          stats.totalErrors++;
          stats.errors.push({
            record: { id: record.id, category: record.category, value: record.value },
            error: error instanceof Error ? error.message : String(error)
          });
          
          if (stats.errors.length <= 5) {
            console.error(`  ⚠️ Error processing record ${record.id}:`, error);
          }
        }
      }
      
      // Insert the batch
      if (preparedRecords.length > 0) {
        try {
          await db.insert(promptComponents).values(preparedRecords);
          stats.totalInserted += preparedRecords.length;
          console.log(`  ✅ Inserted ${preparedRecords.length} records`);
        } catch (error) {
          console.error(`  ❌ Failed to insert batch:`, error);
          
          // Try inserting records one by one as fallback
          console.log(`  🔄 Attempting individual insertions for failed batch...`);
          for (const record of preparedRecords) {
            try {
              await db.insert(promptComponents).values(record);
              stats.totalInserted++;
            } catch (individualError) {
              stats.totalErrors++;
              stats.errors.push({
                record: { originalId: record.originalId, category: record.category, value: record.value },
                error: individualError instanceof Error ? individualError.message : String(individualError)
              });
            }
          }
        }
      }
    }
    
    stats.endTime = new Date();
    
    // Show final statistics
    const duration = ((stats.endTime.getTime() - stats.startTime.getTime()) / 1000).toFixed(2);
    console.log('\n📊 Prompt Components Import Summary:');
    console.log(`  ✅ Successfully inserted: ${stats.totalInserted}/${stats.totalRead} records`);
    console.log(`  ⚠️ Errors encountered: ${stats.totalErrors}`);
    console.log(`  ⏱️ Time taken: ${duration} seconds`);
    
    if (stats.errors.length > 0) {
      console.log(`\n❌ First ${Math.min(5, stats.errors.length)} errors:`);
      stats.errors.slice(0, 5).forEach(err => {
        console.log(`  - Record ${JSON.stringify(err.record)}: ${err.error}`);
      });
    }
    
    return stats;
  } catch (error) {
    console.error('❌ Fatal error during prompt components import:', error);
    stats.endTime = new Date();
    return stats;
  }
}

// Process aesthetics data
async function importAesthetics() {
  console.log('\n=== Starting Aesthetics Import ===');
  
  const stats: ImportStats = {
    totalRead: 0,
    totalProcessed: 0,
    totalInserted: 0,
    totalErrors: 0,
    errors: [],
    startTime: new Date()
  };
  
  try {
    // Read the JSON file
    const filePath = path.join(process.cwd(), 'aesthetics_database_data.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!data.Sheet1 || !Array.isArray(data.Sheet1)) {
      throw new Error('Invalid data structure: Sheet1 array not found');
    }
    
    const aestheticsData = data.Sheet1;
    stats.totalRead = aestheticsData.length;
    
    console.log(`📚 Found ${stats.totalRead} aesthetics to import`);
    console.log(`📦 Processing in batches of ${BATCH_SIZE}...`);
    
    // Process in batches
    for (let i = 0; i < aestheticsData.length; i += BATCH_SIZE) {
      const batch = aestheticsData.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(aestheticsData.length / BATCH_SIZE);
      
      console.log(`\n🔄 Processing batch ${batchNumber}/${totalBatches} (records ${i + 1}-${Math.min(i + BATCH_SIZE, aestheticsData.length)})`);
      
      const preparedRecords = [];
      
      for (const record of batch) {
        try {
          // Prepare the record for insertion
          const preparedRecord = {
            originalId: parseInteger(record.id),
            name: cleanText(record.name) || 'Unnamed',
            description: cleanText(record.description),
            era: cleanText(record.era),
            categories: cleanText(record.categories),
            tags: cleanText(record.tags),
            visualElements: cleanText(record.visual_elements),
            colorPalette: cleanText(record.color_palette),
            moodKeywords: cleanText(record.mood_keywords),
            relatedAesthetics: cleanText(record.related_aesthetics),
            mediaExamples: cleanText(record.media_examples),
            referenceImages: cleanText(record['reference example images']),
            origin: cleanText(record.origin),
            category: cleanText(record.category),
            usageCount: 0,
            popularity: "0.00",
            importedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Validate required fields
          if (!preparedRecord.name) {
            throw new Error('Missing required field: name');
          }
          
          preparedRecords.push(preparedRecord);
          stats.totalProcessed++;
          
          // Show progress
          if (stats.totalProcessed % PROGRESS_INTERVAL === 0) {
            const percentage = ((stats.totalProcessed / stats.totalRead) * 100).toFixed(1);
            console.log(`  ⏳ Progress: ${stats.totalProcessed}/${stats.totalRead} (${percentage}%)`);
          }
        } catch (error) {
          stats.totalErrors++;
          stats.errors.push({
            record: { id: record.id, name: record.name },
            error: error instanceof Error ? error.message : String(error)
          });
          
          if (stats.errors.length <= 5) {
            console.error(`  ⚠️ Error processing record ${record.id}:`, error);
          }
        }
      }
      
      // Insert the batch
      if (preparedRecords.length > 0) {
        try {
          await db.insert(aesthetics).values(preparedRecords);
          stats.totalInserted += preparedRecords.length;
          console.log(`  ✅ Inserted ${preparedRecords.length} records`);
        } catch (error) {
          console.error(`  ❌ Failed to insert batch:`, error);
          
          // Try inserting records one by one as fallback
          console.log(`  🔄 Attempting individual insertions for failed batch...`);
          for (const record of preparedRecords) {
            try {
              // Skip records with duplicate names
              const existingRecord = await db.select().from(aesthetics).where(sql`name = ${record.name}`).limit(1);
              if (existingRecord.length === 0) {
                await db.insert(aesthetics).values(record);
                stats.totalInserted++;
              } else {
                console.log(`  ⏭️ Skipping duplicate: ${record.name}`);
              }
            } catch (individualError) {
              stats.totalErrors++;
              stats.errors.push({
                record: { originalId: record.originalId, name: record.name },
                error: individualError instanceof Error ? individualError.message : String(individualError)
              });
            }
          }
        }
      }
    }
    
    stats.endTime = new Date();
    
    // Show final statistics
    const duration = ((stats.endTime.getTime() - stats.startTime.getTime()) / 1000).toFixed(2);
    console.log('\n📊 Aesthetics Import Summary:');
    console.log(`  ✅ Successfully inserted: ${stats.totalInserted}/${stats.totalRead} records`);
    console.log(`  ⚠️ Errors encountered: ${stats.totalErrors}`);
    console.log(`  ⏱️ Time taken: ${duration} seconds`);
    
    if (stats.errors.length > 0) {
      console.log(`\n❌ First ${Math.min(5, stats.errors.length)} errors:`);
      stats.errors.slice(0, 5).forEach(err => {
        console.log(`  - Record ${JSON.stringify(err.record)}: ${err.error}`);
      });
    }
    
    return stats;
  } catch (error) {
    console.error('❌ Fatal error during aesthetics import:', error);
    stats.endTime = new Date();
    return stats;
  }
}

// Main import function
export async function importAllData() {
  console.log('🚀 Starting comprehensive data import...');
  console.log('=' .repeat(50));
  
  const overallStartTime = new Date();
  const results = {
    promptComponents: null as ImportStats | null,
    aesthetics: null as ImportStats | null
  };
  
  try {
    // Import prompt components
    results.promptComponents = await importPromptComponents();
    
    // Import aesthetics
    results.aesthetics = await importAesthetics();
    
    // Show overall summary
    const overallEndTime = new Date();
    const totalDuration = ((overallEndTime.getTime() - overallStartTime.getTime()) / 1000).toFixed(2);
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 IMPORT COMPLETE!');
    console.log('=' .repeat(50));
    
    console.log('\n📊 Overall Import Summary:');
    
    if (results.promptComponents) {
      console.log('\n📝 Prompt Components:');
      console.log(`  - Total Records: ${results.promptComponents.totalRead}`);
      console.log(`  - Successfully Imported: ${results.promptComponents.totalInserted}`);
      console.log(`  - Errors: ${results.promptComponents.totalErrors}`);
    }
    
    if (results.aesthetics) {
      console.log('\n🎨 Aesthetics:');
      console.log(`  - Total Records: ${results.aesthetics.totalRead}`);
      console.log(`  - Successfully Imported: ${results.aesthetics.totalInserted}`);
      console.log(`  - Errors: ${results.aesthetics.totalErrors}`);
    }
    
    console.log(`\n⏱️ Total time taken: ${totalDuration} seconds`);
    
    // Calculate success rate
    const totalRecords = (results.promptComponents?.totalRead || 0) + (results.aesthetics?.totalRead || 0);
    const totalImported = (results.promptComponents?.totalInserted || 0) + (results.aesthetics?.totalInserted || 0);
    const successRate = totalRecords > 0 ? ((totalImported / totalRecords) * 100).toFixed(2) : '0';
    
    console.log(`📈 Overall success rate: ${successRate}%`);
    console.log(`✅ Successfully imported ${totalImported} out of ${totalRecords} total records`);
    
    return results;
  } catch (error) {
    console.error('\n❌ Critical error during import process:', error);
    throw error;
  }
}

// Function to clear existing data (use with caution!)
export async function clearExistingData() {
  console.log('\n⚠️ WARNING: Clearing existing data...');
  
  try {
    // Clear prompt components
    const deletedComponents = await db.delete(promptComponents);
    console.log('✅ Cleared prompt_components table');
    
    // Clear aesthetics
    const deletedAesthetics = await db.delete(aesthetics);
    console.log('✅ Cleared aesthetics table');
    
    console.log('✅ All existing data cleared');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

