# NIAQI Backend API

A NestJS-based REST API for the NIAQI mobile application, providing authentication and user management functionality.

## 🚀 Features

- ✅ User Registration & Login
- ✅ JWT Authentication (Access & Refresh Tokens)
- ✅ Password Reset Flow
- ✅ Email Confirmation (token-based)
- ✅ Secure Password Hashing (bcrypt)
- ✅ PostgreSQL Database with Prisma ORM
- ✅ Input Validation
- ✅ CORS Configuration
- ✅ Environment Variable Management

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables

Edit the `.env` file with your database credentials:

```env
DATABASE_URL="postgresql://postgres:2258@localhost:5432/NIAQI?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key"
PORT=5000
```

### 3. Run Prisma Migrations

```bash
npx prisma generate
npx prisma migrate dev --name init_auth_system
```

### 4. Start the Server

```bash
npm run start:dev
```

Server runs at: **http://localhost:5000/api**

## 📚 API Endpoints

### POST /api/auth/signup - Register new user
### POST /api/auth/signin - Login user
### POST /api/auth/forgot-password - Request password reset
### POST /api/auth/reset-password - Reset password
### POST /api/auth/confirm-email - Confirm email
### POST /api/auth/refresh - Refresh access token
### GET /api/auth/me - Get current user (protected)

## 🔒 Security

- bcrypt password hashing
- JWT with access & refresh tokens
- Input validation
- CORS protection

## 📝 Database Schema

- User model with email, password, roles
- Email confirmation tokens
- Password reset tokens
- Refresh token storage

For detailed documentation, see project wiki.
