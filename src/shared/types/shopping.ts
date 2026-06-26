export type ShoppingItem = {
  id: string
  itemName: string
  itemHighlighted: boolean
  lastEditedByUid: string
}

export type StoredList = {
  listId: string
  listName: string
  ownerUid: string
  lastEditedByUid: string
}

export type ListMember = {
  uid: string
  username: string
}
