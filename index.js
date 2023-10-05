//TO DO
//add undo function
//name, save, and load list?
//show history list by frequency and recency
//delete all left, check all right, clear checked middle

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
const shoppingListName = "shoppingList"
const shoppingListInDB = ref(database, shoppingListName)

const inputFieldEl = document.getElementById("input-field")
const addButtonEl = document.getElementById("add-button")
const shoppingListEl = document.getElementById("shopping-list")

inputFieldEl.addEventListener("keyup", function (e) {
  e.preventDefault()
  if (e.key === "Enter") {
    addButtonEl.click()
  }
})

addButtonEl.addEventListener("click", function (e) {
  e.preventDefault()
  let inputValue = inputFieldEl.value
  if (inputValue !== "") {
    let item = { itemName: inputValue, itemHighlighted: false }
    push(shoppingListInDB, item)
    clearInputFieldEl()
  }
})

onValue(shoppingListInDB, function (snapshot) {
  if (snapshot.exists()) {
    let itemsArray = Object.entries(snapshot.val())
    clearShoppingListEl()
    for (let i = 0; i < itemsArray.length; i++) {
      let currentItem = itemsArray[i]
      appendItemToShoppingListEl(currentItem)
    }
  } else {
    shoppingListEl.innerHTML = "No items here... yet"
  }
})

function appendItemToShoppingListEl(item) {
  const itemID = item[0]
  let { itemName, itemHighlighted } = item[1]
  const li = document.createElement("li")
  const deleteBtn = createButton("delete")

  li.textContent = itemName

  deleteBtn.addEventListener("click", function (e) {
    e.stopPropagation()
    let exactLocationOfItemInDB = ref(database, `${shoppingListName}/${itemID}`)
    remove(exactLocationOfItemInDB)
  })
  li.addEventListener("click", function () {
    set(
      ref(database, `${shoppingListName}/${itemID}/itemHighlighted`),
      !itemHighlighted
    )
    applyHighlightStatus(item, li)
  })
  shoppingListEl.append(li)
  li.appendChild(deleteBtn)
  console.log(li)
  applyHighlightStatus(item, li)
}

function createButton(classes) {
  const button = document.createElement("button")
  button.className = classes
  button.appendChild(document.createTextNode("X"))
  return button
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
