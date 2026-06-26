"use client"

import { Loader2 } from "lucide-react"

export function EmailLinkAuthLoadingState() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(238,240,244,0.85)_42%,rgba(214,195,165,0.45)_100%)] text-[#432000]">
      <div className="absolute -left-32 -top-32 h-56 w-56 rounded-full bg-[#ffcf70]/35 blur-3xl" />
      <div className="absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-[#b0d8c3]/40 blur-3xl" />
      <div className="relative mx-auto flex min-h-screen w-[92%] max-w-3xl items-center justify-center py-12">
        <div className="rounded-4xl border border-white/70 bg-white/85 px-8 py-10 text-center shadow-[0_24px_80px_rgba(67,32,0,0.16)] backdrop-blur">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#8a6d45]" />
          <p className="text-sm uppercase tracking-[0.35em] text-[#8a6d45]">Checking session</p>
          <h1 className="mt-3 text-3xl font-medium">Opening your list</h1>
          <p className="mt-2 text-sm text-[#5f4a31]">Verifying your Firebase sign-in link and restoring your shopping lists.</p>
        </div>
      </div>
    </div>
  )
}
