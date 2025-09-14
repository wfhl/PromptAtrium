export interface ElitePromptOptions {
  subject?: string;
  additionalDetails?: string;
  gender?: string;
  characterType?: string;
  roles?: string;
  bodyTypes?: string;
  hairstyles?: string;
  hairColor?: string;
  eyeColor?: string;
  makeup?: string;
  skinTone?: string;
  clothing?: string;
  accessories?: string;
  expression?: string;
  pose?: string;
  place?: string;
  lighting?: string;
  background?: string;
  composition?: string;
  mood?: string;
  artform?: string;
  photoType?: string;
  photographyStyles?: string;
  photographer?: string;
  device?: string;
  artStyle?: string;
  artist?: string;
  digitalArtform?: string;
  loraDescription?: string;
  negativePrompt?: string;
  [key: string]: any;
}

export interface GeneratedPrompt {
  prompt: string;
  original?: string;
  negativePrompt: string;
  timestamp: string;
  settings: Record<string, any>;
}

export interface SavedPreset {
  id: number;
  name: string;
  data: ElitePromptOptions;
  created_at?: string;
  updated_at?: string;
  is_favorite?: boolean;
  is_default?: boolean;
}

export interface CharacterPreset extends SavedPreset {
  character_data: {
    gender?: string;
    characterType?: string;
    roles?: string;
    bodyTypes?: string;
    hairstyles?: string;
    hairColor?: string;
    eyeColor?: string;
    makeup?: string;
    skinTone?: string;
    clothing?: string;
    accessories?: string;
    expression?: string;
    pose?: string;
  };
}

class ElitePromptGenerator {
  generatePrompt(options: ElitePromptOptions): GeneratedPrompt {
    const parts: string[] = [];
    
    // Add main subject
    if (options.subject) {
      parts.push(options.subject);
    }
    
    // Add character details
    const characterParts: string[] = [];
    if (options.gender) characterParts.push(options.gender);
    if (options.characterType) characterParts.push(options.characterType);
    if (options.roles) characterParts.push(options.roles);
    if (options.bodyTypes) characterParts.push(options.bodyTypes);
    
    // Appearance
    if (options.hairstyles) characterParts.push(options.hairstyles + " hair");
    if (options.hairColor) characterParts.push(options.hairColor + " hair color");
    if (options.eyeColor) characterParts.push(options.eyeColor + " eyes");
    if (options.makeup) characterParts.push(options.makeup + " makeup");
    if (options.skinTone) characterParts.push(options.skinTone + " skin");
    if (options.clothing) characterParts.push("wearing " + options.clothing);
    if (options.accessories) characterParts.push("with " + options.accessories);
    if (options.expression) characterParts.push(options.expression + " expression");
    if (options.pose) characterParts.push(options.pose + " pose");
    
    if (characterParts.length > 0) {
      parts.push(characterParts.join(", "));
    }
    
    // Add scene details
    const sceneParts: string[] = [];
    if (options.place) sceneParts.push("at " + options.place);
    if (options.lighting) sceneParts.push(options.lighting);
    if (options.background) sceneParts.push(options.background + " background");
    if (options.composition) sceneParts.push(options.composition);
    if (options.mood) sceneParts.push(options.mood + " mood");
    
    if (sceneParts.length > 0) {
      parts.push(sceneParts.join(", "));
    }
    
    // Add style details
    const styleParts: string[] = [];
    if (options.artform) styleParts.push(options.artform);
    if (options.photoType) styleParts.push(options.photoType);
    if (options.photographyStyles) styleParts.push(options.photographyStyles);
    if (options.photographer) styleParts.push("by " + options.photographer);
    if (options.device) styleParts.push("shot with " + options.device);
    if (options.artStyle) styleParts.push(options.artStyle + " style");
    if (options.artist) styleParts.push("by " + options.artist);
    if (options.digitalArtform) styleParts.push(options.digitalArtform);
    
    if (styleParts.length > 0) {
      parts.push(styleParts.join(", "));
    }
    
    // Add LoRA description
    if (options.loraDescription) {
      parts.push(options.loraDescription);
    }
    
    // Add additional details
    if (options.additionalDetails) {
      parts.push(options.additionalDetails);
    }
    
    const prompt = parts.join(", ");
    
    return {
      prompt: prompt || "a beautiful image",
      original: prompt || "a beautiful image",
      negativePrompt: options.negativePrompt || "ugly, blurry, low quality, distorted",
      timestamp: new Date().toISOString(),
      settings: options
    };
  }
}

const elitePromptGenerator = new ElitePromptGenerator();
export default elitePromptGenerator;