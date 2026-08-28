export type ShoppingItem = {
  id: string
  itemName: string
  itemHighlighted: boolean
  lastEditedByUid: string
  createdAt?: number
  updatedAt?: number
  sortOrder?: string
}

export type StoredList = {
  listId: string
  listName: string
  customName?: string
  ownerUid: string
  lastEditedByUid: string
  createdAt?: number
  updatedAt?: number
}

export type ListMember = {
  uid: string
  username: string
}
