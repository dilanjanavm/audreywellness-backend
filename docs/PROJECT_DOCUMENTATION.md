# Project Documentation - Audrey Wellness Backend

**Version:** 1.0  
**Last Updated:** January 2025  
**Framework:** NestJS (Node.js/TypeScript)  
**Database:** MySQL (via TypeORM)

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Master Data vs Dependent Data](#master-data-vs-dependent-data)
4. [Data Import Order and Dependencies](#data-import-order-and-dependencies)
5. [Initial Setup Steps](#initial-setup-steps)
6. [Module Structure](#module-structure)
7. [Data Relationships](#data-relationships)
8. [Authentication & Authorization](#authentication--authorization)
9. [API Overview](#api-overview)
10. [Environment Configuration](#environment-configuration)
11. [Development Guidelines](#development-guidelines)

---

## Overview

The Audrey Wellness Backend is a comprehensive business management system built with NestJS, designed to manage customers, suppliers, items/products, recipes, tasks, costing, complaints, and courier services. The system follows a modular architecture with role-based access control and permission management.

### Key Features

- **User & Role Management:** Complete user management with roles and permissions
- **Customer Management:** Customer data with CSV import capabilities
- **Supplier Management:** Supplier data with item relationships
- **Item/Product Management:** Product catalog with categories and pricing
- **Category Management:** Product categorization system
- **Recipe Management:** Product recipes with versioning support
- **Task Management:** Task tracking with phases and recipe execution
- **Costing Management:** Product costing calculations
- **Complaint Management:** Customer complaint tracking with status workflow
- **Courier Tracking:** Integration with Citypak (Falcon) courier service
- **Attachment Management:** File upload and storage

---

## System Architecture

### Technology Stack

- **Framework:** NestJS 10.x
- **Language:** TypeScript
- **Database:** MySQL
- **ORM:** TypeORM
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **Email:** Nodemailer
- **HTTP Client:** Axios

### Application Structure

```
src/
├── modules/          # Feature modules (business logic)
├── common/           # Shared utilities, guards, interceptors, filters
├── config/           # Configuration files
├── database/         # Database seeds and migrations
└── main.ts           # Application entry point
```

---

## Master Data vs Dependent Data

Understanding master data and dependent data is crucial for proper system initialization and data import.

### Master Data (Standalone - No Dependencies)

Master data can be created independently without requiring other data to exist first.

#### 1. **Categories** ✅
- **Entity:** `CategoryEntity`
- **Table:** `categories`
- **Key Fields:** `categoryId`, `categoryName`, `categoryDesc`, `status`
- **Dependencies:** None
- **Import:** Manual creation via API (no CSV import)
- **Purpose:** Product categorization

#### 2. **Users** ✅
- **Entity:** `User`
- **Table:** `users`
- **Key Fields:** `userName`, `email`, `mobileNumber`, `roleId`
- **Dependencies:** Roles (optional - can be null)
- **Import:** Manual creation via API
- **Note:** Super Admin user is auto-created via seed
- **Purpose:** System users and employees

#### 3. **Roles** ✅
- **Entity:** `Role`
- **Table:** `roles`
- **Key Fields:** `name`, `code`, `description`, `isActive`
- **Dependencies:** None (but linked to Permissions via RolePermissions)
- **Import:** Manual creation via API
- **Note:** Super Admin role is auto-created via seed
- **Purpose:** User role definitions

#### 4. **Permissions** ✅
- **Entity:** `Permission`
- **Table:** `permissions`
- **Key Fields:** `name`, `code`, `module`, `description`
- **Dependencies:** None
- **Import:** Auto-created via seed (46 permissions)
- **Purpose:** System permission definitions

#### 5. **Suppliers** ✅ (Mostly Independent)
- **Entity:** `Supplier`
- **Table:** `suppliers`
- **Key Fields:** `supplierCode`, `name`, `reference`, `address`, `phone`, `email`
- **Dependencies:** None (items can be linked later)
- **Import:** CSV import available (`POST /suppliers/import`)
- **Purpose:** Supplier/vendor information

#### 6. **Customers** ✅ (Mostly Independent)
- **Entity:** `CustomerEntity`
- **Table:** `customers`
- **Key Fields:** `sNo`, `name`, `shortName`, `smsPhone`, `email`, `address`
- **Dependencies:** None (complaints can be created later)
- **Import:** CSV import available (`POST /customers/import-csv`)
- **Purpose:** Customer/client information

---

### Dependent Data (Requires Master Data)

Dependent data requires one or more master data records to exist before it can be created.

#### 1. **Items/Products** ⚠️ DEPENDS ON: Categories
- **Entity:** `ItemEntity`
- **Table:** `items`
- **Key Fields:** `itemCode`, `stockId`, `description`, `category`, `categoryId`, `price`, `currency`
- **Dependencies:** 
  - **Category** (recommended - `categoryId` is optional but `category` name is required)
  - **Suppliers** (optional - many-to-many relationship, can be linked after creation)
- **Import:** CSV import available (`POST /items/import`)
- **Purpose:** Product/item catalog
- **Note:** Category should exist before importing items for proper relationships

#### 2. **Recipes** ⚠️ DEPENDS ON: Items
- **Entity:** `Recipe`
- **Table:** `recipes`
- **Key Fields:** `name`, `productId`, `itemId`, `batchSize`, `version`, `status`
- **Dependencies:** 
  - **Item/Product** (required - `productId` and `itemId`)
- **Import:** Manual creation via API only
- **Purpose:** Product manufacturing recipes
- **Note:** Items must exist before creating recipes

#### 3. **Costing** ⚠️ DEPENDS ON: Items, Recipes (optional)
- **Entity:** `CostingEntity`
- **Table:** `costings`
- **Key Fields:** `itemId`, `recipeId`, `totalCost`, `sellingPrice`
- **Dependencies:** 
  - **Item/Product** (required - `itemId`)
  - **Recipe** (optional - `recipeId`)
- **Import:** Manual creation via API only
- **Purpose:** Product costing calculations
- **Note:** Items must exist before creating costings

#### 4. **Tasks** ⚠️ DEPENDS ON: Users, Costing (optional), Recipes (optional)
- **Entity:** `TaskEntity`
- **Table:** `tasks`
- **Key Fields:** `name`, `phaseId`, `assignedUserId`, `costingId`, `recipeExecutionId`
- **Dependencies:** 
  - **TaskPhase** (required - `phaseId`)
  - **User** (optional - `assignedUserId`)
  - **Costing** (optional - `costingId`)
  - **Recipe** (optional - via `recipeExecutionId`)
- **Import:** Manual creation via API only
- **Purpose:** Task management and tracking
- **Note:** Users and phases should exist before creating tasks

#### 5. **Complaints** ⚠️ DEPENDS ON: Customers, Users
- **Entity:** `ComplaintEntity`
- **Table:** `complaints`
- **Key Fields:** `customerId`, `assignedToId`, `headline`, `description`, `category`, `priority`, `status`
- **Dependencies:** 
  - **Customer** (required - `customerId`)
  - **User** (required - `assignedToId`)
- **Import:** Manual creation via API only
- **Purpose:** Customer complaint management
- **Note:** Customers and Users must exist before creating complaints

#### 6. **Courier Orders** ⚠️ DEPENDS ON: None (but related to business operations)
- **Entity:** `CourierOrderEntity`
- **Table:** `courier_orders`
- **Key Fields:** `citypakOrderId`, `trackingNumber`, `reference`, `status`
- **Dependencies:** None (standalone tracking)
- **Import:** Created via API when order is placed with courier service
- **Purpose:** Courier package tracking

#### 7. **Supplier-Item Relationships** ⚠️ DEPENDS ON: Suppliers, Items
- **Table:** `suppliers_items_item_entities` (many-to-many join table)
- **Dependencies:** 
  - **Supplier** (required)
  - **Item** (required)
- **Import:** Linked via API (`POST /suppliers/:id/items` or `POST /items/:itemCode/suppliers`)
- **Purpose:** Link suppliers to items they supply

---

## Data Import Order and Dependencies

Follow this order when importing or setting up data to avoid dependency errors:

### Phase 1: System Initialization (Automatic)

This happens automatically when the application starts via the seed service:

1. ✅ **Permissions** - Auto-created (46 permissions across 9 modules)
2. ✅ **Roles** - Super Admin role auto-created
3. ✅ **Users** - Super Admin user auto-created
   - Email: `admin@app.com`
   - Password: `1234`
   - Username: `admin`
   - Role: Super Admin (all permissions)

### Phase 2: Manual Master Data Setup

Set up these manually or via CSV import (no dependencies):

1. ✅ **Categories** (Recommended first for item organization)
   - Create via: `POST /categories`
   - No CSV import available
   - Used by: Items

2. ✅ **Roles** (If additional roles needed)
   - Create via: `POST /roles`
   - Assign permissions via: `POST /roles/:id/permissions`
   - Used by: Users

3. ✅ **Users** (Create employees/staff)
   - Create via: `POST /users`
   - Requires: Role (optional)
   - Used by: Complaints, Tasks

4. ✅ **Suppliers** (Can import via CSV)
   - Import via: `POST /suppliers/import` (CSV file upload)
   - Or create via: `POST /suppliers`
   - Used by: Items (many-to-many relationship)

5. ✅ **Customers** (Can import via CSV)
   - Import via: `POST /customers/import-csv` (CSV file upload)
   - Or create via: `POST /customers`
   - Used by: Complaints

### Phase 3: Dependent Data Setup

Set up these after master data exists:

1. ⚠️ **Items/Products** (Requires Categories)
   - Import via: `POST /items/import` (CSV content) or `POST /items/import/upload` (CSV file)
   - Or create via: `POST /items`
   - Requires: Category (recommended)
   - Used by: Recipes, Costing, Supplier-Item relationships

2. ⚠️ **Supplier-Item Relationships** (Requires Suppliers and Items)
   - Link via: `POST /suppliers/:id/items` or `POST /items/:itemCode/suppliers`
   - Requires: Supplier and Item must exist
   - Used by: Item management, supplier management

3. ⚠️ **Recipes** (Requires Items)
   - Create via: `POST /recipes`
   - Requires: Item/Product (`productId`, `itemId`)
   - Used by: Tasks, Costing

4. ⚠️ **Costing** (Requires Items, optionally Recipes)
   - Create via: `POST /costings`
   - Requires: Item (`itemId`), Recipe (optional)
   - Used by: Tasks

5. ⚠️ **Tasks** (Requires Users, optionally Costing/Recipes)
   - Create via: `POST /tasks`
   - Requires: TaskPhase (`phaseId`), User (optional), Costing (optional), Recipe (optional)
   - Used by: Task tracking system

6. ⚠️ **Complaints** (Requires Customers and Users)
   - Create via: `POST /complaints`
   - Requires: Customer (`customerId`), User (`assignedToId`)
   - Used by: Complaint management system

7. ⚠️ **Courier Orders** (Independent but business-related)
   - Create via: `POST /courier/orders`
   - No dependencies
   - Used by: Package tracking

---

## Initial Setup Steps

Follow these steps to set up a new instance of the system:

### Step 1: Environment Configuration

1. Copy `.env` template (if available) or create `.env` file
2. Configure database connection:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=root
   DB_PASSWORD=your_password
   DB_NAME=audreywellnessdb
   ```
3. Configure JWT secret:
   ```env
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=1d
   ```
4. Configure email (optional, for user welcome emails):
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```
5. Configure courier service (optional):
   ```env
   CITYPAK_STAGING_API_TOKEN=your-token
   CITYPAK_PRODUCTION_API_TOKEN=your-token
   NODE_ENV=development
   ```

### Step 2: Database Setup

1. Create MySQL database:
   ```sql
   CREATE DATABASE audreywellnessdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Run application (TypeORM will auto-create tables if `synchronize: true`):
   ```bash
   npm install
   npm run start:dev
   ```
3. Seed service runs automatically, creating:
   - All permissions (46 permissions)
   - Super Admin role
   - Super Admin user (admin@app.com / 1234)

### Step 3: Verify Initial Setup

1. Login with Super Admin credentials:
   ```bash
   POST /auth/login
   {
     "email": "admin@app.com",
     "password": "1234"
   }
   ```
2. Verify you receive JWT token
3. Use token for subsequent API calls

### Step 4: Data Import (Recommended Order)

1. **Categories** (if you have category data):
   ```bash
   POST /categories
   Authorization: Bearer <token>
   {
     "categoryId": "CAT001",
     "categoryName": "Category Name",
     "categoryDesc": "Description"
   }
   ```

2. **Roles & Permissions** (if you need additional roles):
   ```bash
   POST /roles
   Authorization: Bearer <token>
   {
     "name": "Manager",
     "code": "MANAGER",
     "description": "Manager role"
   }
   ```

3. **Users** (create staff/employees):
   ```bash
   POST /users
   Authorization: Bearer <token>
   {
     "userName": "john.doe",
     "email": "john@example.com",
     "mobileNumber": "0771234567",
     "roleId": "<role-uuid>"
   }
   ```

4. **Suppliers** (CSV import recommended):
   ```bash
   POST /suppliers/import
   Authorization: Bearer <token>
   Content-Type: multipart/form-data
   file: <suppliers.csv>
   ```

5. **Customers** (CSV import recommended):
   ```bash
   POST /customers/import-csv
   Authorization: Bearer <token>
   Content-Type: multipart/form-data
   file: <customers.csv>
   ```

6. **Items/Products** (CSV import recommended, after Categories):
   ```bash
   POST /items/import/upload
   Authorization: Bearer <token>
   Content-Type: multipart/form-data
   file: <items.csv>
   ```

7. **Link Suppliers to Items** (after both exist):
   ```bash
   POST /items/:itemCode/suppliers
   Authorization: Bearer <token>
   {
     "supplierIds": ["supplier-uuid-1", "supplier-uuid-2"]
   }
   ```

8. **Recipes** (after Items exist):
   ```bash
   POST /recipes
   Authorization: Bearer <token>
   {
     "name": "Recipe Name",
     "productId": "<item-uuid>",
     "itemId": "<item-uuid>",
     "batchSize": "100",
     "totalTime": 120
   }
   ```

9. **Costing** (after Items and optionally Recipes):
   ```bash
   POST /costings
   Authorization: Bearer <token>
   {
     "itemId": "<item-uuid>",
     "recipeId": "<recipe-uuid>",
     "totalCost": 1000.00,
     "sellingPrice": 1500.00
   }
   ```

---

## Module Structure

### Core Modules

| Module | Path | Description |
|--------|------|-------------|
| **Auth** | `src/modules/auth` | Authentication (login, JWT) |
| **Users** | `src/modules/users` | User management |
| **Roles** | `src/modules/roles` | Role management |
| **Permissions** | `src/modules/permissions` | Permission management |
| **RolePermissions** | `src/modules/role-permissions` | Role-Permission linking |

### Business Modules

| Module | Path | Description |
|--------|------|-------------|
| **Customers** | `src/modules/customer` | Customer management, CSV import |
| **Suppliers** | `src/modules/suppliers` | Supplier management, CSV import |
| **Items** | `src/modules/item` | Product/Item management, CSV import |
| **Categories** | `src/modules/category` | Category management |
| **Recipes** | `src/modules/recipes` | Recipe management with versioning |
| **Tasks** | `src/modules/tasks` | Task management with phases |
| **Costing** | `src/modules/costing` | Product costing |
| **Complaints** | `src/modules/complaint` | Complaint management |
| **Courier** | `src/modules/courier` | Courier tracking (Citypak integration) |
| **Attachments** | `src/modules/attachment` | File upload/storage |

### Supporting Modules

| Module | Path | Description |
|--------|------|-------------|
| **Email** | `src/modules/email` | Email service (Nodemailer) |
| **Seed** | `src/database/seeds` | Database seeding service |

---

## Data Relationships

### Entity Relationship Diagram (Key Relationships)

```
Users ──┐
        ├──> Complaints (assignedToId)
        └──> Tasks (assignedUserId)

Roles ──> Users (roleId)

Categories ──> Items (categoryId)

Items ──┬──> Recipes (productId, itemId)
        ├──> Costing (itemId)
        └──> Suppliers (many-to-many)

Suppliers ──> Items (many-to-many)

Customers ──> Complaints (customerId)

Recipes ──> Tasks (via recipeExecutionId)

Costing ──> Tasks (costingId)

TaskPhase ──> Tasks (phaseId)
```

### Detailed Relationships

#### 1. User Relationships
- **Users → Roles:** Many-to-One (users.roleId → roles.id)
- **Users → Complaints:** One-to-Many (complaints.assignedToId → users.id)
- **Users → Tasks:** One-to-Many (tasks.assignedUserId → users.id)

#### 2. Category Relationships
- **Categories → Items:** One-to-Many (items.categoryId → categories.id)

#### 3. Item Relationships
- **Items → Categories:** Many-to-One (items.categoryId → categories.id)
- **Items → Suppliers:** Many-to-Many (via join table `suppliers_items_item_entities`)
- **Items → Recipes:** One-to-Many (recipes.productId, recipes.itemId → items.id)
- **Items → Costing:** One-to-Many (costings.itemId → items.id)

#### 4. Supplier Relationships
- **Suppliers → Items:** Many-to-Many (via join table)

#### 5. Customer Relationships
- **Customers → Complaints:** One-to-Many (complaints.customerId → customers.id)

#### 6. Recipe Relationships
- **Recipes → Items:** Many-to-One (recipes.productId → items.id)
- **Recipes → Costing:** One-to-Many (costings.recipeId → recipes.id)
- **Recipes → Tasks:** One-to-One (tasks.recipeExecutionId → recipe_executions.recipeId)

#### 7. Task Relationships
- **Tasks → Users:** Many-to-One (tasks.assignedUserId → users.id)
- **Tasks → Costing:** Many-to-One (tasks.costingId → costings.id)
- **Tasks → TaskPhase:** Many-to-One (tasks.phaseId → task_phases.id)
- **Tasks → Recipes:** One-to-One (via recipe_executions)

---

## Authentication & Authorization

### Authentication

The system uses JWT (JSON Web Tokens) for authentication.

**Login Endpoint:**
```
POST /auth/login
Body: { "email": "user@example.com", "password": "password123" }
Response: { "access_token": "jwt-token-here", "user": {...} }
```

**Token Usage:**
Include the token in the `Authorization` header:
```
Authorization: Bearer <jwt-token>
```

### Authorization (Role-Based Access Control)

The system uses a three-tier authorization system:

1. **Legacy Roles (Enum):** `ADMIN`, `MANAGER`, `USER`
2. **Roles (Database):** Flexible role system with custom roles
3. **Permissions (Database):** Granular permissions per module

### Permission System

46 permissions across 9 modules:

| Module | Permissions |
|--------|-------------|
| **Users** | USER_CREATE, USER_UPDATE, USER_DELETE, USER_VIEW |
| **Roles** | ROLE_CREATE, ROLE_UPDATE, ROLE_DELETE, ROLE_VIEW, ROLE_ASSIGN_PERMISSIONS |
| **Permissions** | PERMISSION_CREATE, PERMISSION_UPDATE, PERMISSION_DELETE, PERMISSION_VIEW |
| **Tasks** | TASK_CREATE, TASK_UPDATE, TASK_DELETE, TASK_VIEW |
| **Costing** | COSTING_CREATE, COSTING_UPDATE, COSTING_DELETE, COSTING_VIEW |
| **Customers** | CUSTOMER_CREATE, CUSTOMER_UPDATE, CUSTOMER_DELETE, CUSTOMER_VIEW |
| **Suppliers** | SUPPLIER_CREATE, SUPPLIER_UPDATE, SUPPLIER_DELETE, SUPPLIER_VIEW |
| **Items** | ITEM_CREATE, ITEM_UPDATE, ITEM_DELETE, ITEM_VIEW |
| **Categories** | CATEGORY_CREATE, CATEGORY_UPDATE, CATEGORY_DELETE, CATEGORY_VIEW |
| **Complaints** | COMPLAINT_CREATE, COMPLAINT_UPDATE, COMPLAINT_DELETE, COMPLAINT_VIEW |

### Default Roles

- **Super Admin:** Auto-created, has all permissions
- **ADMIN (Legacy):** Full access (checked via enum)
- **MANAGER (Legacy):** Moderate access
- **USER (Legacy):** Limited access

### Guards

- **JwtAuthGuard:** Verifies JWT token
- **RolesGuard:** Checks user roles/permissions
- **@Roles() decorator:** Specifies required roles for endpoints

---

## API Overview

### Base URL
```
Development: http://localhost:3005
Production: http://206.189.82.117:3003
```

### API Structure

All APIs follow RESTful conventions:

- **GET** `/resource` - List all resources
- **GET** `/resource/:id` - Get single resource
- **POST** `/resource` - Create resource
- **PUT** `/resource/:id` - Update resource
- **DELETE** `/resource/:id` - Delete resource

### Key Endpoints

#### Authentication
- `POST /auth/login` - User login

#### Users
- `POST /users` - Create user
- `GET /users` - List users
- `GET /users/:id` - Get user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### Roles & Permissions
- `POST /roles` - Create role
- `GET /roles` - List roles
- `POST /roles/:id/permissions` - Assign permissions to role
- `GET /permissions` - List permissions
- `GET /permissions/module/:module` - Get permissions by module

#### Customers
- `POST /customers` - Create customer
- `POST /customers/import-csv` - **Import customers from CSV**
- `GET /customers` - List customers
- `GET /customers/:id` - Get customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer
- `GET /customers/search/:term` - Search customers

#### Suppliers
- `POST /suppliers` - Create supplier
- `POST /suppliers/import` - **Import suppliers from CSV**
- `GET /suppliers` - List suppliers
- `GET /suppliers/:id` - Get supplier
- `PUT /suppliers/:id` - Update supplier
- `DELETE /suppliers/:id` - Delete supplier
- `GET /suppliers/export/csv` - Export suppliers to CSV

#### Items
- `POST /items` - Create item
- `POST /items/import` - **Import items from CSV (content)**
- `POST /items/import/upload` - **Import items from CSV (file)**
- `GET /items` - List items
- `GET /items/:itemCode` - Get item by code
- `PUT /items/:itemCode` - Update item
- `DELETE /items/:itemCode` - Delete item
- `GET /items/search/:term` - Search items
- `POST /items/:itemCode/suppliers` - Link suppliers to item

#### Categories
- `POST /categories` - Create category
- `GET /categories` - List categories
- `GET /categories/:id` - Get category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

#### Recipes
- `POST /recipes` - Create recipe
- `GET /recipes` - List recipes
- `GET /recipes/:id` - Get recipe
- `PUT /recipes/:id` - Update recipe
- `DELETE /recipes/:id` - Delete recipe

#### Tasks
- `POST /tasks` - Create task
- `GET /tasks` - List tasks
- `GET /tasks/:id` - Get task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

#### Costing
- `POST /costings` - Create costing
- `GET /costings` - List costings
- `GET /costings/:id` - Get costing
- `PUT /costings/:id` - Update costing
- `DELETE /costings/:id` - Delete costing

#### Complaints
- `POST /complaints` - Create complaint
- `GET /complaints` - List complaints
- `GET /complaints/:id` - Get complaint
- `PUT /complaints/:id` - Update complaint
- `PATCH /complaints/:id/status` - Update complaint status
- `DELETE /complaints/:id` - Delete complaint

#### Courier
- `POST /courier/orders` - Create courier order
- `GET /courier/orders` - List courier orders
- `GET /courier/orders/:id` - Get courier order
- `GET /courier/orders/:id/track` - Track courier order
- `POST /courier/webhook` - Webhook for courier updates

### Detailed API Documentation

For detailed API documentation, see:
- `docs/COMPLAINT_MANAGEMENT_API.md` - Complaint management API
- `docs/COURIER_TRACKING_API.md` - Courier tracking API
- Other module-specific documentation files

---

## Environment Configuration

### Required Environment Variables

#### Database
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=audreywellnessdb
```

#### JWT Authentication
```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1d
```

#### Application
```env
PORT=3005
NODE_ENV=development
```

#### Email (Optional)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

#### Courier Service (Optional)
```env
CITYPAK_STAGING_URL=https://staging.citypak.lk
CITYPAK_STAGING_API_TOKEN=your-staging-token
CITYPAK_PRODUCTION_URL=https://falcon.citypak.lk
CITYPAK_PRODUCTION_API_TOKEN=your-production-token
```

#### CORS (Optional)
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:4200
```

### Environment Files

- `.env` - Base environment file (loaded first)
- `.env.production` - Production overrides (loaded if NODE_ENV=production)

See `ENV_FILES_SETUP.md` for detailed environment configuration guide.

---

## Development Guidelines

### CSV Import Formats

#### Customer CSV Format
Columns: `type`, `debtor_no`, `branch_code`, `debtor_ref`, `branch_ref`, `address`, `tax_id`, `ntn_no`, `curr_abrev`, `terms`, `sales_type`, `credit_status`, `salesman_name`, `location_name`, `shipper_name`, `area`, `tax_group`, `group_no`, `notes`, `phone`, `phone2`, `fax`, `email`, `DOB`, `name`, ...

**Mapping:**
- `debtor_no`/`branch_code` → `sNo`
- `name` → `name`
- `debtor_ref`/`branch_ref` → `shortName`
- `phone`/`phone2` → `smsPhone`
- `email` → `email`
- `curr_abrev` → `currency`
- `terms` → `paymentTerms`
- `sales_type` → `salesType`
- `area` → `cityArea`
- `DOB` → `dob`
- `address` → `address`
- `group_no` → `salesGroup`

#### Supplier CSV Format
Standard supplier CSV with columns: `supp_name`, `supp_ref`, `address`, `phone`, `phone2`, `email`, `contact_person`, `fax`, `ntn_no`, etc.

#### Item CSV Format
Columns: `item_code`, `stock_id`, `description`, `category`, `units`, `price`, `alt_price`, `currency`, `status`

### Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error response format:
```json
{
  "statusCode": 400,
  "message": "Error message",
  "timestamp": "2025-01-12T10:00:00.000Z",
  "path": "/api/endpoint"
}
```

### Data Validation

- All DTOs use class-validator decorators
- Required fields are validated
- Enum values are validated
- Email format is validated
- UUID format is validated

### Logging

The application uses NestJS Logger:
- Error logs for exceptions
- Warning logs for important events
- Info logs for general operations
- Debug logs for detailed debugging

---

## Summary: Data Import Checklist

Use this checklist when setting up a new system instance:

### ✅ Phase 1: Automatic (On Application Start)
- [x] Permissions created (46 permissions)
- [x] Super Admin role created
- [x] Super Admin user created (admin@app.com / 1234)

### ✅ Phase 2: Master Data (No Dependencies)
- [ ] Categories created (via API)
- [ ] Additional Roles created (if needed, via API)
- [ ] Users/Employees created (via API)
- [ ] Suppliers imported (via CSV: `POST /suppliers/import`)
- [ ] Customers imported (via CSV: `POST /customers/import-csv`)

### ⚠️ Phase 3: Dependent Data (Requires Master Data)
- [ ] Items imported (via CSV: `POST /items/import/upload`) - **Requires Categories**
- [ ] Supplier-Item relationships linked (via API) - **Requires Suppliers & Items**
- [ ] Recipes created (via API) - **Requires Items**
- [ ] Costing created (via API) - **Requires Items (and optionally Recipes)**
- [ ] Tasks created (via API) - **Requires Users, Phases (and optionally Costing/Recipes)**
- [ ] Complaints created (via API) - **Requires Customers & Users**

---

## Additional Resources

- **API Endpoints Summary:** See `docs/API_ENDPOINTS_SUMMARY.md`
- **Complaint Management API:** See `docs/COMPLAINT_MANAGEMENT_API.md`
- **Courier Tracking API:** See `docs/COURIER_TRACKING_API.md`
- **Environment Setup:** See `ENV_FILES_SETUP.md`
- **Email Setup:** See `docs/EMAIL_SETUP.md`

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained By:** Backend Development Team
