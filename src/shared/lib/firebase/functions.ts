import { push, ref, update } from "firebase/database"
import { database } from "./config"
import { trimAndCollapseSpaces } from "@/shared/utils/text"

function printError(error: unknown, message = "Error:") {
  if (error instanceof Error) {
    console.error(message, error.message)
  } else if (typeof error === "string") {
    console.error(message, error)
  } else {
    console.error(message, "Unknown error.")
  }
}

function getTimestamp() {
  return Date.now()
}

export function generateSequentialSortOrder(index: number) {
  return String(index).padStart(6, "0")
}

export function generateFractionalIndex(beforeSortOrder: string | null, afterSortOrder: string | null) {
  if (!beforeSortOrder && !afterSortOrder) {
    return "a0"
  }

  if (!beforeSortOrder) {
    return `${afterSortOrder}~`
  }

  if (!afterSortOrder) {
    return `${beforeSortOrder}~`
  }

  let index = 0

  while (index < Math.max(beforeSortOrder.length, afterSortOrder.length)) {
    const beforeChar = beforeSortOrder[index] ?? ""
    const afterChar = afterSortOrder[index] ?? ""

    if (beforeChar === afterChar) {
      index += 1
      continue
    }

    if (beforeChar && afterChar) {
      const beforeCode = beforeChar.charCodeAt(0)
      const afterCode = afterChar.charCodeAt(0)

      if (beforeCode + 1 < afterCode) {
        return `${beforeSortOrder.slice(0, index)}${String.fromCharCode(beforeCode + 1)}`
      }
    }

    return `${beforeSortOrder.slice(0, index)}${beforeChar || "a"}0`
  }

  return `${beforeSortOrder}0`
}

export async function dbSaveEditedItem(listId: string, itemId: string, newItemName: string, userId: string) {
  if (!database || !itemId || !userId || !listId) {
    return
  }

  const trimmedName = trimAndCollapseSpaces(newItemName)

  const now = getTimestamp()

  const updates: Record<string, unknown> = {
    [`lists/${listId}/lastEditedByUid`]: userId,
    [`lists/${listId}/updatedAt`]: now
  }

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

  const updates: Record<string, unknown> = {
    [`lists/${listId}/lastEditedByUid`]: userId,
    [`lists/${listId}/updatedAt`]: now
  }

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

  const updates: Record<string, unknown> = {
    [`lists/${listId}/lastEditedByUid`]: userId,
    [`lists/${listId}/updatedAt`]: now
  }

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

export async function dbUpdateItemSortOrder(listId: string, itemId: string, sortOrder: string, userId: string) {
  if (!database || !itemId || !userId || !listId) {
    return
  }

  const now = getTimestamp()

  const updates: Record<string, unknown> = {
    [`lists/${listId}/items/${itemId}/sortOrder`]: sortOrder,
    [`lists/${listId}/items/${itemId}/updatedAt`]: now,
    [`lists/${listId}/lastEditedByUid`]: userId,
    [`lists/${listId}/updatedAt`]: now
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to update item sort order:")
  }
}

export async function dbReorderItems(listId: string, userId: string, itemOrder: Array<{ id: string; sortOrder: string }>) {
  if (!database || !userId || !listId) {
    return false
  }

  const now = getTimestamp()

  const updates: Record<string, unknown> = {
    [`lists/${listId}/lastEditedByUid`]: userId,
    [`lists/${listId}/updatedAt`]: now
  }

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
  const itemName = trimAndCollapseSpaces(itemEntry)

  if (!database || !itemName || !userId || !listId) {
    return
  }

  const newItemRef = push(ref(database, `lists/${listId}/items`))
  const newItemId = newItemRef.key
  if (!newItemId) return

  const now = getTimestamp()

  const updates: Record<string, unknown> = {
    [`lists/${listId}/items/${newItemId}`]: {
      itemName,
      itemHighlighted: false,
      lastEditedByUid: userId,
      createdAt: now,
      updatedAt: now,
      sortOrder: sortOrder ?? generateFractionalIndex(null, null)
    },
    [`lists/${listId}/lastEditedByUid`]: userId,
    [`lists/${listId}/updatedAt`]: now
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to add item:")
  }
}

export async function dbChangeListOwner(userId: string, listId: string, memberUserIds: string[]) {
  if (!database || !userId || !listId) {
    return
  }

  if (!memberUserIds.some(memberUserId => memberUserId === userId)) {
    return
  }

  const updates: Record<string, unknown> = {
    [`lists/${listId}/owner`]: userId,
    [`lists/${listId}/updatedAt`]: getTimestamp()
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to change list owner:")
  }
}

export async function dbRemoveListMember(listId: string, userId: string) {
  if (!database || !listId || !userId) {
    return
  }

  const updates: Record<string, unknown> = {
    [`lists/${listId}/members/${userId}`]: null,
    [`lists/${listId}/memberProfiles/${userId}`]: null,
    [`users/${userId}/lists/${listId}`]: null,
    [`lists/${listId}/updatedAt`]: getTimestamp()
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to remove list member:")
  }
}

export async function dbRenameList(listId: string, userId: string, newName: string) {
  if (!database || !userId || !listId) {
    return
  }

  const trimmedName = trimAndCollapseSpaces(newName)
  if (!trimmedName) {
    return
  }

  const updates: Record<string, unknown> = {
    [`lists/${listId}/listName`]: trimmedName,
    [`lists/${listId}/lastEditedByUid`]: userId,
    [`lists/${listId}/updatedAt`]: getTimestamp()
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to rename list:")
  }
}

export async function dbJoinList(listId: string, userId: string, username: string) {
  if (!database || !userId || !listId || !username) {
    return
  }

  const updates: Record<string, unknown> = {
    [`lists/${listId}/members/${userId}`]: true,
    [`users/${userId}/lists/${listId}`]: true,
    [`lists/${listId}/memberProfiles/${userId}/username`]: username,
    [`lists/${listId}/updatedAt`]: getTimestamp()
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to join list:")
  }

  return listId
}

export async function dbLeaveList(listId: string, userId: string, memberUserIds: string[], ownerUserId: string) {
  if (!database || !userId || !listId || !memberUserIds) {
    return
  }

  const otherMemberUserIds = memberUserIds.filter(memberUserId => memberUserId !== userId)

  const updates: Record<string, unknown> = {
    [`users/${userId}/lists/${listId}`]: null,
    [`lists/${listId}/updatedAt`]: getTimestamp()
  }

  if (userId === ownerUserId) {
    if (otherMemberUserIds.length > 0) {
      updates[`lists/${listId}/owner`] = otherMemberUserIds[0]
      updates[`lists/${listId}/members/${userId}`] = null
      updates[`lists/${listId}/memberProfiles/${userId}`] = null
    } else {
      updates[`lists/${listId}`] = null
    }
  } else {
    updates[`lists/${listId}/members/${userId}`] = null
    updates[`lists/${listId}/memberProfiles/${userId}`] = null
  }

  try {
    await update(ref(database), updates)
  } catch (error) {
    printError(error, "Failed to leave list:")
  }
}
