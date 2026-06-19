import { DialogHTMLAttributes, useEffect, useRef, useState } from "react"
import ListJoinForm from "./ListJoinForm"
import ListCreateForm from "./ListCreateForm"
import ListEditForm from "./ListEditForm"
import SettingsModalHeader from "./SettingsModalHeader"
import { ModalDialog, ModalDialogRef } from "@/shared/components/ModalDialog"

type SettingsModalProps = DialogHTMLAttributes<HTMLDialogElement> & {
  currentListId: string
  currentListNameInput: string
  newListNameInput: string
  joinListIdInput: string
  onCopyList: () => Promise<boolean>
  onCurrentListNameChange: (value: string) => void
  onSaveCurrentListName: () => void
  onLeaveList: () => void
  onNewListNameChange: (value: string) => void
  onCreateList: () => void
  onJoinListIdChange: (value: string) => void
  onJoinList: () => Promise<void>
  isOpen: boolean
  setIsOpen: (value: boolean) => void
}

export function SettingsModal({
  currentListId,
  currentListNameInput,
  newListNameInput,
  joinListIdInput,
  onCopyList,
  onCurrentListNameChange,
  onSaveCurrentListName,
  onLeaveList,
  onNewListNameChange,
  onCreateList,
  onJoinListIdChange,
  onJoinList,
  isOpen,
  setIsOpen
}: SettingsModalProps) {
  const [isHeaderElevated, setIsHeaderElevated] = useState(false)
  const [isScrolledBottom, setIsScrolledBottom] = useState(false)
  const [copyStatus, setCopyStatus] = useState<"idle" | "success">("idle")
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settingsModalRef = useRef<ModalDialogRef | null>(null)

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current)
      }
    }
  }, [])

  function handleModalClose() {
    unlockBodyScroll()
  }

  function unlockBodyScroll() {
    document.body.style.overflow = "unset"
  }

  function closeSettingsModal() {
    settingsModalRef.current?.close()
  }

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
    <ModalDialog
      ref={settingsModalRef}
      onClose={handleModalClose}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      isScrolledBottom={isScrolledBottom}
      onScroll={event => {
        setIsHeaderElevated(event.currentTarget.scrollTop > 0)
        setIsScrolledBottom(event.currentTarget.scrollHeight - event.currentTarget.scrollTop <= event.currentTarget.clientHeight)
      }}
    >
      <div className="relative flex flex-col gap-2">
        <SettingsModalHeader isElevated={isHeaderElevated} closeSettingsModal={closeSettingsModal} />

        <ListEditForm
          currentListId={currentListId}
          currentListNameInput={currentListNameInput}
          copyStatus={copyStatus}
          onCurrentListNameChange={onCurrentListNameChange}
          onSaveCurrentListName={onSaveCurrentListName}
          onLeaveList={onLeaveList}
          handleCopyList={handleCopyList}
        />

        <ListCreateForm onCreateList={onCreateList} newListNameInput={newListNameInput} onNewListNameChange={onNewListNameChange} />

        <ListJoinForm onJoinList={onJoinList} joinListIdInput={joinListIdInput} onJoinListIdChange={onJoinListIdChange} />
      </div>
    </ModalDialog>
  )
}
