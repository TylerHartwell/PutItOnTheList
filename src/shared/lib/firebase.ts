import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"

export const firebaseConfig = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ?? "",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "",
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() ?? "",
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim() ?? "",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ?? "",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? ""
} as const

const firebaseAppConfig = {
  apiKey: firebaseConfig.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: firebaseConfig.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  appId: firebaseConfig.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: firebaseConfig.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: firebaseConfig.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: firebaseConfig.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfig.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
}

const firebaseBaseReady = Boolean(firebaseAppConfig.apiKey && firebaseAppConfig.authDomain && firebaseAppConfig.projectId && firebaseAppConfig.appId)
const firebaseDatabaseReady = Boolean(firebaseAppConfig.databaseURL)

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseAppConfig)

export const firebaseAuthReady = firebaseBaseReady
export const firebaseDataReady = firebaseBaseReady && firebaseDatabaseReady
export const database = firebaseDataReady ? getDatabase(firebaseApp) : null
export const auth = firebaseAuthReady ? getAuth(firebaseApp) : null

export const firebaseAuthUnavailableMessage = "Firebase auth is not configured. Set the Firebase web app env vars in Netlify and redeploy."

export const firebaseDatabaseUnavailableMessage =
  "Firebase database is not configured. Set NEXT_PUBLIC_FIREBASE_DATABASE_URL in Netlify and redeploy."
