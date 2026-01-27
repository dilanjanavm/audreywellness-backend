# API Endpoints Summary

**Base URL:** `http://localhost:3005`  
**Last Updated:** 2025-12-16

This document provides a quick reference of all API endpoints. For detailed documentation, see the individual API documentation files.

---

## Quick Reference

| Method | Endpoint | Auth Required | Roles | Description |
|--------|----------|---------------|-------|-------------|
| **Authentication** |
| POST | `/auth/login` | ❌ | - | User login |
| **Users** |
| POST | `/users` | ❌ | - | Create user |
| GET | `/users` | ❌ | - | Get all users |
| GET | `/users/:id` | ❌ | - | Get user by ID |
| PUT | `/users/:id` | ❌ | - | Update user |
| DELETE | `/users/:id` | ❌ | - | Delete user |
| **Roles** |
| POST | `/roles` | ❌ | - | Create role |
| GET | `/roles` | ❌ | - | Get all roles |
| GET | `/roles/:id` | ❌ | - | Get role by ID |
| PUT | `/roles/:id` | ❌ | - | Update role |
| DELETE | `/roles/:id` | ❌ | - | Delete role |
| POST | `/roles/:id/permissions` | ❌ | - | Assign permissions |
| GET | `/roles/:id/permissions` | ❌ | - | Get role permissions |
| **Permissions** |
| POST | `/permissions` | ❌ | - | Create permission |
| GET | `/permissions` | ❌ | - | Get all permissions |
| GET | `/permissions/:id` | ❌ | - | Get permission by ID |
| GET | `/permissions/module/:module` | ❌ | - | Get permissions by module |
| GET | `/permissions/grouped/by-module` | ❌ | - | Get grouped permissions |
| PUT | `/permissions/:id` | ❌ | - | Update permission |
| DELETE | `/permissions/:id` | ❌ | - | Delete permission |
| **Customers** |
| POST | `/customers` | ✅ | ADMIN, MANAGER | Create customer |
| POST | `/customers/import-csv` | ✅ | ADMIN, MANAGER | Import customers CSV |
| GET | `/customers` | ✅ | ADMIN, MANAGER, USER | Get all customers |
| GET | `/customers/:id` | ✅ | ADMIN, MANAGER, USER | Get customer by ID |
| GET | `/customers/sno/:sNo` | ✅ | ADMIN, MANAGER, USER | Get customer by number |
| PUT | `/customers/:id` | ✅ | ADMIN, MANAGER | Update customer |
| DELETE | `/customers/:id` | ✅ | ADMIN | Delete customer |
| GET | `/customers/search/:term` | ✅ | ADMIN, MANAGER, USER | Search customers |
| GET | `/customers/:id/complaints` | ✅ | ADMIN, MANAGER, USER | Get customer complaints |
| **Suppliers** |
| POST | `/suppliers` | ✅ | ADMIN, MANAGER | Create supplier |
| GET | `/suppliers` | ✅ | ADMIN, MANAGER, USER | Get all suppliers |
| GET | `/suppliers/stats` | ✅ | ADMIN, MANAGER | Get supplier statistics |
| GET | `/suppliers/:id` | ✅ | ADMIN, MANAGER, USER | Get supplier by ID |
| GET | `/suppliers/reference/:reference` | ✅ | ADMIN, MANAGER, USER | Get supplier by reference |
| PUT | `/suppliers/:id` | ✅ | ADMIN, MANAGER | Update supplier |
| DELETE | `/suppliers/:id` | ✅ | ADMIN, MANAGER | Delete supplier |
| GET | `/suppliers/:id/items` | ✅ | ADMIN, MANAGER, USER | Get supplier items |
| POST | `/suppliers/:id/items` | ✅ | ADMIN, MANAGER | Add items to supplier |
| DELETE | `/suppliers/:id/items` | ✅ | ADMIN, MANAGER | Remove items from supplier |
| GET | `/suppliers/items/:itemId/suppliers` | ✅ | ADMIN, MANAGER, USER | Get suppliers by item |
| POST | `/suppliers/import` | ✅ | ADMIN, MANAGER | Import suppliers CSV |
| GET | `/suppliers/export/csv` | ✅ | ADMIN, MANAGER | Export suppliers CSV |
| **Items** |
| POST | `/items` | ✅ | ADMIN, MANAGER | Create item |
| GET | `/items` | ✅ | ADMIN, MANAGER, USER | Get all items |
| GET | `/items/:itemCode` | ✅ | ADMIN, MANAGER, USER | Get item by code |
| PUT | `/items/:itemCode` | ✅ | ADMIN, MANAGER | Update item |
| DELETE | `/items/:itemCode` | ✅ | ADMIN | Delete item |
| POST | `/items/bulk-remove` | ✅ | ADMIN | Bulk delete items |
| GET | `/items/search/:term` | ✅ | ADMIN, MANAGER, USER | Search items |
| GET | `/items/category/:categoryId` | ✅ | ADMIN, MANAGER, USER | Get items by category |
| POST | `/items/:itemCode/suppliers` | ✅ | ADMIN, MANAGER | Add suppliers to item |
| DELETE | `/items/:itemCode/suppliers` | ✅ | ADMIN, MANAGER | Remove suppliers from item |
| GET | `/items/:itemCode/suppliers` | ✅ | ADMIN, MANAGER, USER | Get item suppliers |
| GET | `/items/supplier/:supplierId/items` | ✅ | ADMIN, MANAGER, USER | Get items by supplier |
| POST | `/items/import` | ✅ | ADMIN, MANAGER | Import items CSV |
| GET | `/items/export/csv` | ✅ | ADMIN, MANAGER | Export items CSV |
| **Categories** |
| POST | `/categories` | ❌ | - | Create category |
| GET | `/categories` | ❌ | - | Get all categories |
| GET | `/categories/:categoryId` | ❌ | - | Get category by ID |
| PUT | `/categories/:categoryId` | ❌ | - | Update category |
| DELETE | `/categories/:categoryId` | ❌ | - | Delete category |
| **Costing** |
| POST | `/costing` | ❌ | - | Create costing |
| GET | `/costing/item/:itemId` | ❌ | - | Get costings for item |
| GET | `/costing/item/:itemId/active` | ❌ | - | Get active costing for item |
| GET | `/costing/:id` | ❌ | - | Get costing by ID |
| PUT | `/costing/:id` | ❌ | - | Update costing |
| PUT | `/costing/:id/set-active` | ❌ | - | Set costing as active |
| DELETE | `/costing/:id` | ❌ | - | Delete costing |
| GET | `/costing/compare/:costingId1/:costingId2` | ❌ | - | Compare two costings |
| GET | `/costing/item/:itemId/history` | ❌ | - | Get costing history |
| POST | `/costing/:id/recalculate` | ❌ | - | Recalculate costing |
| POST | `/costing/bulk/deactivate` | ❌ | - | Bulk deactivate costings |
| GET | `/costing/health/check` | ❌ | - | Health check |
| GET | `/costing/items/co` | ❌ | - | Get items with costing |
| GET | `/costing/items/category/:category` | ❌ | - | Get items by category with costing |
| GET | `/costing/items/:itemCode` | ❌ | - | Get item with costing |
| GET | `/costing/items/search/:term` | ❌ | - | Search items with costing |
| POST | `/costing/items/by-categories` | ❌ | - | Get items by categories with costing |
| GET | `/costing/products/costed` | ❌ | - | Get costed products |
| GET | `/costing/products/:itemId/cost-history` | ❌ | - | Get product cost history |
| **Tasks** |
| GET | `/tasks/phases` | ✅ | - | Get all phases |
| POST | `/tasks/phases` | ✅ | - | Create phase |
| PUT | `/tasks/phases/:phaseId` | ✅ | - | Update phase |
| DELETE | `/tasks/phases/:phaseId` | ✅ | - | Delete phase |
| POST | `/tasks` | ✅ | - | Create task |
| GET | `/tasks/phases/:phaseId/tasks` | ✅ | - | Get phase tasks (role-filtered) |
| GET | `/tasks/reference/statuses` | ✅ | - | Get status reference |
| POST | `/tasks/:taskId/comments` | ✅ | - | Add comment to task |
| GET | `/tasks/:taskId/comments` | ✅ | - | Get task comments |
| DELETE | `/tasks/comments/:commentId` | ✅ | - | Delete comment |
| POST | `/tasks/:taskId/move` | ✅ | - | Move task to phase |
| GET | `/tasks/:taskId/movement-history` | ✅ | - | Get movement history |
| PUT | `/tasks/:taskId` | ✅ | - | Update task |
| PATCH | `/tasks/:taskId/position` | ✅ | - | Update task position |
| DELETE | `/tasks/:taskId` | ✅ | - | Delete task |
| **Complaints** |
| POST | `/complaints` | ✅ | ADMIN, MANAGER, USER | Create complaint |
| GET | `/complaints` | ✅ | ADMIN, MANAGER, USER | Get all complaints |
| GET | `/complaints/:id` | ✅ | ADMIN, MANAGER, USER | Get complaint by ID |
| PUT | `/complaints/:id` | ✅ | ADMIN, MANAGER | Update complaint |
| PUT | `/complaints/:id/status` | ✅ | ADMIN, MANAGER | Update complaint status |
| POST | `/complaints/:id/notes` | ✅ | ADMIN, MANAGER, USER | Add note to complaint |
| POST | `/complaints/:id/feedback` | ✅ | ADMIN, MANAGER, USER | Submit feedback |
| **Attachments** |
| POST | `/attachments/upload` | ✅ | ADMIN, MANAGER, USER | Upload generic file |
| GET | `/attachments/uploads/generic` | ✅ | ADMIN, MANAGER, USER | Get generic uploads |
| GET | `/attachments` | ✅ | ADMIN, MANAGER | Get all uploads |
| POST | `/attachments/complaint/:complaintId` | ✅ | ADMIN, MANAGER, USER | Upload complaint attachment |
| GET | `/attachments/complaint/:complaintId` | ✅ | ADMIN, MANAGER, USER | Get complaint attachments |
| GET | `/attachments/:id/download` | ✅ | ADMIN, MANAGER, USER | Download attachment |
| GET | `/attachments/:id/preview` | ✅ | ADMIN, MANAGER, USER | Preview attachment |
| GET | `/attachments/:id` | ✅ | ADMIN, MANAGER, USER | Get attachment info |
| DELETE | `/attachments/:id` | ✅ | ADMIN, MANAGER | Delete attachment |
| **Email Service** |
| GET | `/email/status` | ❌ | - | Get email service status |
| GET | `/email/verify` | ❌ | - | Verify email connection |
| POST | `/email/test` | ❌ | - | Send test email |
| **Recipes** |
| POST | `/recipes` | ✅ | ADMIN, MANAGER | Create recipe |
| GET | `/recipes` | ✅ | ADMIN, MANAGER, USER | Get all recipes |
| GET | `/recipes/:id` | ✅ | ADMIN, MANAGER, USER | Get recipe by ID |
| GET | `/recipes/product/:productId/batch/:batchSize/versions` | ✅ | ADMIN, MANAGER, USER | Get version history |
| PUT | `/recipes/:id` | ✅ | ADMIN, MANAGER | Update recipe |
| PUT | `/recipes/:id/set-active` | ✅ | ADMIN, MANAGER | Set active version |
| DELETE | `/recipes/:id` | ✅ | ADMIN, MANAGER | Delete recipe |

---

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

To get a token, use the `/auth/login` endpoint.

---

## Query Parameters Common Patterns

### Pagination
- `page` (number, default: 1): Page number
- `limit` (number, default: 10-50): Items per page

### Filtering
- `search` (string): Search term
- `status` (string): Status filter
- `category` (string/UUID): Category filter

### Sorting
- Most endpoints return data in creation order (newest first) or by a default sort field

---

## Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Optional message"
}
```

### Paginated Response
```json
{
  "data": [ ... ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "timestamp": "2025-12-16T10:00:00.000Z",
  "path": "/endpoint",
  "method": "GET"
}
```

---

## Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `204 No Content`: Success with no content
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Detailed Documentation

For detailed API documentation with request/response examples, see:

- [Complete API Documentation](./COMPLETE_API_DOCUMENTATION.md)
- [User Role Permission API](./USER_ROLE_PERMISSION_API.md)
- [Item API](./ITEM_API.md)
- [Email API](./EMAIL_API.md)
- [Task API](./TASK_API.md)
- [Auth Login Response](./AUTH_LOGIN_RESPONSE.md)
- [All Permissions List](./ALL_PERMISSIONS_LIST.md)

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-16

