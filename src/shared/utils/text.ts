export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

export function decodeAmpersandEntity(value: string) {
  return value.replaceAll("&amp;", "&")
}
