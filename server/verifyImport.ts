import { db } from './db';
import { promptComponents, aesthetics } from '@shared/schema';
import { sql } from 'drizzle-orm';

(async () => {
  try {
    // Count prompt components
    const componentCount = await db.select({ count: sql`count(*)` }).from(promptComponents);
    console.log('📝 Prompt Components in database:', componentCount[0].count);
    
    // Sample some prompt components
    const sampleComponents = await db.select().from(promptComponents).limit(5);
    console.log('\n📋 Sample Prompt Components:');
    sampleComponents.forEach(c => {
      console.log(`  - [${c.category}] ${c.value}${c.description ? ': ' + c.description : ''}`);
    });
    
    // Count aesthetics
    const aestheticsCount = await db.select({ count: sql`count(*)` }).from(aesthetics);
    console.log('\n🎨 Aesthetics in database:', aestheticsCount[0].count);
    
    // Sample some aesthetics
    const sampleAesthetics = await db.select().from(aesthetics).limit(5);
    console.log('\n🎭 Sample Aesthetics:');
    sampleAesthetics.forEach(a => {
      console.log(`  - ${a.name}: ${a.description?.substring(0, 100)}...`);
    });
    
    // Get category distribution for prompt components
    const categories = await db.select({ 
      category: promptComponents.category,
      count: sql`count(*)`
    }).from(promptComponents).groupBy(promptComponents.category);
    
    console.log('\n📊 Prompt Component Categories:');
    categories.forEach(c => {
      console.log(`  - ${c.category}: ${c.count} items`);
    });
    
    console.log('\n✅ Data verification complete!');
  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    process.exit(0);
  }
})();