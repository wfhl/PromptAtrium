import { Router } from 'express';
import { db } from '../db';
import { 
  promptStyleRuleTemplates, 
  characterPresets as characterPresetsTable 
} from '@shared/schema';
import { eq, desc, and, isNotNull } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/system-data/character-presets
 * Get all character presets for Quick Prompt
 */
router.get('/character-presets', async (req, res) => {
  try {
    // First check if the table exists and has data
    const presets = await db
      .select()
      .from(characterPresetsTable)
      .where(isNotNull(characterPresetsTable.name))
      .orderBy(desc(characterPresetsTable.is_favorite), characterPresetsTable.name);

    // If no presets exist, return default ones
    if (presets.length === 0) {
      const defaultPresets = [
        {
          id: 1,
          name: "Elena, Warrior Princess",
          gender: "Female",
          role: "Warrior",
          description: "A fierce warrior princess with flowing red hair, emerald eyes, and ornate armor",
          is_favorite: true,
          user_id: null
        },
        {
          id: 2,
          name: "Marcus, Knight Commander",
          gender: "Male",
          role: "Knight",
          description: "A noble knight commander in gleaming silver armor with a scarred face and determined expression",
          is_favorite: true,
          user_id: null
        },
        {
          id: 3,
          name: "Zara, Mystic Scholar",
          gender: "Female",
          role: "Mage",
          description: "An elegant mystic scholar with dark skin, white hair, and glowing tattoos",
          is_favorite: false,
          user_id: null
        },
        {
          id: 4,
          name: "Kai, Street Samurai",
          gender: "Non-binary",
          role: "Cyberpunk",
          description: "A cyberpunk street samurai with neon implants, leather jacket, and katana",
          is_favorite: false,
          user_id: null
        },
        {
          id: 5,
          name: "Luna, Forest Guardian",
          gender: "Female",
          role: "Nature Spirit",
          description: "An ethereal forest guardian with antlers, flowing green robes, and nature magic",
          is_favorite: false,
          user_id: null
        }
      ];

      return res.json(defaultPresets);
    }

    res.json(presets);
  } catch (error: any) {
    console.error('Error fetching character presets:', error);
    
    // Return default presets on error
    const fallbackPresets = [
      {
        id: 1,
        name: "Default Character",
        gender: "Any",
        role: "Protagonist",
        description: "A main character for your story",
        is_favorite: false,
        user_id: null
      }
    ];
    
    res.json(fallbackPresets);
  }
});

/**
 * GET /api/system-data/prompt-templates
 * Get all prompt enhancement templates
 */
router.get('/prompt-templates', async (req, res) => {
  try {
    // Fetch templates from database
    const templates = await db
      .select()
      .from(promptStyleRuleTemplates)
      .orderBy(promptStyleRuleTemplates.name);

    // If no templates exist, return defaults
    if (templates.length === 0) {
      const defaultTemplates = [
        {
          id: "1",
          template_id: "photo_master_v1",
          name: "Photography Master",
          description: "Professional photography style with technical camera details",
          template_type: "photography",
          master_prompt: `You are a master photographer. Transform the given prompt into a highly detailed photography prompt.
Include: camera type, lens, aperture, ISO, lighting setup, composition rules, and post-processing style.
Focus on photorealistic quality and professional photography techniques.`,
          llm_provider: "openai",
          llm_model: "gpt-4o",
          use_happy_talk: false,
          compress_prompt: false,
          compression_level: "medium"
        },
        {
          id: "2",
          template_id: "cinematic_v1",
          name: "Cinematic Style",
          description: "Movie-like dramatic scenes with cinematic language",
          template_type: "cinematic",
          master_prompt: `You are a cinematographer. Transform the prompt into a cinematic scene description.
Include: camera angles, shot types, lighting mood, color grading, aspect ratio, and film references.
Create drama and visual storytelling.`,
          llm_provider: "openai",
          llm_model: "gpt-4o",
          use_happy_talk: false,
          compress_prompt: false,
          compression_level: "medium"
        },
        {
          id: "3",
          template_id: "artistic_v1",
          name: "Artistic Expression",
          description: "Fine art and creative interpretation",
          template_type: "artistic",
          master_prompt: `You are an artist. Transform the prompt into an artistic vision.
Include: art style, medium, technique, color palette, mood, and artistic influences.
Focus on creativity and emotional expression.`,
          llm_provider: "openai",
          llm_model: "gpt-4o",
          use_happy_talk: true,
          compress_prompt: false,
          compression_level: "light"
        },
        {
          id: "4",
          template_id: "minimal_v1",
          name: "Minimalist",
          description: "Clean, simple, focused prompts",
          template_type: "minimal",
          master_prompt: `Create a concise, focused prompt. Remove unnecessary details while keeping the core essence.
Focus on the most important visual elements. Be precise and clear.`,
          llm_provider: "openai",
          llm_model: "gpt-4o-mini",
          use_happy_talk: false,
          compress_prompt: true,
          compression_level: "heavy"
        },
        {
          id: "5",
          template_id: "fantasy_v1",
          name: "Fantasy Epic",
          description: "Epic fantasy and magical scenes",
          template_type: "fantasy",
          master_prompt: `You are a fantasy world builder. Transform the prompt into an epic fantasy scene.
Include: magical elements, fantasy creatures, epic scale, mystical atmosphere, and otherworldly details.
Create wonder and imagination.`,
          llm_provider: "openai",
          llm_model: "gpt-4o",
          use_happy_talk: true,
          compress_prompt: false,
          compression_level: "light"
        }
      ];

      return res.json(defaultTemplates);
    }

    // Map database templates to expected format
    const formattedTemplates = templates.map(t => ({
      id: t.id,
      template_id: t.template_id,
      name: t.name,
      description: t.description || t.template,
      template_type: t.template_type || 'custom',
      master_prompt: t.master_prompt || t.template,
      llm_provider: t.llm_provider || 'openai',
      llm_model: t.llm_model || 'gpt-4o',
      use_happy_talk: t.use_happy_talk || false,
      compress_prompt: t.compress_prompt || false,
      compression_level: t.compression_level || 'medium'
    }));

    res.json(formattedTemplates);
  } catch (error: any) {
    console.error('Error fetching prompt templates:', error);
    
    // Return minimal fallback template
    const fallbackTemplates = [
      {
        id: "fallback",
        template_id: "basic",
        name: "Basic Enhancement",
        description: "Simple prompt enhancement",
        template_type: "basic",
        master_prompt: "Enhance this prompt with more detail and clarity.",
        llm_provider: "openai",
        llm_model: "gpt-4o",
        use_happy_talk: false,
        compress_prompt: false,
        compression_level: "medium"
      }
    ];
    
    res.json(fallbackTemplates);
  }
});

/**
 * POST /api/system-data/character-presets
 * Create a new character preset
 */
router.post('/character-presets', async (req, res) => {
  try {
    const { name, gender, role, description, is_favorite } = req.body;
    const userId = (req as any).user?.id || null;

    if (!name) {
      return res.status(400).json({
        error: 'Character name is required',
        success: false
      });
    }

    const newPreset = await db
      .insert(characterPresetsTable)
      .values({
        name,
        gender: gender || 'Any',
        role: role || 'Character',
        description: description || '',
        is_favorite: is_favorite || false,
        user_id: userId
      })
      .returning();

    res.json({
      success: true,
      preset: newPreset[0]
    });
  } catch (error: any) {
    console.error('Error creating character preset:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create character preset'
    });
  }
});

/**
 * DELETE /api/system-data/character-presets/:id
 * Delete a character preset
 */
router.delete('/character-presets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || null;

    // Only allow deletion of user's own presets
    if (userId) {
      await db
        .delete(characterPresetsTable)
        .where(
          and(
            eq(characterPresetsTable.id, parseInt(id)),
            eq(characterPresetsTable.user_id, userId)
          )
        );
    } else {
      return res.status(403).json({
        error: 'Authentication required',
        success: false
      });
    }

    res.json({
      success: true,
      message: 'Character preset deleted'
    });
  } catch (error: any) {
    console.error('Error deleting character preset:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete character preset'
    });
  }
});

/**
 * GET /api/system-data/json-prompt-helper
 * Get JSON prompt helper data for random prompts
 */
router.get('/json-prompt-helper', async (req, res) => {
  try {
    // Return categorized prompt suggestions
    const promptData = {
      nature_scenes: [
        "misty forest with ancient trees and golden sunlight",
        "dramatic mountain peaks at sunset with clouds",
        "serene lake reflecting autumn colors",
        "wild ocean waves crashing against cliffs",
        "desert dunes under starry night sky"
      ],
      urban_landscapes: [
        "cyberpunk city street with neon lights",
        "abandoned industrial complex at dawn",
        "bustling market square in old European town",
        "modern skyline reflected in glass buildings",
        "rain-soaked alleyway with atmospheric lighting"
      ],
      fantasy_scenes: [
        "floating islands with waterfalls in the sky",
        "ancient magical library with glowing books",
        "dragon's lair filled with treasure",
        "enchanted forest with bioluminescent plants",
        "crystal cave with rainbow light reflections"
      ],
      portraits: [
        "wise elder with weathered features telling stories",
        "young adventurer ready for journey",
        "mysterious figure in shadows",
        "royal portrait with elaborate costume",
        "candid street portrait with natural light"
      ],
      abstract_concepts: [
        "visualization of time and space",
        "emotions transformed into colors",
        "sound waves becoming visible art",
        "dreams merging with reality",
        "consciousness expanding into cosmos"
      ],
      sci_fi_themes: [
        "space station orbiting alien planet",
        "robot discovering human emotions",
        "time portal opening in laboratory",
        "alien marketplace on distant world",
        "terraforming project on Mars"
      ]
    };

    res.json(promptData);
  } catch (error: any) {
    console.error('Error fetching prompt helper data:', error);
    res.json({
      nature_scenes: ["landscape with mountains"],
      portraits: ["person portrait"]
    });
  }
});

export default router;