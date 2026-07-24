import { ShoppingItem } from "@/shared/types/shopping"
import { vibrate } from "@/shared/utils/vibrate"
import { useSortable } from "@dnd-kit/sortable"
import { Check, GripVertical, X } from "lucide-react"
import { RefObject } from "react"
import { CSS } from "@dnd-kit/utilities"

type SortableItemRowProps = {
  item: ShoppingItem
  editingItemId: string | null
  editingItemText: string
  editInputRef: RefObject<HTMLInputElement | null>
  onDeleteItem: (itemId: string) => void
  onStartEditItem: (item: ShoppingItem) => void
  onEditingItemTextChange: (value: string) => void
  onSaveEditedItem: () => void
  onToggleHighlight: (item: ShoppingItem) => void
}

export function SortableItemRow({
  item,
  editingItemId,
  editingItemText,
  editInputRef,
  onDeleteItem,
  onStartEditItem,
  onEditingItemTextChange,
  onSaveEditedItem,
  onToggleHighlight
}: SortableItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isActive } = useSortable({ id: item.id })

  function handleToggleHighlight() {
    onToggleHighlight(item)
    vibrate()
  }

  function handleEditItem() {
    onStartEditItem(item)
    vibrate()
  }

  function handleSaveEditedItem() {
    onSaveEditedItem()
    vibrate()
  }

  function handleDeleteItem() {
    onDeleteItem(item.id)
    vibrate()
  }

  return (
    <li
      ref={setNodeRef}
      data-item-id={item.id}
      className={`flex items-center justify-start rounded-md border-2 border-transparent py-0 shadow-[0_1px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_0_7px_rgba(0,0,0,0.8)] ${
        item.itemHighlighted ? "bg-[#fffdc1]" : "bg-[#fffdf8]"
      } ${isActive ? "scale-[1.02] bg-[rgba(255,255,255,0.9)] shadow-[0_15px_15px_rgba(34,33,81,0.25)]" : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: isActive ? "none" : "pan-y",
        zIndex: isActive ? 20 : undefined
      }}
    >
      <button
        type="button"
        className={`bg-transparent p-2 text-center font-black leading-none text-[#fc7371] active:scale-130 cursor-pointer ${isActive ? "pointer-events-none" : ""}`}
        onClick={handleDeleteItem}
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
          onBlur={handleSaveEditedItem}
          onKeyDown={event => {
            if (event.key === "Enter") {
              event.preventDefault()
              handleSaveEditedItem()
            }
          }}
        />
      ) : (
        <button
          type="button"
          className={`min-w-0 flex-1 bg-transparent px-1.5 py-2 text-left text-xl cursor-auto wrap-break-word ${item.itemHighlighted ? "opacity-50" : ""}`}
          onClick={handleEditItem}
          aria-label={`Edit ${item.itemName}`}
        >
          <span className="block">{item.itemName}</span>
        </button>
      )}

      <button
        type="button"
        className="bg-transparent p-2 text-center font-black leading-none active:scale-130 cursor-pointer"
        onClick={handleToggleHighlight}
        aria-label={`Toggle marked state for ${item.itemName}`}
      >
        <Check className="h-6 w-6 text-green-600 hover:scale-120" strokeWidth={5} />
      </button>

      <button
        type="button"
        className="touch-none cursor-grab bg-transparent p-2 text-center font-black leading-none text-[#fc7371] active:scale-130"
        aria-label={`Reorder ${item.itemName}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </li>
  )
}
