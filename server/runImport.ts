#!/usr/bin/env tsx
import { importAllData, clearExistingData } from './importDataToDatabase';

(async () => {
  try {
    console.log('🔧 Running data import script...\n');
    
    // Optional: Clear existing data first
    // Uncomment the next line if you want to clear existing data before importing
    // await clearExistingData();
    
    // Run the import
    await importAllData();
    
    console.log('\n✨ Import script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Import script failed:', error);
    process.exit(1);
  }
})();