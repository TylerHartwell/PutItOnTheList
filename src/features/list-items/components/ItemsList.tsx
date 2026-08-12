import { DragDropProvider, KeyboardSensor, PointerSensor, type DragEndEvent } from "@dnd-kit/react"
import { PointerActivationConstraints } from "@dnd-kit/dom"
import { isSortable } from "@dnd-kit/react/sortable"
import { vibrate } from "@/shared/utils/vibrate"
import { SortableItemRow } from "./SortableItemRow"
import type { ItemsListProps } from "../types"

const dragSensors = [
  PointerSensor.configure({
    activationConstraints(event, source) {
      if (event.pointerType === "touch") {
        return [new PointerActivationConstraints.Delay({ value: 100, tolerance: 5 })]
      }

      const defaultActivationConstraints = PointerSensor.defaults.activationConstraints

      if (typeof defaultActivationConstraints === "function") {
        return defaultActivationConstraints(event, source)
      }

      return defaultActivationConstraints
    }
  }),
  KeyboardSensor
]

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
  function handleDragEnd(event: DragEndEvent) {
    const { operation, canceled } = event
    const { source } = operation

    if (canceled || !isSortable(source)) {
      return
    }

    const { initialIndex, index } = source

    if (typeof initialIndex !== "number" || typeof index !== "number" || initialIndex === index) {
      return
    }

    const sourceItem = items[initialIndex]
    const targetItem = items[index]

    if (!sourceItem || !targetItem || sourceItem.id === targetItem.id) {
      return
    }

    onMoveItem(sourceItem.id, targetItem.id)
    vibrate()
  }

  if (items.length === 0) {
    return <p className="my-2.5 text-xl">No items here...yet</p>
  }

  return (
    <DragDropProvider sensors={dragSensors} onDragEnd={handleDragEnd}>
      <ul className="my-2.5 flex list-none flex-col gap-2 p-0" data-list-root>
        {items.map((item, index) => (
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
