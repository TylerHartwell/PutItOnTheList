//TO DO
//add undo function
//add quantity option
//add user and time/date added signature?
//right click to edit item?
//name, save, and load list?

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

const appSettings = {
    databaseURL: "https://playground-3bec0-default-rtdb.firebaseio.com/"
}

const app = initializeApp(appSettings)
const database = getDatabase(app)
const shoppingListInDB = ref(database, "shoppingList")

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
        push(shoppingListInDB, inputValue)
    
        clearInputFieldEl()
    }
    
})

onValue(shoppingListInDB, function(snapshot) {
    if (snapshot.exists()) {
        let itemsArray = Object.entries(snapshot.val())
    
        clearShoppingListEl()
        
        for (let i = 0; i < itemsArray.length; i++) {
            let currentItem = itemsArray[i]
            let currentItemID = currentItem[0]
            let currentItemValue = currentItem[1]
            
            appendItemToShoppingListEl(currentItem)
        }    
    } else {
        shoppingListEl.innerHTML = "No items here... yet"
    }
})

function clearShoppingListEl() {
    shoppingListEl.innerHTML = ""
}

function clearInputFieldEl() {
    inputFieldEl.value = ""
}

function appendItemToShoppingListEl(item) {
    let itemID = item[0]
    let itemValue = item[1]
    
    let newEl = document.createElement("li")
    
    newEl.textContent = itemValue
    //let isHighlighted = false
    //need to make item values objects with a text property and an isHighlighted property instead of just single strings as values
    
    newEl.addEventListener("dblclick", function() {
        let exactLocationOfItemInDB = ref(database, `shoppingList/${itemID}`)
        
        remove(exactLocationOfItemInDB)
    })
    
    // newEl.addEventListener("click", function() {
    //     change border color to green or transparent
    // })
    
    shoppingListEl.append(newEl)
}