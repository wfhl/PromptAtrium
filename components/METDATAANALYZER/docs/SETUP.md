# Setup Guide - Image Metadata Analyzer

Complete setup instructions for integrating the Image Metadata Analyzer into your application.

## Prerequisites

### System Requirements
- Node.js 18+ (recommended: Node.js 20)
- npm/yarn/pnpm package manager
- ExifTool system utility
- TypeScript 5+ (for TypeScript projects)

### ExifTool Installation

**macOS (Homebrew):**
```bash
brew install exiftool
```

**Ubuntu/Debian:**
```bash
sudo apt-get install exiftool
```

**Windows:**
1. Download from https://exiftool.org/
2. Extract and add to PATH
3. Verify with `exiftool -ver`

**Docker:**
```dockerfile
RUN apt-get update && apt-get install -y exiftool
```

## Installation

### 1. Copy Files
Copy the entire `METDATAANALYZER` folder to your project:
```bash
cp -r METDATAANALYZER/ /path/to/your/project/
```

### 2. Install Dependencies

**Frontend Dependencies:**
```bash
npm install @tanstack/react-query@^5.0.0
npm install react-dropzone@^14.0.0
npm install lucide-react@^0.400.0
npm install @radix-ui/react-accordion@^1.1.0
npm install @radix-ui/react-dialog@^1.0.0
npm install @radix-ui/react-dropdown-menu@^2.0.0
npm install @radix-ui/react-slot@^1.0.0
npm install class-variance-authority@^0.7.0
npm install clsx@^2.0.0
npm install tailwind-merge@^2.0.0
```

**Backend Dependencies:**
```bash
npm install express@^4.18.0
npm install multer@^1.4.0
npm install sharp@^0.32.0
npm install @types/express@^4.17.0
npm install @types/multer@^1.4.0
npm install @types/node@^20.0.0
```

**Or use the provided package.json:**
```bash
cp METDATAANALYZER/package.json ./package-additions.json
# Merge dependencies into your existing package.json
```

### 3. TypeScript Configuration

Add to your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"]
    }
  }
}
```

### 4. Tailwind CSS Setup

Add to your `tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./METDATAANALYZER/frontend/**/*.{js,ts,jsx,tsx}",
    // ... your existing content paths
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
    },
  },
};
```

Add CSS variables to your `globals.css`:
```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}
```

## Frontend Integration

### React Query Setup

Wrap your app with QueryClient:
```typescript
// App.tsx or main.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './METDATAANALYZER/frontend/lib/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app content */}
    </QueryClientProvider>
  );
}
```

### Using the Complete Analyzer Page
```typescript
// In your router/pages
import { MetadataAnalyzer } from './METDATAANALYZER/frontend/pages/MetadataAnalyzer';

function AnalyzerPage() {
  return <MetadataAnalyzer />;
}
```

### Using Individual Components
```typescript
import { DropzoneUpload } from './METDATAANALYZER/frontend/components/DropzoneUpload';
import { MetadataDisplay } from './METDATAANALYZER/frontend/components/MetadataDisplay';

function CustomAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState(null);

  const handleAnalyze = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/standalone-metadata/analyze', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    setMetadata(result);
  };

  return (
    <div>
      <DropzoneUpload onFileSelect={setFile} />
      {file && <button onClick={handleAnalyze}>Analyze</button>}
      {metadata && (
        <MetadataDisplay 
          data={metadata}
          filename={metadata.filename}
          filesize={metadata.filesize}
        />
      )}
    </div>
  );
}
```

## Backend Integration

### Express.js Setup
```typescript
// server.ts
import express from 'express';
import metadataRoutes from './METDATAANALYZER/backend/routes/standalone-metadata';

const app = express();

// Mount metadata analyzer routes
app.use('/api/standalone-metadata', metadataRoutes);

// Ensure temp directory exists
import fs from 'fs';
import path from 'path';
const tempDir = path.join(process.cwd(), 'temp_metadata_analysis');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

app.listen(3000);
```

### Direct Utility Usage
```typescript
import { extractMetadataFromImage } from './METDATAANALYZER/backend/utils/image-metadata';

async function analyzeImage(filePath: string) {
  try {
    const metadata = await extractMetadataFromImage(filePath);
    
    if (metadata?.ai_generation?.source !== 'unknown') {
      console.log('AI Generated:', metadata.ai_generation.source);
      console.log('Prompt:', metadata.ai_generation.prompt);
    }
    
    return metadata;
  } catch (error) {
    console.error('Analysis failed:', error);
    return null;
  }
}
```

## Environment Setup

### Development Environment
```bash
# Create .env file
NODE_ENV=development
TEMP_DIR=./temp_metadata_analysis
MAX_FILE_SIZE=52428800
```

### Production Environment
```bash
NODE_ENV=production
TEMP_DIR=/tmp/metadata_analysis
MAX_FILE_SIZE=104857600
EXIFTOOL_PATH=/usr/bin/exiftool
```

## Testing the Integration

### 1. Health Check
```bash
curl http://localhost:3000/api/standalone-metadata/health
# Should return: {"success": true, "message": "Standalone metadata analyzer is running"}
```

### 2. Upload Test
```bash
curl -X POST -F "image=@test-image.png" http://localhost:3000/api/standalone-metadata/analyze
# Should return metadata analysis JSON
```

### 3. Frontend Test
1. Navigate to your analyzer page
2. Upload a test image
3. Verify metadata displays correctly
4. Check browser console for errors

## Common Issues & Solutions

### ExifTool Not Found
```
Error: spawn exiftool ENOENT
```
**Solution:** Install ExifTool and ensure it's in PATH

### File Upload Size Limits
```
Error: File too large
```
**Solution:** Increase limits in `standalone-metadata.ts`:
```typescript
const upload = multer({ 
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});
```

### Memory Issues
```
Error: Cannot allocate memory
```
**Solution:** For large files, implement streaming:
```typescript
// Add to image-metadata.ts
const pipeline = sharp().png({ compressionLevel: 9 });
```

### CSS Styling Issues
**Missing Styles:** Ensure Tailwind includes METDATAANALYZER files in content paths
**Component Styling:** Verify CSS variables are defined
**Dark Mode:** Check dark mode class toggles

### TypeScript Errors
**Path Resolution:** Verify tsconfig.json paths are correct
**Missing Types:** Install @types packages for all dependencies
**Import Errors:** Check file extensions and relative paths

## Performance Optimization

### Image Processing
```typescript
// Optimize Sharp for production
sharp.cache(false); // Disable cache for memory efficiency
sharp.simd(true);   // Enable SIMD operations
```

### File Handling
```typescript
// Stream large files
const stream = sharp(inputPath)
  .resize(1024, 1024, { fit: 'inside' })
  .png({ compressionLevel: 6 });
```

### Caching
```typescript
// Add Redis caching for repeated analyses
const cacheKey = `metadata:${fileHash}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

## Security Considerations

### File Validation
- Validate file types before processing
- Implement virus scanning for uploads
- Sanitize filenames and metadata

### Resource Limits
- Set maximum file sizes
- Implement rate limiting
- Monitor memory usage

### Data Privacy
- Clean up temporary files immediately
- Don't log sensitive metadata
- Implement proper access controls

## Deployment

### Docker Setup
```dockerfile
FROM node:20-alpine
RUN apk add --no-cache exiftool
COPY METDATAANALYZER/ ./METDATAANALYZER/
RUN npm install
EXPOSE 3000
CMD ["node", "server.js"]
```

### Production Checklist
- [ ] ExifTool installed
- [ ] File upload limits configured
- [ ] Error logging enabled
- [ ] Health checks working
- [ ] SSL certificates configured
- [ ] Rate limiting enabled
- [ ] Monitoring setup

## Next Steps

1. **Test thoroughly** with various image types
2. **Customize UI** to match your application design
3. **Add database integration** if needed for persistence
4. **Implement caching** for frequently analyzed images
5. **Add monitoring** and alerting for production use
6. **Scale horizontally** with load balancers if needed

For detailed API documentation, see [API.md](./API.md).  
For integration examples, see [INTEGRATION.md](./INTEGRATION.md).