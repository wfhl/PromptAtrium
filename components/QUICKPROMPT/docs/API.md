# Quick Prompt Generator - API Documentation

## 📡 API Overview

The Quick Prompt Generator provides a comprehensive set of API endpoints for prompt generation, character management, and AI-powered enhancements.

## 🔐 Authentication

Most endpoints support both authenticated and anonymous access:
- **Authenticated**: Full access to personal presets and libraries
- **Anonymous**: Limited access with session-based storage

```typescript
// Example authentication header
headers: {
  'Authorization': 'Bearer <token>',
  'Content-Type': 'application/json'
}
```

## 📚 Endpoints

### Character Presets

#### GET /api/character-presets
Retrieve all character presets for the current user.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Elegant Woman",
    "gender": "female",
    "role": "business professional",
    "description": "Sophisticated business woman with elegant style",
    "is_favorite": true,
    "is_custom": true,
    "character_data": {
      "bodyType": "athletic",
      "hairstyle": "long wavy",
      "hairColor": "brunette",
      "eyeColor": "green",
      "skinTone": "fair",
      "clothing": "business suit",
      "accessories": "pearl necklace",
      "additionalDetails": "confident posture"
    }
  }
]
```

#### POST /api/character-presets
Create a new character preset.

**Request Body:**
```json
{
  "name": "Anime Character",
  "gender": "female",
  "role": "warrior",
  "description": "Fierce anime warrior",
  "lora_description": "anime style, cel shaded, vibrant colors",
  "character_data": {
    "bodyType": "athletic",
    "hairstyle": "long twin tails",
    "hairColor": "blue",
    "clothing": "armor suit"
  }
}
```

**Response:**
```json
{
  "id": 2,
  "message": "Character preset created successfully"
}
```

#### PUT /api/character-presets/:id
Update an existing character preset.

#### DELETE /api/character-presets/:id
Delete a character preset.

#### POST /api/character-presets/:id/favorite
Toggle favorite status for a character preset.

---

### Prompt Templates

#### GET /api/prompt-templates
Retrieve all available prompt templates.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Photography - Professional",
    "category": "photography",
    "type": "professional",
    "template": "Professional photography of {subject}, {character}, shot with {camera}, {lighting}, {composition}",
    "variables": ["subject", "character", "camera", "lighting", "composition"],
    "example": "Professional photography of urban landscape, elegant woman, shot with Canon 5D, golden hour lighting, rule of thirds composition",
    "is_active": true
  }
]
```

#### POST /api/prompt-templates
Create a custom prompt template.

**Request Body:**
```json
{
  "name": "Custom Portrait",
  "category": "photography",
  "template": "Portrait of {character} in {setting}, {mood} atmosphere, {style} photography",
  "variables": ["character", "setting", "mood", "style"]
}
```

---

### Prompt Library

#### GET /api/prompt-library/categories
Get all prompt library categories.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Portraits",
    "description": "Character and portrait prompts",
    "prompt_count": 45
  }
]
```

#### GET /api/prompt-library
Get prompts from the library.

**Query Parameters:**
- `category_id`: Filter by category
- `search`: Search term
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset

**Response:**
```json
{
  "prompts": [
    {
      "id": 1,
      "title": "Sunset Portrait",
      "positive_prompt": "Beautiful woman at golden hour...",
      "negative_prompt": "blur, distortion...",
      "category_id": 1,
      "tags": ["portrait", "sunset", "outdoor"],
      "example_images": ["image1.jpg", "image2.jpg"]
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

#### POST /api/prompt-library
Save a prompt to the library.

**Request Body:**
```json
{
  "title": "Epic Fantasy Scene",
  "description": "A dramatic fantasy landscape",
  "positive_prompt": "Epic fantasy landscape with...",
  "negative_prompt": "modern, urban, technology",
  "category_id": 3,
  "tags": ["fantasy", "landscape", "epic"],
  "visibility": "private",
  "example_images": ["base64_image_data"]
}
```

---

### AI Enhancement

#### POST /api/enhance-prompt
Enhance a prompt using AI.

**Request Body:**
```json
{
  "prompt": "woman in red dress",
  "provider": "openai",
  "model": "gpt-4",
  "enhancement_type": "detailed",
  "preserve_style": true
}
```

**Response:**
```json
{
  "enhanced_prompt": "Elegant woman in a flowing crimson red evening gown, dramatic lighting highlighting the silk fabric's texture, confident pose against a luxurious ballroom setting, professional fashion photography",
  "tokens_used": 45,
  "provider": "openai"
}
```

**Supported Providers:**
- `openai` - GPT-3.5/GPT-4
- `anthropic` - Claude
- `google` - Gemini
- `groq` - Llama/Mixtral
- `local` - Local LLM

---

### Image Analysis

#### POST /api/analyze-image
Analyze an uploaded image using vision models.

**Request Body (multipart/form-data):**
- `image`: Image file (JPEG, PNG, WebP)
- `provider`: Vision model provider
- `analysis_type`: Type of analysis

**Request Body (JSON with base64):**
```json
{
  "image": "data:image/jpeg;base64,...",
  "provider": "openai",
  "analysis_type": "detailed"
}
```

**Response:**
```json
{
  "analysis": "The image shows a sunset landscape with mountains in the background...",
  "tags": ["sunset", "landscape", "mountains", "nature"],
  "suggested_prompt": "Dramatic sunset over mountain range, golden hour lighting...",
  "metadata": {
    "width": 1920,
    "height": 1080,
    "format": "jpeg"
  }
}
```

**Supported Providers:**
- `openai` - GPT-4 Vision
- `anthropic` - Claude Vision
- `google` - Gemini Vision
- `custom` - Custom vision server

---

### Social Media Captions

#### POST /api/generate-social-caption
Generate social media captions from prompts.

**Request Body:**
```json
{
  "prompt": "Beautiful sunset landscape photography...",
  "platform": "instagram",
  "tone": "engaging",
  "include_hashtags": true,
  "hashtag_count": 10
}
```

**Response:**
```json
{
  "caption": "Caught this breathtaking sunset painting the sky in shades of gold 🌅✨",
  "hashtags": ["#sunset", "#landscape", "#photography", "#naturephotography", "#goldenhour"],
  "platform_optimized": true,
  "character_count": 145
}
```

**Supported Platforms:**
- `instagram`
- `twitter`
- `facebook`
- `tiktok`
- `linkedin`

---

### Metadata Generation

#### POST /api/generate-prompt-metadata
Generate metadata for a prompt.

**Request Body:**
```json
{
  "prompt": "Epic fantasy warrior in battle...",
  "character_preset": "warrior",
  "template_name": "cinematic"
}
```

**Response:**
```json
{
  "title": "Epic Fantasy Battle Scene",
  "description": "A dramatic portrayal of a fantasy warrior in combat",
  "tags": ["fantasy", "warrior", "battle", "cinematic", "epic"],
  "category": "Fantasy Art",
  "suggested_settings": {
    "aspect_ratio": "16:9",
    "style": "cinematic",
    "quality": "high"
  }
}
```

---

## 🔄 WebSocket Support

For real-time updates and streaming responses:

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.send(JSON.stringify({
  type: 'enhance_prompt',
  data: {
    prompt: 'woman in garden',
    stream: true
  }
}));

ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log('Streaming response:', response.chunk);
};
```

## 📊 Rate Limiting

Default rate limits:
- **Anonymous users**: 100 requests/hour
- **Authenticated users**: 1000 requests/hour
- **Image analysis**: 20 requests/hour
- **AI enhancement**: 50 requests/hour

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🔌 Mock Data Mode

For development without a backend:

```javascript
// Enable mock mode
const API_MOCK_MODE = true;

// Mock responses are provided for all endpoints
// Data is stored in localStorage for persistence
```

## 🚨 Error Responses

Standard error format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "prompt",
      "issue": "Required field missing"
    }
  },
  "status": 400
}
```

Common error codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## 🧪 Testing Endpoints

Use the included test suite:

```bash
# Run API tests
npm run test:api

# Test specific endpoint
npm run test:api -- --endpoint character-presets
```

## 📝 API Client Example

```typescript
import { QuickPromptAPI } from './QUICKPROMPT/frontend/lib/api';

const api = new QuickPromptAPI({
  baseURL: 'http://localhost:5000',
  apiKey: 'optional-api-key'
});

// Get character presets
const presets = await api.getCharacterPresets();

// Enhance a prompt
const enhanced = await api.enhancePrompt({
  prompt: 'sunset landscape',
  provider: 'openai'
});

// Analyze an image
const analysis = await api.analyzeImage(imageFile, {
  provider: 'openai',
  analysisType: 'detailed'
});
```

---

Next: [Features Guide](./FEATURES.md) →