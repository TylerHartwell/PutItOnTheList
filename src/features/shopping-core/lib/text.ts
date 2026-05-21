export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

export function vibrate(ms = 3): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms)
  }
}