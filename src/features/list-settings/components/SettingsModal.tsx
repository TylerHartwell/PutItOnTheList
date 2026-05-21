type SettingsModalProps = {
  currentListId: string
  currentListNameInput: string
  newListNameInput: string
  joinListIdInput: string
  onClose: () => void
  onCopyList: () => Promise<void>
  onCurrentListNameChange: (value: string) => void
  onSaveCurrentListName: () => void
  onLeaveList: () => void
  onNewListNameChange: (value: string) => void
  onCreateList: () => void
  onJoinListIdChange: (value: string) => void
  onJoinList: () => Promise<void>
}

export function SettingsModal({
  currentListId,
  currentListNameInput,
  newListNameInput,
  joinListIdInput,
  onClose,
  onCopyList,
  onCurrentListNameChange,
  onSaveCurrentListName,
  onLeaveList,
  onNewListNameChange,
  onCreateList,
  onJoinListIdChange,
  onJoinList
}: SettingsModalProps) {
  return (
    <div
      className="fixed inset-0 z-20 flex items-start justify-center bg-black/45 px-2.5 py-5"
      onClick={event => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="max-h-[calc(100vh-40px)] w-full max-w-130 overflow-y-auto rounded-xl border-2 border-[#252525] bg-[#fffdf8] p-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between gap-2.5">
          <h2 className="m-0 text-xl">List Settings</h2>
          <button
            type="button"
            className="min-h-9 min-w-9 rounded-md border border-transparent bg-[#252525] text-[#fdfdfd] focus:border-black focus:outline-none"
            onClick={onClose}
            aria-label="Close settings"
          >
            X
          </button>
        </div>

        <section className="mt-3 border-t border-[#d8d8d8] pt-3">
          <h3 className="mb-2.5 text-base">Current List</h3>
          <label className="mb-1 block text-sm" htmlFor="current-list-id">
            List Number
          </label>
          <div className="flex min-w-0 items-center gap-1.5">
            <input
              id="current-list-id"
              className="m-0 min-w-0 flex-1 rounded-md border-2 border-transparent bg-[#dce1eb] p-2 text-[#626262] outline-none focus:border-black"
              value={currentListId}
              readOnly
            />
            <button
              type="button"
              className="min-h-8 rounded-md border border-transparent bg-[#252525] px-2.5 text-[#fdfdfd] focus:border-black focus:outline-none"
              onClick={() => void onCopyList()}
            >
              Copy
            </button>
          </div>

          <label className="mb-1 mt-2 block text-sm" htmlFor="current-list-name">
            Local List Name
          </label>
          <div className="flex min-w-0 items-center gap-1.5">
            <input
              id="current-list-name"
              className="m-0 min-w-0 flex-1 rounded-md border-2 border-transparent bg-[#dce1eb] p-2 outline-none focus:border-black"
              placeholder="Optional"
              autoComplete="off"
              value={currentListNameInput}
              onChange={event => onCurrentListNameChange(event.target.value)}
              onKeyUp={event => {
                if (event.key === "Enter") {
                  onSaveCurrentListName()
                }
              }}
            />
            <button
              type="button"
              className="min-h-8 rounded-md border border-transparent bg-[#252525] px-2.5 text-[#fdfdfd] focus:border-black focus:outline-none"
              onClick={onSaveCurrentListName}
            >
              Save
            </button>
          </div>

          <div className="mt-2.5 flex justify-center">
            <button
              type="button"
              className="min-h-8 rounded-md border border-transparent bg-[#8f2a2a] px-2.5 text-[#fdfdfd] focus:border-black focus:outline-none"
              onClick={onLeaveList}
            >
              Leave List
            </button>
          </div>
        </section>

        <section className="mt-3 border-t border-[#d8d8d8] pt-3">
          <h3 className="mb-2.5 text-base">Create New List</h3>
          <label className="mb-1 block text-sm" htmlFor="new-list-name">
            Local List Name
          </label>
          <div className="flex min-w-0 items-center gap-1.5">
            <input
              id="new-list-name"
              className="m-0 min-w-0 flex-1 rounded-md border-2 border-transparent bg-[#dce1eb] p-2 outline-none focus:border-black"
              placeholder="Optional"
              autoComplete="off"
              value={newListNameInput}
              onChange={event => onNewListNameChange(event.target.value)}
              onKeyUp={event => {
                if (event.key === "Enter") {
                  onCreateList()
                }
              }}
            />
            <button
              type="button"
              className="min-h-8 rounded-md border border-transparent bg-[#252525] px-2.5 text-[#fdfdfd] focus:border-black focus:outline-none"
              onClick={onCreateList}
            >
              Create
            </button>
          </div>
        </section>

        <section className="mt-3 border-t border-[#d8d8d8] pt-3">
          <h3 className="mb-2.5 text-base">Join Existing List</h3>
          <label className="mb-1 block text-sm" htmlFor="join-list-id">
            List Number
          </label>
          <div className="flex min-w-0 items-center gap-1.5">
            <input
              id="join-list-id"
              className="m-0 min-w-0 flex-1 rounded-md border-2 border-transparent bg-[#dce1eb] p-2 outline-none focus:border-black"
              placeholder="Paste list number"
              autoComplete="off"
              value={joinListIdInput}
              onChange={event => onJoinListIdChange(event.target.value)}
              onKeyUp={event => {
                if (event.key === "Enter") {
                  void onJoinList()
                }
              }}
            />
            <button
              type="button"
              className="min-h-8 rounded-md border border-transparent bg-[#252525] px-2.5 text-[#fdfdfd] focus:border-black focus:outline-none"
              onClick={() => void onJoinList()}
            >
              Join
            </button>
          </div>
        </section>

        <div className="mt-3.5 flex justify-center">
          <button
            type="button"
            className="min-h-8 min-w-20 rounded-md border border-transparent bg-[#252525] px-2.5 text-[#fdfdfd] focus:border-black focus:outline-none"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}