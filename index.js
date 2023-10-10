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

const inputFieldEl = document.getElementById("input-field")
const addButtonEl = document.getElementById("add-button")
const shoppingListEl = document.getElementById("shopping-list")
const multiOptionsEl = document.getElementById("multi-options")
const groupsEl = document.getElementById("groups")
const groupIdInput = document.getElementById("group-id-input")

if (localStorage.getItem("group-ids") === null) {
  const newGroupId = String(Date.now())
  localStorage.setItem("group-ids", JSON.stringify([newGroupId]))
}

Array.from(JSON.parse(localStorage.getItem("group-ids"))).forEach((v, i) => {
  const option = document.createElement("option")
  option.text = v
  groupsEl.appendChild(option)
})

let groupId = groupsEl.value
groupsEl.onchange = () => {
  const selectedGroupId = groupsEl.value
  const selectedGroupIdIndex = groupsEl.selectedIndex
  if (selectedGroupIdIndex !== 0) {
    makeGroupIdFirst(selectedGroupId)
    location.reload()
  }
}

const shoppingListInDB = ref(database, groupId)

groupIdInput.addEventListener("keyup", function (e) {
  e.preventDefault()
  if (e.key === "Enter") {
    makeGroupIdFirst(e.target.value)
    location.reload()
  }
})

inputFieldEl.addEventListener("keyup", function (e) {
  e.preventDefault()
  if (e.key === "Enter") {
    addButtonEl.click()
  }
})

addButtonEl.addEventListener("click", addInputToList)
shoppingListEl.addEventListener("click", deleteItem)
shoppingListEl.addEventListener("click", editItem)
shoppingListEl.addEventListener("click", toggleHighlight)
multiOptionsEl.addEventListener("click", deleteAllItems)
multiOptionsEl.addEventListener("click", markAllItems)
multiOptionsEl.addEventListener("click", unmarkAllItems)

onValue(shoppingListInDB, function (snapshot) {
  if (snapshot.exists()) {
    let itemsArray = Object.entries(snapshot.val())
    clearShoppingListEl()
    for (let i = 0; i < itemsArray.length; i++) {
      let currentItem = itemsArray[i]
      appendItemToShoppingListEl(currentItem)
    }
    multiOptionsEl.hidden = false
  } else {
    shoppingListEl.innerHTML = "No items here...yet"
    multiOptionsEl.hidden = true
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
    Array.from(shoppingListEl.children).forEach(li => {
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
      while (shoppingListEl.firstChild.id) {
        const itemID = shoppingListEl.firstChild.id
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

  shoppingListEl.append(li)
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
  shoppingListEl.innerHTML = ""
}

function clearInputFieldEl() {
  inputFieldEl.value = ""
}

function addInputToList(e) {
  e.preventDefault()
  let inputValue = inputFieldEl.value
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
