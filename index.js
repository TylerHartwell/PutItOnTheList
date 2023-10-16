//TO DO
//add undo function
//name, save, and load list?
//show history list by frequency and recency

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  set,
  get,
  child
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

const appSettings = {
  databaseURL: "https://playground-3bec0-default-rtdb.firebaseio.com/"
}

const app = initializeApp(appSettings)
const database = getDatabase(app)

const bodyEl = document.querySelector("body")
const itemEntryEl = document.querySelector(".item-entry")
const addItemBtn = document.querySelector(".add-item-btn")
const itemListEl = document.querySelector(".item-list")
const multiItemOptionsEl = document.querySelector(".multi-item-options")
const groupSelectorEl = document.querySelector(".group-selector")
const groupEntryEl = document.querySelector(".group-entry")

assureNonEmptyLocalStorage()

createGroupSelection()

let groupId = groupSelectorEl.value

const shoppingListInDB = ref(database, groupId)

let canVibrate = false
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

groupSelectorEl.onchange = () => {
  const selectedGroupId = groupSelectorEl.value
  const selectedGroupIdIndex = groupSelectorEl.selectedIndex
  if (selectedGroupIdIndex !== 0) {
    makeGroupIdFirst(selectedGroupId)
    location.reload()
  }
}

groupEntryEl.addEventListener("keyup", function (e) {
  e.preventDefault()
  if (e.key === "Enter") {
    joinGroup()
  }
})

itemEntryEl.addEventListener("keyup", function (e) {
  e.preventDefault()
  if (e.key === "Enter") {
    addItemBtn.click()
  }
})

bodyEl.addEventListener("click", e => {
  if (e.target.matches(".leave")) leaveGroup()
  if (e.target.matches(".join")) joinGroup()
  if (e.target.matches(".copy")) copyGroup()
  if (e.target.matches(".add-item-btn")) addInputToList(e)
  if (e.target.matches(".delete")) deleteItem(e)
  if (e.target.matches(".item-text")) editItem(e)
  if (e.target.matches(".mark")) toggleHighlight(e)
  if (e.target.matches(".delete-marked")) deleteMarkedItems()
  if (e.target.matches(".delete-all")) deleteAllItems()
  if (e.target.matches(".mark-all")) markAllItems(true)
  if (e.target.matches(".unmark-all")) markAllItems(false)
})

function createGroupSelection() {
  Array.from(JSON.parse(localStorage.getItem("group-ids"))).forEach(v => {
    const option = document.createElement("option")
    option.text = v
    groupSelectorEl.appendChild(option)
  })
}

function checkExistingGroup(id) {
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

function leaveGroup() {
  if (groupEntryEl.value) {
    const newGroupsArray = JSON.parse(localStorage.getItem("group-ids")).filter(
      id => id !== groupEntryEl.value
    )
    localStorage.setItem("group-ids", JSON.stringify(newGroupsArray))
    assureNonEmptyLocalStorage()
    vibrate(50)
    location.reload()
  }
}

function joinGroup() {
  if (groupEntryEl.value) {
    checkExistingGroup(groupEntryEl.value)
      .then(isExisting => {
        if (isExisting) {
          makeGroupIdFirst(groupEntryEl.value)
          vibrate(50)
          location.reload()
        } else {
          groupEntryEl.value = ""
        }
      })
      .catch(error => {
        console.error(error)
      })
  }
}

function copyGroup() {
  navigator.clipboard.writeText(groupSelectorEl.value)
  vibrate(50)
}

function assureNonEmptyLocalStorage() {
  if (
    localStorage.getItem("group-ids") === null ||
    Array.from(JSON.parse(localStorage.getItem("group-ids"))).length < 1
  ) {
    const newGroupId = String(Date.now())
    localStorage.setItem("group-ids", JSON.stringify([newGroupId]))
  }
}

function makeGroupIdFirst(groupId) {
  const newGroupsArray = JSON.parse(localStorage.getItem("group-ids")).filter(
    id => id !== groupId
  )
  newGroupsArray.unshift(groupId)
  localStorage.setItem("group-ids", JSON.stringify(newGroupsArray))
}

function toggleHighlight(e) {
  const li = e.target.parentElement
  if (li.classList.contains("item")) {
    const itemID = li.id
    const itemHighlighted = li.dataset.itemHighlighted === "true"
    set(ref(database, `${groupId}/${itemID}/itemHighlighted`), !itemHighlighted)
    vibrate(50)
  }
}

function deleteItem(e) {
  const itemID = e.target.parentElement.id
  let exactLocationOfItemInDB = ref(database, `${groupId}/${itemID}`)
  remove(exactLocationOfItemInDB)
  vibrate(50)
}

function markAllItems(bool) {
  Array.from(itemListEl.children).forEach(li => {
    if (li.dataset.itemHighlighted !== `${bool}`) {
      const itemID = li.id
      set(ref(database, `${groupId}/${itemID}/itemHighlighted`), bool)
      vibrate(50)
    }
  })
}

function deleteMarkedItems() {
  //remove confirm after implementing undo
  if (confirm("Delete marked items from current list?") === true) {
    const items = document.querySelectorAll(".item")

    items.forEach(li => {
      if (li.dataset.itemHighlighted == "true") {
        const itemID = li.id
        let exactLocationOfItemInDB = ref(database, `${groupId}/${itemID}`)
        remove(exactLocationOfItemInDB)
        vibrate(50)
      }
    })
  }
}

function deleteAllItems() {
  if (confirm("Delete all items from current list?") === true) {
    while (itemListEl.firstChild.id) {
      const itemID = itemListEl.firstChild.id
      let exactLocationOfItemInDB = ref(database, `${groupId}/${itemID}`)
      remove(exactLocationOfItemInDB)
      vibrate(50)
    }
  }
}

function saveEditedItem(e) {
  const li = e.target.parentElement
  if (li.classList.contains("item")) {
    const itemID = li.id
    set(ref(database, `${groupId}/${itemID}/itemName`), e.target.textContent)
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
  vibrate(50)
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
  e.preventDefault()
  let inputValue = itemEntryEl.value
  if (inputValue !== "" && inputIsUnique(inputValue)) {
    let item = { itemName: inputValue, itemHighlighted: false }
    push(shoppingListInDB, item)
    vibrate(50)
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
