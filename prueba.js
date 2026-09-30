import { crearPelicula, listarTitulos } from "./data.js";

const nueva = crearPelicula({
  titulo: "Matrix",
  fecha_estreno: "1999-03-31",
  director: "Wachowski",
  duracion_minutos: 136,
  saga: "Matrix",
  actores: ["Keanu Reeves"],
  categorias: ["Ciencia ficción"],
});

console.log("Película creada:", nueva);
console.log("Listado:", listarTitulos({}));
