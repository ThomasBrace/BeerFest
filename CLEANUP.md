# 🗑️ Database Cleanup System

BeerFestify includes an automated cleanup system to remove old events and keep your database clean and cost-effective.

## 🚀 Automatic Cleanup (Recommended)

### Cloud Functions (Deployed ✅)
- **Scheduled Function**: `cleanupOldEvents` runs daily at 2 AM UTC
- **Manual Function**: `manualCleanup` can be triggered via HTTP
- **Retention Period**: Events older than 7 days are automatically deleted

### What Gets Cleaned Up
- ✅ **Events** older than 1 week
- ✅ **Beers** associated with old events
- ✅ **Scores** from old events
- ✅ **Attendees** from old events
- ✅ **Photos** uploaded to Firebase Storage

### Function URLs
- **Manual Cleanup**: `https://us-central1-beerfest-4b679.cloudfunctions.net/manualCleanup`
- **Scheduled Cleanup**: Runs automatically (no URL needed)

## 🛠️ Manual Cleanup Options

### Option 1: HTTP Request
```bash
curl -X POST https://us-central1-beerfest-4b679.cloudfunctions.net/manualCleanup
```

### Option 2: Local Script
```bash
# Set up Firebase Admin credentials
export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account-key.json"

# Run the cleanup script
node cleanup-script.js
```

### Option 3: Firebase CLI
```bash
# Deploy and run functions locally
firebase functions:shell

# In the shell, call the function
manualCleanup()
```

## 📊 Monitoring

### View Function Logs
```bash
firebase functions:log
```

### Firebase Console
- Go to [Firebase Console](https://console.firebase.google.com/project/beerfest-4b679/functions)
- View function executions and logs
- Monitor cleanup statistics

## ⚙️ Configuration

### Change Retention Period
Edit `functions/src/index.ts` and modify:
```typescript
const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7); // Change 7 to desired days
```

### Change Schedule
Edit the cron expression in `functions/src/index.ts`:
```typescript
export const cleanupOldEvents = onSchedule("0 2 * * *", async (event) => {
  // "0 2 * * *" = Daily at 2 AM UTC
  // "0 0 * * 0" = Weekly on Sunday at midnight
  // "0 0 1 * *" = Monthly on the 1st at midnight
});
```

## 🔒 Security

- Functions run with Firebase Admin privileges
- Only events older than the specified period are deleted
- All deletions are logged for audit purposes
- Batch operations ensure data consistency

## 💰 Cost Benefits

- **Reduced Storage**: Automatic cleanup of old photos and data
- **Lower Firestore Costs**: Fewer documents = lower read/write costs
- **Efficient Queries**: Smaller database = faster queries

## 🚨 Important Notes

- **Irreversible**: Deleted data cannot be recovered
- **7-Day Retention**: Events are kept for 1 week by default
- **Automatic**: No manual intervention required
- **Safe**: Only affects events older than the retention period

## 📈 Statistics

The cleanup functions log detailed statistics:
- Number of events deleted
- Number of beers deleted
- Number of scores deleted
- Number of attendees deleted
- Number of photos deleted

This helps you monitor the cleanup effectiveness and database growth patterns.
