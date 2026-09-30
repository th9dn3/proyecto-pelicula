import { Router } from "express";
import * as data from "../data.js";

export const router = Router();

router.get("/actores", (req, res) => res.json(data.listarActores()));
router.get("/categorias", (req, res) => res.json(data.listarCategorias()));
router.get("/sagas", (req, res) => res.json(data.listarSagas()));
