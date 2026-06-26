import { StoredList } from "@/shared/types/shopping"

export const LISTS_KEY = "lists"
const LEGACY_LIST_IDS_KEY = "list-ids"
const LEGACY_LIST_NAMES_KEY = "list-names"

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function saveToLocalStorage<T>(key: string, value: T) {
  const storage = getLocalStorage()

  if (!storage) {
    throw new Error("Local storage is not available")
  }

  storage.setItem(key, JSON.stringify(value))

  return value
}

function safeParseStringArray(raw: string | null): string[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)

    return Array.isArray(parsed) ? parsed.filter(id => typeof id === "string") : []
  } catch {
    return []
  }
}

function safeParseStringRecord(raw: string | null): Record<string, string> {
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw)

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {}
    }

    const filteredRecord: Record<string, string> = {}

    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        filteredRecord[key] = value
      }
    }

    return filteredRecord
  } catch {
    return {}
  }
}

function safeParseStoredLists(raw: string | null): StoredList[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    const validLists: StoredList[] = []

    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        continue
      }

      const maybeListId = (entry as { listId?: unknown }).listId
      const maybeListName = (entry as { listName?: unknown }).listName

      if (typeof maybeListId !== "string") {
        continue
      }

      validLists.push({
        listId: maybeListId,
        listName: typeof maybeListName === "string" ? maybeListName : "",
        ownerUid: typeof (entry as { ownerUid?: unknown }).ownerUid === "string" ? (entry as { ownerUid: string }).ownerUid : "",
        lastEditedBy: typeof (entry as { lastEditedBy?: unknown }).lastEditedBy === "string" ? (entry as { lastEditedBy: string }).lastEditedBy : ""
      })
    }

    return validLists
  } catch {
    return []
  }
}

export function generateListId(): string {
  const alphabet = "0123456789"
  const idLength = 8

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const randomBytes = new Uint8Array(idLength)
    crypto.getRandomValues(randomBytes)

    return Array.from(randomBytes, byte => alphabet[byte % alphabet.length]).join("")
  }

  return Array.from({ length: idLength }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("")
}

function fromLegacyToStoredLists(prunedLegacyListNames: Record<string, string>): StoredList[] {
  return Object.entries(prunedLegacyListNames).map(([listId, listName]) => ({
    listId,
    listName,
    ownerUid: "",
    lastEditedBy: ""
  }))
}

function removeLegacyKeys(storage: Storage) {
  storage.removeItem(LEGACY_LIST_IDS_KEY)
  storage.removeItem(LEGACY_LIST_NAMES_KEY)
}

function migrateLegacyLists(storage: Storage) {
  if (storage.getItem(LISTS_KEY) !== null) {
    removeLegacyKeys(storage)
    return
  }

  const legacyListIds = safeParseStringArray(storage.getItem(LEGACY_LIST_IDS_KEY))
  const legacyListNames = safeParseStringRecord(storage.getItem(LEGACY_LIST_NAMES_KEY))

  const prunedLegacyListNames = pruneLegacyListNames(legacyListIds, legacyListNames)

  const migratedLists = fromLegacyToStoredLists(prunedLegacyListNames)

  saveToLocalStorage(LISTS_KEY, migratedLists)

  removeLegacyKeys(storage)
}

export function loadStorageLists() {
  const storage = getLocalStorage()

  if (!storage) {
    throw new Error("Local storage is not available")
  }

  migrateLegacyLists(storage)

  let storageLists = safeParseStoredLists(storage.getItem(LISTS_KEY) ?? null)

  if (storageLists.length === 0) {
    storageLists = saveToLocalStorage(LISTS_KEY, [{ listId: generateListId(), listName: "", ownerUid: "", lastEditedBy: "" } as StoredList])
  }

  return storageLists
}

//return only names that correspond to valid list ids, in case there are any stray names from previously deleted lists
function pruneLegacyListNames(listIds: string[], listNames: Record<string, string>): Record<string, string> {
  const prunedListNames: Record<string, string> = {}

  for (const listId of listIds) {
    if (listNames[listId]) {
      prunedListNames[listId] = listNames[listId]
    }
  }

  return prunedListNames
}

export function addListToStorage(listIdToJoin: string) {
  const existingListsRaw = localStorage.getItem(LISTS_KEY) ?? null

  const existingLists = safeParseStoredLists(existingListsRaw)

  if (existingLists.some(list => list.listId === listIdToJoin)) {
    return
  }

  const nextLists = [{ listId: listIdToJoin, listName: "", ownerUid: "", lastEditedBy: "" }, ...existingLists]

  saveToLocalStorage(LISTS_KEY, nextLists)
}
