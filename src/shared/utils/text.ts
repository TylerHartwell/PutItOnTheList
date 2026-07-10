export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

export function decodeAmpersandEntity(value: string) {
  return value.replaceAll("&amp;", "&")
}

export function normalizePastedLinkInput(rawInput: string) {
  const withDecodedEntities = decodeAmpersandEntity(rawInput).trim()
  const match = withDecodedEntities.match(/https?:\/\/\S+/i)
  const urlLikeValue = match ? match[0] : withDecodedEntities

  return urlLikeValue.replace(/^[<\"']+|[>\"']+$/g, "")
}
