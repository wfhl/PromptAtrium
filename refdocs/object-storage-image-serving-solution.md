# Object Storage Image Serving Solution

## Overview
This document describes how we implemented image serving from Replit's Object Storage (App Storage) for both authenticated and unauthenticated users in the PromptAtrium application. The solution ensures that public prompt images are viewable by anyone while maintaining security for private content.

## The Challenge

### Initial Issues
1. **Production Deployment Problem**: Images were showing "Image unavailable" in the published app despite working in development
2. **Authentication Barrier**: The object storage sidecar endpoint (`http://127.0.0.1:1106`) used for authentication isn't available in production deployments
3. **Public Access Requirement**: Prompt images marked as public needed to be viewable by unauthenticated users visiting shared prompt links

### Technical Context
- **Object Storage Setup**: Using Replit's App Storage (backed by Google Cloud Storage)
- **Bucket Configuration**: `replit-objstore-0787b323-84b9-43bc-9908-9e19c8088441`
- **Storage Paths**: 
  - Public: `/replit-objstore-0787b323-84b9-43bc-9908-9e19c8088441/public`
  - Private: `/replit-objstore-0787b323-84b9-43bc-9908-9e19c8088441/.private`

## Solution Architecture

### 1. Public Image Serving Endpoint
**Location**: `server/routes.ts` - `/api/objects/serve/:path(*)`

This endpoint serves images without requiring authentication, but still enforces ACL (Access Control List) permissions:

```typescript
app.get("/api/objects/serve/:path(*)", async (req, res) => {
  // No isAuthenticated middleware - allows public access
  // But still checks ACL permissions internally
})
```

### 2. Dual-Mode Operation

#### Development Mode
When the sidecar isn't available (detected via timeout):
```typescript
if (process.env.NODE_ENV === 'development') {
  // Quick sidecar availability check with 100ms timeout
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 100)
  );
  
  try {
    await Promise.race([
      objectStorageClient.getBuckets({ maxResults: 1 }),
      timeoutPromise
    ]);
  } catch (sidecarError) {
    // Return placeholder response for development
    return res.status(200).json({ 
      message: 'Development mode: Object storage not available',
      path: path,
      note: 'Images will display when object storage sidecar is running or in production'
    });
  }
}
```

#### Production Mode Fallback
When sidecar authentication fails in production:
```typescript
if (process.env.NODE_ENV === 'production' || error instanceof ObjectNotFoundError) {
  console.log("Falling back to direct bucket access for:", normalizedPath);
  
  // Construct direct bucket access
  const { bucketName, objectName } = parseObjectPath(fullPath);
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  
  // CRITICAL: Only serve public files in fallback mode
  const aclPolicy = await getObjectAclPolicy(file);
  if (aclPolicy?.visibility !== "public") {
    // Private file requires authentication we can't verify
    return res.sendStatus(401);
  }
  
  // Stream the public file
  await objectStorageService.downloadObject(file, res);
}
```

### 3. ACL-Based Access Control

The system maintains security through ACL checks:

#### For Authenticated Users
```typescript
const userId = req.user?.claims?.sub || null;

if (userId) {
  // Check if user can access (handles both public and private)
  const canAccess = await objectStorageService.canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission: ObjectPermission.READ
  });
  
  if (!canAccess) {
    return res.status(403).json({ message: 'Access denied' });
  }
}
```

#### For Unauthenticated Users
```typescript
if (!userId) {
  // No user ID - only allow public files
  const aclPolicy = await getObjectAclPolicy(objectFile);
  
  if (aclPolicy?.visibility !== "public") {
    // Private content requires authentication
    return res.status(401).json({ 
      message: 'Authentication required for private content' 
    });
  }
}
```

### 4. Automatic Public ACL for Prompt Images

When images are uploaded to prompts, they're automatically marked as public:

**Location**: `server/routes.ts` - `/api/prompt-images`

```typescript
app.post("/api/prompt-images", isAuthenticated, async (req, res) => {
  const { promptId, imageUrls } = req.body;
  
  // Normalize and set public ACL for each image
  for (const imageUrl of imageUrls) {
    const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(
      imageUrl,
      {
        visibility: "public",
        users: []
      }
    );
    normalizedUrls.push(normalizedPath);
  }
  
  // Update prompt with normalized URLs
  await storage.updatePrompt(promptId, {
    exampleImagesUrl: normalizedUrls
  });
});
```

## Frontend Integration

### Image URL Transformation
Both thumbnails and full-size previews use the same transformation logic:

```typescript
// In prompt-detail.tsx and PromptCard.tsx
<img
  src={imageUrl.startsWith('http') 
    ? imageUrl 
    : `/api/objects/serve/${encodeURIComponent(imageUrl)}`}
  alt="..."
/>
```

This ensures:
- External URLs (http/https) are used directly
- Object storage paths are routed through our serving endpoint
- Proper URL encoding for paths with special characters

### Full-Size Preview Dialog
```typescript
<Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
  <DialogContent className="max-w-4xl">
    {selectedImage && (
      <img
        src={selectedImage.startsWith('http') 
          ? selectedImage 
          : `/api/objects/serve/${encodeURIComponent(selectedImage)}`}
        alt="Full size preview"
        className="w-full h-auto rounded-lg"
      />
    )}
  </DialogContent>
</Dialog>
```

## Security Considerations

### What's Protected
1. **Private Images**: Return 401 Unauthorized for unauthenticated access
2. **User-Specific Content**: ACL checks ensure users can only access their own private content
3. **Path Traversal**: Object paths are normalized and validated

### What's Public
1. **Prompt Example Images**: Automatically set to public visibility
2. **Shared Prompts**: Public prompts have their images accessible to everyone
3. **Direct URLs**: External image URLs bypass our system entirely

## Error Handling

### Development Environment
- **Sidecar Unavailable**: Returns JSON placeholder message
- **Auth Failures**: Falls back to assuming public access for testing

### Production Environment
- **Sidecar Auth Failure**: Falls back to direct bucket access (public only)
- **Missing Objects**: Returns 404 Not Found
- **Access Denied**: Returns 403 Forbidden (authenticated but not authorized)
- **Auth Required**: Returns 401 Unauthorized (not authenticated)

## Testing Checklist

### Authenticated User Testing
- [ ] Can view own private images
- [ ] Can view public images
- [ ] Cannot view other users' private images
- [ ] Full-size preview works for all accessible images

### Unauthenticated User Testing
- [ ] Can view public prompt images
- [ ] Cannot view private images (gets 401)
- [ ] Share links work for public prompts
- [ ] Full-size preview works for public images

### Development Environment Testing
- [ ] Graceful fallback when sidecar unavailable
- [ ] Clear messaging about image availability
- [ ] No breaking errors or timeouts

### Production Deployment Testing
- [ ] Images load correctly for public prompts
- [ ] Authentication enforcement for private content
- [ ] No sidecar dependency issues
- [ ] Performance is acceptable

## Implementation Files

### Backend
- `server/routes.ts`: Image serving endpoints and ACL management
- `server/objectStorage.ts`: Object storage service with fallback logic
- `server/objectAcl.ts`: ACL policy management

### Frontend
- `client/src/pages/prompt-detail.tsx`: Prompt detail page with image gallery
- `client/src/components/PromptCard.tsx`: Prompt card with thumbnail display
- `client/src/components/PromptImageUploader.tsx`: Image upload with ACL setting

## Environment Variables

Required for object storage operation:
- `PUBLIC_OBJECT_SEARCH_PATHS`: Public directory paths in bucket
- `PRIVATE_OBJECT_DIR`: Private directory path in bucket
- `NODE_ENV`: Determines development vs production behavior

## Troubleshooting

### Images Not Showing in Production
1. Check if object storage is properly configured (use `check_object_storage_status`)
2. Verify environment variables are set
3. Ensure images have public ACL (check via object storage panel)
4. Check server logs for authentication errors

### Images Not Showing in Development
1. Object storage sidecar may not be running (expected)
2. Check for the JSON placeholder response
3. Verify paths are correct in the database

### Authentication Errors
1. Sidecar endpoint (`127.0.0.1:1106`) not accessible
2. Falls back to direct bucket access (production)
3. Returns placeholder (development)

## Future Improvements

### Potential Enhancements
1. **Caching**: Add CDN or browser caching for public images
2. **Image Optimization**: Serve different sizes based on context
3. **Batch ACL Updates**: Tool for bulk updating image visibility
4. **Monitoring**: Track failed image loads and access patterns

### Security Hardening
1. **Path Validation**: Additional checks for path traversal attempts
2. **Rate Limiting**: Prevent abuse of public image endpoint
3. **Audit Logging**: Track access to sensitive images
4. **Token-Based Access**: Temporary signed URLs for private content

## Conclusion

This solution successfully enables public image viewing for unauthenticated users while maintaining security for private content. The dual-mode operation ensures functionality in both development and production environments, with appropriate fallbacks for when the authentication sidecar isn't available. The ACL-based system provides fine-grained control over image visibility, automatically handling public prompt images while protecting user privacy.