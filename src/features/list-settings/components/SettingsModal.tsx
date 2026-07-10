import { DialogHTMLAttributes, useEffect, useRef, useState } from "react"
import ListJoinForm from "./ListJoinForm"
import ListCreateForm from "./ListCreateForm"
import ListEditForm from "./ListEditForm"
import SettingsModalHeader from "./SettingsModalHeader"
import { ModalDialog } from "@/shared/components/ModalDialog"
import type { ListMember } from "@/shared/types/shopping"
import { SettingsButton } from "./SettingsButton"

function getMemberDisplayName(member: ListMember) {
  const username = member.username.trim()
  const uid = member.uid.trim()

  if (!username || username === uid) {
    return `user-${uid.slice(0, 6) || "unknown"}`
  }

  return username
}

type SettingsModalProps = DialogHTMLAttributes<HTMLDialogElement> & {
  currentListId: string
  currentListNameInput: string
  newListNameInput: string
  joinListIdInput: string
  joinListError: string
  copyList: () => Promise<boolean>
  onCurrentListNameChange: (value: string) => void
  onSaveCurrentListName: () => void
  onLeaveList: () => void
  onNewListNameChange: (value: string) => void
  onCreateList: () => void
  onJoinListIdChange: (value: string) => void
  onJoinList: () => Promise<void>
  currentListMembers: ListMember[]
  currentListOwnerUid: string
  isCurrentUserOwner: boolean
  onRemoveMember: (memberUid: string) => Promise<void>
  onTransferOwnership: (nextOwnerUid: string) => Promise<void>
  isOpen: boolean
  setIsOpen: (value: boolean) => void
}

export function SettingsModal({
  currentListId,
  currentListNameInput,
  newListNameInput,
  joinListIdInput,
  joinListError,
  copyList,
  onCurrentListNameChange,
  onSaveCurrentListName,
  onLeaveList,
  onNewListNameChange,
  onCreateList,
  onJoinListIdChange,
  onJoinList,
  currentListMembers,
  currentListOwnerUid,
  isCurrentUserOwner,
  onRemoveMember,
  onTransferOwnership,
  isOpen,
  setIsOpen
}: SettingsModalProps) {
  const [isHeaderElevated, setIsHeaderElevated] = useState(false)
  const [isScrolledBottom, setIsScrolledBottom] = useState(false)
  const [copyStatus, setCopyStatus] = useState<"idle" | "success">("idle")
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current)
      }
    }
  }, [])

  function handleModalClose() {
    setIsOpen(false)
  }

  async function handleCopyList() {
    const didCopy = await copyList()
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
    <ModalDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      isScrolledBottom={isScrolledBottom}
      onScroll={event => {
        setIsHeaderElevated(event.currentTarget.scrollTop > 0)
        setIsScrolledBottom(event.currentTarget.scrollHeight - event.currentTarget.scrollTop <= event.currentTarget.clientHeight)
      }}
    >
      <div className="relative flex flex-col gap-2">
        <SettingsModalHeader isElevated={isHeaderElevated} onModalClose={handleModalClose} />

        <ListEditForm
          currentListId={currentListId}
          currentListNameInput={currentListNameInput}
          copyStatus={copyStatus}
          onCurrentListNameChange={onCurrentListNameChange}
          onSaveCurrentListName={onSaveCurrentListName}
          onLeaveList={onLeaveList}
          onCopyList={handleCopyList}
        />

        <ListCreateForm onCreateList={onCreateList} newListNameInput={newListNameInput} onNewListNameChange={onNewListNameChange} />

        <ListJoinForm
          onJoinList={onJoinList}
          joinListIdInput={joinListIdInput}
          joinListError={joinListError}
          onJoinListIdChange={onJoinListIdChange}
        />

        <section className="mt-3 border-t border-[#d8d8d8] p-2">
          <h3 className="mb-2.5 text-base">Members</h3>
          <ul className="flex flex-col gap-1.5">
            {currentListMembers.map(member => {
              const isOwner = member.uid === currentListOwnerUid

              return (
                <li key={member.uid} className="flex items-center justify-between gap-2 rounded-md bg-[#dce1eb] p-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{getMemberDisplayName(member)}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {isOwner ? <span className="rounded-md  px-2 py-1 text-xs">Owner</span> : null}
                    {isCurrentUserOwner && !isOwner ? (
                      <>
                        <SettingsButton type="button" onClick={() => void onTransferOwnership(member.uid)}>
                          Make Owner
                        </SettingsButton>
                        <SettingsButton
                          type="button"
                          className="bg-[#8f2a2a] hover:text-[#8f2a2a] active:text-[#8f2a2a] active:outline-[#8f2a2a]"
                          onClick={() => void onRemoveMember(member.uid)}
                        >
                          Remove
                        </SettingsButton>
                      </>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </ModalDialog>
  )
}
