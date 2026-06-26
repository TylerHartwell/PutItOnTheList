const LISTS_KEY = "lists"
const LEGACY_LIST_IDS_KEY = "list-ids"
const LEGACY_GROUP_IDS_KEY = "group-ids"

export type LegacyLocalList = {
  listId: string
  listName: string
}

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

function removeObsoleteLegacyStorageKeys(storage: Storage) {
  storage.removeItem(LEGACY_GROUP_IDS_KEY)
}

function safeParseStringArray(raw: string | null): string[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)

    return Array.isArray(parsed) ? parsed.filter(value => typeof value === "string") : []
  } catch {
    return []
  }
}

function safeParseStoredListIds(raw: string | null): string[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    const listIds: string[] = []

    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        continue
      }

      const maybeListId = (entry as { listId?: unknown }).listId
      if (typeof maybeListId === "string" && maybeListId.trim().length > 0) {
        listIds.push(maybeListId)
      }
    }

    return listIds
  } catch {
    return []
  }
}

function safeParseStoredLists(raw: string | null): LegacyLocalList[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    const lists: LegacyLocalList[] = []

    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        continue
      }

      const maybeListId = (entry as { listId?: unknown }).listId
      const maybeListName = (entry as { listName?: unknown }).listName

      if (typeof maybeListId !== "string") {
        continue
      }

      const trimmedListId = maybeListId.trim()
      if (!trimmedListId) {
        continue
      }

      lists.push({
        listId: trimmedListId,
        listName: typeof maybeListName === "string" ? maybeListName.trim() : ""
      })
    }

    return lists
  } catch {
    return []
  }
}

export function loadLegacyListIdsForAuthMigration() {
  const storage = getLocalStorage()
  if (!storage) {
    return []
  }

  removeObsoleteLegacyStorageKeys(storage)

  const storedListIds = safeParseStoredListIds(storage.getItem(LISTS_KEY))
  const legacyListIds = safeParseStringArray(storage.getItem(LEGACY_LIST_IDS_KEY))

  return Array.from(new Set([...storedListIds, ...legacyListIds]))
}

export function loadLegacyListMetadataForAuthMigration() {
  const storage = getLocalStorage()
  if (!storage) {
    return {
      listIds: [] as string[],
      listNamesById: {} as Record<string, string>,
      localStorageLists: [] as LegacyLocalList[]
    }
  }

  removeObsoleteLegacyStorageKeys(storage)

  const storedLists = safeParseStoredLists(storage.getItem(LISTS_KEY))
  const legacyListIds = safeParseStringArray(storage.getItem(LEGACY_LIST_IDS_KEY))

  const allListIds = Array.from(new Set([...storedLists.map(list => list.listId), ...legacyListIds]))
  const listNamesById: Record<string, string> = {}

  for (const list of storedLists) {
    if (!listNamesById[list.listId] && list.listName) {
      listNamesById[list.listId] = list.listName
    }
  }

  return {
    listIds: allListIds,
    listNamesById,
    localStorageLists: storedLists
  }
}

export function removeMigratedLegacyLocalStorageLists(migratedListIds: string[]) {
  if (migratedListIds.length === 0) {
    return
  }

  const storage = getLocalStorage()
  if (!storage) {
    return
  }

  removeObsoleteLegacyStorageKeys(storage)

  const migratedListIdSet = new Set(migratedListIds.map(listId => listId.trim()).filter(Boolean))
  if (migratedListIdSet.size === 0) {
    return
  }

  const currentStoredLists = safeParseStoredLists(storage.getItem(LISTS_KEY))
  if (currentStoredLists.length === 0) {
    storage.removeItem(LISTS_KEY)
    return
  }

  const nextStoredLists = currentStoredLists.filter(list => !migratedListIdSet.has(list.listId))

  if (nextStoredLists.length === 0) {
    storage.removeItem(LISTS_KEY)
    return
  }

  storage.setItem(LISTS_KEY, JSON.stringify(nextStoredLists))
}
