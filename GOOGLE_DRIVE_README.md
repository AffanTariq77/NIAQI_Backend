# Google Drive Sync Service

A complete NestJS backend service that syncs Google Drive documents to PostgreSQL using a Google Service Account.

## 📋 Features

- ✅ **Service Account Authentication** - Secure Google Drive API access
- ✅ **Automatic File Listing** - Lists all non-folder files from Google Drive
- ✅ **Smart Download** - Handles both regular files and Google Workspace files (exports as PDF)
- ✅ **Database Sync** - Stores file content and metadata in PostgreSQL
- ✅ **Incremental Updates** - Only downloads files that are new or modified
- ✅ **REST API** - Endpoints to list and download documents
- ✅ **Automated Sync** - Cron job runs every 5 minutes
- ✅ **Full Logging** - Detailed logs for monitoring and debugging

## 🏗️ Architecture

```
┌─────────────────┐
│  Google Drive   │
│  (Source)       │
└────────┬────────┘
         │
         │ Service Account Auth
         │
┌────────▼────────────────────────────┐
│  Google Drive Service               │
│  - Authenticate                     │
│  - List files                       │
│  - Download content                 │
│  - Sync with DB                     │
└────────┬────────────────────────────┘
         │
         │
┌────────▼────────────────────────────┐
│  PostgreSQL Database                │
│  documents table:                   │
│  - id (uuid)                        │
│  - drive_id (text)                  │
│  - name (text)                      │
│  - mime_type (text)                 │
│  - modified_time (timestamp)        │
│  - content (bytea)                  │
│  - created_at, updated_at           │
└────────┬────────────────────────────┘
         │
         │
┌────────▼────────────────────────────┐
│  REST API Endpoints                 │
│  GET /documents                     │
│  GET /documents/:id                 │
│  GET /documents/sync/now            │
└─────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Set Up Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google Drive API
4. Create a Service Account:
   - Go to **IAM & Admin** > **Service Accounts**
   - Click **Create Service Account**
   - Name it (e.g., "niaqi-drive-sync")
   - Grant it **Viewer** role
5. Generate Key:
   - Click on the service account
   - Go to **Keys** tab
   - Click **Add Key** > **Create New Key**
   - Choose **JSON** format
   - Download the key file
6. Share Google Drive folder with service account email:
   - Copy the service account email: `niaqi-831@niaqi-478514.iam.gserviceaccount.com`
   - Share your Google Drive folder with this email (Viewer permission)

### 2. Configure Service Account

Replace the contents of `/NIAQI_Backend/keys/service-account.json` with your downloaded key file.

**Example structure:**

```json
{
  "type": "service_account",
  "project_id": "niaqi-478514",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "niaqi-831@niaqi-478514.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### 3. Start the Backend

```bash
cd /Users/mac/Documents/GitHub/NIAQI/NIAQI_Backend
npm run start:dev
```

The service will:

1. ✅ Initialize Google Drive authentication
2. ✅ Start the cron scheduler (runs every 5 minutes)
3. ✅ Expose REST API endpoints

### 4. Test the API

#### List all documents

```bash
curl http://localhost:5000/documents
```

#### Download a document

```bash
curl http://localhost:5000/documents/{id} --output downloaded-file.pdf
```

#### Trigger manual sync

```bash
curl http://localhost:5000/documents/sync/now
```

## 📡 API Endpoints

### GET /documents

List all documents metadata (without content).

**Response:**

```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "uuid",
      "driveId": "google-drive-file-id",
      "name": "Document Name.pdf",
      "mimeType": "application/pdf",
      "modifiedTime": "2025-11-26T12:00:00Z",
      "size": "12345",
      "createdAt": "2025-11-26T12:00:00Z",
      "updatedAt": "2025-11-26T12:00:00Z"
    }
  ]
}
```

### GET /documents/:id

Download a specific document by ID.

**Response:** File download (binary)

**Headers:**

- `Content-Type`: Original file MIME type
- `Content-Disposition`: attachment; filename="..."
- `Content-Length`: File size

### GET /documents/sync/now

Trigger manual sync immediately.

**Response:**

```json
{
  "success": true,
  "message": "Sync completed successfully",
  "newFiles": 5,
  "updatedFiles": 3,
  "skippedFiles": 10,
  "totalFiles": 18
}
```

## 🔄 Sync Logic

The sync service follows this logic:

1. **List Files** - Get all non-folder files from Google Drive
2. **For Each File:**
   - Check if file exists in database (by `drive_id`)
   - Compare `modifiedTime` with database record
   - **If NEW** → Download and insert into database
   - **If MODIFIED** → Download and update database record
   - **If UNCHANGED** → Skip (no download)
3. **Log Results** - Report new, updated, and skipped files

### File Download Strategy

- **Google Workspace Files** (Docs, Sheets, Slides):
  - Use `files.export` API
  - Export as PDF: `application/pdf`
- **Regular Files** (PDF, images, etc.):
  - Use `files.get` with `alt='media'`
  - Download as-is

## ⏰ Cron Schedule

The sync runs automatically every 5 minutes:

```typescript
@Cron('*/5 * * * *')  // Every 5 minutes
```

**Cron Expression Breakdown:**

- `*/5` - Every 5 minutes
- `*` - Every hour
- `*` - Every day
- `*` - Every month
- `*` - Every day of week

**To change frequency:**
Edit `src/google-drive/google-drive-sync.task.ts`:

```typescript
// Every hour
@Cron('0 * * * *')

// Every 30 minutes
@Cron('*/30 * * * *')

// Daily at 2 AM
@Cron('0 2 * * *')
```

## 📊 Database Schema

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drive_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    modified_time TIMESTAMP NOT NULL,
    size BIGINT,
    content BYTEA,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_drive_id ON documents(drive_id);
CREATE INDEX idx_documents_modified_time ON documents(modified_time);
```

## 📁 Project Structure

```
NIAQI_Backend/
├── keys/
│   └── service-account.json         ← Google Service Account credentials
├── prisma/
│   ├── schema.prisma                ← Database schema with documents table
│   └── migrations/                  ← Database migrations
└── src/
    ├── google-drive/
    │   ├── google-drive.module.ts           ← Module definition
    │   ├── google-drive.service.ts          ← Core sync logic
    │   ├── google-drive.controller.ts       ← REST API endpoints
    │   └── google-drive-sync.task.ts        ← Cron scheduler
    ├── prisma/
    │   ├── prisma.module.ts
    │   └── prisma.service.ts
    └── app.module.ts                ← Main app (imports GoogleDriveModule)
```

## 🔒 Security

### Best Practices

1. ✅ **Never commit** `service-account.json` to git
2. ✅ Add to `.gitignore`:
   ```
   keys/
   *.json
   !package.json
   ```
3. ✅ Use environment variables for sensitive data
4. ✅ Service account has **read-only** access to Drive
5. ✅ Database stores encrypted content (bytea)

### Permissions

The service account needs:

- **Google Drive API** - Enabled in Google Cloud
- **Drive Viewer Permission** - On the specific folder/files
- **Scope**: `https://www.googleapis.com/auth/drive.readonly`

## 🐛 Troubleshooting

### Error: "Failed to initialize Google Drive authentication"

**Solution:**

- Check `keys/service-account.json` exists and is valid JSON
- Verify service account email and key are correct
- Ensure Google Drive API is enabled

### Error: "Insufficient permission"

**Solution:**

- Share Google Drive folder with service account email
- Grant at least **Viewer** permission
- Wait a few minutes for permissions to propagate

### Error: "404 File not found"

**Solution:**

- Verify the file exists in Google Drive
- Check if file is in a shared folder with the service account
- Ensure file is not in trash

### Files not syncing

**Solution:**

- Check logs: Look for errors in console
- Verify cron is running: Check "Starting scheduled Google Drive sync..." logs
- Test manual sync: `GET /documents/sync/now`
- Check database: `SELECT * FROM documents;`

### Large files failing

**Solution:**

- PostgreSQL `bytea` has limits (~1GB)
- For very large files, consider storing in file system or cloud storage
- Add size checks before download

## 📈 Performance

### Optimization Tips

1. **Limit File Size**

   ```typescript
   // In google-drive.service.ts, add size check
   if (file.size && BigInt(file.size) > BigInt(50 * 1024 * 1024)) {
     this.logger.warn(`Skipping large file: ${file.name} (${file.size} bytes)`);
     continue;
   }
   ```

2. **Parallel Downloads**

   ```typescript
   // Process files in batches
   const batchSize = 5;
   for (let i = 0; i < driveFiles.length; i += batchSize) {
     const batch = driveFiles.slice(i, i + batchSize);
     await Promise.all(batch.map((file) => this.processFile(file)));
   }
   ```

3. **Database Indexing**
   Already created:
   - Index on `drive_id` (for lookups)
   - Index on `modified_time` (for sorting)

## 📝 Monitoring

### Log Levels

```typescript
// In google-drive.service.ts
this.logger.log("Info message"); // Normal operations
this.logger.debug("Debug message"); // Detailed info
this.logger.warn("Warning message"); // Non-critical issues
this.logger.error("Error message"); // Critical errors
```

### Key Metrics to Monitor

- **Sync Duration** - How long each sync takes
- **File Counts** - New, updated, skipped files
- **Error Rate** - Failed downloads or database operations
- **Database Size** - Growth of documents table

## 🚀 Production Deployment

### Environment Variables

Add to `.env`:

```properties
# Google Drive Configuration
GOOGLE_SERVICE_ACCOUNT_PATH=./keys/service-account.json
GOOGLE_DRIVE_SYNC_ENABLED=true
GOOGLE_DRIVE_SYNC_INTERVAL=*/5 * * * *

# Optional: Timezone for cron
TZ=America/New_York
```

### Docker Considerations

```dockerfile
# Dockerfile
COPY keys/service-account.json /app/keys/
RUN chmod 600 /app/keys/service-account.json
```

### Health Checks

Add health check endpoint:

```typescript
@Get('health')
async healthCheck() {
  return {
    status: 'ok',
    lastSync: await this.getLastSyncTime(),
    documentCount: await this.getDocumentCount(),
  };
}
```

## 📚 References

- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/reference)
- [Service Account Authentication](https://cloud.google.com/iam/docs/service-accounts)
- [NestJS Scheduling](https://docs.nestjs.com/techniques/task-scheduling)
- [Prisma Bytea Type](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#bytes)

## ✅ Testing Checklist

- [ ] Service account key configured
- [ ] Google Drive API enabled
- [ ] Folder shared with service account
- [ ] Database migration applied
- [ ] Backend server started
- [ ] Authentication successful (check logs)
- [ ] Manual sync works (`/documents/sync/now`)
- [ ] Files appear in database
- [ ] List endpoint works (`/documents`)
- [ ] Download endpoint works (`/documents/:id`)
- [ ] Cron job runs every 5 minutes
- [ ] Updated files re-sync correctly
- [ ] Logs show proper activity

## 🎉 Success!

If everything is configured correctly, you should see:

```
[GoogleDriveService] Google Drive authentication initialized successfully
[GoogleDriveSyncTask] Starting scheduled Google Drive sync...
[GoogleDriveService] Found 15 files in Google Drive
[GoogleDriveService] Processing file: Document.pdf (abc123)
[GoogleDriveService] Added new file: Document.pdf
[GoogleDriveSyncTask] Scheduled sync completed: 5 new, 3 updated, 7 skipped
```

Your Google Drive documents are now automatically syncing to your database! 🚀
