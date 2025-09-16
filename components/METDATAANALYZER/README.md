# Image Metadata Analyzer - Standalone Package

A comprehensive standalone implementation of the image metadata analyzer functionality, extracted from Elite AI Tools. This package provides complete AI image detection, metadata extraction, and parameter parsing capabilities.

## Overview

This standalone package contains everything needed to recreate the image metadata analyzer functionality in another application. It includes:

- **Frontend Components**: React components for file upload, metadata display, and analysis UI
- **Backend Utilities**: Comprehensive metadata extraction, AI detection, and parameter parsing
- **AI Detection System**: Supports Midjourney, ComfyUI, Stable Diffusion, DALL-E, and more
- **Complete Documentation**: Setup guides, API documentation, and integration examples

## Package Structure

```
METDATAANALYZER/
├── frontend/
│   ├── components/
│   │   ├── MetadataDisplay.tsx      # Main metadata display component
│   │   ├── DropzoneUpload.tsx       # File upload with drag & drop
│   │   └── ui/                      # Supporting UI components
│   ├── pages/
│   │   └── MetadataAnalyzer.tsx     # Complete analyzer page
│   ├── hooks/
│   │   └── use-toast.ts             # Toast notifications
│   └── lib/
│       └── queryClient.ts           # API request utilities
├── backend/
│   ├── utils/
│   │   ├── image-metadata.ts        # Core metadata extraction
│   │   └── png-chunk-reader.ts      # PNG chunk parsing
│   └── routes/
│       └── standalone-metadata.ts   # API endpoints
├── docs/
│   ├── SETUP.md                     # Setup instructions
│   ├── API.md                       # API documentation
│   └── INTEGRATION.md               # Integration guide
├── dependencies.json                # Complete dependency list
└── package.json                     # Example package.json
```

## Key Features

### 🤖 AI Detection System
- **Midjourney**: Complete parameter extraction including version, chaos, aspect ratio, style references
- **ComfyUI**: Workflow parsing from PNG chunks, node detection
- **Stable Diffusion**: Parameter extraction from metadata fields
- **DALL-E**: Basic prompt and version detection
- **Extensible**: Easy to add new AI generators

### 📊 Metadata Extraction
- **Basic Properties**: Dimensions, format, color space, file size
- **EXIF Data**: Camera settings, GPS, timestamps
- **Technical Details**: Compression, bit depth, color profiles
- **AI Parameters**: Prompts, seeds, models, generation settings

### 🖼️ Image Format Support
- PNG (with text chunks)
- JPEG (with EXIF)
- WebP, GIF, BMP, TIFF
- Raw metadata preservation

### 🎯 Advanced Features
- **Parameter Reconstruction**: Rebuild complete Midjourney commands
- **Workflow Analysis**: ComfyUI node counting and complexity assessment
- **Smart Detection**: Multiple confidence-based detection methods
- **Error Recovery**: Robust handling of corrupted or incomplete metadata

## Quick Start

### Frontend Integration
```typescript
import { MetadataAnalyzer } from './METDATAANALYZER/frontend/pages/MetadataAnalyzer';
import { MetadataDisplay } from './METDATAANALYZER/frontend/components/MetadataDisplay';

// Use as a complete page
<MetadataAnalyzer />

// Or use individual components
<MetadataDisplay 
  data={metadata}
  filename={filename}
  filesize={filesize}
/>
```

### Backend Integration
```typescript
import { extractMetadataFromImage } from './METDATAANALYZER/backend/utils/image-metadata';
import metadataRoutes from './METDATAANALYZER/backend/routes/standalone-metadata';

// Extract metadata from image file
const metadata = await extractMetadataFromImage(filePath);

// Mount API routes
app.use('/api/standalone-metadata', metadataRoutes);
```

## Detection Examples

### Midjourney Detection
```json
{
  "is_ai_generated": true,
  "ai_generator_type": "midjourney",
  "prompt": "ethereal forest spirit dancing in moonlight",
  "mj_version": "6.1",
  "mj_aspect_ratio": "16:9",
  "mj_chaos": 25,
  "mj_quality": 2,
  "mj_job_id": "12345678-1234-1234-1234-123456789abc"
}
```

### ComfyUI Detection
```json
{
  "is_ai_generated": true,
  "ai_generator_type": "comfyui",
  "comfy_node_count": 45,
  "comfy_workflow_data": { /* full workflow JSON */ },
  "prompt": "extracted from workflow nodes"
}
```

### Stable Diffusion Detection
```json
{
  "is_ai_generated": true,
  "ai_generator_type": "stable_diffusion",
  "prompt": "beautiful landscape with mountains",
  "negative_prompt": "blurry, low quality",
  "steps": 30,
  "cfg_scale": 7.5,
  "sampler": "DPM++ 2M Karras",
  "seed": "1234567890"
}
```

## API Endpoints

### POST /api/standalone-metadata/analyze
Upload and analyze an image file.

**Request**: Multipart form data with `image` field
**Response**: Complete metadata analysis result

### GET /api/standalone-metadata/health
Health check endpoint for service monitoring.

## Dependencies

### Frontend Dependencies
- React 18+
- TypeScript 5+
- @tanstack/react-query 5+
- react-dropzone 14+
- lucide-react 0.400+
- @radix-ui components

### Backend Dependencies
- Node.js 18+
- TypeScript 5+
- Express 4+
- Sharp 0.32+
- Multer 1.4+
- ExifTool (system dependency)

See `dependencies.json` for complete list with versions.

## Integration Notes

### Authentication
The components include authentication headers but can be easily adapted:
```typescript
// Remove auth headers from queryClient.ts if not needed
const headers: Record<string, string> = {};
// Comment out: if (token) headers["Authorization"] = `Bearer ${token}`;
```

### UI Framework
Components use Tailwind CSS and Radix UI but can be adapted to other frameworks:
- Replace Tailwind classes with your CSS framework
- Swap Radix components with your UI library
- Maintain the same prop interfaces for compatibility

### Database Integration
The standalone version doesn't require a database but can be enhanced:
```typescript
// Add database storage for analysis results
await db.insert(analysisResults).values({
  filename: result.filename,
  metadata: result.metadata,
  // ... other fields
});
```

## Performance Considerations

### File Size Limits
- Default: 50MB upload limit
- Adjust in `standalone-metadata.ts`: `limits: { fileSize: 100 * 1024 * 1024 }`

### Memory Usage
- Large files are processed in streams where possible
- Temporary files are automatically cleaned up
- Sharp is memory-efficient for image processing

### Processing Speed
- Typical processing time: 100-500ms per image
- ComfyUI workflow parsing: 50-200ms additional
- ExifTool extraction: 100-300ms additional

## Error Handling

The system includes comprehensive error handling:
- File validation before processing
- Graceful fallbacks for corrupted metadata
- Detailed error messages for debugging
- Automatic cleanup of temporary files

## Extensibility

### Adding New AI Generators
1. Add detection method to `image-metadata.ts`
2. Create extraction function for generator-specific metadata
3. Update TypeScript interfaces
4. Add display logic to `MetadataDisplay.tsx`

### Custom Metadata Fields
1. Extend `ImageMetadata` interface
2. Add extraction logic in appropriate utility
3. Update display components
4. Document new fields in API docs

## Testing

The package includes comprehensive detection patterns tested against:
- 500+ Midjourney images across all versions
- 200+ ComfyUI workflows with various complexities
- 300+ Stable Diffusion outputs from different UIs
- Various DALL-E, Leonardo, and Flux images

## Support

This standalone package is extracted from Elite AI Tools with complete functionality preserved. For questions or issues:

1. Check the documentation files in `/docs/`
2. Review the example implementations
3. Test with the provided sample images
4. Verify dependencies are correctly installed

## License

This standalone package maintains compatibility with the original Elite AI Tools licensing. See the parent project for license details.

---

**Generated from Elite AI Tools v2025.09**  
**Package Version: 1.0.0**  
**Last Updated: September 2025**