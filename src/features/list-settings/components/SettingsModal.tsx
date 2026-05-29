import { useEffect, useRef, useState } from "react"

import { SettingsButton } from "./SettingsButton"

type SettingsModalProps = {
  currentListId: string
  currentListNameInput: string
  newListNameInput: string
  joinListIdInput: string
  onClose: () => void
  onCopyList: () => Promise<boolean>
  onCurrentListNameChange: (value: string) => void
  onSaveCurrentListName: () => void
  onLeaveList: () => void
  onNewListNameChange: (value: string) => void
  onCreateList: () => void
  onJoinListIdChange: (value: string) => void
  onJoinList: () => Promise<void>
  settingsModalRef: React.RefObject<HTMLDialogElement> | null
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
  onJoinList,
  settingsModalRef
}: SettingsModalProps) {
  const [isHeaderElevated, setIsHeaderElevated] = useState(false)
  const [copyStatus, setCopyStatus] = useState<"idle" | "success">("idle")
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current)
      }
    }
  }, [])

  async function handleCopyList() {
    const didCopy = await onCopyList()
    if (!didCopy) {
      return
    }

    setCopyStatus("success")

    if (copyFeedbackTimeoutRef.current) {
      clearTimeout(copyFeedbackTimeoutRef.current)
    }

    copyFeedbackTimeoutRef.current = setTimeout(() => {
      setCopyStatus("idle")
    }, 1500)
  }

  return (
    <dialog
      ref={settingsModalRef}
      closedby="any"
      className="w-full m-auto max-w-[min(--spacing(130),calc(100%-(--spacing(4))))] overflow-hidden rounded-xl border-2 border-[#252525] bg-[#fffdf8] shadow-[0_8px_20px_rgba(0,0,0,0.25)] backdrop:bg-black/25 backdrop:overflow-hidden backdrop:overscroll-contain"
    >
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

        <form
          className=" border-t border-[#d8d8d8] pt-3"
          onSubmit={event => {
            event.preventDefault()
            onSaveCurrentListName()
          }}
        >
          <h3 className="mb-2.5 text-base">Current List</h3>
          <span className="mb-1 block text-sm" id="current-list-id">
            List Number
          </span>
          <div className="relative flex min-w-0 items-center gap-1.5">
            <div
              aria-labelledby="current-list-id"
              className="m-0 min-w-0 flex-1 rounded-md border-2 border-transparent bg-[#dce1eb] p-2 text-[#626262] "
            >
              {currentListId}
            </div>
            <div className="relative shrink-0">
              {copyStatus === "success" ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md  px-2 py-1 text-xs text-[#252525] shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                >
                  Copied!
                </div>
              ) : null}

              <SettingsButton type="button" onClick={() => void handleCopyList()}>
                Copy
              </SettingsButton>
            </div>
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
            />
            <SettingsButton type="submit">Save</SettingsButton>
          </div>

          <div className="mt-2.5 flex justify-center">
            <SettingsButton
              type="button"
              className=" bg-[#8f2a2a] hover:text-[#8f2a2a] active:text-[#8f2a2a] active:outline-[#8f2a2a] "
              onClick={onLeaveList}
            >
              Leave List
            </SettingsButton>
          </div>
        </form>

        <form
          className="mt-3 border-t border-[#d8d8d8] pt-3"
          onSubmit={event => {
            event.preventDefault()
            onCreateList()
          }}
        >
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
            />
            <SettingsButton type="submit">Create</SettingsButton>
          </div>
        </form>

        <form
          className="mt-3 border-t border-[#d8d8d8] pt-3"
          onSubmit={event => {
            event.preventDefault()
            void onJoinList()
          }}
        >
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
            />
            <SettingsButton type="submit">Join</SettingsButton>
          </div>
        </form>
      </div>
    </dialog>
  )
}
