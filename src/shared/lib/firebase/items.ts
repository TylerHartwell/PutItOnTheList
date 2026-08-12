import { push, ref, update } from "firebase/database"
import { database } from "./config"
import { createItemRecord, createListAuditUpdates, getTimestamp, printError, readItemsFromSnapshot, trimAndCollapseItemName } from "./shared"
import { ShoppingItem } from "@/shared/types/shopping"
import { onValue } from "firebase/database"

export async function dbSaveEditedItem(listId: string, itemId: string, newItemName: string, userId: string) {
  if (!database || !itemId || !userId || !listId) {
    return
  }

  const trimmedName = trimAndCollapseItemName(newItemName)
  const now = getTimestamp()
  const updates: Record<string, unknown> = createListAuditUpdates(listId, userId, now)

  if (trimmedName) {
    updates[`lists/${listId}/items/${itemId}/itemName`] = trimmedName
    updates[`lists/${listId}/items/${itemId}/lastEditedByUid`] = userId
    updates[`lists/${listId}/items/${itemId}/updatedAt`] = now
  } else {
    updates[`lists/${listId}/items/${itemId}`] = null
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to save edited item:")
  }
}

export async function dbDeleteItems(listId: string, userId: string, itemIds: string[]) {
  if (!database || !userId || !listId) {
    return
  }

  const now = getTimestamp()
  const updates: Record<string, unknown> = createListAuditUpdates(listId, userId, now)

  for (const itemId of itemIds) {
    updates[`lists/${listId}/items/${itemId}`] = null
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, `Failed to delete item${itemIds.length !== 1 && "s"}:`)
  }
}

export async function dbChangeItemsHighlight(nextValue: boolean, userId: string, listId: string, itemIds: string[]) {
  if (!database || !userId || !listId) {
    return
  }

  const now = getTimestamp()
  const updates: Record<string, unknown> = createListAuditUpdates(listId, userId, now)

  for (const itemId of itemIds) {
    updates[`lists/${listId}/items/${itemId}/itemHighlighted`] = nextValue
    updates[`lists/${listId}/items/${itemId}/lastEditedByUid`] = userId
    updates[`lists/${listId}/items/${itemId}/updatedAt`] = now
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to change item highlight:")
  }
}

export async function dbReorderItems(listId: string, userId: string, itemOrder: Array<{ id: string; sortOrder: string }>) {
  if (!database || !userId || !listId) {
    return false
  }

  const now = getTimestamp()
  const updates: Record<string, unknown> = createListAuditUpdates(listId, userId, now)

  for (const item of itemOrder) {
    updates[`lists/${listId}/items/${item.id}/sortOrder`] = item.sortOrder
    updates[`lists/${listId}/items/${item.id}/updatedAt`] = now
  }

  try {
    await update(ref(database), updates)
    return true
  } catch (error) {
    printError(error, "Failed to reorder items:")
    return false
  }
}

export async function dbAddItem(itemEntry: string, userId: string, listId: string, sortOrder?: string) {
  const itemName = trimAndCollapseItemName(itemEntry)

  if (!database || !itemName || !userId || !listId) {
    return
  }

  const newItemRef = push(ref(database, `lists/${listId}/items`))
  const newItemId = newItemRef.key
  if (!newItemId) return

  const now = getTimestamp()
  const updates: Record<string, unknown> = {
    [`lists/${listId}/items/${newItemId}`]: {
      ...createItemRecord(itemName, userId, now, sortOrder)
    },
    ...createListAuditUpdates(listId, userId, now)
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to add item:")
  }
}

export function dbSubscribeToListItems(listId: string, userId: string, callback: (items: ShoppingItem[]) => void) {
  if (!database || !userId || !listId) {
    return null
  }

  const listItemsRef = ref(database, `lists/${listId}/items`)
  return onValue(listItemsRef, snapshot => {
    const nextItems = readItemsFromSnapshot(snapshot)
    callback(nextItems)
  })
}
