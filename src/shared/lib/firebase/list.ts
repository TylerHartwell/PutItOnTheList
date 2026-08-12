import { ref, update } from "firebase/database"
import { database } from "./config"
import { createListAuditUpdates, getTimestamp, printError } from "./shared"
import { trimAndCollapseSpaces } from "@/shared/utils/text"

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
  const reservationResult = await (
    await import("./shared")
  ).runTransactionAtPath(`lists/${listId}`, currentValue => {
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
