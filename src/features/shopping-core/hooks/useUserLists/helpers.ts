import { trimAndCollapseSpaces } from "@/shared/utils/text"

export const MAX_CREATE_LIST_ATTEMPTS = 10

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

export function buildListRecord(userId: string, activeUsername: string, listName: string) {
  const trimmedName = trimAndCollapseSpaces(listName)

  return {
    owner: userId,
    listName: trimmedName,
    lastEditedByUid: userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    members: {
      [userId]: true
    },
    memberProfiles: {
      [userId]: {
        username: activeUsername
      }
    }
  }
}
