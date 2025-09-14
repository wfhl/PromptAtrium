/**
 * Prompt component data arrays
 * This module provides component data that should be fetched from the database
 * For now, includes default values to ensure the generator works immediately
 */

import type { 
  PromptDataArrays, 
  QualityPreset, 
  RuleTemplate, 
  CharacterPreset,
  AspectRatio 
} from './types';

/**
 * Fetch component data from the database
 * This function should be called on initialization to populate the arrays
 * @returns Promise<PromptDataArrays>
 */
export async function fetchPromptData(): Promise<PromptDataArrays> {
  try {
    // TODO: Replace with actual API call to fetch from database
    const response = await fetch('/api/prompt-components');
    if (response.ok) {
      const data = await response.json();
      return processComponentData(data);
    }
  } catch (error) {
    console.warn('Failed to fetch prompt data from database, using defaults:', error);
  }
  
  // Return default data if fetch fails
  return getDefaultPromptData();
}

/**
 * Process raw component data from database into organized arrays
 */
function processComponentData(data: any): PromptDataArrays {
  // TODO: Implement actual data processing based on database structure
  // For now, return defaults
  return getDefaultPromptData();
}

/**
 * Get default prompt data arrays
 * These serve as fallback values and initial data
 */
export function getDefaultPromptData(): PromptDataArrays {
  return {
    // Art and style
    ARTFORM: [
      "Photography", "Digital Art", "3D Render", "Illustration", "Painting",
      "Concept Art", "Sketch", "Watercolor", "Oil Painting", "Pencil Drawing",
      "Vector Art", "Pixel Art", "Mixed Media", "Collage", "Abstract Art"
    ],
    
    PHOTO_TYPE: [
      "Portrait", "Landscape", "Fashion", "Street Photography", "Wildlife",
      "Macro", "Aerial", "Documentary", "Fine Art", "Commercial",
      "Editorial", "Product", "Architectural", "Sports", "Event"
    ],
    
    DIGITAL_ARTFORM: [
      "Digital Painting", "3D Modeling", "Photomanipulation", "Matte Painting",
      "Vector Illustration", "Digital Collage", "CGI", "VFX Art", "Motion Graphics",
      "Procedural Art", "Fractal Art", "Generative Art", "Voxel Art"
    ],
    
    PHOTOGRAPHY_STYLES: [
      "Cinematic", "Dramatic", "Moody", "Vibrant", "Minimalist",
      "High Key", "Low Key", "Black and White", "Film Noir", "Vintage",
      "Documentary", "Fashion Editorial", "Fine Art", "Street Style"
    ],
    
    // Character - Female specific
    FEMALE_BODY_TYPES: [
      "slender", "athletic", "curvy", "petite", "tall",
      "elegant", "graceful", "fit", "slim", "hourglass"
    ],
    
    FEMALE_DEFAULT_TAGS: [
      "beautiful woman", "young woman", "elegant lady", "female model",
      "girl", "feminine figure", "graceful woman", "sophisticated woman"
    ],
    
    FEMALE_CLOTHING: [
      "elegant dress", "casual outfit", "business suit", "evening gown",
      "summer dress", "jeans and t-shirt", "cocktail dress", "sportswear",
      "bohemian outfit", "vintage clothing", "modern fashion", "streetwear"
    ],
    
    FEMALE_ADDITIONAL_DETAILS: [
      "confident expression", "natural beauty", "elegant pose", "graceful movement",
      "radiant smile", "thoughtful gaze", "powerful stance", "serene expression"
    ],
    
    // Character - Male specific
    MALE_BODY_TYPES: [
      "athletic", "muscular", "lean", "tall", "broad-shouldered",
      "fit", "strong", "slim", "sturdy", "well-built"
    ],
    
    MALE_DEFAULT_TAGS: [
      "handsome man", "young man", "gentleman", "male model",
      "guy", "masculine figure", "strong man", "distinguished man"
    ],
    
    MALE_CLOTHING: [
      "business suit", "casual wear", "formal attire", "leather jacket",
      "jeans and shirt", "sportswear", "military uniform", "streetwear",
      "vintage suit", "modern fashion", "rugged outfit", "smart casual"
    ],
    
    MALE_ADDITIONAL_DETAILS: [
      "confident stance", "determined expression", "strong presence", "thoughtful look",
      "charismatic smile", "intense gaze", "relaxed posture", "powerful pose"
    ],
    
    // Character - Neutral/Universal
    NEUTRAL_BODY_TYPES: [
      "average build", "medium height", "proportionate", "balanced physique",
      "natural form", "healthy appearance", "well-proportioned"
    ],
    
    NEUTRAL_DEFAULT_TAGS: [
      "person", "figure", "individual", "character", "human",
      "subject", "model", "protagonist"
    ],
    
    NEUTRAL_CLOTHING: [
      "casual attire", "comfortable clothing", "everyday wear", "practical outfit",
      "modern clothing", "simple outfit", "versatile wardrobe"
    ],
    
    NEUTRAL_ADDITIONAL_DETAILS: [
      "natural expression", "relaxed demeanor", "authentic presence",
      "genuine emotion", "thoughtful mood", "calm composure"
    ],
    
    // Character - Universal attributes
    ROLES: [
      "model", "artist", "warrior", "scholar", "explorer",
      "scientist", "musician", "dancer", "athlete", "professional",
      "adventurer", "royal", "mystic", "engineer", "chef"
    ],
    
    HAIRSTYLES: [
      "long flowing hair", "short pixie cut", "wavy hair", "straight hair",
      "curly hair", "braided hair", "ponytail", "bob cut", "shoulder-length",
      "messy hair", "elegant updo", "side-swept", "layered cut"
    ],
    
    HAIR_COLORS: [
      "blonde", "brunette", "black", "red", "auburn",
      "silver", "platinum", "chestnut", "honey blonde", "dark brown",
      "ash blonde", "copper", "strawberry blonde", "white", "grey"
    ],
    
    EYE_COLORS: [
      "blue", "green", "brown", "hazel", "grey",
      "amber", "violet", "dark brown", "light blue", "emerald green",
      "golden brown", "steel grey", "deep blue", "bright green"
    ],
    
    MAKEUP_OPTIONS: [
      "natural makeup", "glamorous makeup", "subtle makeup", "bold lipstick",
      "smokey eyes", "winged eyeliner", "nude lips", "dramatic makeup",
      "fresh-faced", "evening makeup", "minimal makeup", "artistic makeup"
    ],
    
    SKIN_TONES: [
      "fair", "light", "medium", "olive", "tan",
      "dark", "pale", "warm-toned", "cool-toned", "golden",
      "porcelain", "bronze", "ebony", "caramel"
    ],
    
    EXPRESSIONS: [
      "smiling", "serious", "thoughtful", "confident", "mysterious",
      "joyful", "contemplative", "determined", "serene", "playful",
      "intense", "relaxed", "focused", "dreamy", "powerful"
    ],
    
    ACCESSORIES: [
      "sunglasses", "hat", "scarf", "watch", "bag",
      "belt", "gloves", "headband", "bandana", "tie",
      "bow tie", "pocket square", "cufflinks"
    ],
    
    JEWELRY: [
      "necklace", "earrings", "bracelet", "ring", "pendant",
      "choker", "anklet", "brooch", "chain", "studs",
      "hoop earrings", "statement jewelry", "delicate jewelry"
    ],
    
    // Scene and environment
    PLACE: [
      "studio", "outdoors", "urban street", "forest", "beach",
      "mountains", "desert", "city skyline", "cafe", "library",
      "garden", "rooftop", "industrial area", "ancient ruins", "modern office",
      "art gallery", "nightclub", "restaurant", "park", "bridge"
    ],
    
    LIGHTING: [
      "natural light", "golden hour", "soft lighting", "dramatic lighting",
      "studio lighting", "neon lights", "candlelight", "moonlight", "backlit",
      "rim lighting", "volumetric lighting", "chiaroscuro", "ambient lighting",
      "harsh shadows", "diffused light", "colored lighting", "spotlight"
    ],
    
    COMPOSITION: [
      "centered", "rule of thirds", "dynamic angle", "close-up", "wide shot",
      "symmetrical", "asymmetrical", "diagonal", "leading lines", "framing",
      "depth of field", "foreground interest", "negative space", "golden ratio",
      "bird's eye view", "low angle", "dutch angle", "over-the-shoulder"
    ],
    
    POSE: [
      "standing", "sitting", "walking", "running", "jumping",
      "dancing", "leaning", "lying down", "kneeling", "reaching",
      "looking away", "looking at camera", "profile view", "three-quarter view",
      "action pose", "relaxed pose", "dynamic pose", "elegant pose"
    ],
    
    BACKGROUND: [
      "blurred background", "bokeh", "gradient", "abstract", "minimalist",
      "detailed scenery", "cityscape", "nature scene", "geometric patterns",
      "textured wall", "solid color", "atmospheric", "busy street", "empty space"
    ],
    
    MOOD: [
      "mysterious", "romantic", "energetic", "peaceful", "dramatic",
      "melancholic", "joyful", "intense", "serene", "playful",
      "dark", "bright", "ethereal", "nostalgic", "futuristic"
    ],
    
    ATMOSPHERE: [
      "foggy", "misty", "clear", "hazy", "smoky",
      "dusty", "rainy", "sunny", "cloudy", "stormy",
      "magical", "ethereal", "gritty", "dreamy", "cinematic"
    ],
    
    // Artists and devices
    DEVICE: [
      "Canon EOS R5", "Nikon Z9", "Sony A7R IV", "Fujifilm X-T4",
      "Hasselblad X1D", "Leica M11", "Phase One XF", "RED Camera",
      "ARRI Alexa", "Blackmagic", "iPhone 15 Pro", "Google Pixel",
      "35mm film", "Medium format", "Large format"
    ],
    
    PHOTOGRAPHER: [
      "Annie Leibovitz", "Steve McCurry", "Ansel Adams", "Henri Cartier-Bresson",
      "Richard Avedon", "Diane Arbus", "Robert Capa", "Dorothea Lange",
      "Sebastião Salgado", "Martin Parr", "Cindy Sherman", "Gregory Crewdson"
    ],
    
    ARTIST: [
      "Greg Rutkowski", "Artgerm", "Alphonse Mucha", "James Jean",
      "Yoshitaka Amano", "H.R. Giger", "Moebius", "Simon Stålenhag",
      "Kilian Eng", "Peter Mohrbacher", "Ross Tran", "Ilya Kuvshinov",
      "Makoto Shinkai", "Studio Ghibli", "Banksy"
    ],
    
    // Detailed category options
    ARCHITECTURE_OPTIONS: [
      "modern architecture", "classical architecture", "brutalist", "art deco",
      "gothic", "baroque", "minimalist", "futuristic", "organic architecture",
      "industrial", "victorian", "contemporary", "sustainable design"
    ],
    
    ART_OPTIONS: [
      "impressionism", "surrealism", "abstract expressionism", "pop art",
      "art nouveau", "cubism", "renaissance", "baroque art", "romanticism",
      "realism", "minimalism", "contemporary art", "street art"
    ],
    
    BRANDS_OPTIONS: [
      "Gucci", "Prada", "Chanel", "Louis Vuitton", "Versace",
      "Balenciaga", "Dior", "Hermès", "Burberry", "Valentino",
      "Saint Laurent", "Givenchy", "Armani", "Dolce & Gabbana"
    ],
    
    CINEMATIC_OPTIONS: [
      "cinematic shot", "movie still", "film grain", "anamorphic lens",
      "letterbox", "color grading", "depth of field", "lens flare",
      "motion blur", "rack focus", "establishing shot", "close-up shot"
    ],
    
    FASHION_OPTIONS: [
      "haute couture", "streetwear", "vintage fashion", "minimalist fashion",
      "avant-garde", "bohemian", "gothic fashion", "preppy", "grunge",
      "athleisure", "formal wear", "casual chic", "punk fashion"
    ],
    
    FEELINGS_OPTIONS: [
      "happy", "sad", "angry", "fearful", "surprised",
      "disgusted", "contemptuous", "excited", "calm", "anxious",
      "hopeful", "nostalgic", "melancholic", "euphoric", "pensive"
    ],
    
    FOODS_OPTIONS: [
      "gourmet cuisine", "street food", "desserts", "fresh fruits",
      "vegetables", "seafood", "meat dishes", "pasta", "sushi",
      "bakery items", "beverages", "exotic foods", "comfort food"
    ],
    
    GEOGRAPHY_OPTIONS: [
      "mountains", "valleys", "rivers", "oceans", "deserts",
      "forests", "tundra", "savanna", "rainforest", "archipelago",
      "peninsula", "glacier", "canyon", "plateau", "coastline"
    ],
    
    HUMAN_OPTIONS: [
      "portrait", "full body", "profile", "hands", "eyes",
      "facial features", "expressions", "gestures", "movement", "interaction",
      "crowd", "couple", "family", "individual", "group"
    ],
    
    INTERACTION_OPTIONS: [
      "conversation", "embrace", "handshake", "dancing together", "playing",
      "working together", "teaching", "learning", "competing", "collaborating",
      "celebrating", "supporting", "confronting", "sharing"
    ],
    
    KEYWORDS_OPTIONS: [
      "trending", "viral", "epic", "masterpiece", "award-winning",
      "professional", "high quality", "detailed", "intricate", "stunning",
      "beautiful", "elegant", "sophisticated", "innovative", "creative"
    ],
    
    OBJECTS_OPTIONS: [
      "furniture", "vehicles", "technology", "books", "instruments",
      "tools", "weapons", "jewelry", "artifacts", "sculptures",
      "paintings", "plants", "flowers", "crystals", "machines"
    ],
    
    PEOPLE_OPTIONS: [
      "children", "teenagers", "adults", "elderly", "families",
      "couples", "friends", "strangers", "professionals", "artists",
      "athletes", "scientists", "musicians", "dancers", "workers"
    ],
    
    PLOTS_OPTIONS: [
      "adventure", "romance", "mystery", "thriller", "fantasy",
      "science fiction", "drama", "comedy", "horror", "action",
      "historical", "dystopian", "utopian", "coming of age", "quest"
    ],
    
    SCENE_OPTIONS: [
      "busy marketplace", "quiet library", "bustling city", "serene nature",
      "chaotic battlefield", "peaceful garden", "crowded concert", "empty road",
      "cozy home", "grand palace", "mysterious forest", "underwater world"
    ],
    
    SCIENCE_OPTIONS: [
      "biology", "physics", "chemistry", "astronomy", "geology",
      "technology", "robotics", "artificial intelligence", "quantum mechanics",
      "genetics", "neuroscience", "ecology", "meteorology", "engineering"
    ],
    
    STUFF_OPTIONS: [
      "textures", "patterns", "materials", "surfaces", "fabrics",
      "metals", "glass", "wood", "stone", "plastic",
      "leather", "paper", "liquid", "smoke", "particles"
    ],
    
    TIME_OPTIONS: [
      "dawn", "morning", "noon", "afternoon", "dusk",
      "evening", "night", "midnight", "golden hour", "blue hour",
      "spring", "summer", "autumn", "winter", "future", "past"
    ],
    
    TYPOGRAPHY_OPTIONS: [
      "serif", "sans-serif", "script", "display", "handwritten",
      "vintage", "modern", "minimalist", "decorative", "graffiti",
      "calligraphy", "digital", "neon", "3D text", "watercolor lettering"
    ],
    
    VEHICLE_OPTIONS: [
      "car", "motorcycle", "bicycle", "truck", "bus",
      "train", "airplane", "helicopter", "boat", "ship",
      "spaceship", "submarine", "hot air balloon", "skateboard", "scooter"
    ],
    
    VIDEOGAME_OPTIONS: [
      "RPG style", "FPS style", "platformer", "strategy game", "puzzle game",
      "fighting game", "racing game", "simulation", "adventure game", "MMO style",
      "retro arcade", "indie game", "AAA game", "mobile game", "VR game"
    ],
    
    // Quality presets
    QUALITY_PRESETS: [
      {
        id: "high_quality",
        name: "High Quality",
        description: "General high quality tags",
        tags: ["masterpiece", "best quality", "high resolution", "highly detailed"],
        negativePromptAdditions: ["low quality", "worst quality", "blurry", "pixelated"],
        weight: 1.2,
        isDefault: true
      },
      {
        id: "ultra_detailed",
        name: "Ultra Detailed",
        description: "Maximum detail and clarity",
        tags: ["ultra detailed", "8k", "intricate details", "sharp focus", "extreme detail"],
        negativePromptAdditions: ["simple", "minimalist", "low detail"],
        weight: 1.3
      },
      {
        id: "photorealistic",
        name: "Photorealistic",
        description: "Realistic photography style",
        tags: ["photorealistic", "hyperrealistic", "professional photography", "raw photo"],
        negativePromptAdditions: ["cartoon", "anime", "illustration", "painting"],
        weight: 1.1
      },
      {
        id: "artistic",
        name: "Artistic",
        description: "Artistic and painterly style",
        tags: ["artistic", "painterly", "expressive", "creative composition"],
        negativePromptAdditions: ["photographic", "realistic", "documentary"],
        weight: 1.0
      }
    ],
    
    // Negative prompt presets
    NEGATIVE_PROMPT_PRESETS: [
      "worst quality, low quality, normal quality",
      "blurry, pixelated, grainy, jpeg artifacts",
      "bad anatomy, bad proportions, deformed, mutated",
      "extra limbs, missing limbs, floating limbs, disconnected limbs",
      "text, watermark, signature, username, artist name",
      "ugly, duplicate, morbid, mutilated, poorly drawn",
      "bad hands, bad fingers, fused fingers, too many fingers"
    ],
    
    // Rule templates
    PROMPT_TEMPLATES: [
      {
        id: "standard",
        name: "Standard",
        description: "Standard prompt format with comma separation",
        template: "{prompt}",
        rules: "Separate elements with commas, most important first",
        formatTemplate: "{subject}, {style}, {mood}, {lighting}, {quality}",
        isActive: true
      },
      {
        id: "pipeline",
        name: "Pipeline",
        description: "Structured pipeline format with sections",
        template: "[{pose} | {setting}] | [{character} | {attributes}] | [{quality}] | [{clothing}] | [{camera}]",
        rules: "Organize in pipeline sections separated by |",
        formatTemplate: "[Action/Pose | Setting] | [Character | Attributes] | [Quality] | [Details] | [Technical]",
        isActive: true
      },
      {
        id: "narrative",
        name: "Narrative",
        description: "Story-like narrative format",
        template: "In {setting}, {character} {action}, {mood} atmosphere with {lighting}",
        rules: "Create a flowing narrative description",
        formatTemplate: "In [setting], [character] [action], creating [mood] with [details]",
        isActive: true
      },
      {
        id: "wildcard",
        name: "Wildcard",
        description: "Creative format with unexpected elements",
        template: "{prompt}, {random_element}, {creative_twist}",
        rules: "Add surprising and creative elements",
        formatTemplate: "{base_prompt}, unexpected: {wildcard}, style fusion: {mix}",
        isActive: true
      }
    ],
    
    // Character presets
    CHARACTER_PRESETS: [
      {
        id: "elegant_woman",
        name: "Elegant Woman",
        description: "Sophisticated female character",
        gender: "female",
        bodyType: "slender",
        defaultTag: "elegant lady",
        role: "model",
        hairstyle: "elegant updo",
        hairColor: "dark brown",
        eyeColor: "green",
        skinTone: "fair",
        clothing: "evening gown",
        additionalDetails: "graceful pose",
        favorite: false,
        createdAt: Date.now()
      },
      {
        id: "rugged_man",
        name: "Rugged Man",
        description: "Strong masculine character",
        gender: "male",
        bodyType: "muscular",
        defaultTag: "strong man",
        role: "adventurer",
        hairstyle: "short messy hair",
        hairColor: "dark",
        eyeColor: "brown",
        skinTone: "tan",
        clothing: "leather jacket",
        additionalDetails: "confident stance",
        favorite: false,
        createdAt: Date.now()
      },
      {
        id: "neutral_figure",
        name: "Neutral Figure",
        description: "Versatile neutral character",
        gender: "neutral",
        bodyType: "average build",
        defaultTag: "person",
        role: "individual",
        hairstyle: "medium length hair",
        clothing: "casual attire",
        additionalDetails: "natural expression",
        favorite: false,
        createdAt: Date.now()
      }
    ],
    
    // Aspect ratios
    ASPECT_RATIOS: [
      { label: "1:1 Square", value: "1:1", width: 1024, height: 1024, isDefault: true },
      { label: "4:3 Standard", value: "4:3", width: 1365, height: 1024 },
      { label: "3:4 Portrait", value: "3:4", width: 768, height: 1024 },
      { label: "16:9 Widescreen", value: "16:9", width: 1820, height: 1024 },
      { label: "9:16 Mobile", value: "9:16", width: 576, height: 1024 },
      { label: "2:3 Photo", value: "2:3", width: 683, height: 1024 },
      { label: "3:2 Landscape", value: "3:2", width: 1536, height: 1024 },
      { label: "21:9 Ultrawide", value: "21:9", width: 2390, height: 1024 }
    ]
  };
}

/**
 * Cache for prompt data to avoid repeated fetches
 */
let cachedPromptData: PromptDataArrays | null = null;

/**
 * Get cached prompt data or fetch if not available
 */
export async function getCachedPromptData(): Promise<PromptDataArrays> {
  if (!cachedPromptData) {
    cachedPromptData = await fetchPromptData();
  }
  return cachedPromptData;
}

/**
 * Clear the cached prompt data
 */
export function clearPromptDataCache(): void {
  cachedPromptData = null;
}

/**
 * Update cached prompt data
 */
export function updatePromptDataCache(data: PromptDataArrays): void {
  cachedPromptData = data;
}