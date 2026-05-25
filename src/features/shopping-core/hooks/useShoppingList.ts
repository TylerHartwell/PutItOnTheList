import { useItemsConcern } from "./useItemsConcern"
import { useListsConcern } from "./useListsConcern"
import { useSettingsConcern } from "./useSettingsConcern"

export function useShoppingList() {
  const lists = useListsConcern()
  const items = useItemsConcern(lists.currentListId)
  const settings = useSettingsConcern({
    currentListId: lists.currentListId,
    listIds: lists.listIds,
    listNames: lists.listNames,
    setCurrentListId: lists.setCurrentListId,
    persistAndSetLists: lists.persistAndSetLists,
    makeListIdFirst: lists.makeListIdFirst
  })

  return {
    lists: {
      listIds: lists.listIds,
      listNames: lists.listNames,
      currentListId: lists.currentListId,
      makeListIdFirst: lists.makeListIdFirst
    },
    items,
    settings
  }
}
