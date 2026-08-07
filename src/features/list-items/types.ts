import type { RefObject } from "react"
import type { ShoppingItem } from "@/shared/types/shopping"

type ItemEditingProps = {
  editingItemId: string | null
  editingItemText: string
  editInputRef: RefObject<HTMLInputElement | null>
  onStartEditItem: (item: ShoppingItem) => void
  onEditingItemTextChange: (value: string) => void
  onSaveEditedItem: () => void
}

type ItemActionProps = {
  onDeleteItem: (itemId: string) => void
  onToggleHighlight: (item: ShoppingItem) => void
}

export type ItemsListProps = ItemEditingProps &
  ItemActionProps & {
    items: ShoppingItem[]
    onMoveItem: (itemId: string, targetItemId: string) => void
  }

export type SortableItemRowProps = ItemEditingProps &
  ItemActionProps & {
    item: ShoppingItem
    index: number
  }
