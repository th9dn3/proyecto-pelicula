import { Router } from "express";
import * as data from "../data.js";

export const router = Router();

// Comentar un título completo (película, o serie en general)
router.post("/titulos/:id/comentarios", (req, res) => {
  try {
    const comentario = data.comentarTitulo(Number(req.params.id), req.body);
    if (!comentario)
      return res.status(404).json({ detail: "Título no encontrado" });
    res.status(201).json(comentario);
  } catch (err) {
    res.status(400).json({ detail: err.message });
  }
});

// Comentar un capítulo específico
router.post("/capitulos/:id/comentarios", (req, res) => {
  try {
    const comentario = data.comentarCapitulo(Number(req.params.id), req.body);
    if (!comentario)
      return res.status(404).json({ detail: "Capítulo no encontrado" });
    res.status(201).json(comentario);
  } catch (err) {
    res.status(400).json({ detail: err.message });
  }
});
