# UrbanNest E-Commerce Backend

## Overview

UrbanNest is a backend REST API built with ASP.NET Core Web API for an e-commerce platform. The application supports user authentication, product management, shopping cart functionality, order processing, reviews, notifications, coupon management, and AI-powered chatbot integration.

The project follows a layered architecture with Controllers, Services, Repository Interfaces, DTOs, and Entity Framework Core for database operations.

## Features

### Authentication & User Management
- User Registration
- User Login
- Google Authentication
- OTP Verification
- Password Management
- Role-Based Access Control

### Product Management
- Product Creation and Management
- Category & Subcategory Management
- Product Image Uploads
- Product Search and Retrieval

### Shopping Features
- Shopping Cart Management
- Wishlist Management
- Product Reviews and Ratings
- Review Replies

### Order Management
- Place Orders
- Order Tracking
- Delivery Details Management
- Order History

### Notifications
- User Notifications
- System Alerts
- Notification Management APIs

### Coupon System
- Coupon Creation
- Coupon Updates
- Coupon Validation
- Discount Application

### AI Chatbot
- Gemini AI Integration
- Customer Assistance Chatbot
- Product Query Support

## Technology Stack

- ASP.NET Core Web API
- C#
- Entity Framework Core
- SQL Server
- JWT Authentication
- Google Authentication
- Gemini API
- SMTP Email Service

## Project Structure

```text
UrbanNest-Ecom/
│
├── Database/
│   ├── UrbanNestDB.sql
│   └── SeedData.sql
│
├── README.md
└── UrbanNest/JsonWebToken
    ├── Controllers
    ├── DTO
    ├── Model
    ├── Repository
    ├── Service
    ├── DataAccess
    ├── Migrations
    ├── wwwroot
    ├── Program.cs
    └── appsettings.json
```

## Setup Instructions

```bash
git clone https://github.com/Neha0108/UrbanNest-Ecom.git
cd UrbanNest-Ecom/UrbanNest/JsonWebToken
dotnet restore
```

Update the connection string in `appsettings.json` and run:

```bash
dotnet ef database update
dotnet run
```

## Contributors

**Neha Lamba**

Intern Project – UrbanNest E-Commerce Platform
DOCUMENTATION : https://teams.public.onecdn.static.microsoft/evergreen-assets/safelinks/2/atp-safelinks.html
