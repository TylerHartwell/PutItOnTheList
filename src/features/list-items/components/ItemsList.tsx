import { type RefObject } from "react"
import { closestCenter, DndContext, PointerSensor, type DragEndEvent, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import type { ShoppingItem } from "@/shared/types/shopping"
import { vibrate } from "@/shared/utils/vibrate"
import { SortableItemRow } from "./SortableItemRow"

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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1
      }
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    onMoveItem(String(active.id), String(over.id))
    vibrate()
  }

  if (items.length === 0) {
    return <p className="my-2.5 text-xl">No items here...yet</p>
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <ul className="my-2.5 flex list-none flex-col gap-2 p-0" data-list-root>
          {items.map(item => (
            <SortableItemRow
              key={item.id}
              item={item}
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
      </SortableContext>
    </DndContext>
  )
}
