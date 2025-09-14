# API Documentation

Complete API reference for the Notes backend system.

## Base URL

```
http://localhost:3001/api
```

## Authentication

All endpoints require authentication unless specified otherwise. Include authentication via:

- **Session Cookie**: Automatically included with `credentials: 'include'`
- **JWT Token**: `Authorization: Bearer <token>`
- **API Key**: `X-API-Key: <key>`

## Notes Endpoints

### Get All Notes

Retrieve all notes for the authenticated user.

```http
GET /notes
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "My Note",
      "content": "Note content",
      "type": "text",
      "folder": "Work",
      "tags": ["important", "todo"],
      "color": "#3b82f6",
      "isPinned": true,
      "isArchived": false,
      "parentId": null,
      "position": 0,
      "createdAt": "2024-01-01T00:00:00Z",
      "lastModified": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Single Note

Retrieve a specific note by ID.

```http
GET /notes/:id
```

**Parameters:**
- `id` (number): Note ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "My Note",
    "content": "Note content",
    "type": "text",
    "folder": "Work",
    "tags": ["important"],
    "color": "#3b82f6",
    "isPinned": true,
    "isArchived": false,
    "parentId": null,
    "position": 0,
    "createdAt": "2024-01-01T00:00:00Z",
    "lastModified": "2024-01-01T00:00:00Z"
  }
}
```

### Create Note

Create a new note.

```http
POST /notes
```

**Request Body:**
```json
{
  "title": "New Note",
  "content": "Note content",
  "type": "text",
  "folder": "Personal",
  "tags": ["tag1", "tag2"],
  "color": "#10b981",
  "isPinned": false,
  "isArchived": false,
  "parentId": null,
  "position": 0
}
```

**Required Fields:**
- `title` (string): Note title

**Optional Fields:**
- `content` (string): Note content
- `type` (string): One of: `text`, `markdown`, `code`, `todo`, `html`
- `folder` (string): Folder name (default: "Unsorted")
- `tags` (string[]): Array of tag names
- `color` (string): Hex color code
- `isPinned` (boolean): Pin status
- `isArchived` (boolean): Archive status
- `parentId` (number): Parent note ID for nested notes
- `position` (number): Sort position

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "New Note",
    "content": "Note content",
    "type": "text",
    "folder": "Personal",
    "tags": ["tag1", "tag2"],
    "color": "#10b981",
    "isPinned": false,
    "isArchived": false,
    "parentId": null,
    "position": 0,
    "createdAt": "2024-01-01T00:00:00Z",
    "lastModified": "2024-01-01T00:00:00Z"
  }
}
```

### Update Note

Update an existing note.

```http
PUT /notes/:id
```

**Parameters:**
- `id` (number): Note ID

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "tags": ["new-tag"],
  "isPinned": true
}
```

All fields are optional. Only provided fields will be updated.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Updated Title",
    "content": "Updated content",
    "type": "text",
    "folder": "Work",
    "tags": ["new-tag"],
    "color": "#3b82f6",
    "isPinned": true,
    "isArchived": false,
    "parentId": null,
    "position": 0,
    "createdAt": "2024-01-01T00:00:00Z",
    "lastModified": "2024-01-02T00:00:00Z"
  }
}
```

### Delete Note

Delete a note.

```http
DELETE /notes/:id
```

**Parameters:**
- `id` (number): Note ID

**Response:**
```json
{
  "success": true,
  "message": "Note deleted successfully"
}
```

### Search Notes

Search notes by text and/or tags.

```http
GET /notes/search?q=search+term&tags=tag1,tag2
```

**Query Parameters:**
- `q` (string): Search query for title and content
- `tags` (string): Comma-separated list of tags

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Matching Note",
      "content": "Content with search term",
      "type": "text",
      "folder": "Work",
      "tags": ["tag1"],
      "color": "#3b82f6",
      "isPinned": false,
      "isArchived": false,
      "parentId": null,
      "position": 0,
      "createdAt": "2024-01-01T00:00:00Z",
      "lastModified": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "query": "search term",
    "tags": ["tag1", "tag2"]
  }
}
```

## Folders Endpoints

### Get All Folders

Retrieve all folders.

```http
GET /folders
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Work",
      "description": "Work-related notes",
      "color": "#3b82f6",
      "icon": "briefcase",
      "noteCount": 5,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Folder

Create a new folder.

```http
POST /folders
```

**Request Body:**
```json
{
  "name": "Projects",
  "description": "Project notes",
  "color": "#8b5cf6",
  "icon": "folder"
}
```

**Required Fields:**
- `name` (string): Folder name

**Optional Fields:**
- `description` (string): Folder description
- `color` (string): Hex color code
- `icon` (string): Icon name

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Projects",
    "description": "Project notes",
    "color": "#8b5cf6",
    "icon": "folder",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Update Folder

Update a folder.

```http
PUT /folders/:id
```

**Parameters:**
- `id` (number): Folder ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "color": "#ef4444"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Updated Name",
    "description": "Work-related notes",
    "color": "#ef4444",
    "icon": "briefcase",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Delete Folder

Delete a folder. Notes in the folder will be moved to "Unsorted".

```http
DELETE /folders/:id
```

**Parameters:**
- `id` (number): Folder ID

**Response:**
```json
{
  "success": true,
  "message": "Folder deleted successfully"
}
```

## Tags Endpoints

### Get All Tags

Retrieve all tags for the user.

```http
GET /tags
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "important",
      "color": "#ef4444",
      "textColor": "#ffffff",
      "borderColor": "#ef4444",
      "backgroundColor": "#fef2f2",
      "count": 3
    }
  ]
}
```

### Create Tag

Create a new tag.

```http
POST /tags
```

**Request Body:**
```json
{
  "name": "urgent",
  "color": "#f59e0b",
  "textColor": "#ffffff",
  "borderColor": "#f59e0b",
  "backgroundColor": "#fef3c7"
}
```

**Required Fields:**
- `name` (string): Tag name

**Optional Fields:**
- `color` (string): Primary color
- `textColor` (string): Text color
- `borderColor` (string): Border color
- `backgroundColor` (string): Background color

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "urgent",
    "color": "#f59e0b",
    "textColor": "#ffffff",
    "borderColor": "#f59e0b",
    "backgroundColor": "#fef3c7"
  }
}
```

### Update Tag

Update a tag.

```http
PUT /tags/:id
```

**Parameters:**
- `id` (number): Tag ID

**Request Body:**
```json
{
  "name": "priority",
  "color": "#dc2626"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "priority",
    "color": "#dc2626",
    "textColor": "#ffffff",
    "borderColor": "#dc2626",
    "backgroundColor": "#fef2f2"
  }
}
```

### Delete Tag

Delete a tag. The tag will be removed from all notes.

```http
DELETE /tags/:id
```

**Parameters:**
- `id` (number): Tag ID

**Response:**
```json
{
  "success": true,
  "message": "Tag deleted successfully"
}
```

## Bulk Operations

### Bulk Update Notes

Update multiple notes at once.

```http
PATCH /notes/bulk
```

**Request Body:**
```json
{
  "noteIds": [1, 2, 3],
  "updates": {
    "folder": "Archive",
    "isArchived": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updated": 3,
    "failed": 0
  }
}
```

### Bulk Delete Notes

Delete multiple notes.

```http
DELETE /notes/bulk
```

**Request Body:**
```json
{
  "noteIds": [1, 2, 3]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": 3,
    "failed": 0
  }
}
```

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Note not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Webhooks (Optional)

Configure webhooks to receive real-time updates:

```http
POST /webhooks
```

**Request Body:**
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["note.created", "note.updated", "note.deleted"],
  "secret": "webhook-secret"
}
```

**Webhook Payload:**
```json
{
  "event": "note.created",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "id": 1,
    "title": "New Note",
    "userId": "user-123"
  }
}
```

## WebSocket Events (Optional)

Connect to WebSocket for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.on('message', (data) => {
  const event = JSON.parse(data);
  // Handle events: note.created, note.updated, note.deleted
});
```