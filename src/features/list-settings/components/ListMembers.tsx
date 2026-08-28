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

type ListMembersProps = {
  currentListMembers: ListMember[]
  currentListOwnerUid: string
  isCurrentUserOwner: boolean
  onRemoveMember: (memberUid: string) => Promise<void>
  onTransferOwnership: (nextOwnerUid: string) => Promise<void>
}

export function ListMembers({ currentListMembers, currentListOwnerUid, isCurrentUserOwner, onRemoveMember, onTransferOwnership }: ListMembersProps) {
  return (
    <section className="border-t border-[#d8d8d8] p-2">
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
  )
}
