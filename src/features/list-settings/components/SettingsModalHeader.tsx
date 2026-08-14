import { SettingsButton } from "./SettingsButton"

type SettingsModalHeaderProps = {
  isElevated: boolean
  activeTab: "list" | "account"
  onCloseSettingsModal: () => void
  onListTabSelect: () => void
  onAccountTabSelect: () => void
}

const SettingsModalHeader = ({ isElevated, activeTab, onCloseSettingsModal, onListTabSelect, onAccountTabSelect }: SettingsModalHeaderProps) => {
  return (
    <div className={`sticky top-0 z-10 bg-[#fffdf8] ${isElevated ? "shadow-[0px_6px_10px_-3px_rgba(0,0,0,0.12)]" : "shadow-none"}`}>
      <div className="flex items-center justify-between gap-2.5 p-2">
        <h2 className="text-xl">Settings</h2>
        <SettingsButton className="size-10" onClick={onCloseSettingsModal} aria-label="Close settings">
          X
        </SettingsButton>
      </div>

      <div className="flex border-b border-[#d8d8d8] px-2" role="tablist" aria-label="Settings sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "list"}
          className={`flex-1 border-b-2 px-3 py-2 text-sm font-medium transition ${
            activeTab === "list" ? "border-[#432000] text-[#432000]" : "border-transparent text-[#8a6d45] hover:text-[#432000]"
          }`}
          onClick={onListTabSelect}
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
          onClick={onAccountTabSelect}
        >
          Account
        </button>
      </div>
    </div>
  )
}

export default SettingsModalHeader
