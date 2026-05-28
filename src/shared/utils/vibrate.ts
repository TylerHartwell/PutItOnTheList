export function vibrate(ms = 3): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms)
  }
}
