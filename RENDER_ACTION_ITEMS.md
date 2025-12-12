# 🎯 IMMEDIATE ACTION ITEMS - Render Dashboard

## What You Need to Change RIGHT NOW

Based on your screenshots, here are the **exact changes** you need to make:

---

## 1️⃣ CRITICAL: Set Root Directory

**Location:** Build & Deploy → Root Directory (Currently EMPTY in your screenshot)

**Set to:**
```
NIAQI_Backend
```

**Why?** Your backend code is in the `NIAQI_Backend` folder, not the root of your repository.

---

## 2️⃣ CRITICAL: Fix Build Command

**Location:** Build & Deploy → Build Command

**Current (WRONG):**
```bash
npm install; npm ci; npm run build
```

**Change to (CORRECT):**
```bash
npm install && npm run build
```

**What's wrong?**
- ❌ `npm ci` conflicts with `npm install`
- ❌ Using `;` doesn't stop on errors
- ✅ Use `&&` to ensure each step succeeds

---

## 3️⃣ CORRECT: Start Command

**Location:** Build & Deploy → Start Command

**Current:**
```bash
npm run start
```

✅ **This is PERFECT!** Don't change this.

---

## 4️⃣ OPTIONAL: Add Pre-Deploy Command

**Location:** Build & Deploy → Pre-Deploy Command (Currently EMPTY)

**Recommended:**
```bash
npx prisma migrate deploy
```

**What this does:** Automatically runs database migrations before each deployment.

**Alternative:** Leave empty and run migrations manually in Shell after first deploy.

---

## 5️⃣ VERIFY: Branch

**Location:** Build & Deploy → Branch

**Current:** `dev`

✅ **Correct!** This matches your current branch.

---

## 🗄️ Database Setup (If Not Done Yet)

### Create PostgreSQL Database:

1. Click "New +" → PostgreSQL
2. Fill in:
   - **Name:** `niaqi-database`
   - **Database:** `niaqi_db`
   - **Region:** Same as Web Service
   - **Plan:** Free (or Starter for production)
3. Click "Create Database"
4. Copy the **Internal Database URL** (looks like: `postgresql://user:pass@dpg-xxx/niaqi_db`)

---

## 🔐 Environment Variables to Add

**Location:** Settings → Environment

Add these variables:

### Required Variables:

```
DATABASE_URL
Value: [Paste Internal Database URL from PostgreSQL]

JWT_SECRET
Value: [Generate random 32+ character string]

JWT_EXPIRATION
Value: 7d

NODE_ENV
Value: production
```

### Stripe Variables (if using payments):

```
STRIPE_SECRET_KEY
Value: sk_test_... (or sk_live_... for production)

STRIPE_PUBLISHABLE_KEY
Value: pk_test_... (or pk_live_... for production)
```

### Google OAuth Variables (if using Google login):

```
GOOGLE_CLIENT_ID
Value: xxx.apps.googleusercontent.com

GOOGLE_CLIENT_SECRET
Value: GOCSPX-xxxxx

GOOGLE_CALLBACK_URL
Value: https://your-app-name.onrender.com/api/auth/google/callback
```

### Frontend URL:

```
FRONTEND_URL
Value: [Your frontend URL - e.g., http://localhost:8081 for dev]
```

---

## 📝 Step-by-Step Actions

### Right Now in Render Dashboard:

1. **Go to:** Build & Deploy section
2. **Click Edit** on Root Directory
3. **Enter:** `NIAQI_Backend`
4. **Save**

5. **Click Edit** on Build Command
6. **Change to:** `npm install && npm run build`
7. **Save**

8. **Scroll to** Pre-Deploy Command
9. **Click Edit**
10. **Enter:** `npx prisma migrate deploy`
11. **Save**

12. **Go to:** Environment tab
13. **Add all required environment variables** (see list above)
14. **Click** "Save Changes"

---

## 🚀 After Making Changes

### Option 1: Manual Deploy
1. Go to "Manual Deploy" dropdown
2. Click "Deploy latest commit"
3. Watch the Logs tab

### Option 2: Push to GitHub (Auto-Deploy)
1. Commit and push your latest code
2. Render will automatically deploy
3. Watch the Logs tab

---

## ✅ Verification After Deploy

### 1. Check Deploy Logs
Look for these success messages:
```
✅ Build succeeded
✅ Service started
🚀 Application is running on: http://localhost:5000/api
```

### 2. Check Service Status
Should show: **"Live"** with green indicator

### 3. Test Your API
Visit: `https://your-service-name.onrender.com/api`

Should return API response (not 404 or error)

### 4. Run Database Setup (First Time Only)
1. Go to Shell tab
2. Run:
```bash
npx prisma migrate deploy
npx prisma db seed
```

### 5. Test API Endpoints
```bash
# Test signup
curl -X POST https://your-app.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test"}'
```

---

## 🚨 If Build Fails

### Check These Common Issues:

1. **"Cannot find module"**
   - Check node_modules installed correctly
   - Verify all dependencies in package.json

2. **"Prisma Client not generated"**
   - Should auto-run via prebuild script
   - Manually run: `npx prisma generate` in Shell

3. **"Database connection failed"**
   - Check DATABASE_URL is correct
   - Use Internal Database URL (not External)
   - Verify database is running

4. **"Root directory not found"**
   - Ensure you set Root Directory to `NIAQI_Backend`
   - Check spelling is exact

---

## 📊 Summary of Changes

| Setting | Current (Wrong) | Correct Value |
|---------|----------------|---------------|
| Root Directory | *(empty)* | `NIAQI_Backend` |
| Build Command | `npm install; npm ci; npm run build` | `npm install && npm run build` |
| Pre-Deploy | *(empty)* | `npx prisma migrate deploy` (optional) |
| Start Command | `npm run start` | ✅ Keep as is |

---

## 🎯 Priority Order

1. **MUST FIX:** Root Directory → `NIAQI_Backend`
2. **MUST FIX:** Build Command → Remove `npm ci`, use `&&`
3. **SHOULD ADD:** Environment Variables
4. **OPTIONAL:** Pre-Deploy Command for auto-migrations

---

## 💡 Pro Tips

- **Auto-Deploy:** Keep "On Commit" enabled for automatic deployments
- **Health Checks:** Render will auto-restart if your service crashes
- **Logs:** Always check logs first when debugging
- **Shell:** Use Shell to debug and run commands directly
- **Metrics:** Monitor your app's performance in Metrics tab

---

## ✅ Final Checklist

- [ ] Root Directory set to `NIAQI_Backend`
- [ ] Build command fixed
- [ ] Environment variables added
- [ ] Database created and connected
- [ ] Save all changes
- [ ] Deploy (manual or auto)
- [ ] Check logs for success
- [ ] Run migrations in Shell
- [ ] Test API endpoints
- [ ] Update OAuth callback URLs

---

## 🎉 You're All Set!

After making these changes, your backend will deploy successfully on Render! 🚀

**Need help?** Check the logs or refer to `RENDER_CONFIG.md` for detailed troubleshooting.
