# 🚀 Quick Reference - Google Drive Sync

## ⚡ Quick Commands

```bash
# Start server
npm run start:dev

# Test API
./test-google-drive-api.sh

# Trigger sync
curl http://localhost:5000/documents/sync/now

# List documents
curl http://localhost:5000/documents

# Download document
curl http://localhost:5000/documents/{id} -o file.pdf
```

## 📋 Setup Checklist

1. ✅ Add service account key to `keys/service-account.json`
2. ✅ Enable Google Drive API in Cloud Console
3. ✅ Share Drive folder with: `niaqi-831@niaqi-478514.iam.gserviceaccount.com`
4. ✅ Start server: `npm run start:dev`
5. ✅ Test: `./test-google-drive-api.sh`

## 🔗 Service Account Email

```
niaqi-831@niaqi-478514.iam.gserviceaccount.com
```

## 📊 API Endpoints

| Method | Endpoint              | Description        |
| ------ | --------------------- | ------------------ |
| GET    | `/documents`          | List all documents |
| GET    | `/documents/:id`      | Download document  |
| GET    | `/documents/sync/now` | Manual sync        |

## ⏰ Sync Schedule

- **Frequency:** Every 5 minutes
- **Cron:** `*/5 * * * *`
- **Timezone:** America/New_York

## 🗃️ Database Table

```sql
documents (
  id uuid PRIMARY KEY,
  drive_id text UNIQUE,
  name text,
  mime_type text,
  modified_time timestamp,
  size bigint,
  content bytea,
  created_at timestamp,
  updated_at timestamp
)
```

## 📁 Key Files

- `src/google-drive/google-drive.service.ts` - Sync logic
- `src/google-drive/google-drive.controller.ts` - API endpoints
- `src/google-drive/google-drive-sync.task.ts` - Cron scheduler
- `keys/service-account.json` - ⚠️ Add your key here

## 🐛 Troubleshooting

| Issue             | Solution                    |
| ----------------- | --------------------------- |
| Auth failed       | Check service account key   |
| No files          | Share Drive folder          |
| Permission denied | Grant Viewer access         |
| Not syncing       | Check logs, try manual sync |

## 📚 Documentation

- `SETUP_GUIDE.md` - Setup instructions
- `GOOGLE_DRIVE_README.md` - Full documentation
- `GOOGLE_DRIVE_IMPLEMENTATION.md` - Implementation details

## ✅ Success Indicators

```
[GoogleDriveService] Google Drive authentication initialized successfully
[GoogleDriveSyncTask] Starting scheduled Google Drive sync...
[GoogleDriveService] Found X files in Google Drive
[GoogleDriveSyncTask] Scheduled sync completed: X new, Y updated, Z skipped
```

## 🎯 Next Steps

1. Configure service account key
2. Share Google Drive folder
3. Start server
4. Verify sync works
5. Integrate with frontend

---

**Need help?** Check `SETUP_GUIDE.md` or `GOOGLE_DRIVE_README.md`
