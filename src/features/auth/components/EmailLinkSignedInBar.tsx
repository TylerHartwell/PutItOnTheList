"use client"

type EmailLinkSignedInBarProps = {
  statusMessage: string
  errorMessage: string
  children: React.ReactNode
}

export function EmailLinkSignedInBar({ statusMessage, errorMessage, children }: EmailLinkSignedInBarProps) {
  return (
    <div className="mx-auto w-[90%] max-w-120 py-1 text-[#432000]">
      {statusMessage ? <p className="mb-4 rounded-2xl bg-[#eef5ef] px-4 py-3 text-sm text-[#2f5a3f]">{statusMessage}</p> : null}
      {errorMessage ? <p className="mb-4 rounded-2xl bg-[#ffe9e4] px-4 py-3 text-sm text-[#9d3d27]">{errorMessage}</p> : null}

      {children}
    </div>
  )
}
