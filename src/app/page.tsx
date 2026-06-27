"use client"

import Image from "next/image"
import { EmailLinkAuthGate } from "@/features/auth/components/EmailLinkAuthGate"
import { useShoppingList } from "@/features/shopping-core/hooks/useShoppingList"
import { useAuth } from "@/shared/lib/auth-context"
import { ListSelectorBar } from "@/features/list-selector/components/ListSelectorBar"
import { SettingsModal } from "@/features/list-settings/components/SettingsModal"
import { ItemComposer } from "@/features/list-items/components/ItemComposer"
import { ItemsList } from "@/features/list-items/components/ItemsList"
import { BulkActions } from "@/features/list-items/components/BulkActions"

function ShoppingListContent() {
  const { user, account } = useAuth()
  const activeUsername = account.profile?.username || user?.uid || ""
  const { lists, items: itemsState, settings } = useShoppingList(user, activeUsername)

  if (lists.isLoading) {
    return <div className="text-center py-8">Loading lists...</div>
  }

  return (
    <>
      <ListSelectorBar
        storedLists={lists.storedLists}
        currentListId={lists.currentListId}
        currentListLastEditedBy={lists.currentListLastEditedBy}
        onChangeList={lists.makeListIdFirst}
        onOpenSettings={settings.openSettingsModal}
      />

      <SettingsModal
        currentListId={lists.currentListId}
        currentListNameInput={settings.currentListNameInput}
        newListNameInput={settings.newListNameInput}
        joinListIdInput={settings.joinListIdInput}
        joinListError={settings.joinListError}
        onCopyList={settings.copyList}
        onCurrentListNameChange={settings.setCurrentListNameInput}
        onSaveCurrentListName={settings.editListName}
        onLeaveList={settings.leaveList}
        onNewListNameChange={settings.setNewListNameInput}
        onCreateList={settings.createList}
        onJoinListIdChange={settings.setJoinListIdInput}
        onJoinList={settings.joinList}
        currentListMembers={settings.currentListMembers}
        currentListOwnerUid={settings.currentListOwnerUid}
        isCurrentUserOwner={settings.isCurrentUserOwner}
        onRemoveMember={settings.removeMember}
        onTransferOwnership={settings.transferOwnership}
        isOpen={settings.isOpen}
        setIsOpen={settings.setIsOpen}
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
    </>
  )
}

export default function Home() {
  return (
    <EmailLinkAuthGate>
      <ShoppingListContent />
    </EmailLinkAuthGate>
  )
}
