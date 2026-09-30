export default function TituloCard({ titulo, onSeleccionar }) {
  const anio = titulo.fecha_estreno ? titulo.fecha_estreno.slice(0, 4) : "—";
  const esSerie = titulo.tipo === "serie";

  return (
    <div className="card" onClick={() => onSeleccionar(titulo.id)}>
      <div className="card-header">
        <h3>{titulo.titulo}</h3>
        <span className="anio">{anio}</span>
      </div>

      <p className="tipo-badge">{esSerie ? "📺 Serie" : "🎬 Película"}</p>

      {titulo.director && <p className="director">Dir. {titulo.director}</p>}
      {titulo.saga && <p className="saga">Saga: {titulo.saga.nombre}</p>}

      {!esSerie && titulo.duracion_minutos && (
        <p className="duracion">{titulo.duracion_minutos} min</p>
      )}

      <div className="card-footer">
        <span className="calificacion">
          {titulo.calificacion_promedio != null
            ? `⭐ ${titulo.calificacion_promedio}/10`
            : "Sin calificar"}
        </span>
      </div>
    </div>
  );
}
