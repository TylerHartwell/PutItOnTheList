export type ShoppingItem = {
  id: string
  itemName: string
  itemHighlighted: boolean
  lastEditedBy: string
}

export type StoredList = {
  listId: string
  listName: string
  ownerUid: string
  lastEditedBy: string
}

export type ListMember = {
  uid: string
  username: string
}
