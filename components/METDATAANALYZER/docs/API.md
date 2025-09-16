# API Documentation - Image Metadata Analyzer

Complete API reference for the Image Metadata Analyzer standalone package.

## Overview

The Image Metadata Analyzer provides REST API endpoints for uploading and analyzing image files. The API returns comprehensive metadata including AI generation parameters, EXIF data, and technical image information.

## Base URL

```
http://localhost:3000/api/standalone-metadata
```

## Endpoints

### 1. Analyze Image

Extract comprehensive metadata from an uploaded image file.

**Endpoint:** `POST /analyze`

**Content-Type:** `multipart/form-data`

**Parameters:**
- `image` (file, required): The image file to analyze
  - Supported formats: PNG, JPEG, GIF, WebP, BMP, TIFF
  - Maximum size: 50MB (configurable)
  - Field name must be exactly `image`

**Example Request:**
```bash
curl -X POST \
  -F "image=@path/to/your/image.png" \
  http://localhost:3000/api/standalone-metadata/analyze
```

**Response Format:**
```typescript
{
  success: boolean;
  filename: string;
  filesize: number;
  
  // Basic image properties
  width: number;
  height: number;
  
  // AI generation detection
  is_ai_generated: boolean;
  ai_generator_type: 'midjourney' | 'comfyui' | 'stable_diffusion' | 'dall-e' | 'unknown';
  
  // Universal AI fields
  prompt?: string;
  negative_prompt?: string;
  steps?: number;
  cfg_scale?: number;
  sampler?: string;
  scheduler?: string;
  seed?: string | number;
  checkpoint_model_name?: string;
  
  // Midjourney specific
  mj_version?: string;
  mj_aspect_ratio?: string;
  mj_chaos?: number;
  mj_quality?: number;
  mj_stylize?: number;
  mj_job_id?: string;
  mj_experimental?: number;
  mj_omni_reference?: string;
  mj_style_references?: string[];
  mj_style_weight?: number;
  mj_weirdness?: number;
  mj_image_weight?: number;
  mj_character_reference?: string;
  mj_character_weight?: number;
  mj_omni_weight?: number;
  mj_raw?: boolean;
  mj_author?: string;
  
  // ComfyUI specific
  comfy_node_count?: number;
  comfy_workflow_id?: string;
  comfy_workflow_data?: object;
  
  // Stable Diffusion extended
  sd_vae?: string;
  sd_clip_skip?: number;
  sd_hires_fix?: boolean;
  
  // Analysis metadata structure
  analysis: {
    id: string;
    timestamp: string;
    imagePath: string;
    metadata: {
      basic: BasicMetadata;
      imageGeneration: AIMetadata;
      exif?: ExifMetadata;
    };
  };
  
  // Complete raw metadata
  complete_metadata: object;
}
```

**Success Response Example:**
```json
{
  "success": true,
  "filename": "midjourney_image.png",
  "filesize": 2048576,
  "width": 1024,
  "height": 1024,
  "is_ai_generated": true,
  "ai_generator_type": "midjourney",
  "prompt": "ethereal forest spirit dancing in moonlight",
  "mj_version": "6.1",
  "mj_aspect_ratio": "1:1",
  "mj_chaos": 25,
  "mj_quality": 2,
  "mj_job_id": "12345678-1234-1234-1234-123456789abc",
  "analysis": {
    "id": "1694123456789",
    "timestamp": "2025-09-05T12:00:00.000Z",
    "imagePath": "midjourney_image.png",
    "metadata": {
      "basic": {
        "width": 1024,
        "height": 1024,
        "format": "PNG",
        "colorSpace": "srgb",
        "channels": 3,
        "hasAlpha": false
      },
      "imageGeneration": {
        "source": "midjourney",
        "prompt": "ethereal forest spirit dancing in moonlight",
        "version": "6.1"
      }
    }
  }
}
```

**Error Response Example:**
```json
{
  "success": false,
  "error": "Only image files are allowed"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (no file, invalid file type)
- `413` - File too large
- `500` - Internal server error

### 2. Health Check

Monitor service availability and status.

**Endpoint:** `GET /health`

**Example Request:**
```bash
curl http://localhost:3000/api/standalone-metadata/health
```

**Response:**
```json
{
  "success": true,
  "message": "Standalone metadata analyzer is running",
  "timestamp": "2025-09-05T12:00:00.000Z"
}
```

## Data Types

### Basic Metadata
```typescript
interface BasicMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
  aspectRatio: number;
  aspectRatioFormatted: string;
  colorSpace: string;
  channels: number;
  depth: string;
  density: number;
  hasAlpha: boolean;
}
```

### AI Metadata
```typescript
interface AIMetadata {
  source: 'midjourney' | 'comfyui' | 'stable_diffusion' | 'dall-e' | 'unknown';
  prompt?: string;
  negativePrompt?: string;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
  seed?: string | number;
  model?: string;
  checkpoint?: string;
  version?: string;
  rawParameters?: object;
  formattedMetadata?: string;
}
```

### EXIF Metadata
```typescript
interface ExifMetadata {
  camera?: string;
  make?: string;
  model?: string;
  software?: string;
  orientation?: string;
  taken_at?: string;
  exposure?: string;
  aperture?: string;
  iso?: string;
  focal_length?: string;
  [key: string]: any;
}
```

## AI Generator Detection

### Midjourney Detection Methods

1. **Digital Source Type** (95% confidence)
   - `DigitalSourceType: "trainedAlgorithmicMedia"`
   - Combined with Author starting with "u"

2. **Filename Pattern** (90% confidence)
   - Pattern: `u{userId}_{prompt}_{uuid}_{index}`
   - Example: `u123_beautiful_sunset_12345678-1234-5678_0.png`

3. **Parameter Patterns** (75% confidence)
   - PNG Description contains: `--v`, `--chaos`, `--ar`, `Job ID:`

4. **Metadata Keywords** (65% confidence)
   - Description or filename contains "midjourney"

### ComfyUI Detection Methods

1. **PNG Workflow Chunks** (90% confidence)
   - Workflow JSON in PNG tEXt/iTXt chunks
   - Keywords: "workflow", "prompt"

2. **Filename Patterns** (80% confidence)
   - Filename contains "comfyui"
   - Metadata contains ComfyUI-specific terms

3. **Node Structure** (70% confidence)
   - JSON contains `class_type`, `inputs`, `outputs`

### Stable Diffusion Detection Methods

1. **Parameters Field** (90% confidence)
   - Contains "Steps:", "CFG scale:", "Sampler:"
   - Automatic1111 format detection

2. **Software Detection** (85% confidence)
   - Software field: "Automatic1111", "InvokeAI", etc.

3. **Metadata Patterns** (80% confidence)
   - PNG Description with SD parameter format

## Parameter Extraction

### Midjourney Parameter Patterns

| Parameter | Pattern | Example |
|-----------|---------|---------|
| Version | `--v \d+(\.\d+)?` | `--v 6.1` |
| Aspect Ratio | `--ar \d+:\d+` | `--ar 16:9` |
| Chaos | `--chaos \d+` | `--chaos 25` |
| Quality | `--q \d+(\.\d+)?` | `--q 2` |
| Stylize | `--stylize \d+` | `--stylize 100` |
| Weirdness | `--weird \d+` | `--weird 50` |
| Style Weight | `--sw \d+(\.\d+)?` | `--sw 200` |
| Image Weight | `--iw \d+(\.\d+)?` | `--iw 1.5` |
| Style References | `--sref [^\-]+` | `--sref https://...` |
| Character Ref | `--cref [^\s]+` | `--cref https://...` |
| Job ID | `Job ID:\s*([a-f0-9-]+)` | `Job ID: 12345...` |

### Stable Diffusion Parameter Patterns

| Parameter | Pattern | Example |
|-----------|---------|---------|
| Prompt | `^(.*?)(?:Negative prompt:\|Steps:\|$)` | Everything before parameters |
| Negative Prompt | `Negative prompt:\s*(.*?)(?:Steps:\|$)` | After "Negative prompt:" |
| Steps | `Steps:\s*(\d+)` | `Steps: 30` |
| CFG Scale | `CFG scale:\s*([\d.]+)` | `CFG scale: 7.5` |
| Seed | `Seed:\s*(\d+)` | `Seed: 1234567890` |
| Sampler | `Sampler:\s*([^\n,]+)` | `Sampler: DPM++ 2M Karras` |
| Model | `Model:\s*([^\n,]+)` | `Model: sd_xl_base_1.0` |

## Error Handling

### Common Errors

**File Upload Errors:**
```json
{
  "success": false,
  "error": "No image file provided"
}
```

**File Type Errors:**
```json
{
  "success": false,
  "error": "Only image files are allowed"
}
```

**File Size Errors:**
```json
{
  "success": false,
  "error": "File too large"
}
```

**Processing Errors:**
```json
{
  "success": false,
  "error": "Failed to extract metadata from image"
}
```

**System Errors:**
```json
{
  "success": false,
  "error": "Internal server error during metadata analysis"
}
```

### Error Recovery

The system includes automatic cleanup:
- Temporary files are deleted after processing
- Failed uploads clean up partial files
- Memory is released after image processing

## Rate Limiting

Implement rate limiting for production use:

```typescript
import rateLimit from 'express-rate-limit';

const analyzeLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many analysis requests, please try again later'
});

app.use('/api/standalone-metadata/analyze', analyzeLimit);
```

## Authentication

The API can be extended with authentication:

```typescript
// Add to routes
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !isValidToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.post('/analyze', requireAuth, upload.single('image'), analyzeHandler);
```

## Caching

Implement caching for repeated analyses:

```typescript
import crypto from 'crypto';

function getFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// In analyze handler
const fileHash = getFileHash(req.file.buffer);
const cacheKey = `metadata:${fileHash}`;

const cached = await cache.get(cacheKey);
if (cached) {
  return res.json(JSON.parse(cached));
}

// ... process file ...

await cache.set(cacheKey, JSON.stringify(result), 3600); // 1 hour
```

## Performance Metrics

### Typical Processing Times

| Operation | Time Range |
|-----------|------------|
| Basic metadata extraction | 50-200ms |
| AI detection | 100-500ms |
| EXIF extraction | 100-300ms |
| ComfyUI workflow parsing | 50-200ms |
| Complete analysis | 200-1000ms |

### Memory Usage

| File Size | Memory Usage |
|-----------|--------------|
| < 5MB | ~50MB |
| 5-20MB | ~100MB |
| 20-50MB | ~200MB |

## Integration Examples

### JavaScript/Node.js
```javascript
const FormData = require('form-data');
const fs = require('fs');

async function analyzeImage(imagePath) {
  const form = new FormData();
  form.append('image', fs.createReadStream(imagePath));
  
  const response = await fetch('http://localhost:3000/api/standalone-metadata/analyze', {
    method: 'POST',
    body: form
  });
  
  return await response.json();
}
```

### Python
```python
import requests

def analyze_image(image_path):
    with open(image_path, 'rb') as f:
        files = {'image': f}
        response = requests.post(
            'http://localhost:3000/api/standalone-metadata/analyze',
            files=files
        )
    return response.json()
```

### cURL
```bash
# Basic analysis
curl -X POST -F "image=@test.png" http://localhost:3000/api/standalone-metadata/analyze

# Save response to file
curl -X POST -F "image=@test.png" http://localhost:3000/api/standalone-metadata/analyze -o result.json

# Pretty print JSON
curl -X POST -F "image=@test.png" http://localhost:3000/api/standalone-metadata/analyze | jq '.'
```

## Testing

### Unit Tests
```typescript
import request from 'supertest';
import app from '../app';

describe('Metadata Analyzer API', () => {
  it('should analyze image successfully', async () => {
    const response = await request(app)
      .post('/api/standalone-metadata/analyze')
      .attach('image', 'test/fixtures/midjourney.png')
      .expect(200);
      
    expect(response.body.success).toBe(true);
    expect(response.body.ai_generator_type).toBe('midjourney');
  });
  
  it('should reject non-image files', async () => {
    const response = await request(app)
      .post('/api/standalone-metadata/analyze')
      .attach('image', 'test/fixtures/document.pdf')
      .expect(400);
      
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Only image files');
  });
});
```

### Load Testing
```bash
# Install Apache Bench
brew install httpd

# Test with concurrent requests
ab -n 1000 -c 10 -p test.png -T multipart/form-data http://localhost:3000/api/standalone-metadata/analyze
```

## Monitoring

### Health Check Integration
```typescript
// Add detailed health check
router.get('/health', async (req, res) => {
  const health = {
    success: true,
    timestamp: new Date().toISOString(),
    services: {
      exiftool: await checkExifTool(),
      sharp: await checkSharp(),
      filesystem: await checkFilesystem()
    }
  };
  
  res.json(health);
});
```

### Logging
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'analyzer.log' })
  ]
});

// Log analysis results
logger.info('Image analyzed', {
  filename: result.filename,
  ai_generated: result.is_ai_generated,
  generator: result.ai_generator_type,
  processing_time: Date.now() - startTime
});
```

## Security

### Input Validation
```typescript
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files allowed'), false);
  }
  
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff'];
  if (!allowedExts.includes(ext)) {
    return cb(new Error('Invalid file extension'), false);
  }
  
  cb(null, true);
};
```

### Sanitization
```typescript
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 255);
}
```

This completes the API documentation for the Image Metadata Analyzer standalone package.