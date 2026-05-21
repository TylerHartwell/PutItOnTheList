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
    <div className="mt-6 flex flex-wrap gap-1">
      <BulkActionButton
        label="X Marked"
        onClick={onDeleteMarkedItems}
        borderColor="border-[#fc7371]"
        textColor="text-[#fffdc1]"
        activeBg="bg-[#ec6f09]"
        activeText="text-black"
      />
      <BulkActionButton
        label="X All"
        onClick={onDeleteAllItems}
        borderColor="border-[#fc7371]"
        textColor="text-[#fc7371]"
        activeBg="bg-[#fc7371]"
        activeText="text-black"
        extraClassName="mr-auto"
      />
      <BulkActionButton
        label="Unmark All"
        onClick={onUnmarkAll}
        borderColor="border-[#fdfdfd]"
        textColor="text-[#fdfdfd]"
        activeBg="bg-[#fdfdfd]"
        activeText="text-black"
      />
      <BulkActionButton
        label="Mark All"
        onClick={onMarkAll}
        borderColor="border-[#fffdc1]"
        textColor="text-[#fffdc1]"
        activeBg="bg-[#fffdc1]"
        activeText="text-black"
      />
    </div>
  )
}

import { BulkActionButton } from "./BulkActionButton"
