# NIAQI Backend - Deployment Guide

## 🚀 Deployment on Render

### Prerequisites
- A Render account
- PostgreSQL database (can be created on Render)
- Environment variables configured

### Build Configuration on Render

Set the following in your Render service:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run start
```

### Environment Variables

Make sure to set these environment variables in Render:

```
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=7d
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
GOOGLE_CALLBACK_URL=https://your-domain.onrender.com/api/auth/google/callback
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com
```

### Database Setup

After the first deployment, you need to run migrations:

1. Go to your Render service dashboard
2. Open the Shell tab
3. Run these commands:

```bash
npx prisma migrate deploy
npx prisma db seed
```

Or use Render's build command:
```bash
npm install && npm run build && npx prisma migrate deploy
```

---

## 💻 Local Development

### Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env` and configure your environment variables:
```bash
cp .env.example .env
```

4. Set up your local database:
```bash
npx prisma migrate dev
npx prisma db seed
```

### Running Locally

**Development mode (with hot reload):**
```bash
npm run start:dev
```

**Production mode:**
```bash
npm run build
npm run start
```

### Available Scripts

- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run start:dev` - Start development server with hot reload
- `npm run start:debug` - Start with debugging enabled
- `npm run lint` - Lint the code
- `npm run test` - Run tests
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Deploy migrations
- `npm run prisma:seed` - Seed the database

---

## 📦 Build Process

The build process follows these steps:

1. **prebuild**: Generate Prisma Client (`prisma generate`)
2. **build**: Compile TypeScript to JavaScript using NestJS CLI
3. **postbuild**: Compile the Prisma seed file

Output is in the `dist/` directory.

---

## 🔍 Troubleshooting

### Build Fails on Render

- Check that all environment variables are set
- Ensure `DATABASE_URL` is valid
- Check build logs for specific errors

### Database Connection Issues

- Verify `DATABASE_URL` format
- Ensure database allows connections from Render's IP
- Check if database is running

### Migration Issues

- Run `npx prisma migrate deploy` manually in Render shell
- Check if migrations folder is committed to git
- Verify Prisma schema syntax

---

## 🔐 Security Notes

- Never commit `.env` file to git
- Use strong JWT secrets in production
- Enable CORS only for trusted origins in production
- Use HTTPS in production
- Rotate API keys regularly

---

## 📚 API Documentation

Base URL: `https://your-domain.onrender.com/api`

All routes are prefixed with `/api`.

Example endpoints:
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/membership/plans` - Get membership plans
- `POST /api/stripe/create-checkout-session` - Create payment session

---

## 🐛 Common Issues

### "Cannot find module @nestjs/core"
Run `npm install` to install dependencies.

### "Prisma Client not generated"
Run `npx prisma generate`.

### Port already in use
Change the PORT in your `.env` file or stop the process using that port.

### CORS errors
Update CORS configuration in `src/main.ts` to include your frontend URL.
