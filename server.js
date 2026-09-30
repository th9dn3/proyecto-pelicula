import express from "express";
import cors from "cors";

import { router as titulosRouter } from "./routes/titulos.js";
import { router as comentariosRouter } from "./routes/comentarios.js";
import { router as catalogosRouter } from "./routes/catalogos.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    mensaje: "API de catálogo de películas y series funcionando",
  });
});

app.use("/", titulosRouter);
app.use("/", comentariosRouter);
app.use("/", catalogosRouter);

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`API corriendo en http://127.0.0.1:${PORT}`);
});
