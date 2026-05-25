import { useState } from "react"

import { SettingsButton } from "./SettingsButton"

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
  const [isHeaderElevated, setIsHeaderElevated] = useState(false)

  return (
    <div
      className="fixed inset-0 z-20 flex items-start justify-center bg-black/45 px-2.5 py-5"
      onClick={event => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-130 overflow-hidden rounded-xl border-2 border-[#252525] bg-[#fffdf8] shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
        <div
          className="relative max-h-[calc(100vh-40px)] overflow-y-auto px-3.5 pb-3.5"
          onScroll={event => {
            setIsHeaderElevated(event.currentTarget.scrollTop > 0)
          }}
        >
          <div
            className={`sticky top-0 z-10 -mx-3.5 flex items-center justify-between gap-2.5 bg-[#fffdf8] px-3.5 py-3.5 ${isHeaderElevated ? "shadow-[0_6px_12px_rgba(0,0,0,0.12)]" : "shadow-none"}`}
          >
            <h2 className="text-xl">List Settings</h2>
            <SettingsButton className="size-10" onClick={onClose} aria-label="Close settings">
              X
            </SettingsButton>
          </div>

          <section className=" border-t border-[#d8d8d8] pt-3">
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
              <SettingsButton onClick={() => void onCopyList()}>Copy</SettingsButton>
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
              <SettingsButton onClick={onSaveCurrentListName}>Save</SettingsButton>
            </div>

            <div className="mt-2.5 flex justify-center">
              <SettingsButton className=" bg-[#8f2a2a] hover:text-[#8f2a2a] active:text-[#8f2a2a] active:outline-[#8f2a2a] " onClick={onLeaveList}>
                Leave List
              </SettingsButton>
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
              <SettingsButton onClick={onCreateList}>Create</SettingsButton>
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
              <SettingsButton onClick={() => void onJoinList()}>Join</SettingsButton>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
