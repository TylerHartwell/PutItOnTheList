import { StoredList } from "@/shared/types/shopping"
import { Settings } from "lucide-react"

type ListSelectorBarProps = {
  storedLists: StoredList[]
  currentListId: string
  currentListLastEditedBy: string
  onChangeList: (listId: string) => void
  onOpenSettings: () => void
}

export function ListSelectorBar({ storedLists, currentListId, currentListLastEditedBy, onChangeList, onOpenSettings }: ListSelectorBarProps) {
  return (
    <div className="mx-auto my-0 w-full">
      <div className="flex items-center justify-center gap-1 text-sm">
        <label htmlFor="list-selector" className=" text-center">
          Current:
        </label>
        <select
          id="list-selector"
          className="min-w-0 flex-1 rounded-md bg-[#dce1eb] py-2 pl-1 pr-4 outline-transparent  focus:outline-black outline-2"
          value={currentListId}
          onChange={event => {
            const nextListId = event.target.value
            if (nextListId) {
              onChangeList(nextListId)
            }
          }}
        >
          {storedLists.map(list => (
            <option key={list.listId} value={list.listId}>
              {list.listName || list.listId}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="inline-flex h-8 items-center justify-center rounded-md border border-transparent bg-[#252525] px-2 text-[#fdfdfd] focus:outline-gray-300 focus:-outline-offset-3 hover:bg-[#fdfdfd] hover:text-[#252525] active:bg-[#fdfdfd] active:text-[#252525] active:border-black active:scale-[0.9]"
          onClick={onOpenSettings}
          aria-label="Open settings"
        >
          <Settings aria-hidden="true" size={18} strokeWidth={2.25} />
        </button>
      </div>
      <p className="mt-1 text-xs text-[#f0e8d8]">List last edited by: {currentListLastEditedBy || "Unknown"}</p>
    </div>
  )
}
