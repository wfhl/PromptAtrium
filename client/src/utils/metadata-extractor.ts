/**
 * Browser-compatible metadata extraction utilities
 * For extracting comprehensive metadata from images including AI generation data
 */

interface ImageMetadata {
  // Basic properties
  width?: number;
  height?: number;
  fileSize?: number;
  fileName?: string;
  fileType?: string;
  dimensionString?: string;
  aspectRatio?: string;
  lastModified?: string;
  
  // AI Generation
  isAIGenerated?: boolean;
  aiGenerator?: 'stable-diffusion' | 'midjourney' | 'comfyui' | 'dall-e' | 'unknown';
  prompt?: string;
  negativePrompt?: string;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
  seed?: string | number;
  model?: string;
  
  // Midjourney specific
  mjVersion?: string;
  mjJobId?: string;
  mjAspectRatio?: string;
  mjChaos?: number;
  mjQuality?: number;
  mjStylize?: number;
  mjWeirdness?: number;
  mjAuthor?: string;
  mjRaw?: boolean;
  
  // DALL-E specific
  dalleVersion?: string;
  dalleQuality?: string;
  dalleStyle?: string;
  
  // Raw metadata
  rawMetadata?: any;
}

export class MetadataExtractor {
  /**
   * Extract all metadata from an image file
   */
  static async extractFromFile(file: File): Promise<ImageMetadata> {
    const metadata: ImageMetadata = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lastModified: new Date(file.lastModified).toLocaleString()
    };

    // Get image dimensions
    const dimensions = await this.getImageDimensions(file);
    Object.assign(metadata, dimensions);

    // Extract metadata based on file type
    if (file.type === 'image/png') {
      const pngMetadata = await this.extractPNGMetadata(file);
      Object.assign(metadata, pngMetadata);
    } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      const jpegMetadata = await this.extractJPEGMetadata(file);
      Object.assign(metadata, jpegMetadata);
    } else if (file.type === 'image/webp') {
      const webpMetadata = await this.extractWebPMetadata(file);
      Object.assign(metadata, webpMetadata);
    }

    // Detect AI generator
    const aiDetection = this.detectAIGenerator(metadata);
    Object.assign(metadata, aiDetection);

    return metadata;
  }

  /**
   * Get image dimensions
   */
  private static getImageDimensions(file: File): Promise<Partial<ImageMetadata>> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const gcd = this.calculateGCD(width, height);
        const aspectRatio = `${width / gcd}:${height / gcd}`;
        
        URL.revokeObjectURL(url);
        resolve({
          width,
          height,
          dimensionString: `${width} × ${height}`,
          aspectRatio
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({});
      };
      
      img.src = url;
    });
  }

  /**
   * Simple DEFLATE decompressor for zlib-compressed data
   */
  private static inflateSync(compressed: Uint8Array): Uint8Array | null {
    try {
      // For browser compatibility, we'll use the built-in DecompressionStream if available
      // Otherwise return null and handle uncompressed data only
      if (typeof DecompressionStream !== 'undefined') {
        const ds = new DecompressionStream('deflate');
        const writer = ds.writable.getWriter();
        writer.write(compressed);
        writer.close();
        
        return new Response(ds.readable).arrayBuffer().then(buffer => new Uint8Array(buffer)) as any;
      }
      return null;
    } catch (error) {
      console.warn('Decompression failed:', error);
      return null;
    }
  }

  /**
   * Extract PNG metadata including all text chunks (tEXt, zTXt, iTXt)
   */
  private static async extractPNGMetadata(file: File): Promise<Partial<ImageMetadata>> {
    try {
      const buffer = await file.arrayBuffer();
      const view = new DataView(buffer);
      const metadata: Partial<ImageMetadata> = {};
      
      // Check PNG signature
      const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      for (let i = 0; i < 8; i++) {
        if (view.getUint8(i) !== pngSignature[i]) {
          return metadata;
        }
      }
      
      let pos = 8;
      const textChunks: Record<string, string> = {};
      
      while (pos < buffer.byteLength - 12) {
        const chunkLength = view.getUint32(pos);
        const chunkType = this.readString(view, pos + 4, 4);
        
        if (chunkType === 'tEXt') {
          // Uncompressed text
          const chunkData = new Uint8Array(buffer, pos + 8, chunkLength);
          const nullIndex = chunkData.indexOf(0);
          
          if (nullIndex !== -1) {
            const keyword = new TextDecoder().decode(chunkData.slice(0, nullIndex));
            const text = new TextDecoder().decode(chunkData.slice(nullIndex + 1));
            textChunks[keyword] = text;
          }
        } else if (chunkType === 'zTXt') {
          // Compressed text
          const chunkData = new Uint8Array(buffer, pos + 8, chunkLength);
          const nullIndex = chunkData.indexOf(0);
          
          if (nullIndex !== -1) {
            const keyword = new TextDecoder().decode(chunkData.slice(0, nullIndex));
            const compressionMethod = chunkData[nullIndex + 1];
            
            if (compressionMethod === 0) { // DEFLATE compression
              const compressedText = chunkData.slice(nullIndex + 2);
              // Try to decompress - for now we'll skip compressed chunks in browser
              // A full implementation would use pako or similar library
              console.log('Found compressed zTXt chunk:', keyword);
            }
          }
        } else if (chunkType === 'iTXt') {
          // International text (may be compressed)
          const chunkData = new Uint8Array(buffer, pos + 8, chunkLength);
          let offset = 0;
          
          // Find keyword
          const keywordEnd = chunkData.indexOf(0, offset);
          if (keywordEnd !== -1) {
            const keyword = new TextDecoder().decode(chunkData.slice(offset, keywordEnd));
            offset = keywordEnd + 1;
            
            // Compression flag
            const compressionFlag = chunkData[offset++];
            const compressionMethod = chunkData[offset++];
            
            // Language tag (skip to next null)
            const langEnd = chunkData.indexOf(0, offset);
            if (langEnd !== -1) {
              offset = langEnd + 1;
              
              // Translated keyword (skip to next null)
              const transEnd = chunkData.indexOf(0, offset);
              if (transEnd !== -1) {
                offset = transEnd + 1;
                
                // Text (may be compressed)
                const textData = chunkData.slice(offset);
                
                if (compressionFlag === 0) {
                  // Uncompressed
                  const text = new TextDecoder('utf-8').decode(textData);
                  textChunks[keyword] = text;
                } else if (compressionFlag === 1 && compressionMethod === 0) {
                  // DEFLATE compressed - for now we'll skip in browser
                  console.log('Found compressed iTXt chunk:', keyword);
                }
              }
            }
          }
        }
        
        pos += 12 + chunkLength; // 4 (length) + 4 (type) + chunkLength + 4 (CRC)
        
        if (chunkType === 'IEND') break;
      }
      
      // Process text chunks for AI metadata
      const parametersText = textChunks['parameters'] || textChunks['Parameters'] || 
                            textChunks['Description'] || textChunks['description'] || '';
      
      if (parametersText) {
        metadata.rawMetadata = { parameters: parametersText };
        
        // Check for Stable Diffusion
        if (parametersText.includes('Steps:') || parametersText.includes('CFG scale:')) {
          const sdMetadata = this.parseStableDiffusionParameters(parametersText);
          Object.assign(metadata, sdMetadata);
        }
        
        // Check for Midjourney
        if (parametersText.includes('--v ') || parametersText.includes('Job ID:')) {
          const mjMetadata = this.parseMidjourneyParameters(parametersText);
          Object.assign(metadata, mjMetadata);
        }
      }
      
      // ComfyUI workflow
      if (textChunks['workflow']) {
        try {
          const workflow = JSON.parse(textChunks['workflow']);
          metadata.rawMetadata = { ...metadata.rawMetadata, workflow };
          metadata.aiGenerator = 'comfyui';
        } catch (e) {
          console.warn('Failed to parse ComfyUI workflow');
        }
      }
      
      // Direct prompt field
      if (textChunks['prompt']) {
        metadata.prompt = textChunks['prompt'];
      }
      
      return metadata;
    } catch (error) {
      console.error('Error extracting PNG metadata:', error);
      return {};
    }
  }

  /**
   * Extract JPEG metadata including XMP data
   */
  private static async extractJPEGMetadata(file: File): Promise<Partial<ImageMetadata>> {
    try {
      const buffer = await file.arrayBuffer();
      const view = new DataView(buffer);
      const metadata: Partial<ImageMetadata> = {};
      
      // Check for JPEG signature
      if (view.getUint16(0) !== 0xFFD8) {
        return metadata;
      }
      
      let offset = 2;
      
      while (offset < buffer.byteLength - 2) {
        const marker = view.getUint16(offset);
        offset += 2;
        
        if (marker === 0xFFE1) {
          // APP1 marker (EXIF or XMP)
          const length = view.getUint16(offset);
          offset += 2;
          
          const data = new Uint8Array(buffer, offset, length - 2);
          
          // Check for XMP
          const xmpHeader = 'http://ns.adobe.com/xap/1.0/\0';
          const xmpHeaderBytes = new TextEncoder().encode(xmpHeader);
          
          let isXMP = true;
          for (let i = 0; i < Math.min(xmpHeaderBytes.length, data.length); i++) {
            if (data[i] !== xmpHeaderBytes[i]) {
              isXMP = false;
              break;
            }
          }
          
          if (isXMP) {
            // Parse XMP data
            const xmpString = new TextDecoder().decode(data.slice(xmpHeaderBytes.length));
            metadata.rawMetadata = { ...metadata.rawMetadata, xmp: xmpString };
            
            // Extract description (common location for AI prompts)
            const descMatch = xmpString.match(/<dc:description[^>]*>(.*?)<\/dc:description>/s);
            if (descMatch) {
              const description = descMatch[1]
                .replace(/<[^>]+>/g, '') // Remove XML tags
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#x([0-9A-F]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
                .trim();
              
              // Check for Midjourney patterns
              if (description.includes('--v ') || description.includes('Job ID:')) {
                const mjMetadata = this.parseMidjourneyParameters(description);
                Object.assign(metadata, mjMetadata);
              }
              
              // Check for DALL-E patterns
              if (description.includes('DALL·E') || description.includes('DALL-E') || 
                  description.includes('OpenAI')) {
                metadata.prompt = description;
                metadata.aiGenerator = 'dall-e';
              }
            }
            
            // Look for other AI-related fields
            if (xmpString.includes('Midjourney')) {
              metadata.aiGenerator = 'midjourney';
            }
            if (xmpString.includes('Stable Diffusion')) {
              metadata.aiGenerator = 'stable-diffusion';
            }
            if (xmpString.includes('DALL')) {
              metadata.aiGenerator = 'dall-e';
            }
          }
          
          offset += length - 2;
        } else if (marker === 0xFFE0) {
          // APP0 (JFIF)
          const length = view.getUint16(offset);
          offset += length;
        } else if ((marker & 0xFF00) === 0xFF00 && marker !== 0xFF00) {
          // Other markers with length
          if (marker === 0xFFDA) {
            // Start of scan - rest is image data
            break;
          }
          const length = view.getUint16(offset);
          offset += length;
        }
      }
      
      return metadata;
    } catch (error) {
      console.error('Error extracting JPEG metadata:', error);
      return {};
    }
  }

  /**
   * Extract WebP metadata
   */
  private static async extractWebPMetadata(file: File): Promise<Partial<ImageMetadata>> {
    try {
      const buffer = await file.arrayBuffer();
      const view = new DataView(buffer);
      const metadata: Partial<ImageMetadata> = {};
      
      // Check WebP signature
      const riff = this.readString(view, 0, 4);
      const webp = this.readString(view, 8, 4);
      
      if (riff !== 'RIFF' || webp !== 'WEBP') {
        return metadata;
      }
      
      // WebP may contain EXIF or XMP chunks
      let offset = 12;
      
      while (offset < buffer.byteLength - 8) {
        const chunkType = this.readString(view, offset, 4);
        const chunkSize = view.getUint32(offset + 4, true); // Little endian
        
        if (chunkType === 'EXIF') {
          // EXIF data
          const exifData = new Uint8Array(buffer, offset + 8, chunkSize);
          const exifString = new TextDecoder().decode(exifData);
          metadata.rawMetadata = { ...metadata.rawMetadata, exif: exifString };
        } else if (chunkType === 'XMP ') {
          // XMP data
          const xmpData = new Uint8Array(buffer, offset + 8, chunkSize);
          const xmpString = new TextDecoder().decode(xmpData);
          metadata.rawMetadata = { ...metadata.rawMetadata, xmp: xmpString };
          
          // Parse for AI metadata similar to JPEG
          if (xmpString.includes('Midjourney')) {
            metadata.aiGenerator = 'midjourney';
          }
          if (xmpString.includes('Stable Diffusion')) {
            metadata.aiGenerator = 'stable-diffusion';
          }
          if (xmpString.includes('DALL')) {
            metadata.aiGenerator = 'dall-e';
          }
        }
        
        offset += 8 + chunkSize;
        if (chunkSize % 2 === 1) offset++; // Padding byte for odd-sized chunks
      }
      
      return metadata;
    } catch (error) {
      console.error('Error extracting WebP metadata:', error);
      return {};
    }
  }

  /**
   * Parse Stable Diffusion parameters
   */
  private static parseStableDiffusionParameters(params: string): Partial<ImageMetadata> {
    const metadata: Partial<ImageMetadata> = {};
    
    // Extract prompt (everything before "Negative prompt:" or "Steps:")
    const promptMatch = params.match(/^(.*?)(?:Negative prompt:|Steps:|$)/s);
    if (promptMatch) {
      metadata.prompt = promptMatch[1].trim();
    }
    
    // Extract negative prompt
    const negPromptMatch = params.match(/Negative prompt:\s*(.*?)(?:Steps:|$)/s);
    if (negPromptMatch) {
      metadata.negativePrompt = negPromptMatch[1].trim();
    }
    
    // Extract steps
    const stepsMatch = params.match(/Steps:\s*(\d+)/i);
    if (stepsMatch) {
      metadata.steps = parseInt(stepsMatch[1]);
    }
    
    // Extract CFG scale
    const cfgMatch = params.match(/CFG scale:\s*([\d.]+)/i);
    if (cfgMatch) {
      metadata.cfgScale = parseFloat(cfgMatch[1]);
    }
    
    // Extract seed
    const seedMatch = params.match(/Seed:\s*(\d+)/i);
    if (seedMatch) {
      metadata.seed = seedMatch[1];
    }
    
    // Extract sampler
    const samplerMatch = params.match(/Sampler:\s*([^,\n]+)/i);
    if (samplerMatch) {
      metadata.sampler = samplerMatch[1].trim();
    }
    
    // Extract model
    const modelMatch = params.match(/Model:\s*([^,\n]+)/i);
    if (modelMatch) {
      metadata.model = modelMatch[1].trim();
    }
    
    return metadata;
  }

  /**
   * Parse Midjourney parameters
   */
  private static parseMidjourneyParameters(description: string): Partial<ImageMetadata> {
    const metadata: Partial<ImageMetadata> = {};
    
    // Extract prompt (everything before parameters or Job ID)
    const promptMatch = description.match(/^(.*?)(?:\s--|\sJob ID:|$)/);
    if (promptMatch && promptMatch[1].trim()) {
      metadata.prompt = promptMatch[1].trim();
    }
    
    // Extract version
    const versionMatch = description.match(/--v\s+(\d+(?:\.\d+)?)/);
    if (versionMatch) {
      metadata.mjVersion = versionMatch[1];
    }
    
    // Extract aspect ratio
    const arMatch = description.match(/--ar\s+(\d+:\d+)/);
    if (arMatch) {
      metadata.mjAspectRatio = arMatch[1];
    }
    
    // Extract chaos
    const chaosMatch = description.match(/--chaos\s+(\d+)/);
    if (chaosMatch) {
      metadata.mjChaos = parseInt(chaosMatch[1]);
    }
    
    // Extract quality
    const qualityMatch = description.match(/--q(?:uality)?\s+(\d+(?:\.\d+)?)/);
    if (qualityMatch) {
      metadata.mjQuality = parseFloat(qualityMatch[1]);
    }
    
    // Extract stylize
    const stylizeMatch = description.match(/--stylize\s+(\d+)/);
    if (stylizeMatch) {
      metadata.mjStylize = parseInt(stylizeMatch[1]);
    }
    
    // Extract weirdness
    const weirdMatch = description.match(/--(?:weird|w)\s+(\d+)/);
    if (weirdMatch) {
      metadata.mjWeirdness = parseInt(weirdMatch[1]);
    }
    
    // Extract raw flag
    if (description.includes('--style raw')) {
      metadata.mjRaw = true;
    }
    
    // Extract Job ID
    const jobIdMatch = description.match(/Job ID:\s*([a-f0-9-]+)/i);
    if (jobIdMatch) {
      metadata.mjJobId = jobIdMatch[1];
    }
    
    return metadata;
  }

  /**
   * Parse DALL-E metadata patterns
   */
  private static parseDALLEMetadata(text: string): Partial<ImageMetadata> {
    const metadata: Partial<ImageMetadata> = {};
    
    // DALL-E typically stores prompt in description
    if (text.includes('DALL·E') || text.includes('DALL-E') || text.includes('OpenAI')) {
      metadata.prompt = text
        .replace(/DALL·E\s*\d*/gi, '')
        .replace(/OpenAI/gi, '')
        .trim();
      
      // Extract version if present
      const versionMatch = text.match(/DALL·E\s*(\d+)/i);
      if (versionMatch) {
        metadata.dalleVersion = versionMatch[1];
      }
      
      // Look for quality/style indicators
      if (text.includes('HD') || text.includes('high quality')) {
        metadata.dalleQuality = 'hd';
      }
      if (text.includes('vivid')) {
        metadata.dalleStyle = 'vivid';
      } else if (text.includes('natural')) {
        metadata.dalleStyle = 'natural';
      }
    }
    
    return metadata;
  }

  /**
   * Detect AI generator based on metadata patterns
   */
  private static detectAIGenerator(metadata: Partial<ImageMetadata>): Partial<ImageMetadata> {
    const result: Partial<ImageMetadata> = {};
    
    // Already detected from parsing
    if (metadata.aiGenerator && metadata.aiGenerator !== 'unknown') {
      result.aiGenerator = metadata.aiGenerator;
      result.isAIGenerated = true;
      return result;
    }
    
    // Check for Midjourney patterns
    if (metadata.mjVersion || metadata.mjJobId || 
        (metadata.prompt && metadata.prompt.match(/--v\s+\d+|--chaos\s+\d+|--ar\s+\d+:\d+/))) {
      result.aiGenerator = 'midjourney';
      result.isAIGenerated = true;
      return result;
    }
    
    // Check for Stable Diffusion patterns
    if (metadata.steps !== undefined || metadata.cfgScale !== undefined || 
        metadata.sampler || (metadata.prompt && metadata.negativePrompt)) {
      result.aiGenerator = 'stable-diffusion';
      result.isAIGenerated = true;
      return result;
    }
    
    // Check for DALL-E patterns
    if (metadata.dalleVersion || metadata.dalleQuality || metadata.dalleStyle ||
        (metadata.prompt && (metadata.prompt.includes('DALL') || metadata.prompt.includes('OpenAI')))) {
      result.aiGenerator = 'dall-e';
      result.isAIGenerated = true;
      return result;
    }
    
    // Check filename patterns for Midjourney
    if (metadata.fileName) {
      const filename = metadata.fileName.toLowerCase();
      
      // Discord/Midjourney naming patterns
      // Format: username_prompt_words_UUID_index.png
      if (filename.match(/^[a-zA-Z0-9_]+_.*_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}_\d+/)) {
        result.aiGenerator = 'midjourney';
        result.isAIGenerated = true;
        
        // Extract username
        const usernameMatch = filename.match(/^([a-zA-Z0-9_]+)_/);
        if (usernameMatch) {
          result.mjAuthor = usernameMatch[1];
        }
        return result;
      }
      
      // DALL-E naming pattern
      if (filename.includes('dall-e') || filename.includes('openai')) {
        result.aiGenerator = 'dall-e';
        result.isAIGenerated = true;
        return result;
      }
      
      // ComfyUI naming pattern
      if (filename.includes('comfyui') || filename.match(/^\d{5}-\d{6}/)) {
        result.aiGenerator = 'comfyui';
        result.isAIGenerated = true;
        return result;
      }
    }
    
    result.aiGenerator = 'unknown';
    result.isAIGenerated = false;
    return result;
  }

  /**
   * Helper function to read string from DataView
   */
  private static readString(view: DataView, offset: number, length: number): string {
    let str = '';
    for (let i = 0; i < length; i++) {
      str += String.fromCharCode(view.getUint8(offset + i));
    }
    return str;
  }

  /**
   * Calculate greatest common divisor
   */
  private static calculateGCD(a: number, b: number): number {
    return b === 0 ? a : this.calculateGCD(b, a % b);
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}