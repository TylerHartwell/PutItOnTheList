import { DialogHTMLAttributes, useEffect, useRef, useState } from "react"
import { AccountSettingsForm } from "@/shared/components/AccountSettingsForm"
import type { UserAccountState } from "@/shared/types/user"
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
  currentListNameError: string
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
  account: UserAccountState
  onSignOut: () => void
  isOpen: boolean
  onCloseSettingsModal: () => void
}

export function SettingsModal({
  currentListId,
  currentListNameInput,
  currentListNameError,
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
  account,
  onSignOut,
  isOpen,
  onCloseSettingsModal
}: SettingsModalProps) {
  const [isHeaderElevated, setIsHeaderElevated] = useState(false)
  const [isScrolledBottom, setIsScrolledBottom] = useState(false)
  const [copyStatus, setCopyStatus] = useState<"idle" | "success">("idle")
  const [tabSelection, setTabSelection] = useState<{ isOpen: boolean; tab: "list" | "account" }>({ isOpen: false, tab: "list" })
  const activeTab = tabSelection.isOpen === isOpen ? tabSelection.tab : "list"
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current)
      }
    }
  }, [])

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

  function handleClose() {
    setTabSelection({ isOpen: false, tab: "list" })
    onCloseSettingsModal()
  }

  function openAccountTab() {
    account.setUsernameInput(account.profile?.username ?? "")
    setTabSelection({ isOpen: true, tab: "account" })
  }

  return (
    <ModalDialog
      isOpen={isOpen}
      onCloseSettingsModal={handleClose}
      className="mx-auto mt-8 mb-auto"
      isScrolledBottom={isScrolledBottom}
      onScroll={event => {
        setIsHeaderElevated(event.currentTarget.scrollTop > 0)
        setIsScrolledBottom(event.currentTarget.scrollHeight - event.currentTarget.scrollTop <= event.currentTarget.clientHeight)
      }}
    >
      <div className="relative flex flex-col gap-2">
        <SettingsModalHeader isElevated={isHeaderElevated} onCloseSettingsModal={handleClose} />

        <div className="flex border-b border-[#d8d8d8] px-2" role="tablist" aria-label="Settings sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "list"}
            className={`flex-1 border-b-2 px-3 py-2 text-sm font-medium transition ${
              activeTab === "list" ? "border-[#432000] text-[#432000]" : "border-transparent text-[#8a6d45] hover:text-[#432000]"
            }`}
            onClick={() => setTabSelection({ isOpen: true, tab: "list" })}
          >
            List
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "account"}
            className={`flex-1 border-b-2 px-3 py-2 text-sm font-medium transition ${
              activeTab === "account" ? "border-[#432000] text-[#432000]" : "border-transparent text-[#8a6d45] hover:text-[#432000]"
            }`}
            onClick={openAccountTab}
          >
            Account
          </button>
        </div>

        {activeTab === "list" ? (
          <>
            <ListEditForm
              currentListId={currentListId}
              currentListNameInput={currentListNameInput}
              currentListNameError={currentListNameError}
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
                        {isOwner ? <span className="rounded-md px-2 py-1 text-xs">Owner</span> : null}
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
          </>
        ) : (
          <AccountSettingsForm account={account} onSignOut={onSignOut} />
        )}
      </div>
    </ModalDialog>
  )
}
