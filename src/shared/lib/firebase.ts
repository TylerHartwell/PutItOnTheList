import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim() ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() ?? ""
}

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const firebaseBaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId)
const firebaseDatabaseReady = Boolean(firebaseConfig.databaseURL)

const firebaseDataReady = firebaseBaseReady && firebaseDatabaseReady
export const firebaseAuth = firebaseBaseReady ? getAuth(firebaseApp) : null

export const database = firebaseDataReady ? getDatabase(firebaseApp) : null
