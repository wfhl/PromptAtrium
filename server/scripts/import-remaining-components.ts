import { db } from "../db";
import { promptGeneratorComponents } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Import detailed options data
import { DETAILED_OPTIONS_CATEGORIES } from "../../client/components/PROMPTGENERATOR/frontend/data/detailedOptionsData";

async function importRemainingComponents() {
  console.log("🔧 Importing remaining detailed options components...");
  
  let orderIndex = 2000; // Start with high order index
  let totalImported = 0;
  let totalSkipped = 0;
  
  // Process categories in batches
  for (const category of DETAILED_OPTIONS_CATEGORIES) {
    console.log(`\n📦 Processing category: ${category.label}`);
    
    for (const subCategory of category.subCategories) {
      const componentsToInsert = [];
      
      // Check existing components and prepare batch insert
      for (const option of subCategory.options) {
        const existing = await db
          .select()
          .from(promptGeneratorComponents)
          .where(
            and(
              eq(promptGeneratorComponents.category, `detailed_${category.name}`),
              eq(promptGeneratorComponents.value, option.value)
            )
          )
          .limit(1);
        
        if (existing.length === 0) {
          componentsToInsert.push({
            category: `detailed_${category.name}`,
            subcategory: subCategory.name,
            value: option.value,
            label: option.label,
            description: `${option.label} - ${category.label} / ${subCategory.label}`,
            examplePrompts: [],
            usageCount: Math.floor(Math.random() * 30) + 10, // Random usage count between 10-40
            orderIndex: orderIndex++,
            isActive: true,
          });
        } else {
          totalSkipped++;
        }
      }
      
      // Batch insert
      if (componentsToInsert.length > 0) {
        await db.insert(promptGeneratorComponents).values(componentsToInsert);
        totalImported += componentsToInsert.length;
        console.log(`  ✅ ${subCategory.label}: ${componentsToInsert.length} components imported`);
      } else {
        console.log(`  ⏭️  ${subCategory.label}: All components already exist`);
      }
    }
  }
  
  console.log("\n✨ Detailed options import completed");
  console.log(`📊 Total imported: ${totalImported}`);
  console.log(`📊 Total skipped (already existed): ${totalSkipped}`);
}

async function importAdditionalHighValueComponents() {
  console.log("\n🌟 Importing additional high-value components...");
  
  const highValueComponents = [
    // Quality modifiers
    { category: "quality", value: "masterpiece", label: "Masterpiece", usageCount: 100 },
    { category: "quality", value: "best quality", label: "Best Quality", usageCount: 95 },
    { category: "quality", value: "ultra-detailed", label: "Ultra Detailed", usageCount: 90 },
    { category: "quality", value: "high resolution", label: "High Resolution", usageCount: 85 },
    { category: "quality", value: "8k", label: "8K Resolution", usageCount: 80 },
    { category: "quality", value: "4k", label: "4K Resolution", usageCount: 75 },
    { category: "quality", value: "photorealistic", label: "Photorealistic", usageCount: 90 },
    { category: "quality", value: "hyperrealistic", label: "Hyperrealistic", usageCount: 85 },
    
    // Negative prompts
    { category: "negative", value: "low quality", label: "Low Quality", usageCount: 90 },
    { category: "negative", value: "blurry", label: "Blurry", usageCount: 85 },
    { category: "negative", value: "bad anatomy", label: "Bad Anatomy", usageCount: 80 },
    { category: "negative", value: "bad hands", label: "Bad Hands", usageCount: 75 },
    { category: "negative", value: "missing fingers", label: "Missing Fingers", usageCount: 70 },
    { category: "negative", value: "extra fingers", label: "Extra Fingers", usageCount: 70 },
    
    // Art styles
    { category: "art_style", value: "anime", label: "Anime Style", usageCount: 85 },
    { category: "art_style", value: "manga", label: "Manga Style", usageCount: 80 },
    { category: "art_style", value: "digital art", label: "Digital Art", usageCount: 85 },
    { category: "art_style", value: "concept art", label: "Concept Art", usageCount: 75 },
    
    // Moods
    { category: "mood", value: "dramatic", label: "Dramatic", usageCount: 70 },
    { category: "mood", value: "cinematic", label: "Cinematic", usageCount: 85 },
    { category: "mood", value: "ethereal", label: "Ethereal", usageCount: 60 },
    { category: "mood", value: "mysterious", label: "Mysterious", usageCount: 65 },
    
    // Time of day
    { category: "time_of_day", value: "golden hour", label: "Golden Hour", usageCount: 85 },
    { category: "time_of_day", value: "blue hour", label: "Blue Hour", usageCount: 80 },
    { category: "time_of_day", value: "sunset", label: "Sunset", usageCount: 75 },
    { category: "time_of_day", value: "sunrise", label: "Sunrise", usageCount: 60 },
    
    // Weather
    { category: "weather", value: "foggy", label: "Foggy", usageCount: 75 },
    { category: "weather", value: "misty", label: "Misty", usageCount: 70 },
    { category: "weather", value: "rainy", label: "Rainy", usageCount: 65 },
    { category: "weather", value: "stormy", label: "Stormy", usageCount: 70 },
    
    // Camera angles
    { category: "camera_angle", value: "low angle", label: "Low Angle", usageCount: 60 },
    { category: "camera_angle", value: "high angle", label: "High Angle", usageCount: 60 },
    { category: "camera_angle", value: "dutch angle", label: "Dutch Angle", usageCount: 55 },
    { category: "camera_angle", value: "bird's eye view", label: "Bird's Eye View", usageCount: 65 },
    { category: "camera_angle", value: "worm's eye view", label: "Worm's Eye View", usageCount: 50 },
    
    // Color schemes
    { category: "color_scheme", value: "vibrant colors", label: "Vibrant Colors", usageCount: 80 },
    { category: "color_scheme", value: "pastel colors", label: "Pastel Colors", usageCount: 70 },
    { category: "color_scheme", value: "monochrome", label: "Monochrome", usageCount: 65 },
    { category: "color_scheme", value: "warm tones", label: "Warm Tones", usageCount: 75 },
    { category: "color_scheme", value: "cool tones", label: "Cool Tones", usageCount: 70 },
    
    // Rendering styles
    { category: "rendering", value: "ray tracing", label: "Ray Tracing", usageCount: 70 },
    { category: "rendering", value: "octane render", label: "Octane Render", usageCount: 75 },
    { category: "rendering", value: "unreal engine", label: "Unreal Engine", usageCount: 80 },
    { category: "rendering", value: "cycles render", label: "Cycles Render", usageCount: 65 },
    { category: "rendering", value: "volumetric lighting", label: "Volumetric Lighting", usageCount: 85 },
  ];
  
  let orderIndex = 5000;
  let imported = 0;
  let skipped = 0;
  
  for (const component of highValueComponents) {
    const existing = await db
      .select()
      .from(promptGeneratorComponents)
      .where(
        and(
          eq(promptGeneratorComponents.category, component.category),
          eq(promptGeneratorComponents.value, component.value)
        )
      )
      .limit(1);
    
    if (existing.length === 0) {
      await db.insert(promptGeneratorComponents).values({
        category: component.category,
        subcategory: null,
        value: component.value,
        label: component.label,
        description: `${component.label} - High-value prompt component`,
        examplePrompts: [],
        usageCount: component.usageCount,
        orderIndex: orderIndex++,
        isActive: true,
      });
      imported++;
    } else {
      skipped++;
    }
  }
  
  console.log(`✅ High-value components imported: ${imported}`);
  console.log(`⏭️  High-value components skipped: ${skipped}`);
}

async function main() {
  try {
    console.log("🚀 Starting remaining components import...");
    console.log("================================");
    
    // Import remaining detailed options
    await importRemainingComponents();
    
    // Import additional high-value components
    await importAdditionalHighValueComponents();
    
    console.log("================================");
    console.log("✅ All remaining components imported successfully!");
    
    // Get final statistics
    const components = await db.select().from(promptGeneratorComponents);
    const categories = [...new Set(components.map(c => c.category))];
    
    console.log(`\n📊 Final Statistics:`);
    console.log(`   - Total components: ${components.length}`);
    console.log(`   - Total categories: ${categories.length}`);
    console.log(`   - Categories:`, categories.slice(0, 15).join(", "), "...");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

// Run the import
main();