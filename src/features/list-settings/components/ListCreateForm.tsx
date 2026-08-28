import { SettingsButton } from "./SettingsButton"

type ListCreateFormProps = {
  onCreateList: () => void
  newListNameInput: string
  onNewListNameChange: (value: string) => void
}

const ListCreateForm = ({ onCreateList, newListNameInput, onNewListNameChange }: ListCreateFormProps) => {
  return (
    <form
      className=" border-t border-[#d8d8d8] p-2"
      onSubmit={event => {
        event.preventDefault()
        onCreateList()
      }}
    >
      <h3 className="mb-2.5 text-base">Create New List</h3>
      <label className="mb-1 block text-sm" htmlFor="new-list-name">
        List Name
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
  )
}

export default ListCreateForm
