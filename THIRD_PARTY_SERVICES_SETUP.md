# Third-Party Services Setup Guide

This document explains how to configure all external services required by the UrbanNest application.

Services Covered:

1. Razorpay Payment Gateway
2. Gemini AI API
3. Google Authentication
4. SMTP Email Service

---

# 1. Razorpay Setup

## Create Razorpay Account

Visit:

https://razorpay.com

Sign up and verify your account.

---

## Navigate to API Keys

Open:

```text
Dashboard
→ Settings
→ API Keys
```

Click:

```text
Generate Test Key
```

You will receive:

```text
Key ID
Key Secret
```

Example:

```text
Key ID : rzp_test_xxxxxxxxx
Key Secret : xxxxxxxxxxxxxxxxx
```

Store these values securely.

---

## Add Razorpay Keys to appsettings.json

```json
{
  "Razorpay": {
    "Key": "rzp_test_xxxxxxxxx",
    "Secret": "xxxxxxxxxxxxxxxxx"
  }
}
```

---

## Production Deployment

Before production:

```text
Dashboard
→ Activate Account
→ Complete KYC
→ Generate Live Keys
```

Replace test credentials with live credentials.

---

# 2. Gemini AI API Setup

## Create Google AI Studio Account

Visit:

https://aistudio.google.com

Login using a Google account.

---

## Generate API Key

Navigate to:

```text
Get API Key
```

Select:

```text
Create API Key
```

Choose:

```text
Create API Key in New Project
```

Copy the generated API key.

Example:

```text
AIzaSyXXXXXXXXXXXXXXXXXXXX
```

---

## Configure Application

Add the key in:

```json
{
  "Gemini": {
    "ApiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXX"
  }
}
```

---

## Verify Setup

Start the application and access the chatbot endpoint.

If configured correctly, Gemini will return AI-generated responses.

---

# 3. Google Authentication Setup

## Open Google Cloud Console

Visit:

https://console.cloud.google.com

Login with your Google account.

---

## Create a New Project

Click:

```text
Select Project
→ New Project
```

Enter:

```text
Project Name: UrbanNest
```

Click:

```text
Create
```

---

## Enable Google Identity Services

Navigate:

```text
APIs & Services
→ Library
```

Enable:

```text
Google Identity Services
```

---

## Configure OAuth Consent Screen

Navigate:

```text
APIs & Services
→ OAuth Consent Screen
```

Select:

```text
External
```

Provide:

```text
Application Name
Support Email
Developer Email
```

Save.

---

## Create OAuth Credentials

Navigate:

```text
APIs & Services
→ Credentials
```

Select:

```text
Create Credentials
→ OAuth Client ID
```

Choose:

```text
Web Application
```

---

## Add Redirect URLs

Example:

```text
https://localhost:5001/signin-google
```

or

```text
https://yourdomain.com/signin-google
```

---

## Copy Credentials

Google will generate:

```text
Client ID
Client Secret
```

Example:

```text
Client ID:
123456789.apps.googleusercontent.com

Client Secret:
GOCSPX-XXXXXXXXXXXX
```

---

## Configure Application

```json
{
  "GoogleAuth": {
    "ClientId": "123456789.apps.googleusercontent.com",
    "ClientSecret": "GOCSPX-XXXXXXXXXXXX"
  }
}
```

---

# 4. SMTP Email Service Setup

The application uses SMTP for:

- OTP Delivery
- Password Reset Emails
- Notifications

---

# Using Gmail SMTP

## Enable 2-Step Verification

Open:

https://myaccount.google.com

Navigate:

```text
Security
→ 2-Step Verification
```

Enable it.

---

## Generate App Password

Navigate:

```text
Security
→ App Passwords
```

Create:

```text
Mail
```

Google will generate:

```text
16-character App Password
```

Example:

```text
abcd efgh ijkl mnop
```

Save this password.

---

## Configure SMTP

Add to:

```json
{
  "SMTP": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "Email": "your-email@gmail.com",
    "Password": "generated-app-password"
  }
}
```

---

## SMTP Settings

Use:

```text
Host      : smtp.gmail.com
Port      : 587
Encryption: TLS
```

---

# Application Configuration Example

```json
{
  "Razorpay": {
    "Key": "rzp_test_xxxxxxxxx",
    "Secret": "xxxxxxxxxxxxxxxxx"
  },

  "Gemini": {
    "ApiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXX"
  },

  "GoogleAuth": {
    "ClientId": "xxxxxxxx.apps.googleusercontent.com",
    "ClientSecret": "GOCSPX-XXXXXXXXXXXX"
  },

  "SMTP": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "Email": "your-email@gmail.com",
    "Password": "your-app-password"
  }
}
```

---

# Security Best Practices

Never commit real secrets to GitHub.

Store sensitive values using:

```text
Environment Variables
User Secrets
Azure Key Vault
AWS Secrets Manager
```

Instead of:

```text
appsettings.json
```

for production environments.

---

# Troubleshooting

## Razorpay Payment Failed

Verify:

- Key ID
- Key Secret
- Account Activation Status

---

## Gemini API Error

Verify:

- API Key
- Billing / Quota
- Model Configuration

---

## Google Login Not Working

Verify:

- Client ID
- Client Secret
- Redirect URLs

---

## Email Sending Failed

Verify:

- SMTP Host
- SMTP Port
- App Password
- Firewall Restrictions

---

# Author

Neha Lamba

UrbanNest E-Commerce Backend Project
