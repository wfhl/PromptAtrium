# Integration Guide - Image Metadata Analyzer

Comprehensive integration examples and patterns for the Image Metadata Analyzer standalone package.

## Table of Contents

1. [Framework Integration](#framework-integration)
2. [Real-World Examples](#real-world-examples)
3. [Advanced Use Cases](#advanced-use-cases)
4. [Database Integration](#database-integration)
5. [Performance Optimization](#performance-optimization)
6. [Custom Extensions](#custom-extensions)

## Framework Integration

### React with TypeScript
```typescript
// hooks/useImageAnalyzer.ts
import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface AnalysisResult {
  success: boolean;
  filename: string;
  filesize: number;
  is_ai_generated: boolean;
  ai_generator_type?: string;
  prompt?: string;
  // ... other fields
}

export function useImageAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/standalone-metadata/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const analysisResult = await response.json();
      setResult(analysisResult);
      return analysisResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeImage, isAnalyzing, result, error };
}

// components/ImageAnalyzer.tsx
import { useImageAnalyzer } from '@/hooks/useImageAnalyzer';
import { DropzoneUpload } from '@/METDATAANALYZER/frontend/components/DropzoneUpload';
import { MetadataDisplay } from '@/METDATAANALYZER/frontend/components/MetadataDisplay';

export function ImageAnalyzer() {
  const { analyzeImage, isAnalyzing, result, error } = useImageAnalyzer();

  const handleFileSelect = async (file: File) => {
    try {
      await analyzeImage(file);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Image Analyzer</h1>
      
      <DropzoneUpload 
        onFileSelect={handleFileSelect}
        isAnalyzing={isAnalyzing}
      />
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-6">
          <MetadataDisplay
            data={result}
            filename={result.filename}
            filesize={result.filesize}
          />
        </div>
      )}
    </div>
  );
}
```

### Next.js App Router
```typescript
// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { extractMetadataFromImage } from '@/METDATAANALYZER/backend/utils/image-metadata';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = path.join('/tmp', `analysis-${Date.now()}-${file.name}`);
    await writeFile(tempPath, buffer);

    try {
      // Analyze the image
      const metadata = await extractMetadataFromImage(tempPath);
      
      const result = {
        success: true,
        filename: file.name,
        filesize: file.size,
        is_ai_generated: metadata?.ai_generation?.source !== 'unknown',
        ai_generator_type: metadata?.ai_generation?.source,
        prompt: metadata?.ai_generation?.prompt,
        complete_metadata: metadata,
      };

      return NextResponse.json(result);
    } finally {
      // Clean up temp file
      await unlink(tempPath).catch(console.error);
    }
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

// app/analyzer/page.tsx
'use client';
import { ImageAnalyzer } from '@/components/ImageAnalyzer';

export default function AnalyzerPage() {
  return <ImageAnalyzer />;
}
```

### Vue 3 with Composition API
```typescript
// composables/useImageAnalyzer.ts
import { ref } from 'vue';

export function useImageAnalyzer() {
  const isAnalyzing = ref(false);
  const result = ref(null);
  const error = ref<string | null>(null);

  const analyzeImage = async (file: File) => {
    isAnalyzing.value = true;
    error.value = null;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/standalone-metadata/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const analysisResult = await response.json();
      result.value = analysisResult;
      return analysisResult;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Analysis failed';
      throw err;
    } finally {
      isAnalyzing.value = false;
    }
  };

  return { analyzeImage, isAnalyzing, result, error };
}

// components/ImageAnalyzer.vue
<template>
  <div class="image-analyzer">
    <h1>AI Image Analyzer</h1>
    
    <div class="upload-area" @drop="handleDrop" @dragover.prevent>
      <input type="file" @change="handleFileSelect" accept="image/*" />
      <p v-if="isAnalyzing">Analyzing...</p>
    </div>
    
    <div v-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-if="result" class="results">
      <h2>Analysis Results</h2>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useImageAnalyzer } from '@/composables/useImageAnalyzer';

const { analyzeImage, isAnalyzing, result, error } = useImageAnalyzer();

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    analyzeImage(file);
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  const file = event.dataTransfer?.files[0];
  if (file) {
    analyzeImage(file);
  }
};
</script>
```

## Real-World Examples

### Digital Asset Management System
```typescript
// services/AssetAnalysisService.ts
import { extractMetadataFromImage } from '@/METDATAANALYZER/backend/utils/image-metadata';
import { db } from '@/lib/database';

export class AssetAnalysisService {
  async processUpload(file: File, userId: string) {
    // Save file to storage
    const filePath = await this.saveToStorage(file);
    
    // Analyze metadata
    const metadata = await extractMetadataFromImage(filePath);
    
    // Store in database
    const asset = await db.assets.create({
      data: {
        filename: file.name,
        filePath,
        fileSize: file.size,
        userId,
        isAiGenerated: metadata?.ai_generation?.source !== 'unknown',
        aiGenerator: metadata?.ai_generation?.source,
        prompt: metadata?.ai_generation?.prompt,
        negativePrompt: metadata?.ai_generation?.negativePrompt,
        metadata: metadata,
        // AI-specific fields
        mjVersion: metadata?.ai_generation?.mjVersion,
        mjJobId: metadata?.ai_generation?.mjJobId,
        sdSampler: metadata?.ai_generation?.sampler,
        sdSteps: metadata?.ai_generation?.steps,
      }
    });
    
    // Tag assets based on AI generation
    if (metadata?.ai_generation?.source !== 'unknown') {
      await this.autoTagAIAsset(asset.id, metadata);
    }
    
    return asset;
  }
  
  private async autoTagAIAsset(assetId: string, metadata: any) {
    const tags = [];
    
    // Add generator tag
    tags.push(`ai-${metadata.ai_generation.source}`);
    
    // Add style tags for Midjourney
    if (metadata.ai_generation.mjStyle) {
      tags.push(`style-${metadata.ai_generation.mjStyle}`);
    }
    
    // Add model tags for Stable Diffusion
    if (metadata.ai_generation.checkpoint) {
      tags.push(`model-${metadata.ai_generation.checkpoint.toLowerCase()}`);
    }
    
    // Apply tags
    await db.assetTags.createMany({
      data: tags.map(tag => ({ assetId, tag }))
    });
  }
}
```

### Content Moderation System
```typescript
// services/ModerationService.ts
import { extractMetadataFromImage } from '@/METDATAANALYZER/backend/utils/image-metadata';

export class ModerationService {
  async analyzeForModeration(imagePath: string) {
    const metadata = await extractMetadataFromImage(imagePath);
    
    const analysis = {
      requiresReview: false,
      flags: [],
      confidence: 0,
      metadata
    };
    
    // Flag AI-generated content
    if (metadata?.ai_generation?.source !== 'unknown') {
      analysis.flags.push({
        type: 'ai_generated',
        source: metadata.ai_generation.source,
        confidence: 0.9
      });
    }
    
    // Check for concerning prompts
    if (metadata?.ai_generation?.prompt) {
      const prompt = metadata.ai_generation.prompt.toLowerCase();
      const concerningTerms = ['violence', 'explicit', 'illegal'];
      
      for (const term of concerningTerms) {
        if (prompt.includes(term)) {
          analysis.flags.push({
            type: 'concerning_prompt',
            term,
            confidence: 0.8
          });
          analysis.requiresReview = true;
        }
      }
    }
    
    // Analyze generation parameters
    if (metadata?.ai_generation?.source === 'midjourney') {
      // Check for unusual parameters that might indicate problematic content
      if (metadata.ai_generation.mjChaos > 80) {
        analysis.flags.push({
          type: 'high_chaos',
          value: metadata.ai_generation.mjChaos,
          confidence: 0.6
        });
      }
    }
    
    return analysis;
  }
}
```

### AI Training Data Classifier
```typescript
// services/TrainingDataService.ts
import { extractMetadataFromImage } from '@/METDATAANALYZER/backend/utils/image-metadata';
import fs from 'fs/promises';
import path from 'path';

export class TrainingDataService {
  async classifyAndOrganize(inputDir: string, outputDir: string) {
    const files = await fs.readdir(inputDir);
    const imageFiles = files.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
    
    const results = {
      processed: 0,
      byGenerator: new Map<string, number>(),
      organized: new Map<string, string[]>()
    };
    
    for (const file of imageFiles) {
      try {
        const inputPath = path.join(inputDir, file);
        const metadata = await extractMetadataFromImage(inputPath);
        
        const generator = metadata?.ai_generation?.source || 'unknown';
        
        // Update statistics
        results.byGenerator.set(
          generator,
          (results.byGenerator.get(generator) || 0) + 1
        );
        
        // Organize by generator
        const outputSubDir = path.join(outputDir, generator);
        await fs.mkdir(outputSubDir, { recursive: true });
        
        // Create metadata file
        const metadataFile = path.join(
          outputSubDir,
          `${path.parse(file).name}_metadata.json`
        );
        await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
        
        // Move image file
        const outputPath = path.join(outputSubDir, file);
        await fs.copyFile(inputPath, outputPath);
        
        // Track organized files
        if (!results.organized.has(generator)) {
          results.organized.set(generator, []);
        }
        results.organized.get(generator)!.push(file);
        
        results.processed++;
      } catch (error) {
        console.error(`Failed to process ${file}:`, error);
      }
    }
    
    // Generate summary report
    const report = {
      totalProcessed: results.processed,
      breakdown: Object.fromEntries(results.byGenerator),
      files: Object.fromEntries(results.organized)
    };
    
    await fs.writeFile(
      path.join(outputDir, 'classification_report.json'),
      JSON.stringify(report, null, 2)
    );
    
    return report;
  }
}
```

## Advanced Use Cases

### Batch Processing with Queue
```typescript
// services/BatchProcessingService.ts
import Queue from 'bull';
import { extractMetadataFromImage } from '@/METDATAANALYZER/backend/utils/image-metadata';

const analysisQueue = new Queue('image analysis', 'redis://localhost:6379');

export class BatchProcessingService {
  constructor() {
    this.setupWorker();
  }
  
  private setupWorker() {
    analysisQueue.process('analyze', 5, async (job) => {
      const { imagePath, userId, options } = job.data;
      
      try {
        const metadata = await extractMetadataFromImage(imagePath);
        
        // Store results
        await this.storeResults(metadata, userId, imagePath);
        
        // Notify completion
        await this.notifyUser(userId, {
          status: 'completed',
          imagePath,
          metadata
        });
        
        return { success: true, metadata };
      } catch (error) {
        await this.notifyUser(userId, {
          status: 'failed',
          imagePath,
          error: error.message
        });
        throw error;
      }
    });
  }
  
  async queueAnalysis(imagePath: string, userId: string, options = {}) {
    const job = await analysisQueue.add('analyze', {
      imagePath,
      userId,
      options
    }, {
      delay: 0,
      attempts: 3,
      backoff: 'exponential'
    });
    
    return job.id;
  }
  
  async getBatchStatus(jobIds: string[]) {
    const jobs = await Promise.all(
      jobIds.map(id => analysisQueue.getJob(id))
    );
    
    return jobs.map(job => ({
      id: job?.id,
      status: job?.opts.attempts ? 'processing' : job?.finishedOn ? 'completed' : 'pending',
      progress: job?.progress() || 0,
      result: job?.returnvalue
    }));
  }
}
```

### Real-time WebSocket Integration
```typescript
// services/RealtimeAnalysisService.ts
import WebSocket from 'ws';
import { extractMetadataFromImage } from '@/METDATAANALYZER/backend/utils/image-metadata';

export class RealtimeAnalysisService {
  private wss: WebSocket.Server;
  
  constructor(server: any) {
    this.wss = new WebSocket.Server({ server });
    this.setupWebSocket();
  }
  
  private setupWebSocket() {
    this.wss.on('connection', (ws) => {
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'analyze') {
            await this.handleAnalysis(ws, data);
          }
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        }
      });
    });
  }
  
  private async handleAnalysis(ws: WebSocket, data: any) {
    const { imagePath, sessionId } = data;
    
    // Send start notification
    ws.send(JSON.stringify({
      type: 'analysis_started',
      sessionId
    }));
    
    try {
      // Perform analysis with progress updates
      const metadata = await this.analyzeWithProgress(imagePath, (progress) => {
        ws.send(JSON.stringify({
          type: 'progress',
          sessionId,
          progress
        }));
      });
      
      // Send results
      ws.send(JSON.stringify({
        type: 'analysis_complete',
        sessionId,
        metadata
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'analysis_error',
        sessionId,
        error: error.message
      }));
    }
  }
  
  private async analyzeWithProgress(
    imagePath: string,
    onProgress: (progress: number) => void
  ) {
    onProgress(10);
    
    const metadata = await extractMetadataFromImage(imagePath);
    onProgress(50);
    
    // Simulate additional processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    onProgress(100);
    
    return metadata;
  }
}
```

## Database Integration

### Prisma Schema Example
```prisma
// schema.prisma
model Image {
  id        String   @id @default(cuid())
  filename  String
  filepath  String
  filesize  Int
  width     Int?
  height    Int?
  createdAt DateTime @default(now())
  userId    String
  
  // AI Generation fields
  isAiGenerated    Boolean @default(false)
  aiGenerator      String?
  prompt           String?
  negativePrompt   String?
  
  // Universal AI fields
  steps            Int?
  cfgScale         Float?
  sampler          String?
  scheduler        String?
  seed             String?
  checkpointModel  String?
  
  // Midjourney specific
  mjVersion        String?
  mjAspectRatio    String?
  mjChaos          Int?
  mjQuality        Float?
  mjStylize        Int?
  mjJobId          String?
  mjExperimental   Int?
  mjWeirdness      Int?
  mjRaw            Boolean?
  
  // ComfyUI specific
  comfyNodeCount   Int?
  comfyWorkflowId  String?
  
  // Raw metadata
  rawMetadata      Json?
  
  // Relations
  user             User     @relation(fields: [userId], references: [id])
  tags             ImageTag[]
  
  @@map("images")
}

model ImageTag {
  id      String @id @default(cuid())
  imageId String
  tag     String
  
  image   Image  @relation(fields: [imageId], references: [id])
  
  @@unique([imageId, tag])
  @@map("image_tags")
}
```

### Database Service Implementation
```typescript
// services/ImageDatabaseService.ts
import { PrismaClient } from '@prisma/client';
import { extractMetadataFromImage } from '@/METDATAANALYZER/backend/utils/image-metadata';

export class ImageDatabaseService {
  constructor(private prisma: PrismaClient) {}
  
  async createFromAnalysis(
    filepath: string,
    filename: string,
    filesize: number,
    userId: string
  ) {
    const metadata = await extractMetadataFromImage(filepath);
    
    const imageData = {
      filename,
      filepath,
      filesize,
      userId,
      width: metadata?.width,
      height: metadata?.height,
      isAiGenerated: metadata?.ai_generation?.source !== 'unknown',
      aiGenerator: metadata?.ai_generation?.source,
      prompt: metadata?.ai_generation?.prompt,
      negativePrompt: metadata?.ai_generation?.negativePrompt,
      steps: metadata?.ai_generation?.steps,
      cfgScale: metadata?.ai_generation?.cfgScale,
      sampler: metadata?.ai_generation?.sampler,
      seed: typeof metadata?.ai_generation?.seed === 'string' 
        ? metadata.ai_generation.seed 
        : metadata?.ai_generation?.seed?.toString(),
      checkpointModel: metadata?.ai_generation?.checkpoint,
      
      // Midjourney fields
      mjVersion: metadata?.ai_generation?.mjVersion,
      mjAspectRatio: metadata?.ai_generation?.mjAspectRatio,
      mjChaos: metadata?.ai_generation?.mjChaos,
      mjQuality: metadata?.ai_generation?.mjQuality,
      mjStylize: metadata?.ai_generation?.mjStylize,
      mjJobId: metadata?.ai_generation?.mjJobId,
      mjExperimental: metadata?.ai_generation?.mjExperimental,
      mjWeirdness: metadata?.ai_generation?.mjWeirdness,
      mjRaw: metadata?.ai_generation?.mjRaw,
      
      // ComfyUI fields
      comfyNodeCount: metadata?.ai_generation?.rawParameters?.comfyNodeCount,
      comfyWorkflowId: metadata?.ai_generation?.rawParameters?.comfyWorkflowId,
      
      rawMetadata: metadata
    };
    
    const image = await this.prisma.image.create({ data: imageData });
    
    // Auto-generate tags
    await this.generateTags(image.id, metadata);
    
    return image;
  }
  
  private async generateTags(imageId: string, metadata: any) {
    const tags = [];
    
    // Generator tag
    if (metadata?.ai_generation?.source && metadata.ai_generation.source !== 'unknown') {
      tags.push(`generator:${metadata.ai_generation.source}`);
    }
    
    // Version tags
    if (metadata?.ai_generation?.mjVersion) {
      tags.push(`midjourney:v${metadata.ai_generation.mjVersion}`);
    }
    
    // Style tags
    if (metadata?.ai_generation?.mjStyle) {
      tags.push(`style:${metadata.ai_generation.mjStyle}`);
    }
    
    // Model tags
    if (metadata?.ai_generation?.checkpoint) {
      tags.push(`model:${metadata.ai_generation.checkpoint.toLowerCase()}`);
    }
    
    // Quality indicators
    if (metadata?.ai_generation?.mjQuality && metadata.ai_generation.mjQuality >= 2) {
      tags.push('high-quality');
    }
    
    if (tags.length > 0) {
      await this.prisma.imageTag.createMany({
        data: tags.map(tag => ({ imageId, tag }))
      });
    }
  }
  
  async searchByMetadata(filters: {
    aiGenerator?: string;
    hasPrompt?: boolean;
    mjVersion?: string;
    minQuality?: number;
    tags?: string[];
  }) {
    const where: any = {};
    
    if (filters.aiGenerator) {
      where.aiGenerator = filters.aiGenerator;
    }
    
    if (filters.hasPrompt) {
      where.prompt = { not: null };
    }
    
    if (filters.mjVersion) {
      where.mjVersion = filters.mjVersion;
    }
    
    if (filters.minQuality) {
      where.mjQuality = { gte: filters.minQuality };
    }
    
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        some: {
          tag: { in: filters.tags }
        }
      };
    }
    
    return this.prisma.image.findMany({
      where,
      include: {
        tags: true,
        user: { select: { id: true, name: true } }
      }
    });
  }
}
```

## Performance Optimization

### Caching Layer
```typescript
// services/CacheService.ts
import Redis from 'ioredis';
import crypto from 'crypto';

export class MetadataCacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  private getFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
  
  async getCachedMetadata(fileBuffer: Buffer) {
    const hash = this.getFileHash(fileBuffer);
    const cached = await this.redis.get(`metadata:${hash}`);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  }
  
  async setCachedMetadata(fileBuffer: Buffer, metadata: any, ttl = 3600) {
    const hash = this.getFileHash(fileBuffer);
    await this.redis.setex(
      `metadata:${hash}`,
      ttl,
      JSON.stringify(metadata)
    );
  }
  
  async getAnalysisStats() {
    const keys = await this.redis.keys('metadata:*');
    const stats = {
      totalCached: keys.length,
      cacheHits: await this.redis.get('cache_hits') || '0',
      cacheMisses: await this.redis.get('cache_misses') || '0'
    };
    
    return stats;
  }
}
```

### Background Processing
```typescript
// services/BackgroundProcessor.ts
import { Worker, Job } from 'bullmq';
import { extractMetadataFromImage } from '@/METDATAANALYZER/backend/utils/image-metadata';

export class BackgroundMetadataProcessor {
  private worker: Worker;
  
  constructor() {
    this.worker = new Worker('metadata-analysis', this.processJob.bind(this), {
      connection: { host: 'localhost', port: 6379 },
      concurrency: 3,
    });
  }
  
  private async processJob(job: Job) {
    const { imagePath, callback } = job.data;
    
    try {
      const metadata = await extractMetadataFromImage(imagePath);
      
      // Call webhook or update database
      if (callback) {
        await this.notifyCompletion(callback, metadata);
      }
      
      return { success: true, metadata };
    } catch (error) {
      throw new Error(`Processing failed: ${error.message}`);
    }
  }
  
  private async notifyCompletion(callbackUrl: string, metadata: any) {
    try {
      await fetch(callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata })
      });
    } catch (error) {
      console.error('Callback notification failed:', error);
    }
  }
}
```

This integration guide provides comprehensive examples for implementing the Image Metadata Analyzer in various frameworks and scenarios. Each example includes error handling, performance considerations, and real-world patterns.