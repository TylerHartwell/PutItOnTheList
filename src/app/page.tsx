"use client"

import Image from "next/image"
import { EmailLinkAuthGate } from "@/features/auth/components/EmailLinkAuthGate"
import { useShoppingList } from "@/features/shopping-core/hooks/useShoppingList"
import { ListSelectorBar } from "@/features/list-selector/components/ListSelectorBar"
import { SettingsModal } from "@/features/list-settings/components/SettingsModal"
import { ItemComposer } from "@/features/list-items/components/ItemComposer"
import { ItemsList } from "@/features/list-items/components/ItemsList"
import { BulkActions } from "@/features/list-items/components/BulkActions"
import { useAuthContextValue } from "@/shared/lib/bundleContext"

function ShoppingListContent() {
  const { user, account, onSignOut } = useAuthContextValue()
  const userId = user?.uid || ""
  const activeUsername = account.profile?.username || userId
  const { lists, items: itemsState, settings } = useShoppingList(userId, activeUsername)

  if (lists.isLoading) {
    return <div className="text-center py-8">Loading lists...</div>
  }

  return (
    <>
      <ListSelectorBar
        storedLists={lists.storedLists}
        currentListId={lists.currentListId}
        currentListLastEditedByUsername={lists.currentListLastEditedByUsername}
        onChangeList={lists.makeListIdFirst}
        onOpenSettings={settings.openSettingsModal}
      />

      <SettingsModal
        currentListId={lists.currentListId}
        currentListNameInput={settings.currentListNameInput}
        currentListNameError={settings.currentListNameError}
        newListNameInput={settings.newListNameInput}
        joinListIdInput={settings.joinListIdInput}
        joinListError={settings.joinListError}
        copyList={settings.copyList}
        onCurrentListNameChange={settings.changeCurrentListNameInput}
        onSaveCurrentListName={settings.editListName}
        onLeaveList={settings.leaveList}
        onNewListNameChange={settings.changeNewListNameInput}
        onCreateList={settings.createList}
        onJoinListIdChange={settings.changeJoinListIdInput}
        onJoinList={settings.joinList}
        currentListMembers={settings.currentListMembers}
        currentListOwnerUid={settings.currentListOwnerUid}
        isCurrentUserOwner={settings.isCurrentUserOwner}
        onRemoveMember={settings.removeMember}
        onTransferOwnership={settings.transferOwnership}
        account={account}
        onSignOut={onSignOut}
        isOpen={settings.isOpen}
        onCloseSettingsModal={settings.closeSettingsModal}
      />

      <Image
        src="/top-hat-cat.png"
        alt="Top hat cat in grocery cart illustration"
        width={100}
        height={120}
        className="mx-auto my-0 block h-auto w-auto"
        priority
      />

      <ItemComposer itemEntry={itemsState.itemEntry} onItemEntryChange={itemsState.changeItemEntry} onAddItem={itemsState.addItem} />

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
        onMoveItem={itemsState.moveItem}
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
