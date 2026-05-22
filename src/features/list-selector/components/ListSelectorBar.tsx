import { Settings } from "lucide-react"

type ListSelectorBarProps = {
  listIds: string[]
  listNames: Record<string, string>
  currentListId: string
  onChangeList: (listId: string) => void
  onOpenSettings: () => void
}

export function ListSelectorBar({ listIds, listNames, currentListId, onChangeList, onOpenSettings }: ListSelectorBarProps) {
  return (
    <div className="mx-auto my-0 flex w-full items-center justify-center gap-1 text-sm">
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
        {listIds.map(listId => (
          <option key={listId} value={listId}>
            {listNames[listId] || listId}
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
  )
}
