import { DialogHTMLAttributes, useEffect, useRef, useState } from "react"
import { AccountSettingsForm } from "@/shared/components/AccountSettingsForm"
import type { UserAccountState } from "@/shared/types/user"
import ListJoinForm from "./ListJoinForm"
import ListCreateForm from "./ListCreateForm"
import ListEditForm from "./ListEditForm"
import SettingsModalHeader from "./SettingsModalHeader"
import { ModalDialog } from "@/shared/components/ModalDialog"
import type { ListMember } from "@/shared/types/shopping"
import { ListMembers } from "./ListMembers"

type SettingsModalProps = DialogHTMLAttributes<HTMLDialogElement> & {
  currentListId: string
  currentListNameInput: string
  currentListNameError: string
  currentListNicknameInput: string
  newListNameInput: string
  joinListIdInput: string
  joinListError: string
  copyList: () => Promise<boolean>
  onCurrentListNameChange: (value: string) => void
  onSaveCurrentListName: () => void
  onCurrentListNicknameChange: (value: string) => void
  onSaveCurrentListNickname: () => void
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
  currentListNicknameInput,
  newListNameInput,
  joinListIdInput,
  joinListError,
  copyList,
  onCurrentListNameChange,
  onSaveCurrentListName,
  onCurrentListNicknameChange,
  onSaveCurrentListNickname,
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
    setIsHeaderElevated(false)
    setIsScrolledBottom(true)
    account.setUsernameInput(account.profile?.username ?? "")
    setTabSelection({ isOpen: true, tab: "account" })
  }

  function openListTab() {
    setIsHeaderElevated(false)
    setIsScrolledBottom(false)
    setTabSelection({ isOpen: true, tab: "list" })
  }

  return (
    <ModalDialog
      isOpen={isOpen}
      onCloseSettingsModal={handleClose}
      className="mx-auto mt-8 mb-auto w-[min(28rem,calc(100%-2rem))]"
      isScrolledBottom={isScrolledBottom}
      scrollToTopKey={activeTab}
      onScroll={event => {
        setIsHeaderElevated(event.currentTarget.scrollTop > 0)
        setIsScrolledBottom(event.currentTarget.scrollHeight - event.currentTarget.scrollTop <= event.currentTarget.clientHeight)
      }}
    >
      <div className="relative flex flex-col ">
        <SettingsModalHeader
          isElevated={isHeaderElevated}
          activeTab={activeTab}
          onCloseSettingsModal={handleClose}
          onListTabSelect={openListTab}
          onAccountTabSelect={openAccountTab}
        />

        {activeTab === "list" ? (
          <>
            <ListEditForm
              currentListId={currentListId}
              currentListNameInput={currentListNameInput}
              currentListNameError={currentListNameError}
              currentListNicknameInput={currentListNicknameInput}
              copyStatus={copyStatus}
              isCurrentUserOwner={isCurrentUserOwner}
              onCurrentListNameChange={onCurrentListNameChange}
              onSaveCurrentListName={onSaveCurrentListName}
              onCurrentListNicknameChange={onCurrentListNicknameChange}
              onSaveCurrentListNickname={onSaveCurrentListNickname}
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

            <ListMembers
              currentListMembers={currentListMembers}
              currentListOwnerUid={currentListOwnerUid}
              isCurrentUserOwner={isCurrentUserOwner}
              onRemoveMember={onRemoveMember}
              onTransferOwnership={onTransferOwnership}
            />
          </>
        ) : (
          <AccountSettingsForm account={account} onSignOut={onSignOut} />
        )}
      </div>
    </ModalDialog>
  )
}
