const LISTS_KEY = "lists"
const LEGACY_LIST_IDS_KEY = "list-ids"

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

export function loadLegacyListIdsForAuthMigration() {
  const storage = getLocalStorage()
  if (!storage) {
    return []
  }

  const storedListIds = safeParseStoredListIds(storage.getItem(LISTS_KEY))
  const legacyListIds = safeParseStringArray(storage.getItem(LEGACY_LIST_IDS_KEY))

  return Array.from(new Set([...storedListIds, ...legacyListIds]))
}
