import { db } from "../db";
import { promptTemplates, promptGeneratorComponents } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

// Import the actual prompt data from PROMPTGENERATOR
import {
  ARTFORM,
  PHOTO_TYPE,
  FEMALE_BODY_TYPES,
  MALE_BODY_TYPES,
  FEMALE_DEFAULT_TAGS,
  MALE_DEFAULT_TAGS,
  ROLES,
  HAIRSTYLES,
  HAIR_COLORS,
  EYE_COLORS,
  MAKEUP_OPTIONS,
  SKIN_TONES,
  FEMALE_CLOTHING,
  MALE_CLOTHING,
  PLACE,
  LIGHTING,
  COMPOSITION,
  POSE,
  BACKGROUND,
  FEMALE_ADDITIONAL_DETAILS,
  MALE_ADDITIONAL_DETAILS,
  PHOTOGRAPHY_STYLES,
  DEVICE,
  PHOTOGRAPHER,
  ARTIST,
} from "../../client/components/PROMPTGENERATOR/frontend/data/promptData";

// Import detailed options data
import { DETAILED_OPTIONS_CATEGORIES } from "../../client/components/PROMPTGENERATOR/frontend/data/detailedOptionsData";

interface PromptTemplateJSON {
  id: number;
  template_id: string;
  name: string;
  template: string;
  description: string | null;
  category: string;
  is_custom: boolean;
  created_by: string;
  created_at: string;
  template_type: string;
  is_default: boolean;
  user_id: string | null;
  master_prompt: string;
  llm_provider: string;
  llm_model: string;
  format_template: string | null;
  usage_rules: string | null;
  use_happy_talk: boolean;
  compress_prompt: boolean;
  compression_level: number;
  updated_at: string;
  display_order: number;
  enabled: boolean;
  prompt_type: string;
  is_user_custom: boolean;
}

async function importPromptTemplates() {
  console.log("📄 Importing prompt templates...");
  
  try {
    // Read the JSON file
    const jsonPath = path.join(process.cwd(), "attached_assets", "prompt_templates_1757847695536.json");
    const jsonContent = fs.readFileSync(jsonPath, "utf-8");
    const templates: PromptTemplateJSON[] = JSON.parse(jsonContent);
    
    console.log(`Found ${templates.length} templates to import`);
    
    for (const template of templates) {
      // Check if template already exists
      const existing = await db
        .select()
        .from(promptTemplates)
        .where(eq(promptTemplates.templateId, template.template_id))
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`⏭️  Template already exists: ${template.name}`);
        continue;
      }
      
      // Insert the template
      await db.insert(promptTemplates).values({
        templateId: template.template_id,
        name: template.name,
        template: template.master_prompt || template.template || "Default template content", // Use master_prompt as the template content
        description: template.description,
        category: template.category,
        isCustom: template.is_custom,
        createdBy: null, // Set to null since we don't have the user in the database
        templateType: template.template_type as "standard" | "advanced" | "custom",
        isDefault: template.is_default,
        masterPrompt: template.master_prompt,
        llmProvider: template.llm_provider || "openai",
        llmModel: template.llm_model || "gpt-4",
        useHappyTalk: template.use_happy_talk,
        compressPrompt: template.compress_prompt,
        compressionLevel: template.compression_level,
      });
      
      console.log(`✅ Imported template: ${template.name}`);
    }
    
    console.log("✨ Prompt templates import completed");
  } catch (error) {
    console.error("❌ Error importing prompt templates:", error);
    throw error;
  }
}

async function importPromptComponents() {
  console.log("🎨 Importing prompt generator components...");
  
  let orderIndex = 0;
  
  // Helper function to insert components
  async function insertComponent(
    category: string,
    subcategory: string | null,
    value: string,
    label: string,
    usageCount: number = 0,
    examplePrompts: string[] = [],
    isActive: boolean = true
  ) {
    // Check if component already exists
    const existing = await db
      .select()
      .from(promptGeneratorComponents)
      .where(
        and(
          eq(promptGeneratorComponents.category, category),
          eq(promptGeneratorComponents.value, value)
        )
      )
      .limit(1);
    
    if (existing.length === 0) {
      await db.insert(promptGeneratorComponents).values({
        category,
        subcategory,
        value,
        label,
        description: `${label} - ${category}${subcategory ? ` / ${subcategory}` : ""}`,
        examplePrompts,
        usageCount,
        orderIndex: orderIndex++,
        isActive,
      });
    }
  }
  
  // Import Art Form components
  console.log("📷 Importing Art Form components...");
  for (const artform of ARTFORM) {
    await insertComponent("artform", null, artform, artform, 50);
  }
  
  // Import Photo Type components
  console.log("📸 Importing Photo Type components...");
  for (const photoType of PHOTO_TYPE) {
    await insertComponent("photo_type", null, photoType, photoType, 40);
  }
  
  // Import Body Type components
  console.log("👤 Importing Body Type components...");
  for (const bodyType of FEMALE_BODY_TYPES) {
    await insertComponent("body_type", "female", bodyType, `Female ${bodyType}`, 20);
  }
  for (const bodyType of MALE_BODY_TYPES) {
    await insertComponent("body_type", "male", bodyType, `Male ${bodyType}`, 20);
  }
  
  // Import Character Default Tags
  console.log("🏷️ Importing Character Tags...");
  for (const tag of FEMALE_DEFAULT_TAGS) {
    await insertComponent("character_tags", "female", tag, tag, 30);
  }
  for (const tag of MALE_DEFAULT_TAGS) {
    await insertComponent("character_tags", "male", tag, tag, 30);
  }
  
  // Import Roles
  console.log("🎭 Importing Character Roles...");
  for (const role of ROLES) {
    await insertComponent("roles", null, role, role, 25);
  }
  
  // Import Hairstyles
  console.log("💇 Importing Hairstyles...");
  for (const hairstyle of HAIRSTYLES) {
    await insertComponent("hairstyles", null, hairstyle, hairstyle, 35);
  }
  
  // Import Hair Colors
  console.log("🎨 Importing Hair Colors...");
  for (const hairColor of HAIR_COLORS) {
    await insertComponent("hair_colors", null, hairColor, hairColor, 30);
  }
  
  // Import Eye Colors
  console.log("👁️ Importing Eye Colors...");
  for (const eyeColor of EYE_COLORS) {
    await insertComponent("eye_colors", null, eyeColor, eyeColor, 25);
  }
  
  // Import Makeup Options
  console.log("💄 Importing Makeup Options...");
  for (const makeup of MAKEUP_OPTIONS) {
    await insertComponent("makeup", null, makeup, makeup, 20);
  }
  
  // Import Skin Tones
  console.log("🎭 Importing Skin Tones...");
  for (const skinTone of SKIN_TONES) {
    await insertComponent("skin_tones", null, skinTone, skinTone, 15);
  }
  
  // Import Clothing
  console.log("👗 Importing Clothing...");
  for (const clothing of FEMALE_CLOTHING) {
    await insertComponent("clothing", "female", clothing, `Female ${clothing}`, 30);
  }
  for (const clothing of MALE_CLOTHING) {
    await insertComponent("clothing", "male", clothing, `Male ${clothing}`, 30);
  }
  
  // Import Places
  console.log("🌍 Importing Places...");
  for (const place of PLACE) {
    await insertComponent("places", null, place, place, 40);
  }
  
  // Import Lighting
  console.log("💡 Importing Lighting...");
  for (const light of LIGHTING) {
    await insertComponent("lighting", null, light, light, 50);
  }
  
  // Import Composition
  console.log("🎬 Importing Composition...");
  for (const comp of COMPOSITION) {
    await insertComponent("composition", null, comp, comp, 35);
  }
  
  // Import Poses
  console.log("🏃 Importing Poses...");
  for (const pose of POSE) {
    await insertComponent("poses", null, pose, pose, 40);
  }
  
  // Import Backgrounds
  console.log("🖼️ Importing Backgrounds...");
  for (const bg of BACKGROUND) {
    await insertComponent("backgrounds", null, bg, bg, 45);
  }
  
  // Import Additional Details
  console.log("✨ Importing Additional Details...");
  for (const detail of FEMALE_ADDITIONAL_DETAILS) {
    await insertComponent("additional_details", "female", detail, `Female ${detail}`, 15);
  }
  for (const detail of MALE_ADDITIONAL_DETAILS) {
    await insertComponent("additional_details", "male", detail, `Male ${detail}`, 15);
  }
  
  // Import Photography Styles
  console.log("📷 Importing Photography Styles...");
  for (const style of PHOTOGRAPHY_STYLES) {
    await insertComponent("photography_styles", null, style, style, 35);
  }
  
  // Import Devices
  console.log("📱 Importing Camera Devices...");
  for (const device of DEVICE) {
    await insertComponent("devices", null, device, device, 20);
  }
  
  // Import Photographers
  console.log("📸 Importing Photographers...");
  for (const photographer of PHOTOGRAPHER) {
    await insertComponent("photographers", null, photographer, photographer, 25);
  }
  
  // Import Artists
  console.log("🎨 Importing Artists...");
  for (const artist of ARTIST) {
    await insertComponent("artists", null, artist, artist, 30);
  }
  
  // Import Detailed Options Categories
  console.log("🔧 Importing Detailed Options Categories...");
  for (const category of DETAILED_OPTIONS_CATEGORIES) {
    for (const subCategory of category.subCategories) {
      for (const option of subCategory.options) {
        await insertComponent(
          `detailed_${category.name}`,
          subCategory.name,
          option.value,
          option.label,
          10
        );
      }
    }
  }
  
  console.log("✨ Prompt components import completed");
}

async function importAdditionalComponents() {
  console.log("🌟 Importing additional high-value components...");
  
  // Import common prompt modifiers with high usage counts
  const commonModifiers = [
    { category: "quality", value: "masterpiece", label: "Masterpiece", usageCount: 100 },
    { category: "quality", value: "best quality", label: "Best Quality", usageCount: 95 },
    { category: "quality", value: "ultra-detailed", label: "Ultra Detailed", usageCount: 90 },
    { category: "quality", value: "high resolution", label: "High Resolution", usageCount: 85 },
    { category: "quality", value: "8k", label: "8K Resolution", usageCount: 80 },
    { category: "quality", value: "4k", label: "4K Resolution", usageCount: 75 },
    { category: "quality", value: "photorealistic", label: "Photorealistic", usageCount: 90 },
    { category: "quality", value: "hyperrealistic", label: "Hyperrealistic", usageCount: 85 },
    { category: "quality", value: "intricate details", label: "Intricate Details", usageCount: 70 },
    { category: "quality", value: "sharp focus", label: "Sharp Focus", usageCount: 65 },
  ];
  
  const negativePrompts = [
    { category: "negative", value: "low quality", label: "Low Quality", usageCount: 90 },
    { category: "negative", value: "blurry", label: "Blurry", usageCount: 85 },
    { category: "negative", value: "bad anatomy", label: "Bad Anatomy", usageCount: 80 },
    { category: "negative", value: "bad hands", label: "Bad Hands", usageCount: 75 },
    { category: "negative", value: "missing fingers", label: "Missing Fingers", usageCount: 70 },
    { category: "negative", value: "extra fingers", label: "Extra Fingers", usageCount: 70 },
    { category: "negative", value: "ugly", label: "Ugly", usageCount: 65 },
    { category: "negative", value: "duplicate", label: "Duplicate", usageCount: 60 },
    { category: "negative", value: "morbid", label: "Morbid", usageCount: 55 },
    { category: "negative", value: "mutilated", label: "Mutilated", usageCount: 55 },
  ];
  
  const artStyles = [
    { category: "art_style", value: "anime", label: "Anime Style", usageCount: 85 },
    { category: "art_style", value: "manga", label: "Manga Style", usageCount: 80 },
    { category: "art_style", value: "cartoon", label: "Cartoon Style", usageCount: 75 },
    { category: "art_style", value: "realistic", label: "Realistic", usageCount: 90 },
    { category: "art_style", value: "semi-realistic", label: "Semi-Realistic", usageCount: 70 },
    { category: "art_style", value: "digital art", label: "Digital Art", usageCount: 85 },
    { category: "art_style", value: "concept art", label: "Concept Art", usageCount: 75 },
    { category: "art_style", value: "illustration", label: "Illustration", usageCount: 70 },
    { category: "art_style", value: "oil painting", label: "Oil Painting", usageCount: 65 },
    { category: "art_style", value: "watercolor", label: "Watercolor", usageCount: 60 },
  ];
  
  const moods = [
    { category: "mood", value: "dramatic", label: "Dramatic", usageCount: 70 },
    { category: "mood", value: "cinematic", label: "Cinematic", usageCount: 85 },
    { category: "mood", value: "ethereal", label: "Ethereal", usageCount: 60 },
    { category: "mood", value: "mysterious", label: "Mysterious", usageCount: 65 },
    { category: "mood", value: "peaceful", label: "Peaceful", usageCount: 55 },
    { category: "mood", value: "energetic", label: "Energetic", usageCount: 50 },
    { category: "mood", value: "melancholic", label: "Melancholic", usageCount: 45 },
    { category: "mood", value: "romantic", label: "Romantic", usageCount: 60 },
    { category: "mood", value: "dark", label: "Dark", usageCount: 70 },
    { category: "mood", value: "bright", label: "Bright", usageCount: 65 },
  ];
  
  const timeOfDay = [
    { category: "time_of_day", value: "sunrise", label: "Sunrise", usageCount: 60 },
    { category: "time_of_day", value: "morning", label: "Morning", usageCount: 55 },
    { category: "time_of_day", value: "noon", label: "Noon", usageCount: 50 },
    { category: "time_of_day", value: "afternoon", label: "Afternoon", usageCount: 45 },
    { category: "time_of_day", value: "golden hour", label: "Golden Hour", usageCount: 85 },
    { category: "time_of_day", value: "sunset", label: "Sunset", usageCount: 75 },
    { category: "time_of_day", value: "dusk", label: "Dusk", usageCount: 65 },
    { category: "time_of_day", value: "night", label: "Night", usageCount: 70 },
    { category: "time_of_day", value: "midnight", label: "Midnight", usageCount: 60 },
    { category: "time_of_day", value: "blue hour", label: "Blue Hour", usageCount: 80 },
  ];
  
  const weather = [
    { category: "weather", value: "sunny", label: "Sunny", usageCount: 60 },
    { category: "weather", value: "cloudy", label: "Cloudy", usageCount: 55 },
    { category: "weather", value: "rainy", label: "Rainy", usageCount: 65 },
    { category: "weather", value: "stormy", label: "Stormy", usageCount: 70 },
    { category: "weather", value: "snowy", label: "Snowy", usageCount: 60 },
    { category: "weather", value: "foggy", label: "Foggy", usageCount: 75 },
    { category: "weather", value: "misty", label: "Misty", usageCount: 70 },
    { category: "weather", value: "windy", label: "Windy", usageCount: 45 },
    { category: "weather", value: "overcast", label: "Overcast", usageCount: 50 },
    { category: "weather", value: "clear sky", label: "Clear Sky", usageCount: 55 },
  ];
  
  // Insert all additional components
  let orderIndex = 1000; // Start with high order index for these special components
  
  for (const components of [commonModifiers, negativePrompts, artStyles, moods, timeOfDay, weather]) {
    for (const component of components) {
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
          description: `${component.label} - Common prompt modifier`,
          examplePrompts: [],
          usageCount: component.usageCount,
          orderIndex: orderIndex++,
          isActive: true,
        });
        console.log(`✅ Added: ${component.label} (${component.category})`);
      }
    }
  }
  
  console.log("✨ Additional components import completed");
}

async function main() {
  try {
    console.log("🚀 Starting prompt data import...");
    console.log("================================");
    
    // Import prompt templates
    await importPromptTemplates();
    
    console.log("");
    
    // Import prompt components
    await importPromptComponents();
    
    console.log("");
    
    // Import additional high-value components
    await importAdditionalComponents();
    
    console.log("================================");
    console.log("✅ All data imported successfully!");
    
    // Get statistics
    const templateCount = await db.select().from(promptTemplates);
    const componentCount = await db.select().from(promptGeneratorComponents);
    
    console.log(`📊 Statistics:`);
    console.log(`   - Templates imported: ${templateCount.length}`);
    console.log(`   - Components imported: ${componentCount.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

// Run the import
main();