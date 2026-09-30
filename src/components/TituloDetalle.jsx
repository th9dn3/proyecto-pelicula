import { useEffect, useState } from "react";
import { api } from "../api";

export default function TituloDetalle({ tituloId, onVolver, onComentario }) {
  const [titulo, setTitulo] = useState(null);
  const [error, setError] = useState("");

  const cargar = () => {
    api
      .obtenerTitulo(tituloId)
      .then(setTitulo)
      .catch((e) => setError(e.message));
  };

  useEffect(cargar, [tituloId]);

  if (error) return <p className="error">{error}</p>;
  if (!titulo) return <p>Cargando…</p>;

  const esSerie = titulo.tipo === "serie";

  return (
    <div className="detalle">
      <button className="volver" onClick={onVolver}>
        ← Volver
      </button>

      <h2>
        {titulo.titulo}{" "}
        <span className="tipo-badge">
          {esSerie ? "📺 Serie" : "🎬 Película"}
        </span>
      </h2>

      <p className="meta">
        {titulo.fecha_estreno}
        {!esSerie &&
          titulo.duracion_minutos &&
          ` · ${titulo.duracion_minutos} min`}
        {titulo.director && ` · Dir. ${titulo.director}`}
      </p>

      {titulo.saga && <p className="saga">Saga: {titulo.saga.nombre}</p>}

      <div className="chips">
        {titulo.categorias.map((c) => (
          <span key={c.id} className="chip">
            {c.nombre}
          </span>
        ))}
      </div>

      <p className="descripcion">{titulo.descripcion}</p>
      <p>
        <strong>Elenco:</strong>{" "}
        {titulo.actores.map((a) => a.nombre).join(", ") || "—"}
      </p>

      <p className="calificacion-grande">
        {titulo.calificacion_promedio != null
          ? `⭐ ${titulo.calificacion_promedio}/10`
          : "Aún sin calificaciones"}
      </p>

      {esSerie ? (
        <SeccionSerie
          titulo={titulo}
          onCambio={cargar}
          onComentario={onComentario}
        />
      ) : (
        <SeccionComentarios
          comentarios={titulo.comentarios}
          onEnviar={(data) =>
            api.comentarTitulo(titulo.id, data).then(() => {
              cargar();
              onComentario?.();
            })
          }
        />
      )}
    </div>
  );
}

// ---------- Bloque de temporadas/capítulos (solo series) ----------

function SeccionSerie({ titulo, onCambio, onComentario }) {
  return (
    <div className="temporadas-lista">
      <h3>Comentarios generales de la serie</h3>
      <SeccionComentarios
        comentarios={titulo.comentarios}
        onEnviar={(data) =>
          api.comentarTitulo(titulo.id, data).then(() => {
            onCambio();
            onComentario?.();
          })
        }
      />

      <h3>Temporadas</h3>
      {titulo.temporadas.length === 0 && (
        <p>Esta serie todavía no tiene temporadas cargadas.</p>
      )}

      {titulo.temporadas.map((temp) => (
        <details key={temp.id} className="temporada-detalle" open>
          <summary>
            Temporada {temp.numero} {temp.titulo && `— ${temp.titulo}`}
          </summary>

          {temp.capitulos.map((cap) => (
            <div key={cap.id} className="capitulo-detalle">
              <div className="capitulo-header">
                <strong>
                  Cap. {cap.numero}
                  {cap.titulo && `: ${cap.titulo}`}
                </strong>
                <span>
                  {cap.duracion_minutos ? `${cap.duracion_minutos} min · ` : ""}
                  {cap.calificacion_promedio != null
                    ? `⭐ ${cap.calificacion_promedio}/10`
                    : "Sin calificar"}
                </span>
              </div>
              {cap.descripcion && (
                <p className="capitulo-descripcion">{cap.descripcion}</p>
              )}

              <SeccionComentarios
                comentarios={cap.comentarios}
                compacto
                onEnviar={(data) =>
                  api.comentarCapitulo(cap.id, data).then(() => {
                    onCambio();
                    onComentario?.();
                  })
                }
              />
            </div>
          ))}
        </details>
      ))}
    </div>
  );
}

// ---------- Bloque reutilizable: lista de comentarios + formulario ----------

function SeccionComentarios({ comentarios, onEnviar, compacto = false }) {
  const [form, setForm] = useState({ texto: "", calificacion: 8 });

  const handleSubmit = (e) => {
    e.preventDefault();
    onEnviar({ ...form, calificacion: Number(form.calificacion) });
    setForm({ texto: "", calificacion: 8 });
  };

  return (
    <div className={compacto ? "comentarios-compacto" : "comentarios-bloque"}>
      {!compacto && <h4>Comentarios ({comentarios.length})</h4>}
      <ul className="comentarios">
        {comentarios.map((c) => (
          <li key={c.id}>
            ⭐ {c.calificacion}/10
            {c.texto && <p>{c.texto}</p>}
          </li>
        ))}
      </ul>

      <form className="form-comentario" onSubmit={handleSubmit}>
        <textarea
          placeholder="¿Qué te pareció?"
          value={form.texto}
          onChange={(e) => setForm({ ...form, texto: e.target.value })}
        />
        <label>
          Calificación: {form.calificacion}
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={form.calificacion}
            onChange={(e) => setForm({ ...form, calificacion: e.target.value })}
          />
        </label>
        <button type="submit">Comentar</button>
      </form>
    </div>
  );
}
