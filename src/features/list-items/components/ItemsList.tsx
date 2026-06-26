import type { RefObject } from "react"
import type { ShoppingItem } from "@/shared/types/shopping"
import { Check, X } from "lucide-react"

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
          className={`flex items-center justify-start overflow-hidden rounded-md border-2 border-transparent py-0 shadow-[0_1px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_0_7px_rgba(0,0,0,0.8)] ${
            item.itemHighlighted ? "bg-[#fffdc1]" : "bg-[#fffdf8]"
          }`}
        >
          <button
            type="button"
            className="bg-transparent p-2 text-center font-black leading-none text-[#fc7371] active:scale-130 cursor-pointer"
            onClick={() => onDeleteItem(item.id)}
            aria-label={`Delete ${item.itemName}`}
          >
            <X className="h-6 w-6 text-red-600 hover:scale-120" strokeWidth={3} />
          </button>

          {editingItemId === item.id ? (
            <input
              ref={editInputRef}
              className="min-w-0 flex-1 bg-transparent px-1.5 py-2 text-xl outline-none cursor-text"
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
              className={`min-w-0 flex-1 bg-transparent px-1.5 py-2 text-left text-xl cursor-auto wrap-break-word ${item.itemHighlighted ? "opacity-50" : ""}`}
              onClick={() => onStartEditItem(item)}
              aria-label={`Edit ${item.itemName}`}
            >
              <span className="block">{item.itemName}</span>
              {/* <span className="mt-0.5 block text-xs text-[#626262]">Last edited by: {item.lastEditedByUid || "Unknown"}</span> */}
            </button>
          )}

          <button
            type="button"
            className="bg-transparent p-2 text-center font-black leading-none active:scale-130 cursor-pointer"
            onClick={() => onToggleHighlight(item)}
            aria-label={`Toggle marked state for ${item.itemName}`}
          >
            <Check className="h-6 w-6 text-green-600 hover:scale-120" strokeWidth={5} />
          </button>
        </li>
      ))}
    </ul>
  )
}
