import { Router } from "express";
import * as data from "../data.js";

export const router = Router();

// Crear película
router.post("/peliculas", (req, res) => {
  try {
    const pelicula = data.crearPelicula(req.body);
    res.status(201).json(pelicula);
  } catch (err) {
    res.status(400).json({ detail: err.message });
  }
});

// Crear serie (con temporadas y capítulos anidados en el body)
router.post("/series", (req, res) => {
  try {
    const serie = data.crearSerie(req.body);
    res.status(201).json(serie);
  } catch (err) {
    res.status(400).json({ detail: err.message });
  }
});

// Listar/buscar títulos (películas y series juntas, con filtros)
router.get("/titulos", (req, res) => {
  const { actor, director, anio, saga, categoria, titulo, tipo } = req.query;
  const titulos = data.listarTitulos({
    actor,
    director,
    anio,
    saga,
    categoria,
    titulo,
    tipo,
  });
  res.json(titulos);
});

// Obtener el detalle completo de un título (película o serie)
router.get("/titulos/:id", (req, res) => {
  const titulo = data.obtenerTitulo(Number(req.params.id));
  if (!titulo) return res.status(404).json({ detail: "Título no encontrado" });
  res.json(titulo);
});

// A propósito: no hay DELETE. No se permite eliminar títulos.
