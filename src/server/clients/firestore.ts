import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

// Initialize Firebase Admin
if (!getApps().length) {
  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // For production, use service account JSON from environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    // For development, you can use a service account JSON file
    // Make sure to add the service account file to .gitignore
    try {
      const serviceAccountPath = path.join(
        process.cwd(),
        "firebase-service-account.json"
      );
      if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = JSON.parse(
          fs.readFileSync(serviceAccountPath, "utf8")
        );
      }
    } catch (error) {
      console.warn(
        "No Firebase service account found. Make sure to set FIREBASE_SERVICE_ACCOUNT_KEY or add firebase-service-account.json"
      );
    }
  }

  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    throw new Error("Firebase service account configuration missing");
  }
}

// Get Firestore instance
const db = getFirestore();

export default db;
