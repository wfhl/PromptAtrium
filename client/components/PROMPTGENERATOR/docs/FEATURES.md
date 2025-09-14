# PROMPTGENERATOR Features Documentation

## Table of Contents
1. [Core Features](#core-features)
2. [Prompt Generation](#prompt-generation)
3. [Character Generation](#character-generation)
4. [Scene Building](#scene-building)
5. [Style Selection](#style-selection)
6. [Template System](#template-system)
7. [LLM Enhancement](#llm-enhancement)
8. [Preset Management](#preset-management)
9. [History & Export](#history--export)
10. [Advanced Features](#advanced-features)

## Core Features

### Multi-Format Support
Generate prompts optimized for different AI image generation models:

- **Stable Diffusion**: Optimized with quality tags and negative prompts
- **Midjourney**: Includes parameters like --ar, --v, --seed
- **FLUX**: Advanced format with detailed scene composition
- **DALL-E**: Natural language descriptions
- **Pipeline**: Structured format with clear sections
- **Narrative**: Story-focused descriptions
- **Wildcard**: Creative and unexpected combinations

### Real-time Generation
- Instant prompt generation as you modify options
- Live preview of all format variations
- Copy individual formats or all at once

## Prompt Generation

### Basic Options

#### Gender Selection
- Female character options
- Male character options
- Non-binary support (custom input)

#### Global Options
- **Disabled**: Manual control over all options
- **Random**: Randomize all available options
- **No Figure Rand**: Randomize scene without character

#### Art Form
- Photography
- Digital Art
- Traditional Art
- 3D Rendering
- Mixed Media

#### Photo Types
Choose from 18+ photography types:
- Portrait, Landscape, Architecture
- Street, Fashion, Product
- Wildlife, Macro, Sports
- Documentary, Travel, Fine Art
- And more...

## Character Generation

### Physical Attributes

#### Body Types
**Female Options** (40+ types):
- Pretty, Athletic, Fit, Lean
- Slender, Petite, Voluptuous
- Muscular, Curvy, etc.

**Male Options** (35+ types):
- Handsome, Athletic, Fit
- Muscular, Lean, Stocky
- Sturdy, Solid, etc.

#### Appearance Details
- **Hairstyles**: 35+ options (short, long, braided, etc.)
- **Hair Colors**: 25+ colors including natural and fantasy
- **Eye Colors**: 15+ options including heterochromia
- **Skin Tones**: 14 diverse options
- **Makeup**: 20+ styles (for female characters)

### Character Roles
50+ profession and character types:
- Medical: Doctor, Nurse, Surgeon
- Education: Teacher, Professor, Student
- Creative: Artist, Musician, Writer
- Action: Soldier, Athlete, Explorer
- Fantasy: Warrior, Mage, Rogue
- And many more...

### Clothing Options
**Female Clothing** (50+ items):
- Dresses, Skirts, Blouses
- Professional wear, Casual wear
- Athletic wear, Swimwear
- Accessories and footwear

**Male Clothing** (40+ items):
- Suits, Casual wear
- Athletic wear, Formal wear
- Accessories and footwear

## Scene Building

### Location Settings

#### Places (50+ options)
- Natural: Beach, Mountain, Forest, Desert
- Urban: City, Street, Rooftop
- Interior: Studio, Office, Home
- Fantasy: Alien world, Underwater, Space

### Lighting Options (45+ styles)
- Natural: Golden hour, Blue hour, Sunrise
- Studio: Softbox, Rim light, Key light
- Dramatic: Silhouette, Backlit, Low key
- Creative: Neon, Volumetric, Cinematic

### Composition (50+ techniques)
- Classic: Rule of thirds, Golden ratio
- Angles: Low angle, High angle, Dutch angle
- Framing: Leading lines, Negative space
- Focus: Depth of field, Bokeh, Sharp focus

### Backgrounds (45+ options)
- Plain: White, Black, Gradient
- Natural: Sky, Forest, Ocean
- Urban: Cityscape, Street, Interior
- Abstract: Patterns, Textures, Colors

## Style Selection

### Photography Styles (50+ options)
- Portrait styles: Candid, Formal, Environmental
- Artistic: Fine art, Abstract, Conceptual
- Technical: HDR, Long exposure, Time-lapse
- Period: Vintage, Retro, Modern

### Artists (50+ masters)
- Classical: Da Vinci, Rembrandt, Van Gogh
- Modern: Picasso, Warhol, Basquiat
- Contemporary: Banksy, Koons, Hirst
- Digital: Beeple, Pak, XCOPY

### Photographers (50+ legends)
- Portrait: Annie Leibovitz, Richard Avedon
- Landscape: Ansel Adams, Marc Adamus
- Street: Henri Cartier-Bresson, Vivian Maier
- Fashion: Mario Testino, Peter Lindbergh

## Template System

### Pre-built Templates

#### Pipeline Template
```
[Pose/Action | Setting] | [Character] | [Quality] | [Outfit] | [Camera]
```

#### Narrative Template
```
The scene opens with {character} in {setting}, creating {mood}...
```

#### Standard Template
```
{subject}, {description}, {style}, {quality}
```

### Custom Templates

Create your own templates with:
- Variable placeholders: `{subject}`, `{place}`, etc.
- Conditional logic: Show/hide based on options
- Default values: Fallback when not specified
- Rules: Guidelines for generation

### Template Features
- Save and load custom templates
- Share templates with others
- Version control for templates
- Template categories and tags

## LLM Enhancement

### Supported Providers
- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude 3 Opus, Sonnet, Haiku
- **Groq**: Llama, Mixtral models
- **Mistral**: Mistral Large, Medium
- **Local**: Ollama, LM Studio support

### Enhancement Options

#### Happy Talk Mode
Adds enthusiasm and positive language:
- "Amazing", "Stunning", "Breathtaking"
- Enhances emotional impact

#### Compression Mode
Reduces token usage while maintaining quality:
- Level 1-10 compression
- Removes redundancy
- Preserves key details

#### Master Prompts
Custom instructions for enhancement:
- Style-specific guidelines
- Format requirements
- Quality standards

## Preset Management

### Character Presets

Save complete character configurations:
- Physical attributes
- Clothing and accessories
- Personality traits
- Default poses

### Scene Presets

Save environment settings:
- Location and background
- Lighting configuration
- Composition rules
- Atmosphere and mood

### Style Presets

Save artistic preferences:
- Artists and photographers
- Color palettes
- Techniques and effects
- Quality settings

### Preset Features
- Favorite presets for quick access
- Categories and tags
- Import/Export presets
- Share with community

## History & Export

### Prompt History

Automatic tracking of:
- Generated prompts
- Enhancement history
- Used options
- Timestamps

### Export Options

#### Formats
- **JSON**: Complete data with metadata
- **CSV**: Spreadsheet compatible
- **TXT**: Plain text prompts
- **Markdown**: Formatted documentation

#### Export Types
- Individual prompts
- Batch export with filters
- Complete history
- Templates and presets

### Import Features
- Restore from backup
- Merge with existing data
- Validate before import
- Conflict resolution

## Advanced Features

### Detailed Options Categories

20+ specialized categories with hundreds of options:

#### Architecture
- Architects, Styles, Buildings
- Materials, Interiors, Exteriors

#### Art
- Painting techniques, Palettes
- Patterns, Sculptures, Styles

#### Cinematic
- Film genres, Camera movements
- Color grading, Aspect ratios

#### Fashion
- Designers, Styles, Accessories
- Materials, Patterns, Eras

#### Science
- Technologies, Concepts
- Materials, Equipment

#### Vehicles
- Types, Brands, Parts
- Racing, Military, Civilian

### Aspect Ratio Calculator

Calculate optimal dimensions for:
- Social media platforms
- Print sizes
- Screen resolutions
- Custom ratios

Features:
- Visual preview
- Common presets
- Pixel dimensions
- Orientation toggle

### Image Analysis

Extract information from existing images:
- Embedded prompts (PNG Info)
- EXIF data
- AI-based content analysis
- Style detection

### Model Information

Display model-specific details:
- Recommended settings
- Optimal resolutions
- Known limitations
- Best practices

### Negative Prompt Generation

Automatic generation based on:
- Selected quality level
- Content type
- Known model issues
- Custom exclusions

### Quality Presets

Pre-configured quality settings:
- **Draft**: Fast, lower quality
- **Standard**: Balanced
- **High**: Detailed, slower
- **Ultra**: Maximum quality
- **Custom**: User-defined

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + G | Generate prompt |
| Ctrl/Cmd + E | Enhance prompt |
| Ctrl/Cmd + S | Save preset |
| Ctrl/Cmd + C | Copy prompt |
| Ctrl/Cmd + R | Randomize |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + H | Show history |
| Ctrl/Cmd + / | Show shortcuts |

## Performance Features

### Optimization
- Lazy loading of components
- Memoized calculations
- Efficient re-rendering
- Cached API responses

### Offline Mode
- Local storage persistence
- Offline prompt generation
- Queue enhancement requests
- Sync when online

### Multi-language Support
- Interface translations
- Prompt translation
- Regional preferences
- RTL language support

## Integration Features

### API Access
- RESTful endpoints
- WebSocket support
- Batch operations
- Rate limiting

### Webhooks
- Generation events
- Enhancement completion
- Preset updates
- Error notifications

### Plugin System
- Custom generators
- Additional formats
- External services
- Community extensions

## Accessibility

### Features
- Keyboard navigation
- Screen reader support
- High contrast mode
- Font size adjustment
- Focus indicators
- ARIA labels

## Mobile Features

### Responsive Design
- Touch-optimized controls
- Swipe gestures
- Mobile-specific layout
- Offline capability

### Progressive Web App
- Install as app
- Push notifications
- Background sync
- Offline mode

## Security Features

### Data Protection
- Local encryption
- Secure API keys
- Session management
- Data anonymization

### Privacy
- No tracking by default
- Data stays local
- Optional cloud sync
- GDPR compliant