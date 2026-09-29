import Database from "better-sqlite3";

// Apunta a la base de datos que ya construiste a mano con DB Browser.
// Como este archivo vive en proyecto-pelicula/backend/, subimos un nivel
// con "../" para llegar a proyecto-pelicula/pelicula-serie.db
export const db = new Database("../pelicula-serie.db");

db.pragma("foreign_keys = ON");

// Nota: aquí NO hay ningún CREATE TABLE. Las tablas ya existen,
// las construiste tú mismo en DB Browser. Este archivo solo abre
// la conexión hacia ellas.
