/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { getApp, getApps, initializeApp } from "firebase/app"
import { child, get, getDatabase, onValue, push, ref, remove, set } from "firebase/database"

type ShoppingItem = {
  id: string
  itemName: string
  itemHighlighted: boolean
}

const LIST_IDS_KEY = "list-ids"
const LIST_NAMES_KEY = "list-names"

const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        databaseURL: "https://playground-3bec0-default-rtdb.firebaseio.com/"
      })

const database = getDatabase(firebaseApp)

function parseListIds(raw: string | null): string[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []
  } catch {
    return []
  }
}

function parseListNames(raw: string | null): Record<string, string> {
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

function vibrate(ms = 3): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms)
  }
}

export default function Home() {
  const [listIds, setListIds] = useState<string[]>([])
  const [listNames, setListNames] = useState<Record<string, string>>({})
  const [currentListId, setCurrentListId] = useState("")
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [itemEntry, setItemEntry] = useState("")

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentListNameInput, setCurrentListNameInput] = useState("")
  const [newListNameInput, setNewListNameInput] = useState("")
  const [joinListIdInput, setJoinListIdInput] = useState("")

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemText, setEditingItemText] = useState("")
  const editInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const savedListIds = parseListIds(localStorage.getItem(LIST_IDS_KEY))
    const savedListNames = parseListNames(localStorage.getItem(LIST_NAMES_KEY))
    const seededListIds = savedListIds.length > 0 ? savedListIds : [String(Date.now())]

    const prunedListNames: Record<string, string> = {}
    for (const listId of seededListIds) {
      if (savedListNames[listId]) {
        prunedListNames[listId] = savedListNames[listId]
      }
    }

    localStorage.setItem(LIST_IDS_KEY, JSON.stringify(seededListIds))
    localStorage.setItem(LIST_NAMES_KEY, JSON.stringify(prunedListNames))

    setListIds(seededListIds)
    setListNames(prunedListNames)
    setCurrentListId(seededListIds[0] ?? "")
  }, [])

  useEffect(() => {
    if (!currentListId) {
      return
    }

    const listRef = ref(database, currentListId)

    const unsubscribe = onValue(listRef, snapshot => {
      if (!snapshot.exists()) {
        setItems([])
        return
      }

      const nextItems = Object.entries(snapshot.val() as Record<string, { itemName: string; itemHighlighted: boolean }>).map(([id, value]) => ({
        id,
        itemName: value.itemName,
        itemHighlighted: value.itemHighlighted
      }))

      setItems(nextItems)
    })

    return () => unsubscribe()
  }, [currentListId])

  useEffect(() => {
    if (editingItemId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingItemId])

  const sortedItems = useMemo(() => items, [items])

  function persistLists(nextListIds: string[], nextListNames: Record<string, string>) {
    localStorage.setItem(LIST_IDS_KEY, JSON.stringify(nextListIds))
    localStorage.setItem(LIST_NAMES_KEY, JSON.stringify(nextListNames))
    setListIds(nextListIds)
    setListNames(nextListNames)
  }

  function makeListIdFirst(listId: string) {
    const nextListIds = [listId, ...listIds.filter(id => id !== listId)]
    const nextNames: Record<string, string> = {}
    for (const id of nextListIds) {
      if (listNames[id]) {
        nextNames[id] = listNames[id]
      }
    }

    persistLists(nextListIds, nextNames)
    setCurrentListId(listId)
  }

  function addInputToList() {
    const inputValue = normalizeText(itemEntry)
    if (!inputValue || !currentListId) {
      setItemEntry("")
      return
    }

    const normalizedInput = inputValue.toLowerCase()
    const isUnique = !items.some(item => normalizeText(item.itemName).toLowerCase() === normalizedInput)

    if (isUnique) {
      push(ref(database, currentListId), {
        itemName: inputValue,
        itemHighlighted: false
      })
      vibrate()
    }

    setItemEntry("")
  }

  function toggleHighlight(item: ShoppingItem) {
    set(ref(database, `${currentListId}/${item.id}/itemHighlighted`), !item.itemHighlighted)
    vibrate()
  }

  function deleteItem(itemId: string) {
    remove(ref(database, `${currentListId}/${itemId}`))
    vibrate()
  }

  function markAllItems(nextValue: boolean) {
    for (const item of items) {
      if (item.itemHighlighted !== nextValue) {
        set(ref(database, `${currentListId}/${item.id}/itemHighlighted`), nextValue)
      }
    }

    vibrate()
  }

  function deleteMarkedItems() {
    if (!window.confirm("Delete marked items from current list?")) {
      return
    }

    for (const item of items) {
      if (item.itemHighlighted) {
        remove(ref(database, `${currentListId}/${item.id}`))
      }
    }

    vibrate()
  }

  function deleteAllItems() {
    if (!window.confirm("Delete all items from current list?")) {
      return
    }

    for (const item of items) {
      remove(ref(database, `${currentListId}/${item.id}`))
    }

    vibrate()
  }

  function startEditItem(item: ShoppingItem) {
    setEditingItemId(item.id)
    setEditingItemText(item.itemName)
    vibrate()
  }

  function saveEditedItem() {
    if (!editingItemId) {
      return
    }

    const nextValue = normalizeText(editingItemText)
    if (nextValue) {
      set(ref(database, `${currentListId}/${editingItemId}/itemName`), nextValue)
    }

    setEditingItemId(null)
    setEditingItemText("")
  }

  function openSettingsModal() {
    setCurrentListNameInput(listNames[currentListId] ?? "")
    setIsSettingsOpen(true)
  }

  function closeSettingsModal() {
    setIsSettingsOpen(false)
  }

  function leaveList() {
    if (!currentListId) {
      return
    }

    const remainingListIds = listIds.filter(id => id !== currentListId)
    const nextListIds = remainingListIds.length > 0 ? remainingListIds : [String(Date.now())]
    const nextListNames: Record<string, string> = {}

    for (const id of nextListIds) {
      if (listNames[id]) {
        nextListNames[id] = listNames[id]
      }
    }

    persistLists(nextListIds, nextListNames)
    setCurrentListId(nextListIds[0])
    closeSettingsModal()
    vibrate()
  }

  async function joinList() {
    const listIdToJoin = joinListIdInput.trim()
    if (!listIdToJoin) {
      return
    }

    try {
      const dbRef = ref(getDatabase())
      const snapshot = await get(child(dbRef, listIdToJoin))
      if (!snapshot.exists()) {
        setJoinListIdInput("")
        return
      }

      makeListIdFirst(listIdToJoin)
      setJoinListIdInput("")
      closeSettingsModal()
      vibrate()
    } catch {
      setJoinListIdInput("")
    }
  }

  function createList() {
    const newListId = String(Date.now())
    const nextListIds = [newListId, ...listIds.filter(id => id !== newListId)]
    const trimmedName = normalizeText(newListNameInput)
    const nextNames = { ...listNames }

    if (trimmedName) {
      nextNames[newListId] = trimmedName
    }

    persistLists(nextListIds, nextNames)
    setCurrentListId(newListId)
    setNewListNameInput("")
    closeSettingsModal()
    vibrate()
  }

  async function copyList() {
    if (!currentListId) {
      return
    }

    try {
      await navigator.clipboard.writeText(currentListId)
      vibrate()
    } catch {
      window.alert("Could not copy list number. Please copy it manually.")
    }
  }

  function editListName() {
    if (!currentListId) {
      return
    }

    const trimmedName = normalizeText(currentListNameInput)
    const nextNames = { ...listNames }

    if (trimmedName) {
      nextNames[currentListId] = trimmedName
    } else {
      delete nextNames[currentListId]
    }

    persistLists(listIds, nextNames)
    closeSettingsModal()
    vibrate()
  }

  return (
    <div className="mx-auto my-6 w-[90%] max-w-170 text-[#432000]">
      <div className="mx-auto my-0 flex w-full items-center justify-center gap-1.5">
        <label htmlFor="list-selector" className="mx-0.5 min-w-12 text-center text-sm">
          Current:
        </label>
        <select
          id="list-selector"
          className="min-w-0 flex-1 rounded-md border-2 border-transparent bg-[#dce1eb] p-1.5 outline-none focus:border-black"
          value={currentListId}
          onChange={event => {
            const nextListId = event.target.value
            if (nextListId) {
              makeListIdFirst(nextListId)
            }
          }}
        >
          {listIds.map(listId => (
            <option key={listId} value={listId}>
              {listNames[listId] || listId}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="h-8 min-w-24 rounded-md border border-transparent bg-[#252525] px-3 text-[#fdfdfd] focus:border-black focus:outline-none"
          onClick={openSettingsModal}
        >
          Settings
        </button>
      </div>

      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-20 flex items-start justify-center bg-black/45 px-2.5 py-5"
          onClick={event => {
            if (event.target === event.currentTarget) {
              closeSettingsModal()
            }
          }}
        >
          <div className="max-h-[calc(100vh-40px)] w-full max-w-130 overflow-y-auto rounded-xl border-2 border-[#252525] bg-[#fffdf8] p-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between gap-2.5">
              <h2 className="m-0 text-xl">List Settings</h2>
              <button
                type="button"
                className="min-h-9 min-w-9 rounded-md border border-transparent bg-[#252525] text-[#fdfdfd] focus:border-black focus:outline-none"
                onClick={closeSettingsModal}
                aria-label="Close settings"
              >
                X
              </button>
            </div>

            <section className="mt-3 border-t border-[#d8d8d8] pt-3">
              <h3 className="mb-2.5 text-base">Current List</h3>
              <label className="mb-1 block text-sm" htmlFor="current-list-id">
                List Number
              </label>
              <div className="flex min-w-0 items-center gap-1.5">
                <input
                  id="current-list-id"
                  className="m-0 min-w-0 flex-1 rounded-md border-2 border-transparent bg-[#dce1eb] p-2 text-[#626262] outline-none focus:border-black"
                  value={currentListId}
                  readOnly
                />
                <button
                  type="button"
                  className="min-h-8 rounded-md border border-transparent bg-[#252525] px-2.5 text-[#fdfdfd] focus:border-black focus:outline-none"
                  onClick={copyList}
                >
                  Copy
                </button>
              </div>

              <label className="mb-1 mt-2 block text-sm" htmlFor="current-list-name">
                Local List Name
              </label>
              <div className="flex min-w-0 items-center gap-1.5">
                <input
                  id="current-list-name"
                  className="m-0 min-w-0 flex-1 rounded-md border-2 border-transparent bg-[#dce1eb] p-2 outline-none focus:border-black"
                  placeholder="Optional"
                  autoComplete="off"
                  value={currentListNameInput}
                  onChange={event => setCurrentListNameInput(event.target.value)}
                  onKeyUp={event => {
                    if (event.key === "Enter") {
                      editListName()
                    }
                  }}
                />
                <button
                  type="button"
                  className="min-h-8 rounded-md border border-transparent bg-[#252525] px-2.5 text-[#fdfdfd] focus:border-black focus:outline-none"
                  onClick={editListName}
                >
                  Save
                </button>
              </div>

              <div className="mt-2.5 flex justify-center">
                <button
                  type="button"
                  className="min-h-8 rounded-md border border-transparent bg-[#8f2a2a] px-2.5 text-[#fdfdfd] focus:border-black focus:outline-none"
                  onClick={leaveList}
                >
                  Leave List
                </button>
              </div>
            </section>

            <section className="mt-3 border-t border-[#d8d8d8] pt-3">
              <h3 className="mb-2.5 text-base">Create New List</h3>
              <label className="mb-1 block text-sm" htmlFor="new-list-name">
                Local List Name
              </label>
              <div className="flex min-w-0 items-center gap-1.5">
                <input
                  id="new-list-name"
                  className="m-0 min-w-0 flex-1 rounded-md border-2 border-transparent bg-[#dce1eb] p-2 outline-none focus:border-black"
                  placeholder="Optional"
                  autoComplete="off"
                  value={newListNameInput}
                  onChange={event => setNewListNameInput(event.target.value)}
                  onKeyUp={event => {
                    if (event.key === "Enter") {
                      createList()
                    }
                  }}
                />
                <button
                  type="button"
                  className="min-h-8 rounded-md border border-transparent bg-[#252525] px-2.5 text-[#fdfdfd] focus:border-black focus:outline-none"
                  onClick={createList}
                >
                  Create
                </button>
              </div>
            </section>

            <section className="mt-3 border-t border-[#d8d8d8] pt-3">
              <h3 className="mb-2.5 text-base">Join Existing List</h3>
              <label className="mb-1 block text-sm" htmlFor="join-list-id">
                List Number
              </label>
              <div className="flex min-w-0 items-center gap-1.5">
                <input
                  id="join-list-id"
                  className="m-0 min-w-0 flex-1 rounded-md border-2 border-transparent bg-[#dce1eb] p-2 outline-none focus:border-black"
                  placeholder="Paste list number"
                  autoComplete="off"
                  value={joinListIdInput}
                  onChange={event => setJoinListIdInput(event.target.value)}
                  onKeyUp={event => {
                    if (event.key === "Enter") {
                      void joinList()
                    }
                  }}
                />
                <button
                  type="button"
                  className="min-h-8 rounded-md border border-transparent bg-[#252525] px-2.5 text-[#fdfdfd] focus:border-black focus:outline-none"
                  onClick={() => void joinList()}
                >
                  Join
                </button>
              </div>
            </section>

            <div className="mt-3.5 flex justify-center">
              <button
                type="button"
                className="min-h-8 min-w-20 rounded-md border border-transparent bg-[#252525] px-2.5 text-[#fdfdfd] focus:border-black focus:outline-none"
                onClick={closeSettingsModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Image
        src="/top-hat-cat.png"
        alt="Top hat cat in grocery cart illustration"
        width={100}
        height={120}
        className="mx-auto my-0 block h-auto w-auto"
        priority
      />

      <input
        type="text"
        className="my-2.5 w-full rounded-md border-2 border-transparent bg-[#dce1eb] p-3.5 text-center text-xl focus:border-black focus:shadow-[0_0_5px_#252525] focus:outline-none"
        placeholder="Enter Item"
        autoComplete="off"
        value={itemEntry}
        onChange={event => setItemEntry(event.target.value)}
        onKeyUp={event => {
          if (event.key === "Enter") {
            addInputToList()
          }
        }}
      />

      <button
        type="button"
        className="w-full rounded-md bg-[#ffd9009a] p-3.5 text-center text-xl active:bg-[#252525] active:text-[#fdfdfd]"
        onClick={addInputToList}
      >
        Put It On The List
      </button>

      {sortedItems.length > 0 ? (
        <ul className="my-2.5 flex list-none flex-col gap-2 p-0">
          {sortedItems.map(item => (
            <li
              key={item.id}
              className={`m-0 flex items-center justify-start overflow-hidden rounded-md border-2 border-transparent bg-[#fffdf8] px-2.5 py-0 shadow-[0_1px_4px_rgba(0,0,0,0.2)] ${
                item.itemHighlighted ? "bg-[#fffdc1]" : ""
              }`}
            >
              <button
                type="button"
                className="-ml-2 min-h-8 min-w-8 bg-transparent p-0 text-center font-black leading-none text-[#fc7371] active:scale-150"
                onClick={() => deleteItem(item.id)}
                aria-label={`Delete ${item.itemName}`}
              >
                X
              </button>

              {editingItemId === item.id ? (
                <input
                  ref={editInputRef}
                  className="min-w-0 flex-1 bg-transparent px-1.5 py-2 text-xl outline-none"
                  value={editingItemText}
                  onChange={event => setEditingItemText(event.target.value)}
                  onBlur={saveEditedItem}
                  onKeyDown={event => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      saveEditedItem()
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className={`min-w-0 flex-1 bg-transparent px-1.5 py-2 text-left text-xl wrap-break-word ${
                    item.itemHighlighted ? "opacity-50" : ""
                  }`}
                  onClick={() => startEditItem(item)}
                >
                  {item.itemName}
                </button>
              )}

              <button
                type="button"
                className="-mr-2 ml-auto min-h-8 min-w-10 bg-transparent p-0 text-center font-black leading-none active:scale-150"
                onClick={() => toggleHighlight(item)}
                aria-label={`Toggle marked state for ${item.itemName}`}
              >
                OK
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="my-2.5 text-xl">No items here...yet</p>
      )}

      {sortedItems.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-1">
          <button
            type="button"
            className="m-0.5 rounded-md border-3 border-double border-[#fc7371] bg-[#252525] px-2 py-1.5 font-bold text-[#fffdc1] active:bg-[#ec6f09] active:text-black"
            onClick={deleteMarkedItems}
          >
            X Marked
          </button>
          <button
            type="button"
            className="m-0.5 mr-auto rounded-md border-3 border-double border-[#fc7371] bg-[#252525] px-2 py-1.5 font-bold text-[#fc7371] active:bg-[#fc7371] active:text-black"
            onClick={deleteAllItems}
          >
            X All
          </button>
          <button
            type="button"
            className="m-0.5 rounded-md border-3 border-double border-[#fdfdfd] bg-[#252525] px-2 py-1.5 font-bold text-[#fdfdfd] active:bg-[#fdfdfd] active:text-black"
            onClick={() => markAllItems(false)}
          >
            Unmark All
          </button>
          <button
            type="button"
            className="m-0.5 rounded-md border-3 border-double border-[#fffdc1] bg-[#252525] px-2 py-1.5 font-bold text-[#fffdc1] active:bg-[#fffdc1] active:text-black"
            onClick={() => markAllItems(true)}
          >
            Mark All
          </button>
        </div>
      )}
    </div>
  )
}
