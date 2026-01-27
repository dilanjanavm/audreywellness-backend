# Product Recipes API Documentation

**Base URL:** `http://localhost:3005`  
**Last Updated:** 2025-12-16

This document describes the Product Recipes API endpoints for managing product recipes with versioning support.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Create Recipe](#1-create-recipe)
   - [Get All Recipes](#2-get-all-recipes)
   - [Get Recipe by ID](#3-get-recipe-by-id)
   - [Get Version History](#4-get-version-history)
   - [Update Recipe](#5-update-recipe)
   - [Set Active Version](#6-set-active-version)
   - [Delete Recipe](#7-delete-recipe)
4. [Data Models](#data-models)
5. [Error Responses](#error-responses)

---

## Overview

The Product Recipes API allows you to:
- Create recipes for products with specific batch sizes
- Maintain version history of recipes
- Filter and search recipes
- Manage recipe steps and ingredients
- Set active versions of recipes

### Key Features

- **Versioning**: All recipe changes create new versions while preserving history
- **Batch Size Support**: Recipes are specific to product batch sizes (e.g., batch10kg, batch25kg)
- **Step Management**: Recipes include ordered steps with instructions, temperature, and duration
- **Ingredient Tracking**: Recipes track ingredients with quantities and units
- **Status Management**: Recipes can be active, draft, or archived

---

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

**Required Roles:**
- **ADMIN, MANAGER**: Can create, update, delete recipes
- **ADMIN, MANAGER, USER**: Can view recipes

---

## Endpoints

### 1. Create Recipe

Create a new recipe for a product with a specific batch size.

**Endpoint:** `POST /recipes`

**Authorization:** ADMIN, MANAGER

**Request Body:**
```json
{
  "name": "Product A - batch10kg Recipe",
  "productId": "c8cef53f-53f3-4610-aa74-444a0a85412b",
  "itemId": "c8cef53f-53f3-4610-aa74-444a0a85412b",
  "batchSize": "batch10kg",
  "totalTime": 15,
  "status": "active",
  "steps": [
    {
      "order": 1,
      "instruction": "add @DI Water 50% and boil it",
      "temperature": 100,
      "duration": 5
    },
    {
      "order": 2,
      "instruction": "Add @Vitamin E and mix well",
      "temperature": null,
      "duration": 10
    }
  ],
  "ingredients": [
    {
      "name": "DI Water",
      "quantity": 1.2,
      "unit": "Kg",
      "category": "Raw Material"
    },
    {
      "name": "Vitamin E",
      "quantity": 1,
      "unit": "Kg",
      "category": "Raw Material"
    }
  ]
}
```

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Recipe name. Defaults to "{ProductName} - {BatchSize} Recipe" if not provided |
| `productId` | UUID | Yes | Product/item UUID |
| `itemId` | UUID | Yes | Same as productId |
| `batchSize` | string | Yes | Batch size identifier (e.g., "batch10kg", "batch25kg") |
| `totalTime` | number | Yes | Total process time in minutes (must equal sum of step durations) |
| `status` | enum | No | Recipe status: "active", "draft", "archived" (default: "draft") |
| `steps` | array | Yes | Array of recipe steps (at least 1 required) |
| `ingredients` | array | Yes | Array of ingredients (at least 1 required) |

**Step Object Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `order` | number | Yes | Step order (1, 2, 3, ...) - must be sequential |
| `instruction` | string | Yes | Step instruction text (can include @mentions) |
| `temperature` | number \| null | No | Temperature in Celsius |
| `duration` | number | Yes | Duration in minutes |

**Ingredient Object Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Ingredient name |
| `quantity` | number | Yes | Quantity for the batch size |
| `unit` | string | Yes | Unit of measurement (e.g., "Kg", "L", "g") |
| `category` | string | No | Ingredient category |

**Response (201 Created):**
```json
{
  "message": "Recipe created successfully",
  "data": {
    "id": "recipe-uuid",
    "name": "Product A - batch10kg Recipe",
    "productId": "c8cef53f-53f3-4610-aa74-444a0a85412b",
    "itemId": "c8cef53f-53f3-4610-aa74-444a0a85412b",
    "batchSize": "batch10kg",
    "totalTime": 15,
    "status": "active",
    "version": 1,
    "isActiveVersion": true,
    "createdBy": "user-uuid",
    "updatedBy": null,
    "steps": [
      {
        "id": "step-uuid-1",
        "order": 1,
        "instruction": "add @DI Water 50% and boil it",
        "temperature": 100,
        "duration": 5,
        "createdAt": "2025-12-16T10:00:00.000Z",
        "updatedAt": "2025-12-16T10:00:00.000Z"
      },
      {
        "id": "step-uuid-2",
        "order": 2,
        "instruction": "Add @Vitamin E and mix well",
        "temperature": null,
        "duration": 10,
        "createdAt": "2025-12-16T10:00:00.000Z",
        "updatedAt": "2025-12-16T10:00:00.000Z"
      }
    ],
    "ingredients": [
      {
        "id": "ingredient-uuid-1",
        "name": "DI Water",
        "quantity": 1.2,
        "unit": "Kg",
        "category": "Raw Material",
        "createdAt": "2025-12-16T10:00:00.000Z",
        "updatedAt": "2025-12-16T10:00:00.000Z"
      },
      {
        "id": "ingredient-uuid-2",
        "name": "Vitamin E",
        "quantity": 1,
        "unit": "Kg",
        "category": "Raw Material",
        "createdAt": "2025-12-16T10:00:00.000Z",
        "updatedAt": "2025-12-16T10:00:00.000Z"
      }
    ],
    "createdAt": "2025-12-16T10:00:00.000Z",
    "updatedAt": "2025-12-16T10:00:00.000Z"
  }
}
```

**Validation Rules:**
- `productId` must be a valid UUID of an existing product
- `totalTime` must equal the sum of all step durations
- Step orders must be sequential starting from 1
- At least one step and one ingredient required

**Error Responses:**
- `400 Bad Request`: Validation error (e.g., totalTime mismatch, invalid step orders)
- `404 Not Found`: Product not found
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions

---

### 2. Get All Recipes

Get all recipes with optional filters and pagination.

**Endpoint:** `GET /recipes`

**Authorization:** ADMIN, MANAGER, USER

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productId` | UUID | No | Filter by product ID |
| `itemId` | UUID | No | Filter by item ID |
| `batchSize` | string | No | Filter by batch size |
| `status` | enum | No | Filter by status: "active", "draft", "archived" |
| `search` | string | No | Search in recipe name and batch size |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 10) |
| `includeVersions` | boolean | No | Include all versions (default: false, only active versions) |

**Example Requests:**
```bash
# Get all active recipes
GET /recipes?status=active

# Get recipes for a specific product
GET /recipes?productId=c8cef53f-53f3-4610-aa74-444a0a85412b

# Get recipes with pagination
GET /recipes?page=1&limit=20

# Get all versions (including inactive)
GET /recipes?includeVersions=true&productId=c8cef53f-53f3-4610-aa74-444a0a85412b

# Search recipes
GET /recipes?search=batch10kg
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "recipe-uuid",
      "name": "Product A - batch10kg Recipe",
      "productId": "c8cef53f-53f3-4610-aa74-444a0a85412b",
      "itemId": "c8cef53f-53f3-4610-aa74-444a0a85412b",
      "batchSize": "batch10kg",
      "totalTime": 15,
      "status": "active",
      "version": 1,
      "isActiveVersion": true,
      "steps": [...],
      "ingredients": [...],
      "createdAt": "2025-12-16T10:00:00.000Z",
      "updatedAt": "2025-12-16T10:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

---

### 3. Get Recipe by ID

Get a specific recipe by its ID.

**Endpoint:** `GET /recipes/:id`

**Authorization:** ADMIN, MANAGER, USER

**Path Parameters:**
- `id` (UUID, required): Recipe ID

**Query Parameters:**
- `includeVersions` (boolean, optional): Include version history (default: false)

**Response (200 OK):**
```json
{
  "data": {
    "id": "recipe-uuid",
    "name": "Product A - batch10kg Recipe",
    "productId": "c8cef53f-53f3-4610-aa74-444a0a85412b",
    "itemId": "c8cef53f-53f3-4610-aa74-444a0a85412b",
    "batchSize": "batch10kg",
    "totalTime": 15,
    "status": "active",
    "version": 1,
    "isActiveVersion": true,
    "steps": [
      {
        "id": "step-uuid-1",
        "order": 1,
        "instruction": "add @DI Water 50% and boil it",
        "temperature": 100,
        "duration": 5,
        "createdAt": "2025-12-16T10:00:00.000Z",
        "updatedAt": "2025-12-16T10:00:00.000Z"
      }
    ],
    "ingredients": [
      {
        "id": "ingredient-uuid-1",
        "name": "DI Water",
        "quantity": 1.2,
        "unit": "Kg",
        "category": "Raw Material",
        "createdAt": "2025-12-16T10:00:00.000Z",
        "updatedAt": "2025-12-16T10:00:00.000Z"
      }
    ],
    "createdAt": "2025-12-16T10:00:00.000Z",
    "updatedAt": "2025-12-16T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `404 Not Found`: Recipe not found
- `400 Bad Request`: Invalid UUID format

---

### 4. Get Version History

Get all versions of a recipe for a specific product and batch size.

**Endpoint:** `GET /recipes/product/:productId/batch/:batchSize/versions`

**Authorization:** ADMIN, MANAGER, USER

**Path Parameters:**
- `productId` (UUID, required): Product ID
- `batchSize` (string, required): Batch size (e.g., "batch10kg")

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "recipe-uuid-3",
      "name": "Product A - batch10kg Recipe",
      "version": 3,
      "isActiveVersion": true,
      "status": "active",
      "totalTime": 20,
      "createdAt": "2025-12-16T12:00:00.000Z",
      "updatedAt": "2025-12-16T12:00:00.000Z"
    },
    {
      "id": "recipe-uuid-2",
      "name": "Product A - batch10kg Recipe",
      "version": 2,
      "isActiveVersion": false,
      "status": "archived",
      "totalTime": 15,
      "createdAt": "2025-12-16T11:00:00.000Z",
      "updatedAt": "2025-12-16T11:00:00.000Z"
    },
    {
      "id": "recipe-uuid-1",
      "name": "Product A - batch10kg Recipe",
      "version": 1,
      "isActiveVersion": false,
      "status": "archived",
      "totalTime": 15,
      "createdAt": "2025-12-16T10:00:00.000Z",
      "updatedAt": "2025-12-16T10:00:00.000Z"
    }
  ]
}
```

**Note:** Versions are returned in descending order (newest first).

---

### 5. Update Recipe

Update an existing recipe. If updating status to "active" and it's not currently active, a new version is created.

**Endpoint:** `PUT /recipes/:id`

**Authorization:** ADMIN, MANAGER

**Path Parameters:**
- `id` (UUID, required): Recipe ID

**Request Body:**
```json
{
  "name": "Updated Recipe Name",
  "status": "active",
  "totalTime": 20,
  "steps": [
    {
      "order": 1,
      "instruction": "Updated step instruction",
      "temperature": 100,
      "duration": 5
    },
    {
      "order": 2,
      "instruction": "New step",
      "temperature": null,
      "duration": 15
    }
  ],
  "ingredients": [
    {
      "name": "DI Water",
      "quantity": 1.5,
      "unit": "Kg",
      "category": "Raw Material"
    }
  ]
}
```

**Request Body Fields:**
All fields are optional. Only provided fields will be updated.

**Response (200 OK):**
```json
{
  "message": "Recipe updated successfully",
  "data": {
    "id": "recipe-uuid",
    "name": "Updated Recipe Name",
    "status": "active",
    "version": 2,
    "isActiveVersion": true,
    "steps": [...],
    "ingredients": [...],
    "updatedAt": "2025-12-16T11:00:00.000Z"
  }
}
```

**Note:** If updating status to "active" and the recipe is not currently active, a new version is automatically created.

**Error Responses:**
- `404 Not Found`: Recipe not found
- `400 Bad Request`: Validation error (e.g., totalTime mismatch)

---

### 6. Set Active Version

Set a specific recipe version as the active version for a product and batch size.

**Endpoint:** `PUT /recipes/:id/set-active`

**Authorization:** ADMIN, MANAGER

**Path Parameters:**
- `id` (UUID, required): Recipe ID

**Response (200 OK):**
```json
{
  "message": "Recipe set as active version successfully",
  "data": {
    "id": "recipe-uuid",
    "name": "Product A - batch10kg Recipe",
    "version": 2,
    "isActiveVersion": true,
    "status": "active",
    "steps": [...],
    "ingredients": [...]
  }
}
```

**Note:** This will automatically deactivate other versions for the same product and batch size.

**Error Responses:**
- `404 Not Found`: Recipe not found

---

### 7. Delete Recipe

Delete a recipe. This permanently removes the recipe and all its steps and ingredients.

**Endpoint:** `DELETE /recipes/:id`

**Authorization:** ADMIN, MANAGER

**Path Parameters:**
- `id` (UUID, required): Recipe ID

**Response (200 OK):**
```json
{
  "message": "Recipe deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: Recipe not found

---

## Data Models

### Recipe Status Enum

```typescript
enum RecipeStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  ARCHIVED = 'archived'
}
```

### Recipe Response Structure

```typescript
interface RecipeResponseDto {
  id: string;                    // UUID
  name: string;                  // Recipe name
  productId: string;             // Product UUID
  itemId: string;                // Item UUID (same as productId)
  batchSize: string;             // Batch size identifier
  totalTime: number;             // Total time in minutes
  status: RecipeStatus;          // Recipe status
  version: number;               // Version number
  isActiveVersion: boolean;      // Is this the active version?
  createdBy?: string;            // Creator user UUID
  updatedBy?: string;            // Last updater user UUID
  steps: RecipeStepResponseDto[]; // Recipe steps
  ingredients: RecipeIngredientResponseDto[]; // Recipe ingredients
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last update timestamp
}
```

### Recipe Step Structure

```typescript
interface RecipeStepResponseDto {
  id: string;           // UUID
  order: number;         // Step order (1, 2, 3, ...)
  instruction: string;  // Step instruction
  temperature: number | null; // Temperature in Celsius
  duration: number;     // Duration in minutes
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;       // Last update timestamp
}
```

### Recipe Ingredient Structure

```typescript
interface RecipeIngredientResponseDto {
  id: string;          // UUID
  name: string;        // Ingredient name
  quantity: number;    // Quantity
  unit: string;        // Unit of measurement
  category: string | null; // Ingredient category
  createdAt: Date;     // Creation timestamp
  updatedAt: Date;      // Last update timestamp
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "timestamp": "2025-12-16T10:00:00.000Z",
  "path": "/recipes",
  "method": "POST"
}
```

### Common Error Codes

- `400 Bad Request`: Invalid request data or validation error
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Usage Examples

### Example 1: Create a Recipe

```javascript
const recipeData = {
  name: "4E Alovera Gel with Lavender Frg - 5L (95%) - batch10kg Recipe",
  productId: "c8cef53f-53f3-4610-aa74-444a0a85412b",
  itemId: "c8cef53f-53f3-4610-aa74-444a0a85412b",
  batchSize: "batch10kg",
  totalTime: 15,
  status: "active",
  steps: [
    {
      order: 1,
      instruction: "add @DI Water 50% and boil it",
      temperature: 100,
      duration: 5
    },
    {
      order: 2,
      instruction: "Add @Vitamin E and mix well at 80°C",
      temperature: 80,
      duration: 10
    }
  ],
  ingredients: [
    {
      name: "DI Water",
      quantity: 1.2,
      unit: "Kg",
      category: "Raw Material"
    },
    {
      name: "Vitamin E",
      quantity: 1,
      unit: "Kg",
      category: "Raw Material"
    }
  ]
};

const response = await fetch('http://localhost:3005/recipes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify(recipeData)
});
```

### Example 2: Get Recipes with Filters

```javascript
// Get active recipes for a product
const response = await fetch(
  'http://localhost:3005/recipes?productId=c8cef53f-53f3-4610-aa74-444a0a85412b&status=active',
  {
    headers: {
      'Authorization': 'Bearer <token>'
    }
  }
);
```

### Example 3: Get Version History

```javascript
const response = await fetch(
  'http://localhost:3005/recipes/product/c8cef53f-53f3-4610-aa74-444a0a85412b/batch/batch10kg/versions',
  {
    headers: {
      'Authorization': 'Bearer <token>'
    }
  }
);
```

---

## Notes

1. **Versioning**: When a recipe is updated and status changes to "active", a new version is automatically created. Old versions are preserved.

2. **Active Version**: Only one version can be active per product and batch size combination. Setting a new active version automatically deactivates others.

3. **Step Ordering**: Steps are always returned in order (1, 2, 3, ...) regardless of creation order.

4. **Total Time Validation**: The `totalTime` must always equal the sum of all step durations.

5. **Ingredient Mentions**: The `@` symbol in step instructions is used to mention ingredients (e.g., "@DI Water"). This is for display purposes only.

6. **Default Behavior**: By default, `GET /recipes` returns only active versions. Use `includeVersions=true` to get all versions.

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-16

