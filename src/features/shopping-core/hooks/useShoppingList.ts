import { useItemsConcern } from "./useItemsConcern"
import { useUserLists } from "./useUserLists"
import { useSettingsConcern } from "./useSettingsConcern"

export function useShoppingList(userId: string, activeUsername: string) {
  const userLists = useUserLists(userId, activeUsername)
  const items = useItemsConcern(userId, userLists.currentListId)
  const settings = useSettingsConcern({
    userLists
  })

  return {
    lists: {
      storedLists: userLists.storedLists,
      currentListId: userLists.currentListId,
      currentListLastEditedByUsername: userLists.currentListLastEditedByUsername,
      makeListIdFirst: userLists.makeListIdFirst,
      isLoading: userLists.isLoading
    },
    items,
    settings
  }
}
