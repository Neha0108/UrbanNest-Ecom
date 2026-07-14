# UrbanNest Database Setup Guide

This guide explains how to create and configure the UrbanNest database using either:

1. Supabase (PostgreSQL)
2. MySQL

---

# Option 1: Setup Using Supabase (PostgreSQL)

## Step 1: Create a Supabase Account

Visit:

https://supabase.com

Sign in and create a new project.

---

## Step 2: Create a New Project

Provide:

- Project Name: UrbanNest
- Database Password: (Choose a strong password)
- Region: Select nearest region

Click Create Project.

---

## Step 3: Obtain Database Connection Details

Navigate to:

Settings → Database

Copy:

- Host
- Port
- Database Name
- Username
- Password

Example:

```text
Host: db.xxxxxxxxx.supabase.co
Port: 5432
Database: postgres
Username: postgres
Password: ********
```

---

## Step 4: Create Database Schema

Open:

SQL Editor → New Query

Upload or paste the contents of:

```text
UrbanNestDB.sql
```

Execute the script.

All required database tables will be created automatically.

---

## Step 5: Configure Application Connection String

Update:

```json
appsettings.json
```

Example:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=db.xxxxxxxxx.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=your_password"
  }
}
```

---

## Step 6: Run the Application

```bash
dotnet restore
dotnet run
```

---

# Option 2: Setup Using MySQL

## Step 1: Install MySQL

Download:

https://dev.mysql.com/downloads/

Install:

- MySQL Server
- MySQL Workbench

---

## Step 2: Create Database

Open MySQL Workbench.

Execute:

```sql
CREATE DATABASE UrbanNestDB;
```

---

## Step 3: Import Database Script

Open:

Server → Data Import

Select:

```text
UrbanNestDB.sql
```

Choose:

```text
UrbanNestDB
```

Click:

```text
Start Import
```

---

## Step 4: Configure Application Connection String

Update:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "server=localhost;port=3306;database=UrbanNestDB;user=root;password=your_password"
  }
}
```

---

## Step 5: Run Application

```bash
dotnet restore
dotnet run
```

---

# Verify Database Setup

Ensure tables are created successfully.

Expected tables include:

```text
Users
Consumer
Retailer
Category
SubCategory
Product
ProductImage
Cart
CartItem
WishlistItem
Orders
OrderItem
Review
ReviewReply
ReviewHelpful
Notification
Coupon
UserAddress
Role
EmailOTP
```

---

# Application Startup

After configuring the database connection:

```bash
dotnet restore
dotnet build
dotnet run
```

Swagger UI can be accessed at:

```text
https://localhost:<port>/swagger
```

---

# Troubleshooting

## Connection Failed

Verify:

- Host Name
- Port
- Username
- Password
- Database Name

---

## Tables Not Created

Ensure:

```text
UrbanNestDB.sql
```

was executed successfully without errors.

---

## Migration Issues

Verify that:

```text
Microsoft.EntityFrameworkCore
```

and the appropriate database provider packages are installed.

---

# Project Repository

GitHub Repository:

```text
https://github.com/Neha0108/UrbanNest-Ecom
```

---

# Author

Neha Lamba

UrbanNest E-Commerce Backend Project
