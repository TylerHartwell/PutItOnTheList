import { type User } from "firebase/auth"
import { useItemsConcern } from "./useItemsConcern"
import { useUserLists } from "./useUserLists"
import { useSettingsConcern } from "./useSettingsConcern"

export function useShoppingList(user: User | null, activeUsername: string) {
  const userLists = useUserLists(user, activeUsername)
  const items = useItemsConcern(user, userLists.currentListId)
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
