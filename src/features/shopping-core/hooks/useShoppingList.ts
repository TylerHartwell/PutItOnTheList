import { useItemsConcern } from "./useItemsConcern"
import { useListsConcern } from "./useListsConcern"
import { useSettingsConcern } from "./useSettingsConcern"

export function useShoppingList() {
  const listsConcern = useListsConcern()
  const items = useItemsConcern(listsConcern.currentListId)
  const settings = useSettingsConcern({
    currentListId: listsConcern.currentListId,
    storedLists: listsConcern.storedLists,
    setCurrentListId: listsConcern.setCurrentListId,
    handleListsChange: listsConcern.handleListsChange
  })

  return {
    lists: {
      storedLists: listsConcern.storedLists,
      currentListId: listsConcern.currentListId,
      makeListIdFirst: listsConcern.makeListIdFirst
    },
    items,
    settings
  }
}
