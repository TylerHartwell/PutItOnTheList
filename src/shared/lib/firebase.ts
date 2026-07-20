import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase, push, ref, update } from "firebase/database"
import { trimAndCollapseSpaces } from "../utils/text"

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

function printError(error: unknown, message = "Error:") {
  if (error instanceof Error) {
    console.error(message, error.message)
  } else if (typeof error === "string") {
    console.error(message, error)
  } else {
    console.error(message, "Unknown error.")
  }
}

export async function dbDeleteAllItems(listId: string, userId: string) {
  if (!database || !userId || !listId) {
    return
  }

  const updates: Record<string, unknown> = {
    [`lists/${listId}/items`]: null,
    [`lists/${listId}/lastEditedByUid`]: userId
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to delete all items:")
  }
}

export async function dbSaveEditedItem(listId: string, itemId: string, newItemName: string, userId: string) {
  if (!database || !itemId || !userId || !listId) {
    return
  }

  const trimmedName = trimAndCollapseSpaces(newItemName)

  const updates: Record<string, unknown> = {
    [`lists/${listId}/lastEditedByUid`]: userId,
    [`lists/${listId}/items/${itemId}`]: trimmedName
      ? {
          itemName: trimmedName,
          lastEditedByUid: userId
        }
      : null
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to save edited item:")
  }
}

export async function dbDeleteMarkedItems(listId: string, userId: string, itemIds: string[]) {
  if (!database || !userId || !listId) {
    return
  }

  const updates: Record<string, unknown> = {
    [`lists/${listId}/lastEditedByUid`]: userId
  }

  for (const itemId of itemIds) {
    updates[`lists/${listId}/items/${itemId}`] = null
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to delete marked items:")
  }
}

export async function dbMarkAllItems(nextValue: boolean, userId: string, listId: string, itemIds: string[]) {
  if (!database || !userId || !listId) {
    return
  }

  const updates: Record<string, unknown> = {
    [`lists/${listId}/lastEditedByUid`]: userId
  }

  for (const itemId of itemIds) {
    updates[`lists/${listId}/items/${itemId}/itemHighlighted`] = nextValue
    updates[`lists/${listId}/items/${itemId}/lastEditedByUid`] = userId
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to mark all items:")
  }
}

export async function dbDeleteItem(listId: string, itemId: string, userId: string) {
  if (!database || !userId || !listId) {
    return
  }

  const updates: Record<string, unknown> = {
    [`lists/${listId}/items/${itemId}`]: null,
    [`lists/${listId}/lastEditedByUid`]: userId
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to delete item:")
  }
}

export async function dbToggleHighlight(itemId: string, nextValue: boolean, userId: string, listId: string) {
  if (!database || !userId || !listId) {
    return
  }

  const updates: Record<string, unknown> = {
    [`lists/${listId}/items/${itemId}/itemHighlighted`]: nextValue,
    [`lists/${listId}/items/${itemId}/lastEditedByUid`]: userId,
    [`lists/${listId}/lastEditedByUid`]: userId
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to toggle highlight:")
  }
}

export async function dbAddItem(itemEntry: string, userId: string, currentListId: string) {
  const itemName = trimAndCollapseSpaces(itemEntry)

  if (!database || !itemName || !userId || !currentListId) {
    return
  }

  const newItemRef = push(ref(database, `lists/${currentListId}/items`))
  const newItemId = newItemRef.key
  if (!newItemId) return

  const updates: Record<string, unknown> = {
    [`lists/${currentListId}/items/${newItemId}`]: {
      itemName,
      itemHighlighted: false,
      lastEditedByUid: userId
    },
    [`lists/${currentListId}/lastEditedByUid`]: userId
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to add item:")
  }
}
