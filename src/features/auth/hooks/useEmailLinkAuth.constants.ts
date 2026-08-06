export const PENDING_EMAIL_KEY = "putitonthelist.pendingEmailForSignIn"

export const AUTH_UNAVAILABLE_MESSAGE = "Firebase auth is not configured. Set the Firebase web app env vars in Netlify and redeploy."

export const FIREBASE_AUTH_QUERY_KEYS = ["apiKey", "oobCode", "mode", "lang", "continueUrl", "continue_url"] as const

export const NESTED_LINK_QUERY_KEYS = ["continueUrl", "continue_url", "link", "deep_link_id", "url"] as const

export const EMAIL_HINT_NESTED_LINK_QUERY_KEYS = ["continueUrl", "continue_url", "link", "deep_link_id"] as const
