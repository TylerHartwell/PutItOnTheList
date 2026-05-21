import type { RefObject } from "react"
import type { ShoppingItem } from "@/shared/types/shopping"

type ItemsListProps = {
  items: ShoppingItem[]
  editingItemId: string | null
  editingItemText: string
  editInputRef: RefObject<HTMLInputElement | null>
  onDeleteItem: (itemId: string) => void
  onStartEditItem: (item: ShoppingItem) => void
  onEditingItemTextChange: (value: string) => void
  onSaveEditedItem: () => void
  onToggleHighlight: (item: ShoppingItem) => void
}

export function ItemsList({
  items,
  editingItemId,
  editingItemText,
  editInputRef,
  onDeleteItem,
  onStartEditItem,
  onEditingItemTextChange,
  onSaveEditedItem,
  onToggleHighlight
}: ItemsListProps) {
  if (items.length === 0) {
    return <p className="my-2.5 text-xl">No items here...yet</p>
  }

  return (
    <ul className="my-2.5 flex list-none flex-col gap-2 p-0">
      {items.map(item => (
        <li
          key={item.id}
          className={`m-0 flex items-center justify-start overflow-hidden rounded-md border-2 border-transparent bg-[#fffdf8] px-2.5 py-0 shadow-[0_1px_4px_rgba(0,0,0,0.2)] ${
            item.itemHighlighted ? "bg-[#fffdc1]" : ""
          }`}
        >
          <button
            type="button"
            className="-ml-2 min-h-8 min-w-8 bg-transparent p-0 text-center font-black leading-none text-[#fc7371] active:scale-150"
            onClick={() => onDeleteItem(item.id)}
            aria-label={`Delete ${item.itemName}`}
          >
            X
          </button>

          {editingItemId === item.id ? (
            <input
              ref={editInputRef}
              className="min-w-0 flex-1 bg-transparent px-1.5 py-2 text-xl outline-none"
              value={editingItemText}
              onChange={event => onEditingItemTextChange(event.target.value)}
              onBlur={onSaveEditedItem}
              onKeyDown={event => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  onSaveEditedItem()
                }
              }}
            />
          ) : (
            <button
              type="button"
              className={`min-w-0 flex-1 bg-transparent px-1.5 py-2 text-left text-xl wrap-break-word ${item.itemHighlighted ? "opacity-50" : ""}`}
              onClick={() => onStartEditItem(item)}
            >
              {item.itemName}
            </button>
          )}

          <button
            type="button"
            className="-mr-2 ml-auto min-h-8 min-w-10 bg-transparent p-0 text-center font-black leading-none active:scale-150"
            onClick={() => onToggleHighlight(item)}
            aria-label={`Toggle marked state for ${item.itemName}`}
          >
            OK
          </button>
        </li>
      ))}
    </ul>
  )
}
