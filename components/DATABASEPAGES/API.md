# API Documentation

Complete API reference for the Database Pages backend routes.

## Base Endpoints

All database operations follow RESTful conventions with the following base pattern:

```
/api/{table_name}
```

## Generic CRUD Operations

### GET /api/:table

Fetch all items from a table.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Item 1",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### GET /api/:table/:id

Fetch a single item by ID.

**Response:**
```json
{
  "id": 1,
  "name": "Item 1",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### POST /api/:table

Create a new item.

**Request Body:**
```json
{
  "name": "New Item",
  "description": "Item description"
}
```

**Response:**
```json
{
  "id": 2,
  "name": "New Item",
  "description": "Item description",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### PUT /api/:table/:id

Update an existing item.

**Request Body:**
```json
{
  "name": "Updated Item",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Updated Item",
  "description": "Updated description",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### PATCH /api/:table/:id

Partially update an existing item.

**Request Body:**
```json
{
  "name": "Partially Updated"
}
```

### DELETE /api/:table/:id

Delete an item.

**Response:** 204 No Content

## Bulk Operations

### PUT /api/:table

Bulk update/create items.

**Request Body:**
```json
[
  {
    "id": 1,
    "name": "Updated Item 1"
  },
  {
    "name": "New Item"
  }
]
```

### POST /api/:table/bulk-delete

Delete multiple items.

**Request Body:**
```json
{
  "ids": [1, 2, 3]
}
```

## Search and Filter

### GET /api/:table/search

Search items with query parameters.

**Query Parameters:**
- `q` - Search query (required)
- `fields` - Comma-separated fields to search (optional)

**Example:**
```
GET /api/aesthetics/search?q=cyber&fields=name,description
```

## Favorites API

### GET /api/favorites/type/:itemType

Get all favorites of a specific type.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Favorited Item",
    "...": "..."
  }
]
```

### POST /api/favorites/add

Add an item to favorites.

**Request Body:**
```json
{
  "itemId": 1,
  "itemType": "aesthetics"
}
```

### DELETE /api/favorites/remove

Remove an item from favorites.

**Request Body:**
```json
{
  "itemId": 1,
  "itemType": "aesthetics"
}
```

### GET /api/favorites/check/:itemType/:itemId

Check if an item is favorited.

**Response:**
```json
{
  "isFavorite": true
}
```

### POST /api/favorites/toggle

Toggle favorite status.

**Request Body:**
```json
{
  "itemId": 1,
  "itemType": "aesthetics"
}
```

## Specific Table Endpoints

### Aesthetics

```
GET    /api/system-data/aesthetics
GET    /api/system-data/aesthetics/:id
POST   /api/system-data/aesthetics
PUT    /api/system-data/aesthetics/:id
DELETE /api/system-data/aesthetics/:id
```

**Aesthetic Object:**
```json
{
  "id": 1,
  "name": "Cyberpunk",
  "description": "Futuristic dystopian aesthetic",
  "era": "1980s-Present",
  "categories": ["Futuristic", "Urban"],
  "tags": ["neon", "tech", "dystopian"],
  "visual_elements": ["Neon lights", "Holograms"],
  "color_palette": ["Neon pink", "Electric blue"],
  "mood_keywords": ["Dark", "Gritty"],
  "inspiration_sources": ["Blade Runner", "Neuromancer"],
  "related_aesthetics": ["Synthwave", "Tech Noir"],
  "media_examples": {},
  "image_urls": [],
  "popularity": 100,
  "is_verified": true,
  "featured": false
}
```

### Checkpoint Models

```
GET    /api/checkpoint-models
GET    /api/checkpoint-models/:id
POST   /api/checkpoint-models
PUT    /api/checkpoint-models/:id
DELETE /api/checkpoint-models/:id
```

**Checkpoint Model Object:**
```json
{
  "id": 1,
  "name": "Stable Diffusion XL",
  "type": "SDXL",
  "sampler": "DPM++ 2M Karras",
  "scheduler": "Karras",
  "steps": "30",
  "cfg_scale": "7.5",
  "recommended_vae": "sdxl_vae.safetensors",
  "negative_prompts": "low quality, blurry",
  "prompting_suggestions": "Use descriptive prompts",
  "civitai_url": "https://civitai.com/models/...",
  "resources": "Additional resources"
}
```

### Collaboration Hubs

```
GET    /api/system-data/collaboration-hubs
GET    /api/system-data/collaboration-hubs/:id
POST   /api/system-data/collaboration-hubs
PUT    /api/system-data/collaboration-hubs/:id
DELETE /api/system-data/collaboration-hubs/:id
```

**Collaboration Hub Object:**
```json
{
  "id": 1,
  "name": "AI Art Collective",
  "handle": "aiartcollective",
  "type": "Art Group",
  "owner": "John Doe",
  "status": "Active",
  "requirements": "Portfolio submission",
  "quality_requirements": "High quality work",
  "notes": "Weekly meetings",
  "within_elite": "No",
  "elite": ""
}
```

### Prompt Components

```
GET    /api/prompt-components
GET    /api/prompt-components/:id
POST   /api/prompt-components
PUT    /api/prompt-components/:id
DELETE /api/prompt-components/:id
GET    /api/prompt-components/category/:category
GET    /api/system/prompt-components/categories
```

**Prompt Component Object:**
```json
{
  "id": 1,
  "category": "style",
  "value": "photorealistic",
  "description": "Creates realistic images",
  "is_default": true,
  "order_index": 1
}
```

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request body"
}
```

### 404 Not Found
```json
{
  "error": "Item not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to perform operation"
}
```

## Authentication Headers

Include authentication headers if required:

```
X-User-ID: user123
Authorization: Bearer <token>
```

## Rate Limiting

Default rate limits:
- 100 requests per minute for GET operations
- 20 requests per minute for POST/PUT/DELETE operations

## Pagination

For large datasets, use pagination parameters:

```
GET /api/:table?page=1&limit=50&sort=name&order=asc
```

Parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 200)
- `sort` - Field to sort by
- `order` - Sort order (asc/desc)