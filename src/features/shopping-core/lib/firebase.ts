import { getApp, getApps, initializeApp } from "firebase/app"
import { getDatabase } from "firebase/database"

const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        databaseURL: "https://playground-3bec0-default-rtdb.firebaseio.com/"
      })

export const database = getDatabase(firebaseApp)