import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"

const requiredFirebaseBaseEnvVarNames = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID"
] as const

const requiredFirebaseDatabaseEnvVarNames = ["NEXT_PUBLIC_FIREBASE_DATABASE_URL"] as const

function readEnv(name: string) {
  return process.env[name]?.trim() ?? ""
}

const firebaseConfig = {
  apiKey: readEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: readEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  appId: readEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
  databaseURL: readEnv("NEXT_PUBLIC_FIREBASE_DATABASE_URL"),
  projectId: readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: readEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: readEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID")
}

export const missingFirebaseBaseEnvVarNames = requiredFirebaseBaseEnvVarNames.filter(name => !readEnv(name))
export const missingFirebaseDatabaseEnvVarNames = requiredFirebaseDatabaseEnvVarNames.filter(name => !readEnv(name))

const firebaseBaseReady = missingFirebaseBaseEnvVarNames.length === 0
const firebaseDatabaseReady = Boolean(firebaseConfig.databaseURL)

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

export const firebaseAuthReady = firebaseBaseReady
export const firebaseDataReady = firebaseBaseReady && firebaseDatabaseReady
export const database = firebaseDataReady ? getDatabase(firebaseApp) : null
export const auth = firebaseAuthReady ? getAuth(firebaseApp) : null

export function getFirebaseAuthUnavailableMessage() {
  if (missingFirebaseBaseEnvVarNames.length === 0) {
    return "Firebase auth is not configured."
  }

  return `Firebase auth is not configured. Missing: ${missingFirebaseBaseEnvVarNames.join(", ")}.`
}

export function getFirebaseDatabaseUnavailableMessage() {
  const missingVars = [...missingFirebaseBaseEnvVarNames, ...missingFirebaseDatabaseEnvVarNames]
  if (missingVars.length === 0) {
    return "Firebase database is not configured."
  }

  return `Firebase database is not configured. Missing: ${missingVars.join(", ")}.`
}
