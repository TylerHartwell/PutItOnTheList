import { SettingsButton } from "./SettingsButton"

type ListEditFormProps = {
  currentListId: string
  currentListNameInput: string
  copyStatus: "idle" | "success"
  onCurrentListNameChange: (value: string) => void
  onSaveCurrentListName: () => void
  onLeaveList: () => void
  onCopyList: () => void
}

const ListEditForm = ({
  currentListId,
  currentListNameInput,
  copyStatus,
  onCurrentListNameChange,
  onSaveCurrentListName,
  onLeaveList,
  onCopyList
}: ListEditFormProps) => {
  return (
    <form
      className=" border-t border-[#d8d8d8] p-2"
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
        <div aria-labelledby="current-list-id" className="m-0 min-w-0 flex-1 rounded-md border-2 border-transparent bg-[#dce1eb] p-2 text-[#626262] ">
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

          <SettingsButton type="button" onClick={onCopyList}>
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
  )
}

export default ListEditForm
