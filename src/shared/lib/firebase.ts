import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? "https://playground-3bec0-default-rtdb.firebaseio.com/",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "playground-3bec0",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? ""
}

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

export const database = getDatabase(firebaseApp)
export const firebaseAuthReady = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain)
export const auth = firebaseAuthReady ? getAuth(firebaseApp) : null
