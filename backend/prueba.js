import { db } from "./db.js";

const tablas = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all();
console.log("Tablas encontradas:");
console.log(tablas);
