# Render Deployment - Quick Reference

## 🎯 Render Configuration

### Service Type
**Web Service**

### Build & Start Commands

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm run start
```

### Environment
- **Runtime:** Node
- **Region:** Choose closest to your users
- **Plan:** Free or Starter (for production use Starter+)

---

## 📋 Environment Variables for Render

Copy these to Render's Environment Variables section:

| Key | Example Value | Description |
|-----|---------------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | PostgreSQL connection string (from Render DB) |
| `JWT_SECRET` | `your-random-secret-key-here` | JWT signing secret (use long random string) |
| `JWT_EXPIRATION` | `7d` | JWT token expiration time |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe secret key (production) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Stripe publishable key |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxx` | Google OAuth secret |
| `GOOGLE_CALLBACK_URL` | `https://your-app.onrender.com/api/auth/google/callback` | OAuth callback URL |
| `PORT` | `5000` | Server port (Render will override this) |
| `NODE_ENV` | `production` | Node environment |
| `FRONTEND_URL` | `https://your-frontend.com` | Your frontend URL for CORS |

---

## 🗄️ Database Setup (PostgreSQL on Render)

### Create Database:
1. In Render Dashboard → New → PostgreSQL
2. Choose a name: `niaqi-database`
3. Database: `niaqi_db`
4. User: Auto-generated
5. Region: Same as your web service
6. Plan: Free (or paid for production)

### Get Connection String:
1. Go to your database dashboard
2. Copy **Internal Database URL**
3. Use this as `DATABASE_URL` in your web service

### Run Migrations After First Deploy:
```bash
# In Render Shell (Web Service → Shell tab)
npx prisma migrate deploy
npx prisma db seed  # Optional: seed initial data
```

---

## 🔧 Post-Deployment Steps

### 1. Verify Deployment
Visit: `https://your-service-name.onrender.com/api`

### 2. Run Database Migrations
```bash
npx prisma migrate deploy
```

### 3. Seed Database (First Time Only)
```bash
npx prisma db seed
```

### 4. Test Endpoints
```bash
# Health check
curl https://your-app.onrender.com/api

# Test auth signup
curl -X POST https://your-app.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

---

## 🚨 Important Notes

### Free Tier Limitations:
- Service spins down after 15 min of inactivity
- First request after sleep takes ~30 seconds
- Database has 90-day expiration (free tier)

### Production Recommendations:
- Use Starter plan or higher (always on)
- Use paid database plan
- Enable auto-deploy from GitHub
- Set up health checks
- Configure custom domain

### Security:
- Use strong `JWT_SECRET` (at least 32 characters)
- Use production Stripe keys
- Whitelist specific origins in CORS (update main.ts)
- Enable HTTPS only
- Never commit `.env` file

---

## 🔄 Auto-Deploy from GitHub

1. Connect your GitHub repository to Render
2. Enable "Auto-Deploy"
3. Choose branch: `develop` or `main`
4. Render will automatically deploy on every push

---

## 📊 Monitoring

### Check Logs:
Go to your service → Logs tab to see:
- Build logs
- Runtime logs
- Error messages
- Database queries

### Health Check Endpoint:
Add this to your NestJS app for monitoring:
```typescript
@Get('health')
health() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

---

## 🐛 Troubleshooting

### Build Fails:
- Check build logs for errors
- Verify `package.json` scripts
- Ensure all dependencies are listed
- Check Node version compatibility

### Service Won't Start:
- Check start logs
- Verify `DATABASE_URL` is correct
- Ensure all required env vars are set
- Check for missing Prisma Client

### Database Connection Issues:
- Use Internal Database URL (not external)
- Verify database is in same region
- Check database is running
- Ensure migrations are deployed

### CORS Errors:
- Add frontend URL to CORS whitelist in `main.ts`
- Check `FRONTEND_URL` env var is set
- Verify protocol (http vs https)

---

## 📞 Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- NestJS Docs: https://docs.nestjs.com
- Prisma Docs: https://www.prisma.io/docs

---

## ✅ Deployment Checklist

Before going live:

- [ ] Environment variables configured
- [ ] Database created and connected
- [ ] Build successful
- [ ] Service starts without errors
- [ ] Migrations deployed
- [ ] Database seeded (if needed)
- [ ] API endpoints tested
- [ ] Authentication working
- [ ] Stripe integration tested
- [ ] Google OAuth configured
- [ ] CORS properly configured
- [ ] Frontend connected successfully

🎉 **Ready to deploy!**
