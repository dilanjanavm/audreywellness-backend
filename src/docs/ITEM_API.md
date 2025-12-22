# Item Management API Documentation

**⭐ NEW** - Newly added endpoints  
**🔄 UPDATED** - Recently updated endpoints

## Base URL
```
http://localhost:3003
```

---

## Table of Contents
1. [Get All Items](#get-all-items)
2. [Get Item by Code](#get-item-by-code)
3. [Create Item](#create-item)
4. [Update Item](#update-item)
5. [Delete Item](#delete-item)

---

## Get All Items

### 🔄 Get All Items (UPDATED)
Get all items with pagination, search, and category filtering.

**Endpoint:** `GET /items`

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50)
- `search` (string, optional): Search term to filter items by description, itemCode, or category name
- `category` (string, optional): **NEW** - Filter by category ID (UUID)
- `includeSuppliers` (boolean, optional): Include supplier information (default: false)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Examples:**
```bash
# Get all items (first page, 50 items)
GET /items?page=1&limit=50

# Search items
GET /items?page=1&limit=50&search=oil

# Filter by category ID (NEW)
GET /items?page=1&limit=50&category=63ffe256-083e-44fb-9505-f7c8694583c6

# Search with category filter (NEW)
GET /items?page=1&limit=50&search=tes&category=63ffe256-083e-44fb-9505-f7c8694583c6

# Include suppliers
GET /items?page=1&limit=50&includeSuppliers=true
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "data": [
      {
        "id": "item-uuid-1234",
        "itemCode": "ITEM-001",
        "stockId": "STOCK-001",
        "description": "Item Description",
        "category": "Raw Material",
        "categoryId": "63ffe256-083e-44fb-9505-f7c8694583c6",
        "units": "kg",
        "price": 100.50,
        "altPrice": 95.00,
        "currency": "USD",
        "status": "ACTIVE",
        "suppliers": [],
        "createdAt": "2025-12-05T10:30:00.000Z",
        "updatedAt": "2025-12-05T10:30:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 50,
    "totalPages": 2
  }
}
```

**Response (Error - 404):**
```json
{
  "statusCode": 404,
  "timestamp": "2025-12-05T10:30:00.000Z",
  "path": "/items",
  "method": "GET",
  "message": "Category with ID 63ffe256-083e-44fb-9505-f7c8694583c6 not found"
}
```

**Notes:**
- The `category` query parameter accepts a **category ID (UUID)**, not a category name
- Search and category filters can be used together
- If no filters are provided, all items are returned
- Pagination is applied to the filtered results

---

## Get Item by Code

Get a specific item by its item code.

**Endpoint:** `GET /items/:itemCode`

**Path Parameters:**
- `itemCode` (string, required): Item code (e.g., "ITEM-001")

**Query Parameters:**
- `includeSuppliers` (boolean, optional): Include supplier information (default: false)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "item-uuid-1234",
    "itemCode": "ITEM-001",
    "stockId": "STOCK-001",
    "description": "Item Description",
    "category": "Raw Material",
    "categoryId": "63ffe256-083e-44fb-9505-f7c8694583c6",
    "units": "kg",
    "price": 100.50,
    "altPrice": 95.00,
    "currency": "USD",
    "status": "ACTIVE",
    "suppliers": [],
    "createdAt": "2025-12-05T10:30:00.000Z",
    "updatedAt": "2025-12-05T10:30:00.000Z"
  }
}
```

---

## Create Item

Create a new item.

**Endpoint:** `POST /items`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "itemCode": "ITEM-001",
  "stockId": "STOCK-001",
  "description": "Item Description",
  "category": "Raw Material",
  "categoryId": "63ffe256-083e-44fb-9505-f7c8694583c6",
  "units": "kg",
  "price": 100.50,
  "altPrice": 95.00,
  "currency": "USD",
  "status": "ACTIVE",
  "supplierIds": ["supplier-uuid-1", "supplier-uuid-2"]
}
```

**Response (Success - 201):**
```json
{
  "statusCode": 201,
  "data": {
    "message": "Item created successfully",
    "data": {
      "id": "item-uuid-1234",
      "itemCode": "ITEM-001",
      "stockId": "STOCK-001",
      "description": "Item Description",
      "category": "Raw Material",
      "categoryId": "63ffe256-083e-44fb-9505-f7c8694583c6",
      "units": "kg",
      "price": 100.50,
      "altPrice": 95.00,
      "currency": "USD",
      "status": "ACTIVE",
      "suppliers": [],
      "createdAt": "2025-12-05T10:30:00.000Z",
      "updatedAt": "2025-12-05T10:30:00.000Z"
    }
  }
}
```

---

## Update Item

Update an existing item.

**Endpoint:** `PUT /items/:itemCode`

**Path Parameters:**
- `itemCode` (string, required): Item code

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:** (All fields optional)
```json
{
  "stockId": "STOCK-002",
  "description": "Updated Description",
  "category": "Updated Category",
  "categoryId": "new-category-uuid",
  "units": "g",
  "price": 150.00,
  "altPrice": 140.00,
  "currency": "EUR",
  "status": "ACTIVE",
  "supplierIds": ["supplier-uuid-3"]
}
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Item updated successfully",
    "data": {
      "id": "item-uuid-1234",
      "itemCode": "ITEM-001",
      "stockId": "STOCK-002",
      "description": "Updated Description",
      "category": "Updated Category",
      "categoryId": "new-category-uuid",
      "units": "g",
      "price": 150.00,
      "altPrice": 140.00,
      "currency": "EUR",
      "status": "ACTIVE",
      "suppliers": [],
      "createdAt": "2025-12-05T10:30:00.000Z",
      "updatedAt": "2025-12-05T11:00:00.000Z"
    }
  }
}
```

---

## Delete Item

Delete an item by its item code.

**Endpoint:** `DELETE /items/:itemCode`

**Path Parameters:**
- `itemCode` (string, required): Item code

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Item deleted successfully"
  }
}
```

---

## Category Filter Usage

### Getting Category IDs

To get category IDs for filtering, use the categories endpoint:

```bash
GET /categories
```

Response example:
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "63ffe256-083e-44fb-9505-f7c8694583c6",
      "categoryId": "CAT005",
      "categoryName": "Raw Material",
      "categoryDesc": "Auto-generated category for Raw Material",
      "categoryColor": "#4E49BA",
      "status": "Active",
      "createdAt": "2025-10-23T07:55:59.529Z",
      "updatedAt": "2025-10-23T07:55:59.529Z"
    }
  ]
}
```

Use the `id` field (UUID) as the `category` query parameter value.

### Filtering Examples

```bash
# Filter by "Raw Material" category
GET /items?category=63ffe256-083e-44fb-9505-f7c8694583c6

# Search "tes" within "Raw Material" category
GET /items?page=1&limit=50&search=tes&category=63ffe256-083e-44fb-9505-f7c8694583c6

# Filter by "Horeka Range" category
GET /items?category=00565f16-205b-40b8-9c39-29ea8d63de31
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "timestamp": "2025-12-05T10:30:00.000Z",
  "path": "/items",
  "method": "GET",
  "message": "Error message describing what went wrong"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "timestamp": "2025-12-05T10:30:00.000Z",
  "path": "/items",
  "method": "GET",
  "message": "Category with ID 63ffe256-083e-44fb-9505-f7c8694583c6 not found"
}
```

---

## Notes

1. **Category Filter**: The `category` query parameter expects a **category ID (UUID)**, not a category name
2. **Combined Filters**: Search and category filters can be used together
3. **Pagination**: Pagination is applied after filtering
4. **Authentication**: All endpoints require authentication (JWT token)
5. **Permissions**: Requires ADMIN, MANAGER, or USER role

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-05  
**Generated For:** Frontend Development Team

