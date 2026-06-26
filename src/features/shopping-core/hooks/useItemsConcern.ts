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

    const itemValue = value as { itemName?: unknown; itemHighlighted?: unknown }
    if (typeof itemValue.itemName !== "string") {
      continue
    }

    nextItems.push({
      id,
      itemName: itemValue.itemName,
      itemHighlighted: typeof itemValue.itemHighlighted === "boolean" ? itemValue.itemHighlighted : false,
      lastEditedBy: typeof (value as { lastEditedBy?: unknown }).lastEditedBy === "string" ? (value as { lastEditedBy: string }).lastEditedBy : ""
    })
  }

  return nextItems
}

export function useItemsConcern(user: User | null, currentListId: string, editorUsername: string) {
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

    const unsubscribeCurrent = onValue(itemsRef, snapshot => {
      nextCurrentItems = snapshot.exists() ? readItemsFromSnapshot(snapshot.val()) : []
      updateItems()
    })

    const unsubscribeLegacy = onValue(legacyItemsRef, snapshot => {
      nextLegacyItems = snapshot.exists() ? readItemsFromSnapshot(snapshot.val()) : []
      updateItems()
    })

    return () => {
      unsubscribeCurrent()
      unsubscribeLegacy()
    }
  }, [currentListId, user])

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
      lastEditedBy: editorUsername
    })
    set(ref(db, `lists/${currentListId}/lastEditedBy`), editorUsername)
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
      lastEditedBy: editorUsername
    })
    set(ref(db, `lists/${currentListId}/lastEditedBy`), editorUsername)
    vibrate()
  }

  function deleteItem(itemId: string) {
    if (!database || !user) {
      return
    }

    const db = database
    const itemsPath = itemSource === "legacy" ? currentListId : `lists/${currentListId}/items`

    remove(ref(db, `${itemsPath}/${itemId}`))
    set(ref(db, `lists/${currentListId}/lastEditedBy`), editorUsername)
    vibrate()
  }

  function markAllItems(nextValue: boolean) {
    if (!database || !user) {
      return
    }

    const db = database
    const itemsPath = itemSource === "legacy" ? currentListId : `lists/${currentListId}/items`

    for (const item of items) {
      if (item.itemHighlighted !== nextValue) {
        void update(ref(db, `${itemsPath}/${item.id}`), {
          itemHighlighted: nextValue,
          lastEditedBy: editorUsername
        })
      }
    }

    set(ref(db, `lists/${currentListId}/lastEditedBy`), editorUsername)
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

    for (const item of items) {
      if (item.itemHighlighted) {
        remove(ref(db, `${itemsPath}/${item.id}`))
      }
    }

    set(ref(db, `lists/${currentListId}/lastEditedBy`), editorUsername)
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

    remove(ref(db, itemsPath))
    set(ref(db, `lists/${currentListId}/lastEditedBy`), editorUsername)
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
        lastEditedBy: editorUsername
      })
    }

    set(ref(db, `lists/${currentListId}/lastEditedBy`), editorUsername)
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
