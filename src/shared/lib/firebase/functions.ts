import { DataSnapshot, get, onValue, push, ref, remove, runTransaction, update } from "firebase/database"
import { database } from "./config"
import { trimAndCollapseSpaces } from "@/shared/utils/text"
import { ShoppingItem } from "@/shared/types/shopping"

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

function createListAuditUpdates(listId: string, userId: string, now = getTimestamp()): Record<string, unknown> {
  return {
    [`lists/${listId}/lastEditedByUid`]: userId,
    [`lists/${listId}/updatedAt`]: now
  }
}

function getPathSnapshot(path: string) {
  if (!database || !path) {
    return null
  }

  return get(ref(database, path))
}

function subscribeToPath(path: string, callback: (snapshot: DataSnapshot) => void, onError?: (error: Error) => void) {
  if (!database || !path) {
    return null
  }

  return onValue(ref(database, path), callback, onError)
}

function runTransactionAtPath(path: string, transactionUpdate: Parameters<typeof runTransaction>[1]) {
  if (!database || !path) {
    return Promise.resolve(null)
  }

  return runTransaction(ref(database, path), transactionUpdate)
}

export function generateSequentialSortOrder(index: number) {
  return String(index).padStart(6, "0")
}

function generateFractionalIndex(beforeSortOrder: string | null, afterSortOrder: string | null) {
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

export async function dbGetUserCurrentListId(userId: string) {
  const snapshot = await getPathSnapshot(`users/${userId}/currentListId`)
  if (!snapshot || !snapshot.exists()) {
    return ""
  }

  const currentListIdValue = snapshot.val()
  return typeof currentListIdValue === "string" ? currentListIdValue : ""
}

export function dbSubscribeToUserListIds(userId: string, callback: (snapshot: DataSnapshot) => void, onError?: (error: Error) => void) {
  return subscribeToPath(`users/${userId}/lists`, callback, onError)
}

export async function dbGetListById(listId: string) {
  return getPathSnapshot(`lists/${listId}`)
}

export function dbSubscribeToListById(listId: string, callback: (snapshot: DataSnapshot) => void, onError?: (error: Error) => void) {
  return subscribeToPath(`lists/${listId}`, callback, onError)
}

export async function dbSetUserCurrentListId(userId: string, listId: string | null) {
  if (!database || !userId) {
    return
  }

  try {
    await update(ref(database), {
      [`users/${userId}/currentListId`]: listId
    })
  } catch (error) {
    printError(error, "Failed to set user current list: ")
  }
}

export async function dbAddUserListReference(userId: string, listId: string) {
  if (!database || !userId || !listId) {
    return
  }

  try {
    await update(ref(database), {
      [`users/${userId}/lists/${listId}`]: true
    })
  } catch (error) {
    printError(error, "Failed to add user list reference: ")
    throw error
  }
}

export async function dbClearUserListMembership(userId: string, listId: string) {
  if (!database || !userId || !listId) {
    return
  }

  try {
    await update(ref(database), {
      [`users/${userId}/lists/${listId}`]: null
    })
  } catch (error) {
    printError(error, "Failed to clear user list membership: ")
  }
}

export async function dbDeleteListById(listId: string) {
  if (!database || !listId) {
    return
  }

  try {
    await update(ref(database), {
      [`lists/${listId}`]: null
    })
  } catch (error) {
    printError(error, "Failed to delete list: ")
  }
}

export async function dbReserveListRecord(listId: string, listRecord: Record<string, unknown>) {
  const reservationResult = await runTransactionAtPath(`lists/${listId}`, currentValue => {
    if (currentValue !== null) {
      return
    }

    return listRecord
  })

  return Boolean(reservationResult?.committed)
}

export async function dbSetListMemberUsername(listId: string, userId: string, username: string) {
  if (!database || !listId || !userId || !username) {
    return
  }

  try {
    await update(ref(database), {
      [`lists/${listId}/memberProfiles/${userId}/username`]: username
    })
  } catch (error) {
    printError(error, "Failed to set list member username: ")
  }
}

export async function dbGetUsernameClaim(usernameKey: string) {
  return getPathSnapshot(`usernames/${usernameKey}`)
}

export async function dbClaimUsername(usernameKey: string, userId: string) {
  const claimResult = await runTransactionAtPath(`usernames/${usernameKey}`, currentValue => {
    if (currentValue === null || currentValue === userId) {
      return userId
    }

    return
  })

  return Boolean(claimResult?.committed)
}

export async function dbReleaseUsername(usernameKey: string, userId: string) {
  const releaseResult = await runTransactionAtPath(`usernames/${usernameKey}`, currentValue => {
    if (currentValue === userId) {
      return null
    }

    return currentValue
  })

  if (releaseResult?.committed && releaseResult.snapshot.val() === null) {
    if (!database) {
      return
    }

    try {
      await remove(ref(database, `usernames/${usernameKey}`))
    } catch (error) {
      printError(error, "Failed to release username: ")
    }
  }
}

export function dbSubscribeToUserProfile(userId: string, callback: (snapshot: DataSnapshot) => void, onError?: (error: Error) => void) {
  return subscribeToPath(`users/${userId}`, callback, onError)
}

export async function dbUpdateUserProfile(userId: string, updates: Record<string, unknown>) {
  if (!database || !userId) {
    return
  }

  const scopedUpdates = Object.entries(updates).reduce<Record<string, unknown>>((nextUpdates, [key, value]) => {
    nextUpdates[`users/${userId}/${key}`] = value
    return nextUpdates
  }, {})

  try {
    await update(ref(database), scopedUpdates)
  } catch (error) {
    printError(error, "Failed to update user profile: ")
    throw error
  }
}

export async function dbSaveEditedItem(listId: string, itemId: string, newItemName: string, userId: string) {
  if (!database || !itemId || !userId || !listId) {
    return
  }

  const trimmedName = trimAndCollapseSpaces(newItemName)

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
    ...createListAuditUpdates(listId, userId, now)
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
    ...createListAuditUpdates(listId, userId)
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function toShoppingItem(id: string, value: unknown, fallbackOrder: string): ShoppingItem | null {
  if (!isRecord(value)) return null

  const itemName = value.itemName
  if (typeof itemName !== "string") return null

  const sortOrder =
    typeof value.sortOrder === "string"
      ? value.sortOrder
      : typeof value.createdAt === "number"
        ? `${value.createdAt}`
        : typeof value.updatedAt === "number"
          ? `${value.updatedAt}`
          : fallbackOrder

  return {
    id,
    itemName,
    itemHighlighted: typeof value.itemHighlighted === "boolean" ? value.itemHighlighted : false,
    lastEditedByUid: typeof value.lastEditedByUid === "string" ? value.lastEditedByUid : "",
    createdAt: typeof value.createdAt === "number" ? value.createdAt : undefined,
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : undefined,
    sortOrder
  }
}

function readItemsFromSnapshot(snapshot: DataSnapshot): ShoppingItem[] {
  const rawData = snapshot.val()

  if (!isRecord(rawData)) return []

  const nextItems: ShoppingItem[] = []

  for (const [id, value] of Object.entries(rawData)) {
    const parsed = toShoppingItem(id, value, nextItems.length.toString())

    if (parsed) {
      nextItems.push(parsed)
    }
  }

  return nextItems.sort((left, right) => {
    const leftOrder = left.sortOrder ?? ""
    const rightOrder = right.sortOrder ?? ""

    return leftOrder.localeCompare(rightOrder)
  })
}
