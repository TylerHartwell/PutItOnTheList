import React from "react"

export interface BulkActionButtonProps {
  label: string
  onClick: () => void
  borderColor: string
  textColor: string
  activeBg: string
  activeText: string
  extraClassName?: string
}

export function BulkActionButton({ label, onClick, borderColor, textColor, activeBg, activeText, extraClassName }: BulkActionButtonProps) {
  return (
    <button
      type="button"
      className={`m-0.5 rounded-md border-3 border-double bg-[#252525] px-2 py-1.5 font-bold ${borderColor} ${textColor} ${extraClassName ?? ""} active:${activeBg} active:${activeText}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
