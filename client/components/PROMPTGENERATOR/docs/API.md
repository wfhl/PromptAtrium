# PROMPTGENERATOR API Documentation

## Overview
The PROMPTGENERATOR backend provides RESTful API endpoints for prompt enhancement, template management, and prompt history. All endpoints are prefixed with `/api`.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Optional authentication can be implemented using JWT tokens or API keys. By default, the API is open for development.

## Endpoints

### 1. Enhance Prompt

Enhance a prompt using LLM providers (OpenAI, Anthropic, etc.).

**Endpoint:** `POST /api/enhance-prompt`

**Request Body:**
```json
{
  "prompt": "string",
  "format": "pipeline | standard | narrative | wildcard | midjourney",
  "llmProvider": "openai | anthropic | groq | mistral",
  "model": "gpt-4 | claude-3-sonnet | etc",
  "useHappyTalk": false,
  "compressPrompt": false,
  "compressionLevel": 5,
  "masterPrompt": "optional custom master prompt",
  "temperature": 0.7,
  "maxTokens": 2000
}
```

**Response:**
```json
{
  "success": true,
  "enhanced": "Enhanced prompt text...",
  "original": "Original prompt",
  "format": "pipeline",
  "model": "gpt-4",
  "processingTime": 1234
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

### 2. Template Management

#### Get All Templates

**Endpoint:** `GET /api/templates`

**Query Parameters:**
- `category` (optional): Filter by category
- `favorite` (optional): Filter favorites only (true/false)

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "pipeline",
      "name": "Pipeline",
      "description": "Advanced pipeline format",
      "template": "{prompt}",
      "rules": "Pipeline format rules",
      "masterPrompt": "You are a specialized expert...",
      "llmProvider": "openai",
      "llmModel": "gpt-4",
      "useHappyTalk": false,
      "compressPrompt": false,
      "compressionLevel": 5,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 5
}
```

#### Get Template by ID

**Endpoint:** `GET /api/templates/:id`

**Response:**
```json
{
  "success": true,
  "template": {
    "id": "pipeline",
    "name": "Pipeline",
    "description": "Advanced pipeline format",
    // ... other fields
  }
}
```

#### Create Template

**Endpoint:** `POST /api/templates`

**Request Body:**
```json
{
  "name": "My Template",
  "description": "Template description",
  "template": "{subject} in {place}",
  "rules": "Template rules",
  "masterPrompt": "Enhancement prompt",
  "llmProvider": "openai",
  "llmModel": "gpt-4",
  "useHappyTalk": false,
  "compressPrompt": false,
  "compressionLevel": 5
}
```

**Response:**
```json
{
  "success": true,
  "template": {
    "id": "generated-id",
    // ... template data
  },
  "message": "Template created successfully"
}
```

#### Update Template

**Endpoint:** `PUT /api/templates/:id`

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  // ... other fields to update
}
```

**Response:**
```json
{
  "success": true,
  "template": {
    // ... updated template data
  },
  "message": "Template updated successfully"
}
```

#### Delete Template

**Endpoint:** `DELETE /api/templates/:id`

**Response:**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

### 3. Prompt History

#### Get Prompt History

**Endpoint:** `GET /api/prompts/history`

**Query Parameters:**
- `limit` (optional): Number of items to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `format` (optional): Filter by format
- `startDate` (optional): Filter from date (ISO 8601)
- `endDate` (optional): Filter to date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "id": 1,
      "prompt": "Original prompt",
      "enhancedPrompt": "Enhanced version",
      "format": "pipeline",
      "options": {
        "gender": "female",
        "artform": "photography"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

#### Save Prompt

**Endpoint:** `POST /api/prompts/save`

**Request Body:**
```json
{
  "prompt": "Generated prompt",
  "enhancedPrompt": "Enhanced version (optional)",
  "format": "stable",
  "options": {
    "gender": "female",
    "artform": "photography",
    // ... other generation options
  },
  "metadata": {
    "name": "My Prompt",
    "tags": ["portrait", "photography"],
    "favorite": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "prompt": {
    "id": 123,
    // ... saved prompt data
  },
  "message": "Prompt saved successfully"
}
```

#### Delete Prompt from History

**Endpoint:** `DELETE /api/prompts/history/:id`

**Response:**
```json
{
  "success": true,
  "message": "Prompt deleted from history"
}
```

### 4. Presets

#### Get All Presets

**Endpoint:** `GET /api/presets`

**Query Parameters:**
- `type` (optional): Filter by type (character | scene | style)
- `favorite` (optional): Filter favorites only

**Response:**
```json
{
  "success": true,
  "presets": [
    {
      "id": "preset-id",
      "name": "Fantasy Warrior",
      "description": "A fantasy warrior character",
      "type": "character",
      "options": {
        "gender": "female",
        "roles": "warrior",
        // ... other options
      },
      "favorite": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 25
}
```

#### Create Preset

**Endpoint:** `POST /api/presets`

**Request Body:**
```json
{
  "name": "My Preset",
  "description": "Preset description",
  "type": "character",
  "options": {
    "gender": "female",
    "roles": "warrior",
    // ... generation options
  },
  "favorite": false
}
```

**Response:**
```json
{
  "success": true,
  "preset": {
    "id": "generated-id",
    // ... preset data
  },
  "message": "Preset created successfully"
}
```

#### Update Preset

**Endpoint:** `PUT /api/presets/:id`

**Request Body:**
```json
{
  "name": "Updated Name",
  "favorite": true,
  // ... fields to update
}
```

#### Delete Preset

**Endpoint:** `DELETE /api/presets/:id`

### 5. Image Analysis

#### Analyze Image for Prompt

**Endpoint:** `POST /api/analyze-image`

**Request Body (multipart/form-data):**
- `image`: Image file (JPEG, PNG, WebP)
- `extractPrompt`: boolean (extract prompt from metadata)
- `generatePrompt`: boolean (generate prompt from image content)
- `llmProvider`: string (optional, for AI-based analysis)

**Response:**
```json
{
  "success": true,
  "analysis": {
    "extractedPrompt": "Prompt from metadata if available",
    "generatedPrompt": "AI-generated prompt based on image",
    "metadata": {
      "width": 1024,
      "height": 768,
      "format": "PNG",
      "model": "Stable Diffusion XL",
      "parameters": {
        // ... generation parameters
      }
    },
    "tags": ["portrait", "photography", "golden hour"],
    "dominantColors": ["#FFD700", "#FFA500", "#FF6347"]
  }
}
```

### 6. Batch Operations

#### Batch Generate Prompts

**Endpoint:** `POST /api/prompts/batch-generate`

**Request Body:**
```json
{
  "count": 10,
  "baseOptions": {
    "artform": "photography",
    "globalOption": "Random"
  },
  "variations": [
    { "gender": "female" },
    { "gender": "male" }
  ],
  "formats": ["stable", "midjourney", "pipeline"]
}
```

**Response:**
```json
{
  "success": true,
  "prompts": [
    {
      "index": 0,
      "original": "...",
      "formats": {
        "stable": "...",
        "midjourney": "...",
        "pipeline": "..."
      }
    }
  ],
  "total": 10
}
```

### 7. Export/Import

#### Export Data

**Endpoint:** `GET /api/export`

**Query Parameters:**
- `type`: templates | presets | history | all
- `format`: json | csv

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [...],
    "presets": [...],
    "history": [...]
  },
  "exportedAt": "2024-01-01T00:00:00Z"
}
```

#### Import Data

**Endpoint:** `POST /api/import`

**Request Body (multipart/form-data):**
- `file`: JSON or CSV file
- `type`: templates | presets | history
- `mode`: merge | replace

**Response:**
```json
{
  "success": true,
  "imported": {
    "templates": 5,
    "presets": 10,
    "history": 100
  },
  "message": "Data imported successfully"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Default: 100 requests per minute per IP
- Enhanced endpoints: 20 requests per minute per IP
- Batch operations: 5 requests per minute per IP

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - API temporarily down |

## WebSocket Events (Optional)

For real-time updates, connect to the WebSocket endpoint:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

// Events
ws.on('prompt:generated', (data) => {
  // New prompt generated
});

ws.on('template:updated', (data) => {
  // Template updated
});

ws.on('enhancement:progress', (data) => {
  // Enhancement progress update
});
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { PromptGeneratorAPI } from 'promptgenerator-sdk';

const api = new PromptGeneratorAPI({
  baseURL: 'http://localhost:3000/api',
  apiKey: 'optional-api-key'
});

// Enhance a prompt
const enhanced = await api.enhancePrompt({
  prompt: 'fantasy warrior',
  format: 'pipeline'
});

// Get templates
const templates = await api.getTemplates();

// Save prompt
const saved = await api.savePrompt({
  prompt: 'generated prompt',
  format: 'stable'
});
```

### Python

```python
from promptgenerator import PromptGeneratorAPI

api = PromptGeneratorAPI(
    base_url="http://localhost:3000/api",
    api_key="optional-api-key"
)

# Enhance a prompt
enhanced = api.enhance_prompt(
    prompt="fantasy warrior",
    format="pipeline"
)

# Get templates
templates = api.get_templates()

# Save prompt
saved = api.save_prompt(
    prompt="generated prompt",
    format="stable"
)
```

### cURL Examples

```bash
# Enhance prompt
curl -X POST http://localhost:3000/api/enhance-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "fantasy warrior",
    "format": "pipeline",
    "llmProvider": "openai"
  }'

# Get templates
curl http://localhost:3000/api/templates

# Create template
curl -X POST http://localhost:3000/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Template",
    "template": "{subject} in {place}",
    "rules": "Template rules"
  }'
```

## Testing

Use the provided Postman collection or OpenAPI specification for testing:

- [Postman Collection](./postman-collection.json)
- [OpenAPI Spec](./openapi.yaml)

## Support

For API support:
- Check the [FAQ](./FAQ.md)
- Open an issue on GitHub
- Contact the development team