"use client"

import { useCallback, type Dispatch, type SetStateAction } from "react"
import { database } from "@/shared/lib/firebase/config"
import { dbAddUserListReference, dbDeleteListById, dbReserveListRecord } from "@/shared/lib/firebase/functions"
import { buildListRecord, generateListId, MAX_CREATE_LIST_ATTEMPTS } from "./helpers"

type BooleanRef = { current: boolean }

type UseListCreationParams = {
  userId: string
  activeUsername: string
  setCurrentListId: Dispatch<SetStateAction<string>>
  isBootstrappingDefaultListRef: BooleanRef
}

export function useListCreation({ userId, activeUsername, setCurrentListId, isBootstrappingDefaultListRef }: UseListCreationParams) {
  const createList = useCallback(
    async (listName: string) => {
      if (!database || !userId) {
        return
      }

      const listRecord = buildListRecord(userId, activeUsername, listName)
      let newListId = ""

      for (let attempt = 0; attempt < MAX_CREATE_LIST_ATTEMPTS; attempt += 1) {
        const candidateListId = generateListId()
        const reservationResult = await dbReserveListRecord(candidateListId, listRecord)

        if (reservationResult) {
          newListId = candidateListId
          break
        }
      }

      if (!newListId) {
        throw new Error("Could not reserve a unique list ID. Please try again.")
      }

      try {
        await dbAddUserListReference(userId, newListId)
      } catch (error) {
        await dbDeleteListById(newListId)
        throw error
      }

      setCurrentListId(newListId)
    },
    [userId, activeUsername, setCurrentListId]
  )

  const ensureDefaultList = useCallback(async () => {
    if (isBootstrappingDefaultListRef.current) {
      return
    }

    isBootstrappingDefaultListRef.current = true

    try {
      await createList("")
    } finally {
      isBootstrappingDefaultListRef.current = false
    }
  }, [createList, isBootstrappingDefaultListRef])

  return {
    createList,
    ensureDefaultList
  }
}
