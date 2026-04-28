//TO DO
//add undo function
//name, save, and load list?
//show history list by frequency and recency

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, push, onValue, remove, set, get, child } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

const appSettings = {
  databaseURL: "https://playground-3bec0-default-rtdb.firebaseio.com/"
}

const app = initializeApp(appSettings)
const database = getDatabase(app)

const bodyEl = document.querySelector("body")
const itemEntryEl = document.querySelector(".item-entry")
const itemListEl = document.querySelector(".item-list")
const multiItemOptionsEl = document.querySelector(".multi-item-options")
const listSelectorEl = document.querySelector(".list-selector")
const settingsModalEl = document.querySelector(".settings-modal")
const currentListIdInputEl = document.querySelector(".current-list-id")
const currentListNameInputEl = document.querySelector(".current-list-name")
const newListNameInputEl = document.querySelector(".new-list-name")
const joinListIdInputEl = document.querySelector(".join-list-id")

assureNonEmptyLocalStorage()

createListSelection()

let listId = listSelectorEl.value

const shoppingListInDB = ref(database, listId)

let canVibrate = false
const vibrateLength = 3
if ("vibrate" in navigator) canVibrate = true

onValue(shoppingListInDB, function (snapshot) {
  if (snapshot.exists()) {
    let itemsArray = Object.entries(snapshot.val())
    clearShoppingListEl()
    for (let i = 0; i < itemsArray.length; i++) {
      let currentItem = itemsArray[i]
      appendItemToShoppingListEl(currentItem)
    }
    multiItemOptionsEl.classList.remove("hidden")
  } else {
    itemListEl.innerHTML = "No items here...yet"
    multiItemOptionsEl.classList.add("hidden")
  }
})

listSelectorEl.onchange = () => {
  const selectedListId = listSelectorEl.value
  const selectedListIdIndex = listSelectorEl.selectedIndex
  if (selectedListIdIndex !== 0) {
    makeListIdFirst(selectedListId)
    location.reload()
  }
}

joinListIdInputEl.addEventListener("keyup", function (e) {
  e.preventDefault()
  if (e.key === "Enter") {
    joinList(joinListIdInputEl.value)
  }
})

newListNameInputEl.addEventListener("keyup", function (e) {
  e.preventDefault()
  if (e.key === "Enter") {
    createList(newListNameInputEl.value)
  }
})

currentListNameInputEl.addEventListener("keyup", function (e) {
  e.preventDefault()
  if (e.key === "Enter") {
    editListName(currentListNameInputEl.value)
  }
})

itemEntryEl.addEventListener("keyup", function (e) {
  e.preventDefault()
  if (e.key === "Enter") {
    addInputToList(e)
  }
})

bodyEl.addEventListener("click", e => {
  if (e.target.matches(".settings-btn")) openSettingsModal()
  if (e.target.matches(".settings-modal") || e.target.matches(".modal-close") || e.target.matches(".modal-cancel")) closeSettingsModal()
  if (e.target.matches(".modal-save-name")) editListName(currentListNameInputEl.value)
  if (e.target.matches(".modal-copy")) copyList()
  if (e.target.matches(".modal-leave")) leaveList()
  if (e.target.matches(".modal-create")) createList(newListNameInputEl.value)
  if (e.target.matches(".modal-join")) joinList(joinListIdInputEl.value)
  if (e.target.matches(".add-item-btn")) addInputToList(e)
  if (e.target.matches(".delete")) deleteItem(e)
  if (e.target.matches(".item-text")) editItem(e)
  if (e.target.matches(".mark")) toggleHighlight(e)
  if (e.target.matches(".delete-marked")) deleteMarkedItems()
  if (e.target.matches(".delete-all")) deleteAllItems()
  if (e.target.matches(".mark-all")) markAllItems(true)
  if (e.target.matches(".unmark-all")) markAllItems(false)
})

bodyEl.addEventListener("keydown", e => {
  if (e.key === "Escape" && !settingsModalEl.classList.contains("hidden")) {
    closeSettingsModal()
  }
})

function createListSelection() {
  listSelectorEl.innerHTML = ""
  const listNames = getListNames()
  Array.from(JSON.parse(localStorage.getItem("list-ids"))).forEach(v => {
    const option = document.createElement("option")
    const listName = listNames[v]
    option.text = listName ? listName : v
    option.value = v
    listSelectorEl.appendChild(option)
  })
  syncSettingsModalFields()
}

function checkExistingList(id) {
  const dbRef = ref(getDatabase())
  return get(child(dbRef, id))
    .then(snapshot => {
      return snapshot.exists()
    })
    .catch(error => {
      console.error(error)
      return false
    })
}

function openSettingsModal() {
  syncSettingsModalFields()
  settingsModalEl.classList.remove("hidden")
  settingsModalEl.setAttribute("aria-hidden", "false")
}

function closeSettingsModal() {
  settingsModalEl.classList.add("hidden")
  settingsModalEl.setAttribute("aria-hidden", "true")
}

function syncSettingsModalFields() {
  const selectedListId = listSelectorEl.value
  const listNames = getListNames()

  currentListIdInputEl.value = selectedListId || ""
  currentListNameInputEl.value = selectedListId ? listNames[selectedListId] || "" : ""
}

function leaveList(listIdToLeave = listSelectorEl.value) {
  if (listIdToLeave) {
    const newListsArray = JSON.parse(localStorage.getItem("list-ids")).filter(id => id !== listIdToLeave)
    localStorage.setItem("list-ids", JSON.stringify(newListsArray))
    pruneListNames(newListsArray)
    assureNonEmptyLocalStorage()
    closeSettingsModal()
    vibrate(vibrateLength)
    location.reload()
  }
}

function joinList(nextListId) {
  const listIdToJoin = nextListId ? nextListId.trim() : ""
  if (listIdToJoin) {
    checkExistingList(listIdToJoin)
      .then(isExisting => {
        if (isExisting) {
          makeListIdFirst(listIdToJoin)
          closeSettingsModal()
          vibrate(vibrateLength)
          location.reload()
        } else {
          joinListIdInputEl.value = ""
          joinListIdInputEl.focus()
        }
      })
      .catch(error => {
        console.error(error)
      })
  }
}

function createList(optionalListName) {
  const newListId = String(Date.now())
  makeListIdFirst(newListId)

  const trimmedName = optionalListName ? optionalListName.trim() : ""
  if (trimmedName) {
    const listNames = getListNames()
    listNames[newListId] = trimmedName
    saveListNames(listNames)
  }

  closeSettingsModal()
  vibrate(vibrateLength)
  location.reload()
}

function copyList() {
  navigator.clipboard.writeText(listSelectorEl.value)
  closeSettingsModal()
  vibrate(vibrateLength)
}

function editListName(nextName) {
  const selectedListId = listSelectorEl.value
  if (!selectedListId) return

  const listNames = getListNames()
  const trimmedName = nextName.trim()
  if (trimmedName) {
    listNames[selectedListId] = trimmedName
  } else {
    delete listNames[selectedListId]
  }

  saveListNames(listNames)
  createListSelection()
  listSelectorEl.value = selectedListId
  syncSettingsModalFields()
  closeSettingsModal()
  vibrate(vibrateLength)
}

function assureNonEmptyLocalStorage() {
  if (localStorage.getItem("list-ids") === null || Array.from(JSON.parse(localStorage.getItem("list-ids"))).length < 1) {
    const newListId = String(Date.now())
    localStorage.setItem("list-ids", JSON.stringify([newListId]))
  }

  if (localStorage.getItem("list-names") === null) {
    localStorage.setItem("list-names", JSON.stringify({}))
  }

  pruneListNames(JSON.parse(localStorage.getItem("list-ids")))
}

function makeListIdFirst(listId) {
  const newListsArray = JSON.parse(localStorage.getItem("list-ids")).filter(id => id !== listId)
  newListsArray.unshift(listId)
  localStorage.setItem("list-ids", JSON.stringify(newListsArray))
}

function getListNames() {
  const storedNames = localStorage.getItem("list-names")
  return storedNames ? JSON.parse(storedNames) : {}
}

function saveListNames(listNames) {
  localStorage.setItem("list-names", JSON.stringify(listNames))
}

function pruneListNames(listIds) {
  const listNames = getListNames()
  Object.keys(listNames).forEach(listId => {
    if (!listIds.includes(listId)) {
      delete listNames[listId]
    }
  })
  saveListNames(listNames)
}

function toggleHighlight(e) {
  const li = e.target.parentElement
  if (li.classList.contains("item")) {
    const itemID = li.id
    const itemHighlighted = li.dataset.itemHighlighted === "true"
    set(ref(database, `${listId}/${itemID}/itemHighlighted`), !itemHighlighted)
    vibrate(vibrateLength)
  }
}

function deleteItem(e) {
  const itemID = e.target.parentElement.id
  let exactLocationOfItemInDB = ref(database, `${listId}/${itemID}`)
  remove(exactLocationOfItemInDB)
  vibrate(vibrateLength)
}

function markAllItems(bool) {
  Array.from(itemListEl.children).forEach(li => {
    if (li.dataset.itemHighlighted !== `${bool}`) {
      const itemID = li.id
      set(ref(database, `${listId}/${itemID}/itemHighlighted`), bool)
      vibrate(vibrateLength)
    }
  })
}

function deleteMarkedItems() {
  //remove confirm after implementing undo

  vibrate(vibrateLength)
  setTimeout(() => {
    if (confirm("Delete marked items from current list?") === true) {
      const items = document.querySelectorAll(".item")
      items.forEach(li => {
        if (li.dataset.itemHighlighted == "true") {
          const itemID = li.id
          let exactLocationOfItemInDB = ref(database, `${listId}/${itemID}`)
          remove(exactLocationOfItemInDB)
          vibrate(vibrateLength)
        }
      })
    }
  }, vibrateLength * 2)
}

function deleteAllItems() {
  vibrate(vibrateLength)
  setTimeout(() => {
    if (confirm("Delete all items from current list?") === true) {
      while (itemListEl.firstChild.id) {
        const itemID = itemListEl.firstChild.id
        let exactLocationOfItemInDB = ref(database, `${listId}/${itemID}`)
        remove(exactLocationOfItemInDB)
      }
    }
  }, vibrateLength * 2)
}

function saveEditedItem(e) {
  const li = e.target.parentElement
  if (li.classList.contains("item")) {
    const itemID = li.id
    set(ref(database, `${listId}/${itemID}/itemName`), e.target.textContent)
  }
  e.target.removeEventListener("blur", saveEditedItem)
}

function blurOnEnterPress(e) {
  if (e.key === "Enter") {
    e.preventDefault()
    e.target.blur()
    e.target.removeEventListener("keydown", blurOnEnterPress)
  }
}

function editItem(e) {
  e.target.addEventListener("blur", saveEditedItem)
  e.target.addEventListener("keydown", blurOnEnterPress)
  vibrate(vibrateLength)
}

function appendItemToShoppingListEl(item) {
  const itemID = item[0]
  const { itemName, itemHighlighted } = item[1]
  const li = makeNewEl("li", "item")
  const itemText = makeNewEl("div", "item-text", itemName)
  const deleteBtn = makeNewEl("button", "delete", "X")
  const markBtn = makeNewEl("button", "mark", "✔️")

  li.id = itemID
  li.dataset.itemHighlighted = itemHighlighted
  applyHighlightStatus(item, li)

  itemText.setAttribute("contenteditable", "plaintext-only")

  itemListEl.append(li)
  li.appendChild(deleteBtn)
  li.appendChild(itemText)
  li.appendChild(markBtn)
  applyHighlightStatus(item, li)
}

function makeNewEl(tag = "div", classes = "newEl", text) {
  const el = document.createElement(tag)
  el.className = classes
  if (text) {
    el.appendChild(document.createTextNode(text))
  }
  return el
}

function applyHighlightStatus(item, li) {
  if (item[1].itemHighlighted) {
    li.classList.add("highlight")
  } else {
    li.classList.remove("highlight")
  }
}

function clearShoppingListEl() {
  itemListEl.innerHTML = ""
}

function clearInputFieldEl() {
  itemEntryEl.value = ""
}

function addInputToList(e) {
  if (e.type === "click") vibrate(vibrateLength)
  let inputValue = itemEntryEl.value
  if (inputValue !== "" && inputIsUnique(inputValue)) {
    let item = { itemName: inputValue, itemHighlighted: false }
    push(shoppingListInDB, item)
  }
  clearInputFieldEl()
}

function inputIsUnique(inputValue) {
  let isUnique = true
  Array.from(document.querySelectorAll(".item-text")).forEach(el => {
    if (el.textContent === inputValue) isUnique = false
  })
  return isUnique
}

function vibrate(ms) {
  if (canVibrate) navigator.vibrate(ms)
}
