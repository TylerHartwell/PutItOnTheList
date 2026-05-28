"use client"

import Image from "next/image"
import { ListSelectorBar } from "@/features/list-selector"
import { SettingsModal } from "@/features/list-settings"
import { BulkActions, ItemComposer, ItemsList } from "@/features/list-items"
import { useShoppingList } from "@/features/shopping-core"

export default function Home() {
  const { lists, items: itemsState, settings } = useShoppingList()

  return (
    <div className="mx-auto my-6 w-[90%] max-w-170 text-[#432000]">
      <ListSelectorBar
        storedLists={lists.storedLists}
        currentListId={lists.currentListId}
        onChangeList={lists.makeListIdFirst}
        onOpenSettings={settings.openSettingsModal}
      />

      <SettingsModal
        currentListId={lists.currentListId}
        currentListNameInput={settings.currentListNameInput}
        newListNameInput={settings.newListNameInput}
        joinListIdInput={settings.joinListIdInput}
        onClose={settings.closeSettingsModal}
        onCopyList={settings.copyList}
        onCurrentListNameChange={settings.setCurrentListNameInput}
        onSaveCurrentListName={settings.editListName}
        onLeaveList={settings.leaveList}
        onNewListNameChange={settings.setNewListNameInput}
        onCreateList={settings.createList}
        onJoinListIdChange={settings.setJoinListIdInput}
        onJoinList={settings.joinList}
        settingsModalRef={settings.settingsModalRef as React.RefObject<HTMLDialogElement>}
      />

      <Image
        src="/top-hat-cat.png"
        alt="Top hat cat in grocery cart illustration"
        width={100}
        height={120}
        className="mx-auto my-0 block h-auto w-auto"
        priority
      />

      <ItemComposer itemEntry={itemsState.itemEntry} onItemEntryChange={itemsState.setItemEntry} onAddItem={itemsState.addInputToList} />

      <ItemsList
        items={itemsState.items}
        editingItemId={itemsState.editingItemId}
        editingItemText={itemsState.editingItemText}
        editInputRef={itemsState.editInputRef}
        onDeleteItem={itemsState.deleteItem}
        onStartEditItem={itemsState.startEditItem}
        onEditingItemTextChange={itemsState.setEditingItemText}
        onSaveEditedItem={itemsState.saveEditedItem}
        onToggleHighlight={itemsState.toggleHighlight}
      />

      <BulkActions
        hasItems={itemsState.items.length > 0}
        onDeleteMarkedItems={itemsState.deleteMarkedItems}
        onDeleteAllItems={itemsState.deleteAllItems}
        onUnmarkAll={() => itemsState.markAllItems(false)}
        onMarkAll={() => itemsState.markAllItems(true)}
      />
    </div>
  )
}
