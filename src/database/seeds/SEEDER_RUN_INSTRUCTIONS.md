# How to Run the Database Seeder

## Method 1: Automatic (Recommended)
The seeder runs **automatically** when you start the application.

```bash
npm start
# or
npm run start:dev
```

The seeder will execute during application startup before the server starts listening.

---

## Method 2: Manual Execution (Standalone)
Run the seeder independently without starting the full application:

```bash
npm run seed
```

This will:
1. Connect to the database
2. Run the seed service
3. Create all permissions, roles, and the admin user
4. Exit when complete

---

## Method 3: Using ts-node Directly
If you need more control, you can run it directly:

```bash
npx ts-node src/database/seed.ts
```

---

## What Gets Seeded

### ✅ Permissions
- 46 permissions across 9 modules (Users, Roles, Permissions, Tasks, Costing, Customers, Suppliers, Items, Categories, Complaints)

### ✅ Super Admin Role
- Role code: `SUPER_ADMIN`
- All 46 permissions assigned

### ✅ Super Admin User
- **Email:** `admin@app.com`
- **Password:** `1234`
- **Username:** `admin`
- Assigned to Super Admin role

---

## Important Notes

1. **Idempotent**: Safe to run multiple times - won't create duplicates
2. **Database Required**: Make sure your database is running and properly configured
3. **Environment Variables**: Ensure your `.env` file has correct database connection settings
4. **Existing Data**: If admin user exists, it will update the role instead of creating duplicate

---

## Troubleshooting

### Error: Cannot connect to database
- Check your `.env` file database configuration
- Ensure database server is running
- Verify database credentials are correct

### Error: Permission already exists
- This is normal - the seeder checks for existing permissions
- It will skip creation and use existing ones

### Error: Admin user already exists
- This is normal - the seeder will update the existing admin's role
- Your admin user will get the Super Admin role assigned

---

## Verify Seeding Success

After running the seeder, you should see logs like:

```
🌱 Starting the seed process...
[SeedService] Starting database seeding...
[SeedService] Creating permissions...
[SeedService] ✅ Created permission: USER_CREATE
[SeedService] ✅ Created permission: USER_UPDATE
...
[SeedService] ✅ Created/Verified 46 permissions
[SeedService] Creating Super Admin role...
[SeedService] ✅ Created Super Admin role
[SeedService] ✅ Assigned 46 permissions to Super Admin role
[SeedService] Creating Super Admin user...
[SeedService] ✅ Super Admin user created successfully!
[SeedService] 📧 Login Credentials:
[SeedService]    Email: admin@app.com
[SeedService]    Password: 1234
[SeedService] ✅ Database seeding completed successfully!
✅ Seeding complete!
```

---

## Test Login

After seeding, test the admin login:

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "username": "admin@app.com",
  "password": "1234"
}
```

**Expected Response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "user": {
    "id": "...",
    "email": "admin@app.com",
    "userName": "admin",
    "role": "admin",
    "roleId": "..."
  }
}
```

