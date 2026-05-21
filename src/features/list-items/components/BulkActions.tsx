type BulkActionsProps = {
  hasItems: boolean
  onDeleteMarkedItems: () => void
  onDeleteAllItems: () => void
  onUnmarkAll: () => void
  onMarkAll: () => void
}

export function BulkActions({ hasItems, onDeleteMarkedItems, onDeleteAllItems, onUnmarkAll, onMarkAll }: BulkActionsProps) {
  if (!hasItems) {
    return null
  }

  return (
    <div className="mt-6 flex items-center gap-1">
      <BulkActionButton
        label="X Marked"
        onClick={onDeleteMarkedItems}
        className="border-[#fc7371] text-[#fffdc1] active:bg-[#ec6f09] hover:bg-[#ec6f09] active:text-black"
      />
      <BulkActionButton
        label="X All"
        onClick={onDeleteAllItems}
        className="mr-auto border-[#fc7371] text-[#fc7371] active:bg-[#fc7371] hover:bg-[#fc7371] active:text-black"
      />
      <BulkActionButton
        label="Unmark All"
        onClick={onUnmarkAll}
        className="border-[#fdfdfd] text-[#fdfdfd] active:bg-[#fdfdfd] hover:bg-[#fdfdfd] active:text-black"
      />
      <BulkActionButton
        label="Mark All"
        onClick={onMarkAll}
        className="border-[#fffdc1] text-[#fffdc1] active:bg-[#fffdc1] hover:bg-[#fffdc1] active:text-black"
      />
    </div>
  )
}

import { BulkActionButton } from "./BulkActionButton"
