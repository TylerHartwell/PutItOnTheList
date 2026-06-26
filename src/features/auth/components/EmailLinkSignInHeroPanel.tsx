export function EmailLinkSignInHeroPanel() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-[linear-gradient(160deg,#fff7e1,#f4efe6_56%,#e9f2ed)] p-6 md:p-7">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.38em] text-[#8a6d45]">Put It On The List</p>
        <h1 className="mt-3 text-3xl font-medium leading-tight md:text-4xl">
          A shared shopping list built for planning, adding, and checking off together.
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#5f4a31]">
          Keep one live list for everyone in your home so ideas, errands, and store runs stay organized in one place.
        </p>
      </div>

      <div className="grid gap-3 text-sm text-[#5f4a31]">
        <div className="rounded-2xl bg-white/65 px-4 py-2.5">Create and manage shared shopping lists</div>
        <div className="rounded-2xl bg-white/65 px-4 py-2.5">Add, update, and organize items in real time</div>
        <div className="rounded-2xl bg-white/65 px-4 py-2.5">Check off what is already in the cart</div>
      </div>
    </div>
  )
}
