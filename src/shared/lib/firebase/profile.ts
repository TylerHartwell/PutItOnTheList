import { remove, ref, update } from "firebase/database"
import { database } from "./config"
import { getPathSnapshot, printError, runTransactionAtPath, subscribeToPath } from "./shared"
import { DataSnapshot } from "firebase/database"

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

export async function dbGetUserListNicknames(userId: string) {
  const snapshot = await getPathSnapshot(`users/${userId}/listNicknames`)
  if (!snapshot || !snapshot.exists()) {
    return {} as Record<string, string>
  }

  const nicknames = snapshot.val() as Record<string, unknown>
  return Object.entries(nicknames).reduce<Record<string, string>>((result, [listId, value]) => {
    if (typeof value === "string" && value.length > 0) {
      result[listId] = value
    }

    return result
  }, {})
}

export async function dbSetUserListNickname(userId: string, listId: string, nickname: string) {
  if (!database || !userId || !listId) {
    return
  }

  try {
    await update(ref(database), {
      [`users/${userId}/listNicknames/${listId}`]: nickname || null
    })
  } catch (error) {
    printError(error, "Failed to set list nickname: ")
    throw error
  }
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

export async function dbGetUserProfile(userId: string) {
  return getPathSnapshot(`users/${userId}`)
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
