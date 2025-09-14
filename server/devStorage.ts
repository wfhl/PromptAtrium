import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

// Development storage paths
const DEV_STORAGE_ROOT = path.join(process.cwd(), "server", "uploads");
const PUBLIC_STORAGE_PATH = path.join(DEV_STORAGE_ROOT, "public");
const PRIVATE_STORAGE_PATH = path.join(DEV_STORAGE_ROOT, "private");

// Ensure storage directories exist
async function ensureStorageDirectories() {
  const dirs = [
    DEV_STORAGE_ROOT,
    PUBLIC_STORAGE_PATH,
    PRIVATE_STORAGE_PATH,
    path.join(PRIVATE_STORAGE_PATH, "uploads"),
    path.join(PRIVATE_STORAGE_PATH, "profile-pictures"),
    path.join(PUBLIC_STORAGE_PATH, "prompt-images"),
  ];
  
  for (const dir of dirs) {
    if (!await exists(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

// Initialize storage directories on module load
ensureStorageDirectories().catch(console.error);

export class DevStorageService {
  // Generate a development upload URL
  async getDevUploadURL(type: 'profile' | 'prompt' | 'generic' = 'generic'): Promise<{ uploadURL: string, objectId: string }> {
    const objectId = randomUUID();
    
    // Return a development endpoint that the frontend can use
    return {
      uploadURL: `/api/dev-upload/${type}/${objectId}`,
      objectId
    };
  }
  
  // Save a file to development storage
  async saveFile(
    objectId: string, 
    data: Buffer, 
    type: 'profile' | 'prompt' | 'generic' = 'generic',
    metadata?: { contentType?: string, userId?: string }
  ): Promise<string> {
    await ensureStorageDirectories();
    
    let filePath: string;
    let publicPath: string;
    
    switch(type) {
      case 'profile':
        filePath = path.join(PRIVATE_STORAGE_PATH, "profile-pictures", `${objectId}`);
        publicPath = `/api/dev-storage/profile-pictures/${objectId}`;
        break;
      case 'prompt':
        filePath = path.join(PUBLIC_STORAGE_PATH, "prompt-images", `${objectId}`);
        publicPath = `/api/dev-storage/prompt-images/${objectId}`;
        break;
      default:
        filePath = path.join(PRIVATE_STORAGE_PATH, "uploads", `${objectId}`);
        publicPath = `/api/dev-storage/uploads/${objectId}`;
    }
    
    // Save the file
    await writeFile(filePath, data);
    
    // Save metadata if provided
    if (metadata) {
      const metadataPath = `${filePath}.meta.json`;
      await writeFile(metadataPath, JSON.stringify({
        ...metadata,
        uploadedAt: new Date().toISOString(),
        size: data.length
      }));
    }
    
    return publicPath;
  }
  
  // Get a file from development storage
  async getFile(type: string, objectId: string): Promise<{ data: Buffer, metadata?: any }> {
    let filePath: string;
    
    switch(type) {
      case 'profile-pictures':
        filePath = path.join(PRIVATE_STORAGE_PATH, "profile-pictures", objectId);
        break;
      case 'prompt-images':
        filePath = path.join(PUBLIC_STORAGE_PATH, "prompt-images", objectId);
        break;
      case 'uploads':
      case 'generic':  // Handle 'generic' as 'uploads'
        filePath = path.join(PRIVATE_STORAGE_PATH, "uploads", objectId);
        break;
      default:
        throw new Error(`Unknown storage type: ${type}`);
    }
    
    if (!await exists(filePath)) {
      throw new Error("File not found");
    }
    
    const data = await readFile(filePath);
    
    // Try to load metadata
    let metadata;
    const metadataPath = `${filePath}.meta.json`;
    if (await exists(metadataPath)) {
      const metaContent = await readFile(metadataPath, 'utf8');
      metadata = JSON.parse(metaContent);
    }
    
    return { data, metadata };
  }
  
  // Delete a file from development storage
  async deleteFile(type: string, objectId: string): Promise<void> {
    let filePath: string;
    
    switch(type) {
      case 'profile-pictures':
        filePath = path.join(PRIVATE_STORAGE_PATH, "profile-pictures", objectId);
        break;
      case 'prompt-images':
        filePath = path.join(PUBLIC_STORAGE_PATH, "prompt-images", objectId);
        break;
      case 'uploads':
      case 'generic':  // Handle 'generic' as 'uploads'
        filePath = path.join(PRIVATE_STORAGE_PATH, "uploads", objectId);
        break;
      default:
        throw new Error(`Unknown storage type: ${type}`);
    }
    
    if (await exists(filePath)) {
      await unlink(filePath);
    }
    
    // Also delete metadata if it exists
    const metadataPath = `${filePath}.meta.json`;
    if (await exists(metadataPath)) {
      await unlink(metadataPath);
    }
  }
  
  // Convert a development storage path to a public URL
  getPublicURL(storagePath: string): string {
    // If it's already a dev storage URL, return as-is
    if (storagePath.startsWith('/api/dev-storage/')) {
      return storagePath;
    }
    
    // Convert Google Cloud Storage URLs to dev storage URLs
    if (storagePath.includes('storage.googleapis.com')) {
      // Extract the filename from the URL
      const url = new URL(storagePath);
      const pathParts = url.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];
      
      // Determine the type based on the path
      if (storagePath.includes('profile') || storagePath.includes('user')) {
        return `/api/dev-storage/profile-pictures/${filename}`;
      } else if (storagePath.includes('prompt')) {
        return `/api/dev-storage/prompt-images/${filename}`;
      } else {
        return `/api/dev-storage/uploads/${filename}`;
      }
    }
    
    // Handle /objects/ paths
    if (storagePath.startsWith('/objects/')) {
      const parts = storagePath.split('/');
      const objectId = parts[parts.length - 1];
      // Use 'uploads' instead of 'generic' for /objects/ paths
      return `/api/dev-storage/uploads/${objectId}`;
    }
    
    return storagePath;
  }
}

export const devStorage = new DevStorageService();