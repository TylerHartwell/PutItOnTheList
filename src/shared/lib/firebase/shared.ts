import { DataSnapshot, get, onValue, push, ref, runTransaction } from "firebase/database"
import { database } from "./config"
import { trimAndCollapseSpaces } from "@/shared/utils/text"
import { ShoppingItem } from "@/shared/types/shopping"

export function printError(error: unknown, message = "Error:") {
  if (error instanceof Error) {
    console.error(message, error.message)
  } else if (typeof error === "string") {
    console.error(message, error)
  } else {
    console.error(message, "Unknown error.")
  }
}

export function getTimestamp() {
  return Date.now()
}

export function createListAuditUpdates(listId: string, userId: string, now = getTimestamp()): Record<string, unknown> {
  return {
    [`lists/${listId}/lastEditedByUid`]: userId,
    [`lists/${listId}/updatedAt`]: now
  }
}

export function getPathSnapshot(path: string) {
  if (!database || !path) {
    return null
  }

  return get(ref(database, path))
}

export function subscribeToPath(path: string, callback: (snapshot: DataSnapshot) => void, onError?: (error: Error) => void) {
  if (!database || !path) {
    return null
  }

  return onValue(ref(database, path), callback, onError)
}

export function runTransactionAtPath(path: string, transactionUpdate: Parameters<typeof runTransaction>[1]) {
  if (!database || !path) {
    return Promise.resolve(null)
  }

  return runTransaction(ref(database, path), transactionUpdate)
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

export function createItemRecord(itemName: string, userId: string, now: number, sortOrder?: string) {
  return {
    itemName,
    itemHighlighted: false,
    lastEditedByUid: userId,
    createdAt: now,
    updatedAt: now,
    sortOrder: sortOrder ?? generateFractionalIndex(null, null)
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function toShoppingItem(id: string, value: unknown, fallbackOrder: string): ShoppingItem | null {
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

export function readItemsFromSnapshot(snapshot: DataSnapshot): ShoppingItem[] {
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

export function getNewItemId() {
  if (!database) {
    return null
  }

  return push(ref(database, "temp"))
}

export function trimAndCollapseItemName(value: string) {
  return trimAndCollapseSpaces(value)
}
