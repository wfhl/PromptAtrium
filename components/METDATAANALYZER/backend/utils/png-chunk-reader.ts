/**
 * PNG Chunk Reader for ComfyUI Metadata Extraction
 * 
 * Directly reads PNG chunks to extract ComfyUI workflow data
 * that may not be accessible through standard EXIF tools.
 */

import fs from 'fs';

interface PNGChunk {
  length: number;
  type: string;
  data: Buffer;
  crc: number;
}

/**
 * Read PNG chunks directly from file buffer
 * @param filePath Path to PNG file
 * @returns Array of PNG chunks
 */
export function readPNGChunks(filePath: string): PNGChunk[] {
  const buffer = fs.readFileSync(filePath);
  const chunks: PNGChunk[] = [];
  
  // Verify PNG signature
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  if (!buffer.subarray(0, 8).equals(pngSignature)) {
    throw new Error('Not a valid PNG file');
  }
  
  let offset = 8; // Skip PNG signature
  
  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) break;
    
    // Read chunk length (4 bytes, big-endian)
    const length = buffer.readUInt32BE(offset);
    offset += 4;
    
    // Read chunk type (4 bytes, ASCII)
    const type = buffer.subarray(offset, offset + 4).toString('ascii');
    offset += 4;
    
    // Read chunk data
    if (offset + length > buffer.length) break;
    const data = buffer.subarray(offset, offset + length);
    offset += length;
    
    // Read CRC (4 bytes)
    if (offset + 4 > buffer.length) break;
    const crc = buffer.readUInt32BE(offset);
    offset += 4;
    
    chunks.push({ length, type, data, crc });
    
    // Stop at IEND chunk
    if (type === 'IEND') break;
  }
  
  return chunks;
}

/**
 * Extract text chunks from PNG (tEXt, zTXt, iTXt)
 * @param chunks PNG chunks array
 * @returns Object with text chunk data
 */
export function extractTextChunks(chunks: PNGChunk[]): Record<string, string> {
  const textData: Record<string, string> = {};
  
  for (const chunk of chunks) {
    if (chunk.type === 'tEXt') {
      // Uncompressed text chunk
      const nullIndex = chunk.data.indexOf(0);
      if (nullIndex > 0) {
        const keyword = chunk.data.subarray(0, nullIndex).toString('latin1');
        const text = chunk.data.subarray(nullIndex + 1).toString('latin1');
        textData[keyword] = text;
      }
    } else if (chunk.type === 'zTXt') {
      // Compressed text chunk
      const nullIndex = chunk.data.indexOf(0);
      if (nullIndex > 0) {
        const keyword = chunk.data.subarray(0, nullIndex).toString('latin1');
        const compressionMethod = chunk.data[nullIndex + 1];
        if (compressionMethod === 0) { // deflate
          try {
            const zlib = require('zlib');
            const compressed = chunk.data.subarray(nullIndex + 2);
            const decompressed = zlib.inflateSync(compressed);
            textData[keyword] = decompressed.toString('latin1');
          } catch (error) {
            console.warn(`Failed to decompress zTXt chunk for keyword: ${keyword}`);
          }
        }
      }
    } else if (chunk.type === 'iTXt') {
      // International text chunk
      const data = chunk.data;
      let offset = 0;
      
      // Find keyword (null-terminated)
      const keywordEnd = data.indexOf(0, offset);
      if (keywordEnd === -1) continue;
      const keyword = data.subarray(offset, keywordEnd).toString('utf8');
      offset = keywordEnd + 1;
      
      // Compression flag and method
      if (offset >= data.length) continue;
      const compressionFlag = data[offset++];
      if (offset >= data.length) continue;
      const compressionMethod = data[offset++];
      
      // Language tag (null-terminated)
      const languageEnd = data.indexOf(0, offset);
      if (languageEnd === -1) continue;
      offset = languageEnd + 1;
      
      // Translated keyword (null-terminated)
      const translatedEnd = data.indexOf(0, offset);
      if (translatedEnd === -1) continue;
      offset = translatedEnd + 1;
      
      // Text data
      let text: string;
      if (compressionFlag === 1 && compressionMethod === 0) {
        // Compressed text
        try {
          const zlib = require('zlib');
          const compressed = data.subarray(offset);
          const decompressed = zlib.inflateSync(compressed);
          text = decompressed.toString('utf8');
        } catch (error) {
          console.warn(`Failed to decompress iTXt chunk for keyword: ${keyword}`);
          continue;
        }
      } else {
        // Uncompressed text
        text = data.subarray(offset).toString('utf8');
      }
      
      textData[keyword] = text;
    }
  }
  
  return textData;
}

/**
 * Extract ComfyUI workflow from PNG file
 * @param filePath Path to PNG file
 * @returns ComfyUI workflow object or null
 */
export function extractComfyUIWorkflow(filePath: string): any {
  try {
    console.log('[DEBUG] Starting PNG chunk extraction for ComfyUI workflow...');
    
    const chunks = readPNGChunks(filePath);
    const textChunks = extractTextChunks(chunks);
    
    console.log('[DEBUG] PNG text chunks found:', Object.keys(textChunks));
    
    // Look for ComfyUI workflow in various text chunks
    for (const [key, value] of Object.entries(textChunks)) {
      if (key.toLowerCase().includes('workflow') || key.toLowerCase().includes('comfy')) {
        console.log(`[DEBUG] Found potential ComfyUI data in '${key}' chunk, length: ${value.length}`);
        
        try {
          const workflow = JSON.parse(value);
          if (workflow && typeof workflow === 'object') {
            // Validate it looks like a ComfyUI workflow
            if (workflow.nodes || workflow.last_node_id || workflow.version) {
              console.log('[DEBUG] Valid ComfyUI workflow found in PNG chunk:', key);
              return workflow;
            }
          }
        } catch (parseError) {
          console.warn(`[DEBUG] Failed to parse JSON from ${key} chunk:`, parseError);
        }
      }
    }
    
    // Also check for 'prompt' and 'workflow' chunks specifically
    if (textChunks['workflow']) {
      try {
        console.log('[DEBUG] Found workflow chunk, attempting to parse...');
        const workflow = JSON.parse(textChunks['workflow']);
        console.log(`[DEBUG] ComfyUI workflow found via direct PNG reading`);
        return workflow;
      } catch (error) {
        console.warn('[DEBUG] Failed to parse workflow chunk:', error);
      }
    }
    
    if (textChunks['prompt']) {
      try {
        console.log('[DEBUG] Found prompt chunk, attempting to parse...');
        const prompt = JSON.parse(textChunks['prompt']);
        if (prompt && typeof prompt === 'object' && Object.keys(prompt).length > 0) {
          console.log('[DEBUG] ComfyUI prompt data found');
          return { prompt_data: prompt };
        }
      } catch (error) {
        console.warn('[DEBUG] Failed to parse prompt chunk:', error);
      }
    }
    
    console.log('[DEBUG] No ComfyUI workflow data found in PNG metadata');
    return null;
    
  } catch (error) {
    console.error('[DEBUG] Error extracting ComfyUI workflow from PNG:', error);
    return null;
  }
}

/**
 * Check if file is a valid PNG
 */
export function isPNG(filePath: string): boolean {
  try {
    const buffer = fs.readFileSync(filePath, { start: 0, end: 8 });
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    return buffer.equals(pngSignature);
  } catch (error) {
    return false;
  }
}