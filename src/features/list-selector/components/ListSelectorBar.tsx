type ListSelectorBarProps = {
  listIds: string[]
  listNames: Record<string, string>
  currentListId: string
  onChangeList: (listId: string) => void
  onOpenSettings: () => void
}

export function ListSelectorBar({ listIds, listNames, currentListId, onChangeList, onOpenSettings }: ListSelectorBarProps) {
  return (
    <div className="mx-auto my-0 flex w-full items-center justify-center gap-1.5">
      <label htmlFor="list-selector" className="mx-0.5 min-w-12 text-center text-sm">
        Current:
      </label>
      <select
        id="list-selector"
        className="min-w-0 flex-1 rounded-md border-2 border-transparent bg-[#dce1eb] p-1.5 outline-none focus:border-black"
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
        className="h-8 min-w-24 rounded-md border border-transparent bg-[#252525] px-3 text-[#fdfdfd] focus:border-black focus:outline-none"
        onClick={onOpenSettings}
      >
        Settings
      </button>
    </div>
  )
}