# 🚀 Quick Setup Guide - Google Drive Sync

## Complete Setup in 5 Steps

### Step 1: Configure Google Service Account Key ⚙️

You need to replace the placeholder in `/NIAQI_Backend/keys/service-account.json` with your actual Google Cloud service account key.

**How to get the key:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: **niaqi-478514**
3. Go to **IAM & Admin** > **Service Accounts**
4. Find: `niaqi-831@niaqi-478514.iam.gserviceaccount.com`
5. Click **Keys** tab
6. If no key exists:
   - Click **Add Key** > **Create New Key**
   - Choose **JSON** format
   - Click **Create** (downloads automatically)
7. Copy the downloaded JSON content
8. Replace `/NIAQI_Backend/keys/service-account.json` with this content

**The file should look like:**

```json
{
  "type": "service_account",
  "project_id": "niaqi-478514",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "niaqi-831@niaqi-478514.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/...",
  "universe_domain": "googleapis.com"
}
```

---

### Step 2: Enable Google Drive API 🔌

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: **niaqi-478514**
3. Go to **APIs & Services** > **Library**
4. Search for "Google Drive API"
5. Click on it
6. Click **Enable** (if not already enabled)

---

### Step 3: Share Google Drive Folder 📁

The service account needs access to your Google Drive files.

1. Open [Google Drive](https://drive.google.com)
2. Find the folder(s) you want to sync
3. Right-click > **Share**
4. Add email: `niaqi-831@niaqi-478514.iam.gserviceaccount.com`
5. Set permission: **Viewer** (read-only)
6. Click **Share**
7. ✅ Done! The service account can now read these files

**Important:**

- Share the entire folder, not individual files
- All files inside the shared folder will be synced
- Subfolders are NOT synced (only direct files)

---

### Step 4: Start the Backend 🚀

```bash
cd /Users/mac/Documents/GitHub/NIAQI/NIAQI_Backend

# Install dependencies (if not done)
npm install

# Start the server
npm run start:dev
```

**Expected output:**

```
[Nest] 12345  - LOG [NestApplication] Nest application successfully started
[GoogleDriveService] Google Drive authentication initialized successfully
[GoogleDriveSyncTask] Starting scheduled Google Drive sync...
[GoogleDriveService] Found 10 files in Google Drive
```

If you see "Google Drive authentication initialized successfully" ✅ You're good!

---

### Step 5: Test the API 🧪

#### Option A: Use the test script

```bash
./test-google-drive-api.sh
```

#### Option B: Manual testing

**Trigger sync:**

```bash
curl http://localhost:5000/documents/sync/now
```

**List documents:**

```bash
curl http://localhost:5000/documents
```

**Download a document:**

```bash
# Get document ID from list response, then:
curl http://localhost:5000/documents/{document-id} --output file.pdf
```

---

## ✅ Verification Checklist

- [ ] Service account key is in `/NIAQI_Backend/keys/service-account.json`
- [ ] Google Drive API is enabled
- [ ] Drive folder is shared with service account email
- [ ] Backend server started successfully
- [ ] Logs show "authentication initialized successfully"
- [ ] Logs show "Starting scheduled Google Drive sync..."
- [ ] API endpoint `/documents/sync/now` works
- [ ] API endpoint `/documents` returns data
- [ ] Documents appear in PostgreSQL database

---

## 🔍 Troubleshooting

### Issue: "Failed to initialize Google Drive authentication"

**Causes:**

- Service account key file is missing or invalid
- File path is wrong
- JSON syntax error

**Solutions:**

1. Verify file exists: `ls keys/service-account.json`
2. Check JSON is valid: `cat keys/service-account.json | jq`
3. Ensure file is not empty
4. Re-download key from Google Cloud Console

---

### Issue: "Insufficient Permission" or "File not found"

**Causes:**

- Drive folder not shared with service account
- Wrong email used for sharing
- Permission not "Viewer" or higher

**Solutions:**

1. Double-check service account email: `niaqi-831@niaqi-478514.iam.gserviceaccount.com`
2. Re-share folder with correct email
3. Ensure permission is "Viewer" (not "No access")
4. Wait 1-2 minutes for permissions to propagate
5. Try manual sync: `curl http://localhost:5000/documents/sync/now`

---

### Issue: "Found 0 files in Google Drive"

**Causes:**

- No files in shared folder
- Files are in subfolders (not supported yet)
- All items are folders

**Solutions:**

1. Ensure there are actual files (not just folders) in the shared folder
2. Move files from subfolders to main folder
3. Check Drive with: `curl http://localhost:5000/documents/sync/now`

---

### Issue: Sync not running automatically

**Causes:**

- Cron scheduler not initialized
- Server crashed or restarted

**Solutions:**

1. Check logs for "Starting scheduled Google Drive sync..."
2. Restart server: `npm run start:dev`
3. Verify ScheduleModule is imported in module
4. Check cron expression in `google-drive-sync.task.ts`

---

## 📊 Database Check

Verify documents in database:

```bash
# Connect to PostgreSQL
psql -U postgresql -d NIAQI

# Check documents table
SELECT id, name, mime_type, modified_time, length(content) as content_size
FROM documents
ORDER BY modified_time DESC
LIMIT 10;

# Count total documents
SELECT COUNT(*) FROM documents;

# Exit
\q
```

---

## 🎯 What Happens After Setup

1. **Immediate:** Service authenticates with Google Drive
2. **Within 5 minutes:** First automatic sync runs
3. **Every 5 minutes:** Sync checks for new/updated files
4. **When file changes:** Next sync detects and updates it
5. **New files:** Automatically added on next sync

---

## 📝 Next Steps

After successful setup:

1. ✅ Monitor logs for sync activity
2. ✅ Test API endpoints with real data
3. ✅ Integrate with frontend (if needed)
4. ✅ Set up monitoring/alerts
5. ✅ Configure backup strategy

---

## 🔗 Quick Links

- [Full Documentation](./GOOGLE_DRIVE_README.md)
- [Google Cloud Console](https://console.cloud.google.com)
- [Google Drive](https://drive.google.com)
- [Service Account Email](mailto:niaqi-831@niaqi-478514.iam.gserviceaccount.com)

---

## 🆘 Need Help?

Check these files:

- `GOOGLE_DRIVE_README.md` - Complete documentation
- `test-google-drive-api.sh` - Test script
- Server logs - Look for errors

Common commands:

```bash
# Restart server
npm run start:dev

# Check database
npm run prisma:studio

# View migrations
ls prisma/migrations/

# Test API
./test-google-drive-api.sh
```

---

**Ready to go! 🚀**
