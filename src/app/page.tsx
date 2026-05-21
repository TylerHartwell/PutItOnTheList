"use client"

import Image from "next/image"
import { useMemo } from "react"
import { ListSelectorBar } from "@/features/list-selector"
import { SettingsModal } from "@/features/list-settings"
import { BulkActions, ItemComposer, ItemsList } from "@/features/list-items"
import { useShoppingList } from "@/features/shopping-core"

export default function Home() {
  const {
    listIds,
    listNames,
    currentListId,
    items,
    itemEntry,
    setItemEntry,
    isSettingsOpen,
    currentListNameInput,
    setCurrentListNameInput,
    newListNameInput,
    setNewListNameInput,
    joinListIdInput,
    setJoinListIdInput,
    editingItemId,
    editingItemText,
    setEditingItemText,
    editInputRef,
    makeListIdFirst,
    addInputToList,
    toggleHighlight,
    deleteItem,
    markAllItems,
    deleteMarkedItems,
    deleteAllItems,
    startEditItem,
    saveEditedItem,
    openSettingsModal,
    closeSettingsModal,
    leaveList,
    joinList,
    createList,
    copyList,
    editListName
  } = useShoppingList()

  const sortedItems = useMemo(() => items, [items])

  return (
    <div className="mx-auto my-6 w-[90%] max-w-170 text-[#432000]">
      <ListSelectorBar
        listIds={listIds}
        listNames={listNames}
        currentListId={currentListId}
        onChangeList={makeListIdFirst}
        onOpenSettings={openSettingsModal}
      />

      {isSettingsOpen && (
        <SettingsModal
          currentListId={currentListId}
          currentListNameInput={currentListNameInput}
          newListNameInput={newListNameInput}
          joinListIdInput={joinListIdInput}
          onClose={closeSettingsModal}
          onCopyList={copyList}
          onCurrentListNameChange={setCurrentListNameInput}
          onSaveCurrentListName={editListName}
          onLeaveList={leaveList}
          onNewListNameChange={setNewListNameInput}
          onCreateList={createList}
          onJoinListIdChange={setJoinListIdInput}
          onJoinList={joinList}
        />
      )}

      <Image
        src="/top-hat-cat.png"
        alt="Top hat cat in grocery cart illustration"
        width={100}
        height={120}
        className="mx-auto my-0 block h-auto w-auto"
        priority
      />

      <ItemComposer itemEntry={itemEntry} onItemEntryChange={setItemEntry} onAddItem={addInputToList} />

      <ItemsList
        items={sortedItems}
        editingItemId={editingItemId}
        editingItemText={editingItemText}
        editInputRef={editInputRef}
        onDeleteItem={deleteItem}
        onStartEditItem={startEditItem}
        onEditingItemTextChange={setEditingItemText}
        onSaveEditedItem={saveEditedItem}
        onToggleHighlight={toggleHighlight}
      />

      <BulkActions
        hasItems={sortedItems.length > 0}
        onDeleteMarkedItems={deleteMarkedItems}
        onDeleteAllItems={deleteAllItems}
        onUnmarkAll={() => markAllItems(false)}
        onMarkAll={() => markAllItems(true)}
      />
    </div>
  )
}
