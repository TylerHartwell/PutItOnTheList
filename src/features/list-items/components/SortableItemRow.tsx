import { cn } from "@/shared/lib/cn"
import { vibrate } from "@/shared/utils/vibrate"
import { useSortable } from "@dnd-kit/react/sortable"
import { Check, GripVertical, X } from "lucide-react"
import type { SortableItemRowProps } from "../types"

export function SortableItemRow({
  item,
  index,
  editingItemId,
  editingItemText,
  editInputRef,
  onDeleteItem,
  onStartEditItem,
  onEditingItemTextChange,
  onSaveEditedItem,
  onToggleHighlight
}: SortableItemRowProps) {
  const { ref, handleRef, isDragging: isActive } = useSortable({ id: item.id, index })

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
      ref={ref}
      data-item-id={item.id}
      className={cn(
        "flex items-center justify-start rounded-md border-2 border-transparent py-0 shadow-[0_1px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_0_7px_rgba(0,0,0,0.8)]",
        item.itemHighlighted ? "bg-[#fffdc1]" : "bg-[#fffdf8]",
        isActive && "scale-[1.02] shadow-[0_15px_15px_rgba(34,33,81,0.25)]"
      )}
      style={{
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
        ref={handleRef}
        className={cn(
          "cursor-grab bg-transparent p-2 text-center font-black leading-none text-[#fc7371] active:scale-130",
          isActive ? "touch-none" : "touch-pan-y"
        )}
        aria-label={`Reorder ${item.itemName}`}
      >
        <GripVertical className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </li>
  )
}
