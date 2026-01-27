# Expected CSV Formats for Import Endpoints

This document describes the expected CSV formats for all import endpoints in the system.

## Table of Contents
1. [Customer CSV Import](#customer-csv-import)
2. [Supplier CSV Import](#supplier-csv-import)
3. [Item CSV Import](#item-csv-import)

---

## Customer CSV Import

**Endpoint:** `POST /customers/import-csv`  
**Method:** File upload (multipart/form-data)  
**Field Name:** `file`  
**Required Roles:** ADMIN, MANAGER

### Expected CSV Format

The system supports **two CSV formats** for backward compatibility:

#### Format 1: New Format (Recommended)
```csv
S.No,Name,Short Name,Branch Name,City/Area,Email,TIN No,NIC No,VAT No,Business Registration No,SMS Phone,Currency,Sales Type,Payment Terms,DOB,Discount,Credit Limit,Address,Salesman,Location,Tax Group,Sales Discount Account,Receivable Account,Prompt Payment Discount,Credit Allowed,Credit Status,Status,General Notes,Sales Group,Relationship Manager
1,Hotel Kabalana,0763601236,Hotel Kabalana,Ahangama,,,,-,0763601236,LKR,Retail,COD-IML,0000-00-00,0,0,Mathara road  Kathaluwa  Ahangama.,Rumesh,Default,Tax Exempt,Discounts Given,Accounts Receivables,Discounts Given,0,Good History,Active,,Hospitality - Retail,
```

#### Format 2: Old Format (Legacy Support)
```csv
debtor_no,branch_code,debtor_ref,branch_ref,name,phone,phone2,email,area,location_name,shipper_name,address,curr_abrev,terms,sales_type,group_no,DOB
1,BR001,REF001,BR001,John Doe,0712345678,0771234567,john@example.com,Colombo,Main Branch,Main Branch,123 Main St,LKR,30 Days,Retail,Group1,1990-01-01
```

### Column Mappings

| CSV Column Name (New Format) | CSV Column Name (Old Format) | Entity Field | Required | Default Value | Notes |
|------------------------------|------------------------------|-------------|----------|---------------|-------|
| `S.No` | `debtor_no`, `branch_code` | `sNo` | No | `#####` | Serial number |
| `Name` | `name` | `name` | **Yes** | `#####` | Customer name |
| `Short Name` | `debtor_ref`, `branch_ref` | `shortName` | **Yes** | `#####` | Max 50 characters |
| `Branch Name` | `location_name`, `shipper_name` | `branchName` | No | `#####` | Branch location |
| `City/Area` | `area` | `cityArea` | No | `#####` | City or area |
| `Email` | `email` | `email` | No | `null` | Valid email format required if provided |
| `SMS Phone` | `phone`, `phone2` | `smsPhone` | **Yes** | `#####` | Phone number |
| `Currency` | `curr_abrev` | `currency` | No | `LKR` | Currency code |
| `Sales Type` | `sales_type`, `salesType` | `salesType` | No | `RETAIL` | See Sales Type values below |
| `Payment Terms` | `terms`, `paymentTerms` | `paymentTerms` | No | `COD-IML` | See Payment Terms values below |
| `DOB` | `DOB`, `dob` | `dob` | No | `2000-01-01` | Date of birth (format: YYYY-MM-DD or DD/MM/YYYY) |
| `Address` | `address` | `address` | No | `null` | Full address |
| `Sales Group` | `group_no` | `salesGroup` | No | `#####` | Sales group name |
| `Status` | - | `status` | No | `ACTIVE` | Always set to ACTIVE for imports |

### Sales Type Values
- `Retail` → `RETAIL`
- `A Category - 18%` → `A_CATEGORY_18`
- `B Category - 15%` → `B_CATEGORY_15`

### Payment Terms Values
- `COD-IML` → `COD_IML`
- `15 Days` → `FIFTEEN_DAYS`
- `30 Days` → `THIRTY_DAYS`
- `45 Days` → `FORTY_FIVE_DAYS`
- `60 Days` → `SIXTY_DAYS`
- `Bank Transfer` → `BANK_TRANSFER`
- `Cash Only` → `CASH_ONLY`

### Empty Value Handling
- **Empty strings** → Replaced with `#####`
- **Empty numbers** → Replaced with `0`
- **Empty dates** → Replaced with `2000-01-01`
- **Empty email/address** → Set to `null` (nullable fields)

### Validation Rules
1. **Name** is required
2. **Short Name** is required
3. **SMS Phone** is required
4. Email must be valid format if provided
5. Duplicate check: First by `sNo`, then by `smsPhone`, then by `email`

### Sample CSV (New Format)
```csv
S.No,Name,Short Name,Branch Name,City/Area,Email,SMS Phone,Currency,Sales Type,Payment Terms,DOB,Address,Status,Sales Group
1,Hotel Kabalana,0763601236,Hotel Kabalana,Ahangama,,0763601236,LKR,Retail,COD-IML,0000-00-00,Mathara road  Kathaluwa  Ahangama.,Active,Hospitality - Retail
2,Araliya Villa,0763093430,Araliya Villa,Ahangama,,0763093430,LKR,Retail,15 Days,06/01/2025,Kathaluwa, Ahangama.,Active,Hospitality - Retail
```

---

## Supplier CSV Import

**Endpoint:** `POST /suppliers/import`  
**Method:** File upload (multipart/form-data)  
**Field Name:** `file`  
**Required Roles:** ADMIN, MANAGER

### Expected CSV Format

```csv
type,supplier_id,supp_name,supp_ref,address,supp_address,ntn_no,gst_no,curr_abrev,terms,tax_group,phone,phone2,fax,email,contact_person,payable_account,payment_discount_account,dimension_id,dimension2_id
SUPPLIER,1,Test Supplier,Test Supplier,No. 287/2B, Stanley Thilakarathne Mawatha, Nugegoda.,,LKR,30 Days,Tax Exempt,771396517,,,,201001,402004,0,0
SUPPLIER,2,4Ever Skin Naturals  Pvt  Ltd.,VD00001,No. 287/2B, Stanley Thilakarathne Mawatha, Nugegoda.,,LKR,30 Days,Tax Exempt,771396517,,,,201001,402004,0,0
```

### Column Mappings

| CSV Column Name | Entity Field | Required | Default Value | Notes |
|----------------|--------------|----------|---------------|-------|
| `type` | - | **Yes** | - | Must be `SUPPLIER` (case-insensitive) |
| `supplier_id` | - | No | - | Legacy field, not used |
| `supp_name` | `name` | **Yes** | - | Supplier name |
| `supp_ref` | `reference` | **Yes** | - | Unique supplier reference |
| `address` or `supp_address` | `address` | **Yes** | `Address not provided` | Full address |
| `phone` or `phone2` | `phone` | **Yes** | `Not Provided` | Primary phone number |
| `phone2` | `phone2` | No | - | Secondary phone number |
| `fax` | `fax` | No | - | Fax number |
| `email` | `email` | No | - | Email address |
| `contact_person` | `contactPerson` | No | - | Contact person name |
| `ntn_no` | `ntnNumber` | No | - | NTN number |
| `gst_no` | `gstNumber` | No | - | GST number |
| `terms` | `paymentTerms` | No | - | Payment terms |
| `tax_group` | `taxGroup` | No | - | Tax group |
| `curr_abrev` | `currency` | No | `LKR` | Currency code (uppercase) |

### Validation Rules
1. **type** must be `SUPPLIER` (rows with other types are skipped)
2. **supp_name** is required
3. **supp_ref** is required (used for duplicate detection)
4. **address** is required (uses `address` or `supp_address`)
5. **phone** is required (uses `phone` or `phone2`)
6. Duplicate check: By `reference` (supp_ref)

### Sample CSV
```csv
type,supp_name,supp_ref,address,phone,email,curr_abrev,terms,tax_group
SUPPLIER,Test Supplier,TS001,No. 287/2B, Stanley Thilakarathne Mawatha, Nugegoda.,771396517,test@example.com,LKR,30 Days,Tax Exempt
SUPPLIER,4Ever Skin Naturals Pvt Ltd.,VD00001,No. 287/2B, Stanley Thilakarathne Mawatha, Nugegoda.,771396517,info@4ever.com,LKR,30 Days,Tax Exempt
```

### Notes
- Rows where `type` is not `SUPPLIER` are automatically skipped
- Empty rows are skipped
- Phone numbers are cleaned (removes spaces, special characters)
- Address is cleaned (removes extra spaces)
- Currency is automatically converted to uppercase

---

## Item CSV Import

**Endpoint:** `POST /items/import` (CSV content) or `POST /items/import/upload` (file upload)  
**Method:** 
- `POST /items/import`: JSON body with `csvContent` field
- `POST /items/import/upload`: File upload (multipart/form-data) with `file` field  
**Required Roles:** ADMIN, MANAGER

### Expected CSV Format

**Note:** Items CSV uses **positional columns** (not header-based). The first row is treated as header and skipped.

```csv
item_code,stock_id,description,category,units,price,alt_price,currency,status
ITM001,STK001,Product Description,Category Name,Unit,100.00,90.00,LKR,Active
ITM002,STK002,Another Product,Category Name,Piece,200.00,180.00,LKR,Active
```

### Column Order (Positional)

| Position | Column Name | Entity Field | Required | Default Value | Notes |
|----------|-------------|--------------|----------|---------------|-------|
| 0 | `item_code` | `itemCode` | **Yes** | - | Unique item code |
| 1 | `stock_id` | `stockId` | No | - | Stock identifier |
| 2 | `description` | `description` | **Yes** | - | Item description |
| 3 | `category` | `category` (name) | **Yes** | - | Category name (auto-created if not exists) |
| 4 | `units` | `units` | **Yes** | - | Unit of measurement |
| 5 | `price` | `price` | No | `0` | Price (numeric) |
| 6 | `alt_price` | `altPrice` | No | `0` | Alternative price (numeric) |
| 7 | `currency` | `currency` | No | `LKR` | Currency code |
| 8 | `status` | `status` | No | `ACTIVE` | Status: `Active` or `Inactive` |

### Validation Rules
1. **Minimum 5 columns** required (item_code, stock_id, description, category, units)
2. **item_code** is required
3. **description** is required
4. **category** is required (will be auto-created if doesn't exist)
5. **units** is required
6. Duplicate check: By `itemCode` (updates existing if found)

### Category Auto-Creation
- If a category name doesn't exist, it will be automatically created
- Auto-generated category ID format: `CAT001`, `CAT002`, etc.
- Auto-generated category description: `Auto-generated category for {categoryName}`
- Random color is assigned to new categories

### Sample CSV
```csv
item_code,stock_id,description,category,units,price,alt_price,currency,status
ITM001,STK001,Organic Shampoo 500ml,Personal Care,ml,1500.00,1350.00,LKR,Active
ITM002,STK002,Herbal Soap 100g,Personal Care,g,250.00,225.00,LKR,Active
ITM003,STK003,Ayurvedic Oil 200ml,Wellness,ml,1200.00,1080.00,LKR,Active
```

### Notes
- CSV parsing handles quoted fields with commas
- Empty rows are skipped
- Numeric fields (price, alt_price) default to 0 if empty or invalid
- Status is case-insensitive (`Active`, `active`, `ACTIVE` all work)
- Currency defaults to `LKR` if not provided

---

## General CSV Import Guidelines

### File Requirements
1. **File Format:** CSV (Comma-Separated Values)
2. **Encoding:** UTF-8
3. **Delimiter:** Comma (`,`)
4. **Quote Character:** Double quotes (`"`)
5. **Header Row:** Required (except for Items which uses positional columns)

### Common Validation
- Empty rows are automatically skipped
- Whitespace is trimmed from all fields
- Special characters in quoted fields are handled correctly
- Varying column counts are allowed (relax_column_count: true)

### Error Handling
- Each row is processed individually
- Errors for one row don't stop the entire import
- Error messages include row numbers for easy identification
- Import results include:
  - Total records processed
  - Successfully imported/updated
  - Skipped records
  - List of errors with row numbers

### Response Format
All CSV import endpoints return a similar response structure:

```json
{
  "success": true,
  "message": "CSV import completed. Imported: 10, Updated: 5, Skipped: 2",
  "totalRecords": 17,
  "imported": 10,
  "updated": 5,
  "skipped": 2,
  "errors": [
    "Row 5: Name is required",
    "Row 12: Invalid email format: invalid-email"
  ]
}
```

---

## Testing CSV Imports

### Using cURL

#### Customer Import
```bash
curl -X POST http://localhost:3005/customers/import-csv \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@customers.csv"
```

#### Supplier Import
```bash
curl -X POST http://localhost:3005/suppliers/import \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@suppliers.csv"
```

#### Item Import (File Upload)
```bash
curl -X POST http://localhost:3005/items/import/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@items.csv"
```

#### Item Import (CSV Content)
```bash
curl -X POST http://localhost:3005/items/import \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "csvContent": "item_code,stock_id,description,category,units,price,alt_price,currency,status\nITM001,STK001,Product,Category,Unit,100,90,LKR,Active"
  }'
```

---

## Troubleshooting

### Common Issues

1. **All rows skipped**
   - Check that required columns are present
   - Verify column names match exactly (case-sensitive for some fields)
   - Ensure at least one required field has a value

2. **Invalid date format**
   - Dates should be in format: `YYYY-MM-DD` or `DD/MM/YYYY`
   - Empty dates default to `2000-01-01`

3. **Email validation errors**
   - Ensure email format is valid: `user@domain.com`
   - Empty emails are allowed (set to null)

4. **Duplicate detection**
   - Customers: Checks `sNo`, then `smsPhone`, then `email`
   - Suppliers: Checks `reference` (supp_ref)
   - Items: Checks `itemCode`

5. **CSV parsing errors**
   - Ensure proper CSV formatting (quoted fields with commas)
   - Check for special characters that need escaping
   - Verify file encoding is UTF-8

---

## Support

For issues or questions about CSV imports, please check:
1. Server logs for detailed error messages
2. API response for row-specific errors
3. This documentation for format requirements
