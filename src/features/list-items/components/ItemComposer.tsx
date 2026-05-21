type ItemComposerProps = {
  itemEntry: string
  onItemEntryChange: (value: string) => void
  onAddItem: () => void
}

export function ItemComposer({ itemEntry, onItemEntryChange, onAddItem }: ItemComposerProps) {
  return (
    <>
      <input
        type="text"
        className="my-2.5 w-full rounded-md border-2 border-transparent bg-[#dce1eb] p-3.5 text-center text-xl focus:border-black focus:shadow-[0_0_5px_#252525] focus:outline-none"
        placeholder="Enter Item"
        autoComplete="off"
        value={itemEntry}
        onChange={event => onItemEntryChange(event.target.value)}
        onKeyUp={event => {
          if (event.key === "Enter") {
            onAddItem()
          }
        }}
      />

      <button
        type="button"
        className="w-full rounded-md bg-[#ffd9009a] p-3.5 text-center text-xl active:bg-[#252525] active:text-[#fdfdfd]"
        onClick={onAddItem}
      >
        Put It On The List
      </button>
    </>
  )
}