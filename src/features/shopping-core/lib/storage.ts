const LIST_IDS_KEY = "list-ids"
const LIST_NAMES_KEY = "list-names"

export function parseListIds(raw: string | null): string[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []
  } catch {
    return []
  }
}

export function parseListNames(raw: string | null): Record<string, string> {
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export function loadSavedLists() {
  const savedListIds = parseListIds(localStorage.getItem(LIST_IDS_KEY))
  const savedListNames = parseListNames(localStorage.getItem(LIST_NAMES_KEY))
  const seededListIds = savedListIds.length > 0 ? savedListIds : [String(Date.now())]

  const prunedListNames: Record<string, string> = {}
  for (const listId of seededListIds) {
    if (savedListNames[listId]) {
      prunedListNames[listId] = savedListNames[listId]
    }
  }

  return { seededListIds, prunedListNames }
}

export function persistLists(nextListIds: string[], nextListNames: Record<string, string>) {
  localStorage.setItem(LIST_IDS_KEY, JSON.stringify(nextListIds))
  localStorage.setItem(LIST_NAMES_KEY, JSON.stringify(nextListNames))
}