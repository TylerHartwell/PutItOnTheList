import { useMemo, useState, type RefObject } from "react"
import { DragDropProvider, PointerSensor, type DragEndEvent } from "@dnd-kit/react"
import { PointerActivationConstraints } from "@dnd-kit/dom"
import { useSortable } from "@dnd-kit/react/sortable"
import { arrayMove } from "@dnd-kit/sortable"
import type { ShoppingItem } from "@/shared/types/shopping"
import { Check, GripVertical, X } from "lucide-react"
import { vibrate } from "@/shared/utils/vibrate"

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
  onMoveItem: (itemId: string, targetItemId: string) => void
}

type SortableItemRowProps = {
  item: ShoppingItem
  index: number
  editingItemId: string | null
  editingItemText: string
  editInputRef: RefObject<HTMLInputElement | null>
  onDeleteItem: (itemId: string) => void
  onStartEditItem: (item: ShoppingItem) => void
  onEditingItemTextChange: (value: string) => void
  onSaveEditedItem: () => void
  onToggleHighlight: (item: ShoppingItem) => void
}

function SortableItemRow({
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
      className={`flex items-center justify-start rounded-md border-2 border-transparent py-0 shadow-[0_1px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_0_7px_rgba(0,0,0,0.8)] ${
        item.itemHighlighted ? "bg-[#fffdc1]" : "bg-[#fffdf8]"
      } ${isActive ? "scale-[1.02] bg-[rgba(255,255,255,0.9)] shadow-[0_15px_15px_rgba(34,33,81,0.25)]" : ""}`}
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
        ref={handleRef}
        type="button"
        className="touch-none cursor-grab bg-transparent p-2 text-center font-black leading-none text-[#fc7371] active:scale-130"
        aria-label={`Reorder ${item.itemName}`}
      >
        <GripVertical className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </li>
  )
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
  onToggleHighlight,
  onMoveItem
}: ItemsListProps) {
  const [orderedItemIds, setOrderedItemIds] = useState<string[]>([])

  const orderedItems = useMemo(() => {
    const itemMap = new Map(items.map(item => [item.id, item]))
    const activeIds = orderedItemIds.length > 0 ? orderedItemIds : items.map(item => item.id)
    const orderedIds = activeIds.filter(id => itemMap.has(id))
    const missingIds = items.map(item => item.id).filter(id => !orderedIds.includes(id))

    return [...orderedIds, ...missingIds].map(id => itemMap.get(id)).filter((item): item is ShoppingItem => item != null)
  }, [items, orderedItemIds])

  function handleDragEnd(event: DragEndEvent) {
    if (event.canceled) {
      return
    }

    const sourceId = event.operation.source?.id
    const targetId = event.operation.target?.id

    if (!sourceId || !targetId || String(sourceId) === String(targetId)) {
      return
    }

    const currentIds = orderedItemIds.length > 0 ? orderedItemIds : items.map(item => item.id)
    const oldIndex = currentIds.indexOf(String(sourceId))
    const newIndex = currentIds.indexOf(String(targetId))

    if (oldIndex >= 0 && newIndex >= 0) {
      setOrderedItemIds(arrayMove(currentIds, oldIndex, newIndex))
    }

    onMoveItem(String(sourceId), String(targetId))
    vibrate()
  }

  if (orderedItems.length === 0) {
    return <p className="my-2.5 text-xl">No items here...yet</p>
  }

  return (
    <DragDropProvider
      onDragEnd={handleDragEnd}
      sensors={[
        PointerSensor.configure({
          activationConstraints: [new PointerActivationConstraints.Delay({ value: 0, tolerance: 0 })]
        })
      ]}
    >
      <ul className="my-2.5 flex list-none flex-col gap-2 p-0" data-list-root>
        {orderedItems.map((item, index) => (
          <SortableItemRow
            key={item.id}
            item={item}
            index={index}
            editingItemId={editingItemId}
            editingItemText={editingItemText}
            editInputRef={editInputRef}
            onDeleteItem={onDeleteItem}
            onStartEditItem={onStartEditItem}
            onEditingItemTextChange={onEditingItemTextChange}
            onSaveEditedItem={onSaveEditedItem}
            onToggleHighlight={onToggleHighlight}
          />
        ))}
      </ul>
    </DragDropProvider>
  )
}
