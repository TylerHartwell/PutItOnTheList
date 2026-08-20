export type UserProfileRecord = {
  email: string
  username: string
  createdAt: number
  updatedAt: number
}

export type UserAccountState = {
  profile: UserProfileRecord | null
  isLoading: boolean
  requiresUsernameSetup: boolean
  usernameInput: string
  setUsernameInput: (value: string) => void
  usernameValidationMessage: string
  isSavingUsername: boolean
  statusMessage: string
  errorMessage: string
  saveUsername: () => Promise<void>
}
