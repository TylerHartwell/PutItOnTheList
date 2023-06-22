//TO DO
//add undo function
//name, save, and load list?

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, push, onValue, remove, set } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

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

inputFieldEl.addEventListener("keyup", function(e) {
    e.preventDefault();
    if (e.key === 'Enter') {
        addButtonEl.click();
    }
});

addButtonEl.addEventListener("click", function() {
    let inputValue = inputFieldEl.value
    if(inputValue !== "") {
        let item = {itemName: inputValue, itemHighlighted: false}
        push(shoppingListInDB, item)
        clearInputFieldEl()
    }
})

onValue(shoppingListInDB, function(snapshot) {
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
    let itemID = item[0]
    let itemValue = item[1].itemName
    let itemHighlighted = item[1].itemHighlighted
    let newEl = document.createElement("li")
    newEl.textContent = itemValue
   
    newEl.addEventListener("dblclick", function(e) {
        e.stopPropagation()
        let exactLocationOfItemInDB = ref(database, `${shoppingListName}/${itemID}`)
        remove(exactLocationOfItemInDB)
    })
    newEl.addEventListener("click", function() {
        set(ref(database, `${shoppingListName}/${itemID}/itemHighlighted`), !itemHighlighted)
        applyHighlightStatus(item, newEl)
    })
    shoppingListEl.append(newEl)
    applyHighlightStatus(item, newEl)
}

function applyHighlightStatus(item, newEl) {
    if(item[1].itemHighlighted) {
        newEl.style.borderColor = "#00FF00"
    } else {
        newEl.style.borderColor = "transparent"
    }
}

function clearShoppingListEl() {
    shoppingListEl.innerHTML = ""
}

function clearInputFieldEl() {
    inputFieldEl.value = ""
}