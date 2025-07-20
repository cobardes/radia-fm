# Firebase Setup Guide

This application has been migrated from Redis to Firestore for persistent storage and real-time updates with **field-level access control**.

## Data Structure

The session data is now separated into two collections for security:

### Collections

1. **`sessions`** (Private - Server-side only)

   ```
   sessions/{sessionId}
   ├── id: string
   ├── createdAt: string
   ├── lastActivity: string
   ├── seedSong: object
   └── currentIndex: number
   ```

2. **`sessionQueues`** (Public - Client readable)
   ```
   sessionQueues/{sessionId}
   ├── sessionId: string
   ├── queue: array
   └── lastUpdated: string
   ```

## Required Environment Variables

### Server-side Firebase Admin Configuration

Add these to your `.env.local` file:

```bash
# Firebase Project ID
FIREBASE_PROJECT_ID=your-project-id

# Firebase Service Account JSON (for production)
FIREBASE_SERVICE_ACCOUNT_KEY={"type": "service_account", "project_id": "your-project-id", ...}
```

### Client-side Firebase Configuration

Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Development Setup

1. **Create a Firebase Project**

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database

2. **Get Configuration Values**

   - In Project Settings > General, find your web app config
   - Copy the values to your `.env.local` file

3. **Set up Service Account (for server-side)**

   - Go to Project Settings > Service Accounts
   - Generate a new private key
   - Either:
     - Set `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable with the JSON content
     - OR save the JSON file as `firebase-service-account.json` in the project root (make sure it's in `.gitignore`)

4. **Deploy Firestore Security Rules**

   Copy the rules from `firestore.rules` to your Firebase Console:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Session metadata - no client access (server-side only)
       match /sessions/{sessionId} {
         allow read, write: if false;
       }

       // Session queues - read-only for everyone, no writes
       match /sessionQueues/{sessionId} {
         allow read: if true;
         allow write: if false;
       }
     }
   }
   ```

## Architecture Changes

### What Changed

1. **Field-Level Access Control**: Clients can only read queue data, not session metadata
2. **Separated Collections**: Session metadata and queues are stored separately
3. **Real-time Queue Updates**: Clients listen only to queue changes
4. **Server-Only Writes**: All writes happen server-side via Firebase Admin SDK
5. **Enhanced Security**: Sensitive session data (seedSong, timestamps) is protected

### Real-time Features

- Queue updates are real-time via Firestore listeners
- Multiple clients can observe the same session queue
- Session metadata remains private and secure
- Changes made by server APIs are immediately visible to clients

### API Endpoints

- `POST /api/sessions/start` - Create new session
- `GET /api/sessions/{sessionId}` - Get full session (server-side)
- `PATCH /api/sessions/{sessionId}` - Update session (server-side)
- `GET /api/sessions/{sessionId}/queue` - **NEW**: Get queue-only data

### Files Modified

- `src/types/index.ts` - Added SessionMetadata and SessionQueue types
- `src/server/services/session.ts` - Migrated to dual-collection structure
- `src/server/clients/firestore.ts` - Server-side Firestore client
- `src/lib/firebase.ts` - Client-side Firebase client
- `src/hooks/useSessionRealtime.ts` - Updated to listen only to queue collection
- `src/app/page.tsx` - Updated to use queue-only real-time updates
- `src/app/api/sessions/[sessionId]/queue/route.ts` - **NEW**: Queue-only endpoint

### Files Removed

- `src/server/clients/redis.ts` - No longer needed
- `@upstash/redis` dependency - Removed from package.json

## Security Benefits

✅ **True Field-Level Access Control**: Clients cannot access session metadata  
✅ **Read-Only Queue Access**: Clients can only read, never write  
✅ **Server-Side Write Control**: All modifications happen server-side  
✅ **Real-Time Updates**: Queue changes are immediately pushed to clients  
✅ **Data Separation**: Sensitive data is completely isolated from client access

This architecture ensures that clients receive real-time queue updates while maintaining strict security boundaries around session metadata.
