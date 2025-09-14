import { useState, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// ============= HARDCODED DATA =============
const SYNTAX_GUIDES = [
  {
    id: 1,
    title: "Weight Control - Emphasizing Elements",
    content: `**Weight control allows you to emphasize or de-emphasize specific elements in your prompt.**

### Basic Syntax
- \`(element:1.5)\` - Increases emphasis by 50%
- \`(element:0.5)\` - Decreases emphasis by 50%
- \`(element:1.2)\` - Slight increase by 20%
- \`[element]\` - Alternative de-emphasis syntax

### Examples
\`\`\`
(beautiful eyes:1.3), detailed portrait
(dark background:0.7), bright subject
((very important:1.5)) - Double parentheses also work
\`\`\`

### Best Practices
- Keep weights between 0.5 and 1.5 for best results
- Use sparingly - too many weights can confuse the model
- Higher weights don't always mean better results
- Test different weight values to find the sweet spot

*Source: Stable Diffusion Documentation*`,
    category: "syntax",
    order: 1
  },
  {
    id: 2,
    title: "Mixing Concepts - Blending Elements",
    content: `**Create unique images by blending multiple concepts together using special syntax.**

### AND Syntax
- \`concept1 AND concept2\` - Equal blend of two concepts
- \`concept1:0.7 AND concept2:0.3\` - Weighted blend

### Examples
\`\`\`
cat AND robot - Creates a robotic cat
forest:0.6 AND ocean:0.4 - Forest with ocean elements
warrior AND angel AND demon - Three-way concept mix
\`\`\`

### Advanced Mixing
\`\`\`
[cat|dog|bird] - Alternates between concepts
[cat:dog:0.5] - Transitions from cat to dog at step 0.5
{2$$cat|dog} - 2 cats and 1 dog composition
\`\`\`

### Tips
- Balance is key - equal weights often work best initially
- Some concepts blend better than others
- Use with style mixing for unique results
- Experiment with transition timing

*Source: ComfyUI and A1111 Documentation*`,
    category: "syntax",
    order: 2
  },
  {
    id: 3,
    title: "Attention Brackets - Fine Control",
    content: `**Use brackets and parentheses for precise attention control in your prompts.**

### Bracket Types
- \`(text)\` - Increases attention by 1.1x
- \`((text))\` - Increases attention by 1.21x (1.1 * 1.1)
- \`[text]\` - Decreases attention by 0.9x
- \`[[text]]\` - Decreases attention by 0.81x

### Nesting Examples
\`\`\`
(masterpiece, (best quality:1.2))
[background, [crowd:0.8]]
((extremely detailed eyes:1.3))
\`\`\`

### Advanced Usage
\`\`\`
\\(literal parentheses\\) - Escape with backslash
{alternate|syntax|options} - Some UIs use curly braces
<lora:name:0.8> - LoRA syntax uses angle brackets
\`\`\`

### Platform Differences
- **Automatic1111**: Full bracket support
- **ComfyUI**: May require specific nodes
- **InvokeAI**: Different syntax variations
- **Midjourney**: Limited bracket support

*Source: Various UI Documentation*`,
    category: "syntax",
    order: 3
  },
  {
    id: 4,
    title: "Step Control - Prompt Scheduling",
    content: `**Control when elements appear or disappear during the generation process.**

### Basic Scheduling
- \`[prompt:0.5]\` - Starts at 50% of steps
- \`[prompt::0.5]\` - Stops at 50% of steps
- \`[from:to:0.5]\` - Switches from one to another

### Examples
\`\`\`
[forest:0.3] - Forest appears after 30% completion
[crowded::0.7] - Crowd disappears at 70%
[day:night:0.5] - Transitions from day to night
[cat:dog:0.3] - Cat for 30%, then dog
\`\`\`

### Advanced Scheduling
\`\`\`
[prompt:10] - Starts at step 10 (absolute)
[prompt::25] - Stops at step 25 (absolute)
[[prompt]::0.5] - Combines with de-emphasis
\`\`\`

### Use Cases
- Add details progressively
- Remove unwanted elements mid-generation
- Create transformations or morphing effects
- Fine-tune composition development

*Source: Stable Diffusion WebUI Documentation*`,
    category: "syntax",
    order: 4
  },
  {
    id: 5,
    title: "Quality Tags - Enhancement Keywords",
    content: `**Essential quality tags that significantly improve image generation results.**

### Universal Quality Tags
\`\`\`
masterpiece, best quality, high resolution,
extremely detailed, professional, award winning,
trending on artstation, 8k uhd, ultra detailed
\`\`\`

### Style-Specific Quality
**Photography:**
\`\`\`
RAW photo, high quality photo, detailed photo,
professional photograph, DSLR quality, sharp focus
\`\`\`

**Digital Art:**
\`\`\`
digital painting, concept art, illustration,
highly detailed digital art, professional artwork
\`\`\`

**Anime/Manga:**
\`\`\`
official art, original, extremely detailed wallpaper,
anime key visual, anime coloring, anime screencap
\`\`\`

### Platform Preferences
- **Midjourney**: "highly detailed, 4k, 8k, intricate"
- **DALL-E**: "high quality, detailed, professional"
- **Stable Diffusion**: "masterpiece, best quality"

### Negative Quality Tags
\`\`\`
low quality, worst quality, jpeg artifacts,
blurry, pixelated, amateur, poorly drawn
\`\`\`

*Source: Community Best Practices*`,
    category: "syntax",
    order: 5
  },
  {
    id: 6,
    title: "Negative Prompts - What to Avoid",
    content: `**Negative prompts tell the AI what NOT to include in your image.**

### Basic Negative Prompts
\`\`\`
ugly, deformed, noisy, blurry, distorted,
grainy, low quality, worst quality, jpeg artifacts
\`\`\`

### Anatomy Fixes
\`\`\`
extra fingers, fewer fingers, extra limbs,
malformed hands, fused fingers, long neck,
bad anatomy, bad proportions, mutated hands
\`\`\`

### Style Control
\`\`\`
cartoon, 3d, illustration, anime, painted,
photoshop, video game, cgi, render, fake
\`\`\`

### Advanced Negatives
**For Realism:**
\`\`\`
illustration, painting, drawing, art, sketch,
anime, cartoon, graphic, text, watermark
\`\`\`

**For Art:**
\`\`\`
photo, realistic, realism, 35mm film, dslr,
cropped, frame, text, signature, watermark
\`\`\`

### Model-Specific
- **Realistic models**: Focus on anatomy and artifact prevention
- **Anime models**: Prevent realistic features
- **Artistic models**: Avoid photographic elements

*Source: Model Documentation and Community Guides*`,
    category: "syntax",
    order: 6
  },
  {
    id: 7,
    title: "SDXL Special Syntax",
    content: `**SDXL models have unique features and syntax requirements.**

### SDXL Resolution
- Recommended: 1024x1024 base resolution
- Aspect ratios: 1:1, 9:16, 16:9, 2:3, 3:2
- Higher resolutions possible with proper settings

### SDXL Prompt Structure
\`\`\`
Main prompt: Subject, composition, style
Secondary prompt: Overall style, mood, quality

Example:
Prompt: woman in red dress, garden, sunset
Style prompt: cinematic, professional photography
\`\`\`

### SDXL Refiner
\`\`\`
Base model: 0-80% of steps
Refiner model: 80-100% of steps
Switch at: 0.8 strength typically
\`\`\`

### SDXL Specific Tags
\`\`\`
score_9, score_8_up, score_7_up, // Quality scores
source_anime, source_cartoon, // Source material
rating_safe, rating_questionable, // Content rating
\`\`\`

### Tips for SDXL
- Use natural language more than tags
- Describe scenes rather than listing elements
- Quality tags less necessary than SD 1.5
- Negative prompts can be simpler

*Source: SDXL Documentation and Papers*`,
    category: "syntax",
    order: 7
  },
  {
    id: 8,
    title: "Model Trigger Words",
    content: `**Many models and LoRAs require specific trigger words to activate their training.**

### Understanding Triggers
- Required words that activate model features
- Usually found in model documentation
- Case-sensitive in some models
- Position in prompt can matter

### Common Trigger Examples
\`\`\`
// Style LoRAs
"in the style of [artist]"
"artwork by [name]"
"[style] style"

// Character LoRAs
"[character name]"
"[outfit description]"
"[characteristic features]"

// Concept LoRAs
"[object name]"
"[specific pose]"
"[action word]"
\`\`\`

### Finding Triggers
1. Check model card on Civitai/HuggingFace
2. Look for "trigger words" or "activation tokens"
3. Review example prompts
4. Test with and without suspected triggers

### Multiple LoRA Usage
\`\`\`
<lora:style1:0.7> style1_trigger,
<lora:character1:0.8> char1_trigger,
<lora:pose1:0.5> pose1_trigger
\`\`\`

### Best Practices
- Place triggers early in prompt
- Don't over-weight trigger words
- Some LoRAs work without triggers (but better with)
- Test different trigger positions

*Source: Model Training Documentation*`,
    category: "syntax",
    order: 8
  }
];

const ANATOMY_GUIDES = [
  {
    id: 10,
    title: "1. Subject Definition",
    content: `**The subject is the primary focus of your image - what the viewer's eye is drawn to first.**

### Core Subject Elements
- **Who/What**: Person, animal, object, or abstract concept
- **Quantity**: Single subject, multiple subjects, groups
- **Positioning**: Centered, rule of thirds, dynamic placement

### Subject Description Hierarchy
1. **Basic Identity**: "woman", "cat", "mountain"
2. **Key Characteristics**: "young woman", "black cat", "snow-capped mountain"
3. **Distinctive Features**: "young woman with long red hair", "black cat with green eyes"
4. **Pose/Action**: "young woman with long red hair walking", "black cat stretching"

### Examples by Category
**Characters:**
\`\`\`
"elderly wizard with long white beard holding a glowing staff"
"cyberpunk hacker with neon tattoos typing on holographic keyboard"
"medieval knight in ornate armor kneeling"
\`\`\`

**Objects:**
\`\`\`
"ancient leather-bound book with golden clasps"
"futuristic hovering vehicle with blue energy trails"
"ornate Victorian pocket watch showing midnight"
\`\`\`

**Scenes:**
\`\`\`
"bustling marketplace in Marrakech at sunset"
"abandoned space station orbiting a dying star"
"misty forest path with fireflies"
\`\`\`

### Pro Tips
- Start with the subject to establish focus
- Be specific but not overly verbose
- Include distinctive features that matter
- Consider the subject's relationship to the environment

*Building strong subjects creates compelling focal points*`,
    category: "anatomy",
    order: 1
  },
  {
    id: 11,
    title: "2. Details & Characteristics",
    content: `**Details bring your subject to life and create visual interest through specific attributes.**

### Physical Appearance
**Facial Features:**
\`\`\`
"piercing blue eyes", "freckles across nose",
"sharp cheekbones", "warm smile", "weathered face"
\`\`\`

**Body & Posture:**
\`\`\`
"athletic build", "graceful pose", "confident stance",
"relaxed posture", "dynamic motion"
\`\`\`

**Hair & Styling:**
\`\`\`
"flowing silver hair", "messy bun", "braided crown",
"short pixie cut", "wild curls"
\`\`\`

### Clothing & Accessories
**Clothing Descriptions:**
\`\`\`
"flowing silk dress with gold embroidery"
"worn leather jacket with patches"
"traditional kimono with cherry blossom pattern"
"futuristic bodysuit with glowing circuits"
\`\`\`

**Accessories & Props:**
\`\`\`
"ornate silver necklace", "vintage aviator goggles",
"leather-bound journal", "holographic wristband"
\`\`\`

### Material & Texture
\`\`\`
"rough stone texture", "smooth metallic surface",
"soft velvet fabric", "weathered wood grain",
"crystalline structure", "organic patterns"
\`\`\`

### Color Specifications
**Precise Colors:**
\`\`\`
"deep crimson", "electric blue", "sage green",
"burnt orange", "pearl white", "obsidian black"
\`\`\`

**Color Relationships:**
\`\`\`
"complementary colors", "monochromatic palette",
"warm color scheme", "pastel tones", "vibrant neon"
\`\`\`

### Detail Density
- **Minimal**: Focus on 2-3 key details
- **Moderate**: 5-7 descriptive elements
- **Highly Detailed**: 10+ specific attributes

*Details should enhance, not overwhelm, your main subject*`,
    category: "anatomy",
    order: 2
  },
  {
    id: 12,
    title: "3. Setting & Environment",
    content: `**The setting provides context and atmosphere, grounding your subject in a specific place and time.**

### Location Types
**Natural Environments:**
\`\`\`
"dense rainforest with hanging vines"
"rocky mountain peak above the clouds"
"serene lake at dawn with mist"
"vast desert under starry sky"
\`\`\`

**Urban Settings:**
\`\`\`
"neon-lit Tokyo street at night"
"abandoned Detroit factory"
"Victorian London alleyway in fog"
"futuristic megacity with flying cars"
\`\`\`

**Interior Spaces:**
\`\`\`
"cozy library with floor-to-ceiling books"
"sterile laboratory with glowing specimens"
"ornate ballroom with crystal chandeliers"
"cramped spaceship cockpit"
\`\`\`

### Environmental Elements
**Weather & Atmosphere:**
\`\`\`
"heavy rain", "thick fog", "golden sunset",
"aurora borealis", "dust storm", "light snowfall"
\`\`\`

**Time of Day:**
\`\`\`
"golden hour", "blue hour", "high noon",
"midnight", "dawn breaking", "dusk settling"
\`\`\`

### Spatial Relationships
**Foreground/Background:**
\`\`\`
"flowers in foreground, mountains in background"
"subject centered, blurred city behind"
"layered depth with multiple planes"
\`\`\`

**Scale & Perspective:**
\`\`\`
"tiny figure against massive architecture"
"close-up with environment visible"
"bird's eye view of the scene"
"worm's eye perspective looking up"
\`\`\`

### Mood Through Setting
- **Mysterious**: "foggy", "shadowy", "abandoned"
- **Peaceful**: "serene", "tranquil", "pastoral"
- **Dramatic**: "stormy", "cliff edge", "volcanic"
- **Whimsical**: "floating islands", "candy landscape"

*Settings should complement and enhance your subject, not compete with it*`,
    category: "anatomy",
    order: 3
  },
  {
    id: 13,
    title: "4. Lighting Techniques",
    content: `**Lighting defines mood, reveals form, and creates visual drama in your images.**

### Natural Lighting
**Time-Based Lighting:**
\`\`\`
"soft morning light", "harsh midday sun",
"golden hour glow", "blue hour ambiance",
"moonlight illumination", "starlight only"
\`\`\`

**Weather-Influenced:**
\`\`\`
"diffused overcast light", "dramatic storm lighting",
"sunbeams through clouds", "rainbow light",
"filtered through leaves", "reflected off snow"
\`\`\`

### Artificial Lighting
**Studio Lighting:**
\`\`\`
"three-point lighting", "Rembrandt lighting",
"butterfly lighting", "split lighting",
"rim lighting", "high key lighting"
\`\`\`

**Practical Lights:**
\`\`\`
"candlelight glow", "neon sign illumination",
"computer screen glow", "fireplace warmth",
"street lamp pools", "car headlights"
\`\`\`

### Lighting Direction
\`\`\`
"backlit silhouette", "side lighting for drama",
"front lighting for clarity", "top-down lighting",
"bottom-up horror lighting", "cross lighting"
\`\`\`

### Light Quality
**Hard vs Soft:**
\`\`\`
"hard shadows", "soft diffused light",
"sharp contrast", "gentle gradients",
"harsh directional", "ambient glow"
\`\`\`

**Color Temperature:**
\`\`\`
"warm orange glow", "cool blue tones",
"neutral white light", "mixed color temperatures",
"gel-filtered colors", "prismatic effects"
\`\`\`

### Advanced Lighting Effects
\`\`\`
"volumetric lighting", "god rays",
"caustics", "subsurface scattering",
"lens flare", "bokeh lights",
"light painting", "bioluminescence"
\`\`\`

### Mood Through Lighting
- **Dramatic**: High contrast, directional light
- **Romantic**: Soft, warm, diffused
- **Mysterious**: Low key, shadows, minimal light
- **Energetic**: Bright, colorful, dynamic

*Lighting is the soul of visual storytelling - use it wisely*`,
    category: "anatomy",
    order: 4
  },
  {
    id: 14,
    title: "5. Style & Artistic Direction",
    content: `**Style determines the overall aesthetic and artistic approach of your generated image.**

### Art Movements
**Classical Styles:**
\`\`\`
"Renaissance painting style", "Baroque drama",
"Impressionist brushwork", "Art Nouveau curves",
"Art Deco geometry", "Surrealist dreamscape"
\`\`\`

**Modern Styles:**
\`\`\`
"Pop Art bold colors", "Minimalist composition",
"Abstract Expressionism", "Photorealism",
"Glitch art aesthetic", "Vaporwave style"
\`\`\`

### Medium Emulation
**Traditional Media:**
\`\`\`
"oil painting on canvas", "watercolor wash",
"charcoal sketch", "pencil drawing",
"ink and wash", "pastel on paper"
\`\`\`

**Digital Techniques:**
\`\`\`
"digital painting", "3D render", "vector art",
"pixel art style", "matte painting",
"concept art", "CGI quality"
\`\`\`

### Artistic Techniques
**Brushwork & Texture:**
\`\`\`
"impasto thick paint", "delicate brushstrokes",
"rough texture", "smooth blending",
"visible canvas texture", "paint drips"
\`\`\`

**Composition Styles:**
\`\`\`
"rule of thirds", "golden ratio", "symmetrical",
"dynamic diagonal", "centered composition",
"negative space", "layered depth"
\`\`\`

### Genre Specifications
**Photography Styles:**
\`\`\`
"street photography", "fashion editorial",
"documentary style", "fine art photography",
"commercial product shot", "candid portrait"
\`\`\`

**Illustration Styles:**
\`\`\`
"children's book illustration", "technical diagram",
"editorial illustration", "concept art",
"manga style", "comic book art"
\`\`\`

### Artist References
\`\`\`
"in the style of Van Gogh", "Monet-inspired",
"reminiscent of Banksy", "Hayao Miyazaki style",
"HR Giger biomechanical", "Studio Ghibli aesthetic"
\`\`\`

### Visual Properties
**Color Approach:**
\`\`\`
"vibrant colors", "muted palette", "monochromatic",
"high saturation", "desaturated", "color harmony"
\`\`\`

**Overall Mood:**
\`\`\`
"whimsical", "dark and moody", "bright and cheerful",
"ethereal", "gritty", "dreamlike", "hyperrealistic"
\`\`\`

*Style is the visual language that speaks to your audience*`,
    category: "anatomy",
    order: 5
  },
  {
    id: 15,
    title: "6. Technical Parameters",
    content: `**Technical specifications that control the rendering quality and specific aspects of generation.**

### Resolution & Aspect Ratio
**Common Resolutions:**
\`\`\`
512x512 - SD 1.5 base
768x768 - SD 1.5 high
1024x1024 - SDXL base
1024x1792 - Portrait (9:16)
1792x1024 - Landscape (16:9)
\`\`\`

**Aspect Ratio Considerations:**
- Square (1:1): Balanced compositions
- Portrait (2:3, 9:16): Vertical subjects
- Landscape (3:2, 16:9): Horizontal scenes
- Ultrawide (21:9): Cinematic views

### Camera Settings
**Focal Length:**
\`\`\`
"14mm ultra-wide", "24mm wide angle",
"35mm standard", "50mm normal",
"85mm portrait", "200mm telephoto"
\`\`\`

**Depth of Field:**
\`\`\`
"shallow DOF", "f/1.4 bokeh", "deep focus",
"tilt-shift effect", "selective focus",
"background blur", "foreground blur"
\`\`\`

**Camera Angles:**
\`\`\`
"eye level", "low angle", "high angle",
"Dutch angle", "aerial view", "close-up",
"extreme close-up", "wide shot"
\`\`\`

### Rendering Quality
**Quality Markers:**
\`\`\`
"4K", "8K", "HD", "ultra HD",
"high resolution", "crisp details",
"sharp focus", "ray traced", "octane render"
\`\`\`

**Processing Effects:**
\`\`\`
"HDR", "tone mapped", "color graded",
"post-processed", "professionally retouched",
"film grain", "chromatic aberration"
\`\`\`

### Model-Specific Parameters
**Steps:**
- Low (20-30): Faster, less detailed
- Medium (30-50): Balanced quality
- High (50-150): Maximum detail

**CFG Scale:**
- Low (3-7): More creative freedom
- Medium (7-12): Balanced adherence
- High (12-20): Strict prompt following

**Sampler Selection:**
\`\`\`
"Euler a" - Fast, good quality
"DPM++ 2M Karras" - High quality
"DDIM" - Deterministic results
"UniPC" - Latest efficiency
\`\`\`

*Technical parameters are the fine-tuning knobs of AI art*`,
    category: "anatomy",
    order: 6
  },
  {
    id: 16,
    title: "7. Prompt Structure Best Practices",
    content: `**Organizing your prompt effectively ensures the AI understands your vision clearly.**

### Optimal Prompt Order
1. **Subject** - Primary focus
2. **Action/Pose** - What they're doing
3. **Appearance** - Key characteristics
4. **Environment** - Setting/location
5. **Lighting** - Mood and atmosphere
6. **Style** - Artistic approach
7. **Quality** - Technical specifications

### Example Structure
\`\`\`
[Subject], [action], [appearance details],
[environment], [lighting], [style],
[quality tags], [technical specs]

"Young woman, reading a book, long red hair and green dress,
cozy library with fireplace, warm candlelight, oil painting style,
masterpiece, highly detailed, 8K resolution"
\`\`\`

### Length Guidelines
**Short Prompts (10-30 words):**
- Quick iterations
- Testing concepts
- Simple subjects

**Medium Prompts (30-75 words):**
- Balanced detail
- Most common length
- Good control vs flexibility

**Long Prompts (75-150 words):**
- Complex scenes
- Multiple subjects
- Precise control

### Token Efficiency
**Combine Related Concepts:**
\`\`\`
Instead of: "red hair, long hair, curly hair"
Use: "long curly red hair"
\`\`\`

**Remove Redundancy:**
\`\`\`
Instead of: "very extremely highly detailed"
Use: "highly detailed" or "intricate details"
\`\`\`

### Common Mistakes to Avoid
- **Over-description**: Too many conflicting details
- **Poor organization**: Random element placement
- **Contradictions**: "dark bright", "old young"
- **Token waste**: Repeating similar concepts
- **Ambiguity**: Unclear references

### Prompt Templates
**Portrait Template:**
\`\`\`
"[age] [gender] with [features], wearing [clothing],
[pose/expression], [location], [lighting] lighting,
[style] style, [quality tags]"
\`\`\`

**Landscape Template:**
\`\`\`
"[main feature] in [location], [time of day],
[weather/atmosphere], [additional elements],
[style], [quality tags]"
\`\`\`

**Object Template:**
\`\`\`
"[object type], [material/texture], [color/pattern],
[condition/age], [setting/background], [lighting],
[style], [quality tags]"
\`\`\`

*A well-structured prompt is like a clear recipe - it leads to consistent, delicious results*`,
    category: "anatomy",
    order: 7
  },
  {
    id: 17,
    title: "8. Model-Specific Optimization",
    content: `**Different AI models have unique strengths and prompt preferences.**

### Stable Diffusion 1.5
**Strengths:**
- Excellent with booru tags
- Strong anime/manga capability
- Huge LoRA ecosystem
- Fast generation

**Prompt Style:**
\`\`\`
"1girl, long hair, blue eyes, school uniform,
classroom, window light, anime style,
masterpiece, best quality"
\`\`\`

### Stable Diffusion XL
**Strengths:**
- Natural language understanding
- Higher resolution native
- Better text rendering
- More coherent scenes

**Prompt Style:**
\`\`\`
"A young woman with flowing hair stands in a sunlit classroom,
wearing a traditional school uniform. Professional photography,
natural lighting, high resolution."
\`\`\`

### Midjourney
**Strengths:**
- Artistic interpretation
- Stunning aesthetics
- Creative compositions
- Excellent lighting

**Prompt Style:**
\`\`\`
"Beautiful ethereal portrait :: flowing hair :: 
dreamlike atmosphere :: soft lighting ::
--ar 2:3 --stylize 750 --v 6"
\`\`\`

### DALL-E 3
**Strengths:**
- Text accuracy
- Concept understanding
- Safety features
- Instruction following

**Prompt Style:**
\`\`\`
"Create a detailed illustration of a fantasy warrior
with ornate armor and a glowing sword, standing
in an ancient temple with dramatic lighting"
\`\`\`

### Specialized Models
**Realistic Models:**
\`\`\`
"RAW photo, subject, detailed skin, pores,
natural lighting, photorealistic, film grain"
\`\`\`

**Anime Models:**
\`\`\`
"1girl, anime style, big eyes, colorful hair,
dynamic pose, detailed background, vibrant colors"
\`\`\`

**Artistic Models:**
\`\`\`
"Oil painting, brushstrokes visible, artistic interpretation,
museum quality, classical technique"
\`\`\`

### Model Selection Tips
- **For Photorealism**: Realistic Vision, Deliberate
- **For Anime**: Anything V5, NovelAI
- **For Art**: DreamShaper, OpenJourney
- **For Flexibility**: SD XL base

*Choose your model like choosing the right tool for the job*`,
    category: "anatomy",
    order: 8
  }
];

const HARDCODED_RESOURCES = [
  {
    id: 1,
    name: "Automatic1111 WebUI",
    description: "Popular open-source Stable Diffusion interface with extensive features",
    website: "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
    category: "prompting"
  },
  {
    id: 2,
    name: "ComfyUI",
    description: "Node-based workflow interface for advanced prompt control",
    website: "https://github.com/comfyanonymous/ComfyUI",
    category: "prompting"
  },
  {
    id: 3,
    name: "InvokeAI",
    description: "Streamlined interface with professional tools for AI image generation",
    website: "https://invoke-ai.github.io/InvokeAI/",
    category: "prompting"
  }
];

// ============= ICON COMPONENTS =============
const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const MessageSquare = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const BookOpen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);

const Sparkles = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
    <path d="M5 3v4"></path>
    <path d="M19 17v4"></path>
    <path d="M3 5h4"></path>
    <path d="M17 19h4"></path>
  </svg>
);

const Code = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);

const ExternalLink = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

const List = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);

const Zap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

const Plus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

// Additional icons for syntax guides
const Weight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="3"></circle>
    <line x1="12" y1="22" x2="12" y2="8"></line>
    <path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>
  </svg>
);

const Brackets = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3h3v18h-3"></path>
    <path d="M8 21H5V3h3"></path>
  </svg>
);

const Timer = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="10" y1="2" x2="14" y2="2"></line>
    <line x1="12" y1="14" x2="12" y2="8"></line>
    <circle cx="12" cy="14" r="8"></circle>
  </svg>
);

const BadgeCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path>
    <path d="m9 12 2 2 4-4"></path>
  </svg>
);

const Ban = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
  </svg>
);

const Settings = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const Tags = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z"></path>
    <path d="M6 9.01V9"></path>
    <path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"></path>
  </svg>
);

// Anatomy icons
const User = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const Palette = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5"></circle>
    <circle cx="17.5" cy="10.5" r=".5"></circle>
    <circle cx="8.5" cy="7.5" r=".5"></circle>
    <circle cx="6.5" cy="12.5" r=".5"></circle>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
  </svg>
);

const MapPin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const Lightbulb = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="6"></line>
    <line x1="12" y1="18" x2="12" y2="22"></line>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
    <line x1="2" y1="12" x2="6" y2="12"></line>
    <line x1="18" y1="12" x2="22" y2="12"></line>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
  </svg>
);

const FileCode = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <line x1="10" y1="9" x2="8" y2="9"></line>
  </svg>
);

const Layout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="9" y1="21" x2="9" y2="9"></line>
  </svg>
);

const Layers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2 17 12 22 22 17"></polyline>
    <polyline points="2 12 12 17 22 12"></polyline>
  </svg>
);

// ============= PROMPTING GUIDE COMPONENT =============
function PromptingGuide({ guides, category, useIds = false }: { guides: any[], category: string, useIds?: boolean }) {
  const getCategoryIcon = (title: string): ReactNode => {
    // Syntax icons
    if (title.includes("Weight Control")) return <Weight />;
    if (title.includes("Mixing Concepts")) return <Plus />;
    if (title.includes("Attention Brackets")) return <Brackets />;
    if (title.includes("Step Control")) return <Timer />;
    if (title.includes("Quality")) return <BadgeCheck />;
    if (title.includes("Negative")) return <Ban />;
    if (title.includes("SDXL")) return <Settings />;
    if (title.includes("Rating") || title.includes("Trigger")) return <Tags />;
    
    // Anatomy icons
    if (title.includes("Subject")) return <User />;
    if (title.includes("Detail")) return <Layers />;
    if (title.includes("Setting")) return <MapPin />;
    if (title.includes("Lighting")) return <Lightbulb />;
    if (title.includes("Style")) return <Palette />;
    if (title.includes("Technical")) return <FileCode />;
    if (title.includes("Prompt Structure")) return <Layout />;
    if (title.includes("Model-Specific")) return <Settings />;
    
    // Default numbered icon for anatomy guides
    if (category === "anatomy") {
      const order = guides.find(g => g.title === title)?.order || 1;
      return <span className="text-primary-400 font-medium">{order}</span>;
    }
    
    return <span className="text-primary-400 font-medium">•</span>;
  };

  // Custom components for markdown rendering
  const markdownComponents = {
    code: ({node, inline, className, children, ...props}: any) => {
      return !inline ? (
        <pre className="bg-gray-950/80 border border-gray-800 p-3 rounded-md text-sm font-mono text-gray-200 my-3 overflow-x-auto">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className="bg-gray-950/80 px-1.5 py-0.5 rounded text-primary-300 font-mono text-sm" {...props}>
          {children}
        </code>
      );
    },
    h1: ({node, children, ...props}: any) => (
      <h1 className="text-xl font-bold text-white mt-4 mb-2" {...props}>{children}</h1>
    ),
    h2: ({node, children, ...props}: any) => (
      <h2 className="text-lg font-bold text-white mt-4 mb-2" {...props}>{children}</h2>
    ),
    h3: ({node, children, ...props}: any) => (
      <h3 className="text-base font-bold text-primary-300 mt-3 mb-1" {...props}>{children}</h3>
    ),
    p: ({node, children, ...props}: any) => {
      const hasPreTag = Array.isArray(children) && children.some(
        child => typeof child === 'object' && child?.type === 'pre'
      );
      
      if (hasPreTag) {
        return <>{children}</>;
      }

      const isSourceParagraph = Array.isArray(children) && 
        children.some(child => 
          typeof child === 'object' && 
          child?.props?.children === 'Source' || 
          child?.props?.children === 'Sources'
        );

      if (isSourceParagraph) {
        return (
          <p className="text-xs text-gray-500 italic mt-4 pt-3 border-t border-gray-800/30" {...props}>
            {children}
          </p>
        );
      }

      return <p className="text-gray-300 mb-3 leading-relaxed" {...props}>{children}</p>;
    },
    strong: ({node, children, ...props}: any) => (
      <strong className="text-white font-semibold" {...props}>{children}</strong>
    ),
    em: ({node, children, ...props}: any) => (
      <em className="text-gray-400 italic" {...props}>{children}</em>
    ),
    ul: ({node, children, ...props}: any) => (
      <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1 ml-2" {...props}>{children}</ul>
    ),
    ol: ({node, children, ...props}: any) => (
      <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1 ml-2" {...props}>{children}</ol>
    ),
    li: ({node, children, ...props}: any) => (
      <li className="text-gray-300" {...props}>{children}</li>
    ),
  };

  const sortedGuides = [...guides].sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });

  return (
    <div className="space-y-6">
      {sortedGuides.map((guide) => (
        <div 
          key={guide.id}
          id={useIds ? `${category}-${guide.id}` : undefined}
          className="bg-gray-900/30 rounded-lg p-5 border border-gray-800/50 hover:border-gray-700/50 transition-colors"
        >
          <div className="flex items-center mb-3">
            <div className="w-7 h-7 rounded-full bg-primary-900/60 border border-primary-700/40 flex items-center justify-center mr-3">
              {getCategoryIcon(guide.title)}
            </div>
            <h3 className="text-lg font-semibold text-white">
              {guide.title}
            </h3>
          </div>
          
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}
            >
              {guide.content}
            </ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============= MAIN COMPONENT =============
export default function StandalonePrompting() {
  const [activeTab, setActiveTab] = useState("anatomy");
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Page Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center text-purple-400">
            <MessageSquare />
          </div>
          <h1 className="text-2xl font-bold">
            <span className="text-white mr-1">Prompt</span>
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Engineering
            </span>
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <section className="mb-16">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-800">
            <button
              onClick={() => setActiveTab("anatomy")}
              className={`flex items-center px-4 py-2 border-b-2 transition-colors ${
                activeTab === "anatomy"
                  ? "border-purple-400 text-purple-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <Sparkles /> <span className="ml-2">Prompt Anatomy</span>
            </button>
            <button
              onClick={() => setActiveTab("syntax")}
              className={`flex items-center px-4 py-2 border-b-2 transition-colors ${
                activeTab === "syntax"
                  ? "border-purple-400 text-purple-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <Code /> <span className="ml-2">Syntax Guide</span>
            </button>
            <button
              onClick={() => setActiveTab("resources")}
              className={`flex items-center px-4 py-2 border-b-2 transition-colors ${
                activeTab === "resources"
                  ? "border-purple-400 text-purple-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <BookOpen /> <span className="ml-2">Resources</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "anatomy" && (
            <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-900/60 border border-purple-700/40 flex items-center justify-center mr-4">
                  <Sparkles />
                </div>
                <h3 className="font-heading font-semibold text-xl text-white">
                  Prompt Anatomy Guide
                </h3>
              </div>

              <p className="text-gray-300 mb-8 max-w-3xl">
                Understanding how to structure your prompts is crucial for achieving consistent, 
                high-quality results. This guide breaks down each component of an effective prompt,
                from subject definition to technical parameters.
              </p>

              <PromptingGuide guides={ANATOMY_GUIDES} category="anatomy" />
            </div>
          )}

          {activeTab === "syntax" && (
            <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-primary-900/60 border border-primary-700/40 flex items-center justify-center mr-4">
                  <Code />
                </div>
                <h3 className="font-heading font-semibold text-xl text-white">
                  Stable Diffusion Syntax Guide
                </h3>
              </div>

              <p className="text-gray-300 mb-4 max-w-3xl">
                Master the power of Stable Diffusion by learning these essential
                prompt syntax techniques. Each section below explains a specific
                feature that gives you greater control over your generated
                images.
              </p>

              {/* Quick Reference */}
              <div className="bg-gray-950/50 rounded-lg border border-gray-800/50 p-4 mb-8">
                <h4 className="text-white font-medium mb-4 flex items-center">
                  <div className="w-6 h-6 rounded-full bg-primary-900/80 border border-primary-700 flex items-center justify-center mr-2.5">
                    <List />
                  </div>
                  <span className="bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
                    Quick Reference Guide
                  </span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SYNTAX_GUIDES.map((guide, index) => {
                    const colorClasses = [
                      "text-blue-400 hover:text-blue-300",
                      "text-purple-400 hover:text-purple-300",
                      "text-green-400 hover:text-green-300",
                      "text-amber-400 hover:text-amber-300",
                      "text-rose-400 hover:text-rose-300",
                      "text-teal-400 hover:text-teal-300",
                      "text-indigo-400 hover:text-indigo-300",
                      "text-orange-400 hover:text-orange-300",
                    ];
                    const colorClass = colorClasses[index % colorClasses.length];

                    const bulletColorClasses = [
                      "bg-blue-500/20 text-blue-500",
                      "bg-purple-500/20 text-purple-500",
                      "bg-green-500/20 text-green-500",
                      "bg-amber-500/20 text-amber-500",
                      "bg-rose-500/20 text-rose-500",
                      "bg-teal-500/20 text-teal-500",
                      "bg-indigo-500/20 text-indigo-500",
                      "bg-orange-500/20 text-orange-500",
                    ];
                    const bulletColorClass = bulletColorClasses[index % bulletColorClasses.length];

                    return (
                      <a
                        key={`summary-${guide.id}`}
                        href={`#syntax-${guide.id}`}
                        className={`text-sm ${colorClass} transition-colors flex items-center group`}
                      >
                        <span className={`${bulletColorClass} w-4 h-4 flex items-center justify-center rounded-full mr-1.5 group-hover:scale-110 transition-transform`}>
                          •
                        </span>
                        {guide.title}
                      </a>
                    );
                  })}
                </div>
              </div>

              <PromptingGuide guides={SYNTAX_GUIDES} category="syntax" useIds={true} />
            </div>
          )}

          {activeTab === "resources" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="dark-card bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-heading font-semibold text-xl text-white">
                      Prompt Resources
                    </h3>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg shadow-purple-900/30 border border-purple-500 font-medium">
                      <span>Add Resource</span>
                      <Plus />
                    </button>
                  </div>

                  {/* Tutorials & Guides */}
                  <div className="mb-6">
                    <h4 className="text-primary-400 font-medium mb-4 text-lg">
                      Tutorials & Guides
                    </h4>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-purple-900/60 border border-purple-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                          <BookOpen />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1 group-hover:text-purple-400 transition-colors">
                            Midjourney Documentation
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Official guide to Midjourney prompt structure and parameters
                          </p>
                          <a
                            href="https://docs.midjourney.com/docs/prompt-guide"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 text-sm hover:text-purple-300 mt-2 inline-flex items-center"
                          >
                            View Resource <span className="ml-1 text-xs">→</span>
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-900/60 border border-blue-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                          <BookOpen />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1 group-hover:text-blue-400 transition-colors">
                            Stable Diffusion Prompt Guide
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Comprehensive guide to SD prompting syntax and techniques
                          </p>
                          <a
                            href="https://stable-diffusion-art.com/prompt-guide/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 text-sm hover:text-blue-300 mt-2 inline-flex items-center"
                          >
                            View Resource <span className="ml-1 text-xs">→</span>
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-emerald-900/60 border border-emerald-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                          <BookOpen />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1 group-hover:text-emerald-400 transition-colors">
                            Civitai Prompt Guide
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Community-driven tips and best practices for prompting
                          </p>
                          <a
                            href="https://civitai.com/articles/741/sd-prompt-building-guide"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 text-sm hover:text-emerald-300 mt-2 inline-flex items-center"
                          >
                            View Resource <span className="ml-1 text-xs">→</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Community Resources */}
                    <h4 className="text-amber-400 font-medium mb-4 text-lg">
                      Community Resources
                    </h4>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-amber-900/60 border border-amber-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                          <BookOpen />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1 group-hover:text-amber-400 transition-colors">
                            Midjourney Community Showcase
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Browse top Midjourney creations with prompts
                          </p>
                          <a
                            href="https://www.midjourney.com/showcase/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 text-sm hover:text-amber-300 mt-2 inline-flex items-center"
                          >
                            View Resource <span className="ml-1 text-xs">→</span>
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-rose-900/60 border border-rose-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                          <BookOpen />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1 group-hover:text-rose-400 transition-colors">
                            PromptHero
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Database of AI art prompts across multiple models
                          </p>
                          <a
                            href="https://prompthero.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rose-400 text-sm hover:text-rose-300 mt-2 inline-flex items-center"
                          >
                            View Resource <span className="ml-1 text-xs">→</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Tools & Applications */}
                    <h4 className="text-indigo-400 font-medium mb-4 text-lg">
                      Tools & Applications  
                    </h4>
                    <div className="space-y-4">
                      {HARDCODED_RESOURCES.map((resource) => (
                        <div
                          key={resource.id}
                          className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-indigo-900/60 border border-indigo-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                            <BookOpen />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-white mb-1 group-hover:text-indigo-400 transition-colors">
                              {resource.name}
                            </h4>
                            <p className="text-gray-400 text-sm">
                              {resource.description}
                            </p>
                            {resource.website && (
                              <a
                                href={resource.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 text-sm hover:text-indigo-300 mt-2 inline-flex items-center"
                              >
                                View Resource <span className="ml-1 text-xs">→</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Prompt Building Tools */}
                    <h4 className="text-purple-400 font-medium mb-4 text-lg mt-8">
                      Prompt Building Tools
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary-900/60 border border-primary-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                          <Sparkles />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1 group-hover:text-primary-400 transition-colors">
                            Elite{" "}
                            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                              Prompt Generator
                            </span>
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Our built-in advanced prompt generator with templates and AI enhancement
                          </p>
                          <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-md text-sm font-medium hover:from-blue-600 hover:to-purple-600 transition-all mt-2 inline-flex items-center">
                            Open Generator <Zap />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-900/60 border border-blue-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                          <Sparkles />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1 group-hover:text-blue-400 transition-colors">
                            FLUX Prompt Generator
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Original prompt generator with comprehensive category options
                          </p>
                          <a
                            href="https://huggingface.co/spaces/gokaygokay/FLUX-Prompt-Generator"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 text-sm hover:text-blue-300 mt-2 inline-flex items-center"
                          >
                            Visit Generator <ExternalLink />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-emerald-900/60 border border-emerald-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                          <Sparkles />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1 group-hover:text-emerald-400 transition-colors">
                            Promptomania Builder
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Visual prompt builder with structured workflow and categories
                          </p>
                          <a
                            href="https://promptomania.com/prompt-builder/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 text-sm hover:text-emerald-300 mt-2 inline-flex items-center"
                          >
                            Visit Builder <ExternalLink />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-1">
                <div className="dark-card bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800 p-6 mb-6">
                  <h3 className="font-heading font-semibold text-xl mb-5 text-white">
                    Learning Resources
                  </h3>
                  <ul className="space-y-4 mb-6 text-gray-300">
                    <li className="flex items-start group">
                      <span className="inline-block bg-indigo-900/60 border border-indigo-700/40 text-indigo-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <a
                        href="https://www.youtube.com/c/MidJourneyAI"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group-hover:text-white transition-colors"
                      >
                        Midjourney Official Channel
                      </a>
                    </li>
                    <li className="flex items-start group">
                      <span className="inline-block bg-blue-900/60 border border-blue-700/40 text-blue-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <a
                        href="https://lexica.art"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group-hover:text-white transition-colors"
                      >
                        Lexica Prompt Search Engine
                      </a>
                    </li>
                    <li className="flex items-start group">
                      <span className="inline-block bg-amber-900/60 border border-amber-700/40 text-amber-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <a
                        href="https://github.com/Maks-s/sd-akashic"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group-hover:text-white transition-colors"
                      >
                        SD Akashic Knowledge Guide
                      </a>
                    </li>
                    <li className="flex items-start group">
                      <span className="inline-block bg-emerald-900/60 border border-emerald-700/40 text-emerald-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <a
                        href="https://promptomania.com/prompt-builder/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group-hover:text-white transition-colors"
                      >
                        Promptomania Builder
                      </a>
                    </li>
                    <li className="flex items-start group">
                      <span className="inline-block bg-rose-900/60 border border-rose-700/40 text-rose-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <a
                        href="https://www.reddit.com/r/StableDiffusion/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group-hover:text-white transition-colors"
                      >
                        Reddit Stable Diffusion Community
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="dark-card bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                  <h3 className="font-heading font-semibold text-xl mb-5 text-white">
                    Quick Tips
                  </h3>
                  <ul className="space-y-4 mb-6 text-gray-300">
                    <li className="flex items-start group">
                      <span className="inline-block bg-primary-900/60 border border-primary-700/40 text-primary-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <span className="group-hover:text-white transition-colors">
                        Use parentheses to group related concepts
                      </span>
                    </li>
                    <li className="flex items-start group">
                      <span className="inline-block bg-primary-900/60 border border-primary-700/40 text-primary-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <span className="group-hover:text-white transition-colors">
                        Add weights to important elements:{" "}
                        <code className="bg-gray-950/80 px-1.5 py-0.5 rounded text-primary-300 text-xs">
                          (roses:1.3)
                        </code>
                      </span>
                    </li>
                    <li className="flex items-start group">
                      <span className="inline-block bg-primary-900/60 border border-primary-700/40 text-primary-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <span className="group-hover:text-white transition-colors">
                        Separate prompt sections logically
                      </span>
                    </li>
                    <li className="flex items-start group">
                      <span className="inline-block bg-primary-900/60 border border-primary-700/40 text-primary-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <span className="group-hover:text-white transition-colors">
                        Begin with subject, then add details
                      </span>
                    </li>
                    <li className="flex items-start group">
                      <span className="inline-block bg-primary-900/60 border border-primary-700/40 text-primary-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <span className="group-hover:text-white transition-colors">
                        Specify style and quality at the end
                      </span>
                    </li>
                  </ul>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="px-3 py-2 border border-primary-700 bg-primary-900/30 hover:bg-primary-900/50 text-primary-300 hover:text-primary-200 rounded-lg text-sm transition-colors"
                      onClick={() => setActiveTab("syntax")}
                    >
                      Syntax Guide
                    </button>
                    <button
                      className="px-3 py-2 border border-purple-700 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 hover:text-purple-200 rounded-lg text-sm transition-colors"
                      onClick={() => setActiveTab("anatomy")}
                    >
                      Prompt Anatomy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}