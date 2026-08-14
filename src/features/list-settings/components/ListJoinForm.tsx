import { SettingsButton } from "./SettingsButton"

type ListJoinFormProps = {
  onJoinList: () => Promise<void>
  joinListIdInput: string
  joinListError: string
  onJoinListIdChange: (value: string) => void
}

const ListJoinForm = ({ onJoinList, joinListIdInput, joinListError, onJoinListIdChange }: ListJoinFormProps) => {
  return (
    <form
      className="border-t border-[#d8d8d8] p-2"
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
      {joinListError ? (
        <p role="alert" className="mt-1 text-sm text-[#8f2a2a]">
          {joinListError}
        </p>
      ) : null}
    </form>
  )
}

export default ListJoinForm
