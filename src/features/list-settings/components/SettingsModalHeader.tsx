import { SettingsButton } from "./SettingsButton"

type SettingsModalHeaderProps = {
  isElevated: boolean
  onModalClose: () => void
}

const SettingsModalHeader = ({ isElevated, onModalClose }: SettingsModalHeaderProps) => {
  return (
    <div
      className={`sticky top-0 z-10 flex items-center justify-between gap-2.5 bg-[#fffdf8] p-2 ${isElevated ? "shadow-[0px_6px_10px_-3px_rgba(0,0,0,0.12)]" : "shadow-none"}`}
    >
      <h2 className="text-xl">List Settings</h2>
      <SettingsButton className="size-10" onClick={onModalClose} aria-label="Close settings">
        X
      </SettingsButton>
    </div>
  )
}

export default SettingsModalHeader
