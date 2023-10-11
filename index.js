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
  set
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

const appSettings = {
  databaseURL: "https://playground-3bec0-default-rtdb.firebaseio.com/"
}

const app = initializeApp(appSettings)
const database = getDatabase(app)

const itemEntryEl = document.querySelector(".item-entry")
const addItemBtnEl = document.querySelector(".add-item-btn")
const itemListEl = document.querySelector(".item-list")
const multiItemOptionsEl = document.querySelector(".multi-item-options")
const groupSelectorEl = document.querySelector(".group-selector")
const groupEntryEl = document.querySelector(".group-entry")

if (localStorage.getItem("group-ids") === null) {
  const newGroupId = String(Date.now())
  localStorage.setItem("group-ids", JSON.stringify([newGroupId]))
}

Array.from(JSON.parse(localStorage.getItem("group-ids"))).forEach((v, i) => {
  const option = document.createElement("option")
  option.text = v
  groupSelectorEl.appendChild(option)
})

let groupId = groupSelectorEl.value
groupSelectorEl.onchange = () => {
  const selectedGroupId = groupSelectorEl.value
  const selectedGroupIdIndex = groupSelectorEl.selectedIndex
  if (selectedGroupIdIndex !== 0) {
    makeGroupIdFirst(selectedGroupId)
    location.reload()
  }
}

const shoppingListInDB = ref(database, groupId)

groupEntryEl.addEventListener("keyup", function (e) {
  e.preventDefault()
  if (e.key === "Enter") {
    makeGroupIdFirst(e.target.value)
    location.reload()
  }
})

itemEntryEl.addEventListener("keyup", function (e) {
  e.preventDefault()
  if (e.key === "Enter") {
    addItemBtnEl.click()
  }
})

addItemBtnEl.addEventListener("click", addInputToList)
itemListEl.addEventListener("click", deleteItem)
itemListEl.addEventListener("click", editItem)
itemListEl.addEventListener("click", toggleHighlight)
multiItemOptionsEl.addEventListener("click", deleteAllItems)
multiItemOptionsEl.addEventListener("click", markAllItems)
multiItemOptionsEl.addEventListener("click", unmarkAllItems)

onValue(shoppingListInDB, function (snapshot) {
  if (snapshot.exists()) {
    let itemsArray = Object.entries(snapshot.val())
    clearShoppingListEl()
    for (let i = 0; i < itemsArray.length; i++) {
      let currentItem = itemsArray[i]
      appendItemToShoppingListEl(currentItem)
    }
    multiItemOptionsEl.hidden = false
  } else {
    itemListEl.innerHTML = "No items here...yet"
    multiItemOptionsEl.hidden = true
  }
})

function makeGroupIdFirst(groupId) {
  const newGroupsArray = JSON.parse(localStorage.getItem("group-ids")).filter(
    id => id !== groupId
  )
  newGroupsArray.unshift(groupId)
  localStorage.setItem("group-ids", JSON.stringify(newGroupsArray))
}

function toggleHighlight(e) {
  if (e.target.classList.contains("mark")) {
    const li = e.target.parentElement
    if (li.classList.contains("item")) {
      const itemID = li.id
      const itemHighlighted = li.dataset.itemHighlighted === "true"
      set(
        ref(database, `${groupId}/${itemID}/itemHighlighted`),
        !itemHighlighted
      )
    }
  }
}

function deleteItem(e) {
  if (e.target.classList.contains("delete")) {
    const itemID = e.target.parentElement.id
    let exactLocationOfItemInDB = ref(database, `${groupId}/${itemID}`)
    remove(exactLocationOfItemInDB)
  }
}

function changeMarks(e, btnClass, bool) {
  if (e.target.classList.contains(btnClass)) {
    Array.from(itemListEl.children).forEach(li => {
      if (li.dataset.itemHighlighted !== `${bool}`) {
        const itemID = li.id
        set(ref(database, `${groupId}/${itemID}/itemHighlighted`), bool)
      }
    })
  }
}

function markAllItems(e) {
  changeMarks(e, "mark-all", true)
}

function unmarkAllItems(e) {
  changeMarks(e, "unmark-all", false)
}

function deleteAllItems(e) {
  if (e.target.classList.contains("delete-all")) {
    if (confirm("Delete all items from current list?") === true) {
      while (itemListEl.firstChild.id) {
        const itemID = itemListEl.firstChild.id
        let exactLocationOfItemInDB = ref(database, `${groupId}/${itemID}`)
        remove(exactLocationOfItemInDB)
      }
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

function editItem(e) {
  if (e.target.classList.contains("item-text")) {
    e.target.addEventListener("blur", saveEditedItem)
  }
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
    li.style.borderColor = "#00FF00"
  } else {
    li.style.borderColor = "transparent"
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
