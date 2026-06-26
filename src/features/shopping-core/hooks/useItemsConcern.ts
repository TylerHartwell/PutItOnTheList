import { useEffect, useRef, useState } from "react"
import { onValue, push, ref, remove, set, update } from "firebase/database"
import { type User } from "firebase/auth"
import { database } from "@/shared/lib/firebase"
import type { ShoppingItem } from "@/shared/types/shopping"
import { vibrate } from "@/shared/utils/vibrate"
import { normalizeText } from "@/shared/utils/text"

type ItemSource = "current" | "legacy"

function readItemsFromSnapshot(rawValue: unknown): ShoppingItem[] {
  if (typeof rawValue !== "object" || rawValue === null || Array.isArray(rawValue)) {
    return []
  }

  const rawData = rawValue as Record<string, unknown>
  const nextItems: ShoppingItem[] = []

  for (const [id, value] of Object.entries(rawData)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      continue
    }

    const itemValue = value as { itemName?: unknown; itemHighlighted?: unknown; lastEditedByUid?: unknown }
    if (typeof itemValue.itemName !== "string") {
      continue
    }

    nextItems.push({
      id,
      itemName: itemValue.itemName,
      itemHighlighted: typeof itemValue.itemHighlighted === "boolean" ? itemValue.itemHighlighted : false,
      lastEditedByUid: typeof itemValue.lastEditedByUid === "string" ? itemValue.lastEditedByUid : ""
    })
  }

  return nextItems
}

export function useItemsConcern(user: User | null, currentListId: string, editorUid: string) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [itemSource, setItemSource] = useState<ItemSource>("current")
  const [itemEntry, setItemEntry] = useState("")
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemText, setEditingItemText] = useState("")
  const editInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!database || !user || !currentListId) {
      return
    }

    const db = database

    const itemsRef = ref(db, `lists/${currentListId}/items`)
    const legacyItemsRef = ref(db, currentListId)

    let nextCurrentItems: ShoppingItem[] = []
    let nextLegacyItems: ShoppingItem[] = []
    let hasLoadedCurrentItems = false
    let hasLoadedLegacyItems = false
    let hasAttemptedLegacyMigration = false
    let isMigratingLegacyItems = false

    const updateItems = () => {
      if (nextCurrentItems.length > 0) {
        setItemSource("current")
        setItems(nextCurrentItems)
        return
      }

      if (nextLegacyItems.length > 0) {
        setItemSource("legacy")
        setItems(nextLegacyItems)
        return
      }

      setItems([])
    }

    const migrateLegacyItemsIfNeeded = async () => {
      if (hasAttemptedLegacyMigration || isMigratingLegacyItems) {
        return
      }

      if (!hasLoadedCurrentItems || !hasLoadedLegacyItems) {
        return
      }

      if (nextCurrentItems.length > 0 || nextLegacyItems.length === 0) {
        return
      }

      hasAttemptedLegacyMigration = true
      isMigratingLegacyItems = true

      const migrationUpdates: Record<string, unknown> = {
        [`lists/${currentListId}/lastEditedByUid`]: editorUid
      }

      for (const legacyItem of nextLegacyItems) {
        migrationUpdates[`lists/${currentListId}/items/${legacyItem.id}`] = {
          itemName: legacyItem.itemName,
          itemHighlighted: legacyItem.itemHighlighted,
          lastEditedByUid: legacyItem.lastEditedByUid || editorUid
        }
      }

      try {
        await update(ref(db), migrationUpdates)

        // Legacy cleanup happens in a follow-up call so copy succeeds even if delete permissions fail.
        await remove(ref(db, currentListId)).catch(() => {})

        nextCurrentItems = nextLegacyItems
        nextLegacyItems = []
      } catch {
        // Keep legacy data intact if migration cannot be completed.
      } finally {
        isMigratingLegacyItems = false
        updateItems()
      }
    }

    const unsubscribeCurrent = onValue(itemsRef, snapshot => {
      hasLoadedCurrentItems = true
      nextCurrentItems = snapshot.exists() ? readItemsFromSnapshot(snapshot.val()) : []
      updateItems()
      void migrateLegacyItemsIfNeeded()
    })

    const unsubscribeLegacy = onValue(legacyItemsRef, snapshot => {
      hasLoadedLegacyItems = true
      nextLegacyItems = snapshot.exists() ? readItemsFromSnapshot(snapshot.val()) : []
      updateItems()
      void migrateLegacyItemsIfNeeded()
    })

    return () => {
      unsubscribeCurrent()
      unsubscribeLegacy()
    }
  }, [currentListId, editorUid, user])

  useEffect(() => {
    if (editingItemId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingItemId])

  function addInputToList() {
    const inputValue = normalizeText(itemEntry)
    if (!database || !inputValue || !user || !currentListId) {
      setItemEntry("")
      return
    }

    const db = database
    const itemsPath = itemSource === "legacy" ? currentListId : `lists/${currentListId}/items`

    push(ref(db, itemsPath), {
      itemName: inputValue,
      itemHighlighted: false,
      lastEditedByUid: editorUid
    })
    set(ref(db, `lists/${currentListId}/lastEditedByUid`), editorUid)
    vibrate()

    setItemEntry("")
  }

  function toggleHighlight(item: ShoppingItem) {
    if (!database || !user) {
      return
    }

    const db = database
    const itemsPath = itemSource === "legacy" ? currentListId : `lists/${currentListId}/items`

    void update(ref(db, `${itemsPath}/${item.id}`), {
      itemHighlighted: !item.itemHighlighted,
      lastEditedByUid: editorUid
    })
    set(ref(db, `lists/${currentListId}/lastEditedByUid`), editorUid)
    vibrate()
  }

  function deleteItem(itemId: string) {
    if (!database || !user) {
      return
    }

    const db = database
    const itemsPath = itemSource === "legacy" ? currentListId : `lists/${currentListId}/items`

    remove(ref(db, `${itemsPath}/${itemId}`))
    set(ref(db, `lists/${currentListId}/lastEditedByUid`), editorUid)
    vibrate()
  }

  function markAllItems(nextValue: boolean) {
    if (!database || !user) {
      return
    }

    const db = database
    const itemsPath = itemSource === "legacy" ? currentListId : `lists/${currentListId}/items`
    const batchUpdates: Record<string, unknown> = {
      [`lists/${currentListId}/lastEditedByUid`]: editorUid
    }

    for (const item of items) {
      if (item.itemHighlighted !== nextValue) {
        batchUpdates[`${itemsPath}/${item.id}/itemHighlighted`] = nextValue
        batchUpdates[`${itemsPath}/${item.id}/lastEditedByUid`] = editorUid
      }
    }

    void update(ref(db), batchUpdates)
    vibrate()
  }

  function deleteMarkedItems() {
    if (!database || !user) {
      return
    }

    const db = database
    const itemsPath = itemSource === "legacy" ? currentListId : `lists/${currentListId}/items`

    if (!window.confirm("Delete marked items from current list?")) {
      return
    }

    const batchUpdates: Record<string, unknown> = {
      [`lists/${currentListId}/lastEditedByUid`]: editorUid
    }

    for (const item of items) {
      if (item.itemHighlighted) {
        batchUpdates[`${itemsPath}/${item.id}`] = null
      }
    }

    void update(ref(db), batchUpdates)
    vibrate()
  }

  function deleteAllItems() {
    if (!database || !user || !currentListId) {
      return
    }

    const db = database
    const itemsPath = itemSource === "legacy" ? currentListId : `lists/${currentListId}/items`

    if (!window.confirm("Delete all items from current list?")) {
      return
    }

    void update(ref(db), {
      [itemsPath]: null,
      [`lists/${currentListId}/lastEditedByUid`]: editorUid
    })
    vibrate()
  }

  function startEditItem(item: ShoppingItem) {
    setEditingItemId(item.id)
    setEditingItemText(item.itemName)
    vibrate()
  }

  function saveEditedItem() {
    if (!database || !editingItemId || !user || !currentListId) {
      setEditingItemId(null)
      setEditingItemText("")
      return
    }

    const db = database
    const itemsPath = itemSource === "legacy" ? currentListId : `lists/${currentListId}/items`

    const trimmedName = normalizeText(editingItemText)

    if (trimmedName === "") {
      remove(ref(db, `${itemsPath}/${editingItemId}`))
    } else {
      void update(ref(db, `${itemsPath}/${editingItemId}`), {
        itemName: trimmedName,
        lastEditedByUid: editorUid
      })
    }

    set(ref(db, `lists/${currentListId}/lastEditedByUid`), editorUid)
    vibrate()
    setEditingItemId(null)
    setEditingItemText("")
  }

  return {
    items,
    itemEntry,
    setItemEntry,
    editingItemId,
    editingItemText,
    setEditingItemText,
    editInputRef,
    addInputToList,
    toggleHighlight,
    deleteItem,
    markAllItems,
    deleteMarkedItems,
    deleteAllItems,
    startEditItem,
    saveEditedItem
  }
}
