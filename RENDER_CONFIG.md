# 🚀 Render Configuration - Step by Step

## Based on Your Current Setup

### ⚙️ Build & Deploy Settings

#### 1. **Root Directory**
```
NIAQI_Backend
```
📌 **Important:** This tells Render your backend code is in the `NIAQI_Backend` folder, not the repository root.

---

#### 2. **Branch**
```
dev
```
✅ This is correct - matches your current branch

---

#### 3. **Build Command**
**CHANGE FROM:**
```bash
npm install; npm ci; npm run build
```

**TO:**
```bash
npm install && npm run build
```

**Why?**
- Remove `npm ci` (conflicts with `npm install`)
- Use `&&` instead of `;` to ensure each command succeeds
- The `build` script automatically runs `prisma generate` (prebuild)

---

#### 4. **Pre-Deploy Command** (Optional but Recommended)
```bash
npx prisma migrate deploy
```

This automatically runs database migrations before each deployment.

**Alternative:** Leave empty and run migrations manually in Shell after first deploy.

---

#### 5. **Start Command**
```bash
npm run start
```
✅ **Perfect!** This is already correct.

---

### 🗄️ Database Setup

#### Create PostgreSQL Database:

1. **In Render Dashboard:**
   - Click "New +" → PostgreSQL
   - Name: `niaqi-database`
   - Database: `niaqi_db`
   - User: (auto-generated)
   - Region: **Same as your Web Service** (important for speed)
   - Plan: Free (or paid for production)

2. **Get Connection String:**
   - Go to database dashboard
   - Copy **Internal Database URL**
   - It looks like: `postgresql://user:pass@dpg-xxx-a/niaqi_db`

---

### 🔐 Environment Variables

Add these in Render's Environment Variables section:

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host/db` | From Render PostgreSQL (Internal URL) |
| `JWT_SECRET` | `your-super-secret-random-string-min-32-chars` | Generate a strong random string |
| `JWT_EXPIRATION` | `7d` | Token validity period |
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` | From Stripe Dashboard |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` | From Stripe Dashboard |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxxx` | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://your-app.onrender.com/api/auth/google/callback` | Update after you know your URL |
| `NODE_ENV` | `production` | Sets environment to production |
| `FRONTEND_URL` | `https://your-frontend-url.com` | Your frontend URL for CORS |
| `PORT` | `5000` | Optional - Render assigns port automatically |

**To add environment variables:**
1. Go to your service → Environment
2. Click "Add Environment Variable"
3. Add each key-value pair
4. Click "Save Changes"

---

### 📋 Deployment Checklist

#### Before Deploying:
- [ ] Root Directory set to `NIAQI_Backend`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm run start`
- [ ] Branch set to `dev`
- [ ] PostgreSQL database created
- [ ] All environment variables added
- [ ] Latest code pushed to GitHub

#### After First Deployment:
- [ ] Service builds successfully
- [ ] Service starts without errors
- [ ] Open Shell and run:
  ```bash
  npx prisma migrate deploy
  npx prisma db seed
  ```
- [ ] Test API: `https://your-app.onrender.com/api`
- [ ] Update `GOOGLE_CALLBACK_URL` with actual domain
- [ ] Update Google OAuth authorized redirect URIs

---

### 🔧 Current Issues to Fix

#### ❌ Issue 1: Build Command
**Current:** `npm install; npm ci; npm run build`
**Problem:** 
- `npm ci` after `npm install` is redundant and can cause conflicts
- Using `;` doesn't stop on errors

**Fix:** Change to `npm install && npm run build`

#### ❌ Issue 2: Missing Root Directory
**Current:** Empty
**Problem:** Render will try to run commands from repository root, not the backend folder

**Fix:** Set to `NIAQI_Backend`

#### ⚠️ Issue 3: Pre-Deploy Command
**Current:** Empty (based on screenshot)
**Recommendation:** Add `npx prisma migrate deploy` to auto-run migrations

---

### 🎯 Correct Configuration Summary

```yaml
Service Name: NIAQI_Backend (or your choice)
Environment: Node
Region: Choose closest to your users
Branch: dev

Root Directory: NIAQI_Backend
Build Command: npm install && npm run build
Pre-Deploy Command: npx prisma migrate deploy (optional)
Start Command: npm run start

Auto-Deploy: Yes (On Commit)
```

---

### 🧪 Testing After Deployment

#### 1. Check Service Status
Look for: **"Live"** status in dashboard

#### 2. Check Logs
Go to: Logs tab → Look for:
```
✅ Server listen() completed
🚀 Application is running on: http://localhost:5000/api
```

#### 3. Test API Endpoint
```bash
curl https://your-app.onrender.com/api
```

Should return server response (not error)

#### 4. Test Health Check (if you have one)
```bash
curl https://your-app.onrender.com/api/health
```

#### 5. Test Authentication
```bash
curl -X POST https://your-app.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'
```

---

### 🚨 Common Deployment Errors

#### Error: "Module not found"
**Cause:** Dependencies not installed
**Fix:** Check build logs, ensure `npm install` runs successfully

#### Error: "Prisma Client not generated"
**Cause:** Build script not running prebuild
**Fix:** Check package.json has `"prebuild": "prisma generate"`

#### Error: "Cannot connect to database"
**Cause:** Wrong DATABASE_URL or database not accessible
**Fix:** 
- Use **Internal Database URL** from Render
- Ensure database is in same region
- Check database is running

#### Error: "Port already in use"
**Cause:** Render assigns port dynamically
**Fix:** Your code should use `process.env.PORT || 5000` ✅ (already correct)

#### Error: "CORS blocked"
**Cause:** Frontend URL not whitelisted
**Fix:** Update CORS config in `src/main.ts` to include your frontend URL

---

### 📞 Need Help?

1. **Check Logs:** Most issues show in the Logs tab
2. **Check Events:** See deployment history and errors
3. **Shell Access:** Debug by running commands directly
4. **Render Docs:** https://render.com/docs

---

### ✅ Quick Action Items

1. **Right Now:** Update these in Render dashboard:
   - Root Directory: `NIAQI_Backend`
   - Build Command: `npm install && npm run build`

2. **After Deploy:** Run in Shell:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

3. **Test:** Visit your API URL

---

## 🎉 You're Ready!

Once you make these changes, click **"Manual Deploy"** or push to your `dev` branch to trigger auto-deploy.

Watch the Logs tab to see your app build and start! 🚀
