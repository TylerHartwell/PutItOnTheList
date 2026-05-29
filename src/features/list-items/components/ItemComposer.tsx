type ItemComposerProps = {
  itemEntry: string
  onItemEntryChange: (value: string) => void
  onAddItem: () => void
}

export function ItemComposer({ itemEntry, onItemEntryChange, onAddItem }: ItemComposerProps) {
  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    onAddItem()
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="itemEntry"
        className="my-2.5 w-full rounded-md border-2 border-transparent bg-[#dce1eb] p-3.5 text-center text-xl focus:border-black focus:shadow-[0_0_5px_#252525] focus:outline-none"
        placeholder="Enter Item"
        autoComplete="off"
        value={itemEntry}
        onChange={event => onItemEntryChange(event.target.value)}
      />

      <button
        type="submit"
        className="w-full rounded-md bg-[#ffd9009a] p-3.5 text-center text-xl transition-all duration-150  hover:bg-[#252525] hover:text-[#fdfdfd] active:translate-y-0.5 active:scale-[0.99] active:bg-[#252525] active:text-[#fdfdfd]"
      >
        Put It On The List
      </button>
    </form>
  )
}
