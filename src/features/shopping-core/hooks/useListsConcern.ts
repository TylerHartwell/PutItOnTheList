"use client"

import { useEffect, useState } from "react"
import { LISTS_KEY, loadStorageLists, saveToLocalStorage } from "../utils/storage"
import { StoredList } from "@/shared/types/shopping"

export function useListsConcern() {
  const [storedLists, setStoredLists] = useState<StoredList[]>([])
  const [currentListId, setCurrentListId] = useState("")

  useEffect(() => {
    let isCancelled = false

    Promise.resolve().then(() => {
      if (isCancelled) {
        return
      }

      try {
        const loadedLists = loadStorageLists()

        setStoredLists(loadedLists)
        setCurrentListId(previousListId => {
          if (previousListId && loadedLists.some(list => list.listId === previousListId)) {
            return previousListId
          }

          return loadedLists[0]?.listId ?? ""
        })
      } catch {
        setStoredLists([])
        setCurrentListId("")
      }
    })

    return () => {
      isCancelled = true
    }
  }, [])

  const handleListsChange = (nextLists: StoredList[]) => {
    setStoredLists(nextLists)
    saveToLocalStorage(LISTS_KEY, nextLists)
  }

  function makeListIdFirst(listId: string) {
    const reorderedLists = storedLists.filter(list => list.listId === listId).concat(storedLists.filter(list => list.listId !== listId))

    handleListsChange(reorderedLists)
    setCurrentListId(listId)
  }

  return {
    storedLists,
    currentListId,
    setCurrentListId,
    handleListsChange,
    makeListIdFirst
  }
}
