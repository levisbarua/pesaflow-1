import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore/lite";
import { getStorage, FirebaseStorage } from "firebase/storage";

// --------------------------------------------------------
// FIREBASE CONFIGURATION
// --------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "PASTE_YOUR_API_KEY_HERE",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "hearth-home.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "hearth-home",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "hearth-home.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:000000000000"
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.length > 20 && 
  !firebaseConfig.apiKey.startsWith("PASTE_")
);

// Only warn if not configured, don't throw - allow app to load with mock services
if (!isFirebaseConfigured) {
  console.warn(
    "⚠️  Firebase configuration is missing. App will use mock services. To enable Firebase, configure your credentials in environment variables or firebaseConfig.ts"
  );
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (isFirebaseConfigured) {
  try {
    const existingApps = getApps();
    app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
    
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    console.log("✅ Firebase initialized successfully.");
  } catch (error: any) {
    console.error("❌ Firebase initialization failed:", error.message);
  }
} else {
  console.log("ℹ️  Firebase disabled - running in mock mode");
}

export { auth, db, storage };