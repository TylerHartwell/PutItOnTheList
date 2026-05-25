import { useEffect, useState } from "react"
import { loadSavedLists, persistLists } from "../lib/storage"

export type ListNames = Record<string, string>

export function useListsConcern() {
  const [listIds, setListIds] = useState<string[]>([])
  const [listNames, setListNames] = useState<ListNames>({})
  const [currentListId, setCurrentListId] = useState("")

  useEffect(() => {
    let isMounted = true
    const { seededListIds, prunedListNames } = loadSavedLists()

    persistLists(seededListIds, prunedListNames)

    queueMicrotask(() => {
      if (!isMounted) {
        return
      }

      setListIds(seededListIds)
      setListNames(prunedListNames)
      setCurrentListId(previousListId => (seededListIds.includes(previousListId) ? previousListId : (seededListIds[0] ?? "")))
    })

    return () => {
      isMounted = false
    }
  }, [])

  function persistAndSetLists(nextListIds: string[], nextListNames: ListNames) {
    persistLists(nextListIds, nextListNames)
    setListIds(nextListIds)
    setListNames(nextListNames)
  }

  function makeListIdFirst(listId: string) {
    const nextListIds = [listId, ...listIds.filter(id => id !== listId)]
    const nextNames: ListNames = {}
    for (const id of nextListIds) {
      if (listNames[id]) {
        nextNames[id] = listNames[id]
      }
    }

    persistAndSetLists(nextListIds, nextNames)
    setCurrentListId(listId)
  }

  return {
    listIds,
    listNames,
    currentListId,
    setCurrentListId,
    persistAndSetLists,
    makeListIdFirst
  }
}

export type ListsConcernState = ReturnType<typeof useListsConcern>
