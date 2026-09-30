import { useState } from "react";
import { api } from "../api";

const camposComunes = {
  titulo: "",
  fecha_estreno: "",
  descripcion: "",
  director: "",
  saga: "",
  actoresTexto: "",
  categoriasTexto: "",
};

export default function AgregarTitulo({ onCreado }) {
  const [tipo, setTipo] = useState("pelicula"); // "pelicula" | "serie"
  const [form, setForm] = useState({ ...camposComunes, duracion_minutos: "" });
  const [temporadas, setTemporadas] = useState([]);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ---------- Manejo de temporadas y capítulos (solo para series) ----------

  const agregarTemporada = () => {
    setTemporadas([
      ...temporadas,
      {
        numero: temporadas.length + 1,
        titulo: "",
        fecha_estreno: "",
        capitulos: [],
      },
    ]);
  };

  const quitarTemporada = (index) => {
    setTemporadas(temporadas.filter((_, i) => i !== index));
  };

  const actualizarTemporada = (index, campo, valor) => {
    const copia = [...temporadas];
    copia[index] = { ...copia[index], [campo]: valor };
    setTemporadas(copia);
  };

  const agregarCapitulo = (temporadaIndex) => {
    const copia = [...temporadas];
    const caps = copia[temporadaIndex].capitulos;
    copia[temporadaIndex].capitulos = [
      ...caps,
      {
        numero: caps.length + 1,
        titulo: "",
        duracion_minutos: "",
        descripcion: "",
      },
    ];
    setTemporadas(copia);
  };

  const quitarCapitulo = (temporadaIndex, capIndex) => {
    const copia = [...temporadas];
    copia[temporadaIndex].capitulos = copia[temporadaIndex].capitulos.filter(
      (_, i) => i !== capIndex,
    );
    setTemporadas(copia);
  };

  const actualizarCapitulo = (temporadaIndex, capIndex, campo, valor) => {
    const copia = [...temporadas];
    const caps = [...copia[temporadaIndex].capitulos];
    caps[capIndex] = { ...caps[capIndex], [campo]: valor };
    copia[temporadaIndex].capitulos = caps;
    setTemporadas(copia);
  };

  // ---------- Enviar ----------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const base = {
        titulo: form.titulo,
        fecha_estreno: form.fecha_estreno || null,
        descripcion: form.descripcion || null,
        director: form.director || null,
        saga: form.saga || null,
        actores: form.actoresTexto
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        categorias: form.categoriasTexto
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (tipo === "pelicula") {
        await api.crearPelicula({
          ...base,
          duracion_minutos: form.duracion_minutos
            ? Number(form.duracion_minutos)
            : null,
        });
      } else {
        await api.crearSerie({
          ...base,
          temporadas: temporadas.map((t) => ({
            numero: Number(t.numero),
            titulo: t.titulo || null,
            fecha_estreno: t.fecha_estreno || null,
            capitulos: t.capitulos.map((c) => ({
              numero: Number(c.numero),
              titulo: c.titulo || null,
              duracion_minutos: c.duracion_minutos
                ? Number(c.duracion_minutos)
                : null,
              descripcion: c.descripcion || null,
            })),
          })),
        });
      }

      setForm({ ...camposComunes, duracion_minutos: "" });
      setTemporadas([]);
      onCreado();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="form-titulo" onSubmit={handleSubmit}>
      <h2>Agregar al catálogo</h2>
      {error && <p className="error">{error}</p>}

      <div className="tipo-selector">
        <label>
          <input
            type="radio"
            checked={tipo === "pelicula"}
            onChange={() => setTipo("pelicula")}
          />
          🎬 Película
        </label>
        <label>
          <input
            type="radio"
            checked={tipo === "serie"}
            onChange={() => setTipo("serie")}
          />
          📺 Serie
        </label>
      </div>

      <label>
        Título *
        <input
          name="titulo"
          required
          value={form.titulo}
          onChange={handleChange}
        />
      </label>
      <label>
        Fecha de estreno
        <input
          name="fecha_estreno"
          type="date"
          value={form.fecha_estreno}
          onChange={handleChange}
        />
      </label>
      <label>
        Director
        <input name="director" value={form.director} onChange={handleChange} />
      </label>

      {tipo === "pelicula" && (
        <label>
          Duración (minutos)
          <input
            name="duracion_minutos"
            type="number"
            value={form.duracion_minutos}
            onChange={handleChange}
          />
        </label>
      )}

      <label>
        Saga (opcional)
        <input name="saga" value={form.saga} onChange={handleChange} />
      </label>
      <label>
        Actores (separados por coma)
        <input
          name="actoresTexto"
          placeholder="Ej: Keanu Reeves, Carrie-Anne Moss"
          value={form.actoresTexto}
          onChange={handleChange}
        />
      </label>
      <label>
        Categorías (separadas por coma)
        <input
          name="categoriasTexto"
          placeholder="Ej: Ciencia ficción, Acción"
          value={form.categoriasTexto}
          onChange={handleChange}
        />
      </label>
      <label>
        Descripción
        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
        />
      </label>

      {tipo === "serie" && (
        <div className="temporadas-editor">
          <h3>Temporadas</h3>
          {temporadas.map((temp, tIndex) => (
            <div key={tIndex} className="temporada-bloque">
              <div className="temporada-header">
                <strong>Temporada {temp.numero}</strong>
                <button
                  type="button"
                  className="secundario"
                  onClick={() => quitarTemporada(tIndex)}
                >
                  Quitar temporada
                </button>
              </div>
              <input
                placeholder="Título de la temporada (opcional)"
                value={temp.titulo}
                onChange={(e) =>
                  actualizarTemporada(tIndex, "titulo", e.target.value)
                }
              />
              <input
                type="date"
                value={temp.fecha_estreno}
                onChange={(e) =>
                  actualizarTemporada(tIndex, "fecha_estreno", e.target.value)
                }
              />

              <div className="capitulos-editor">
                {temp.capitulos.map((cap, cIndex) => (
                  <div key={cIndex} className="capitulo-bloque">
                    <span>Cap. {cap.numero}</span>
                    <input
                      placeholder="Título del capítulo"
                      value={cap.titulo}
                      onChange={(e) =>
                        actualizarCapitulo(
                          tIndex,
                          cIndex,
                          "titulo",
                          e.target.value,
                        )
                      }
                    />
                    <input
                      placeholder="Duración (min)"
                      type="number"
                      value={cap.duracion_minutos}
                      onChange={(e) =>
                        actualizarCapitulo(
                          tIndex,
                          cIndex,
                          "duracion_minutos",
                          e.target.value,
                        )
                      }
                    />
                    <input
                      placeholder="Descripción del capítulo"
                      value={cap.descripcion}
                      onChange={(e) =>
                        actualizarCapitulo(
                          tIndex,
                          cIndex,
                          "descripcion",
                          e.target.value,
                        )
                      }
                    />
                    <button
                      type="button"
                      className="secundario"
                      onClick={() => quitarCapitulo(tIndex, cIndex)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => agregarCapitulo(tIndex)}>
                  + Agregar capítulo
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={agregarTemporada}>
            + Agregar temporada
          </button>
        </div>
      )}

      <button type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
