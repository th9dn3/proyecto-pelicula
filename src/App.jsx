import { useEffect, useState } from "react";
import { api } from "./api";
import Filtros from "./components/Filtros";
import TituloCard from "./components/TituloCard";
import TituloDetalle from "./components/TituloDetalle";
import AgregarTitulo from "./components/AgregarTitulo";
import Toast from "./components/Toast";

export default function App() {
  const [vista, setVista] = useState("lista");
  const [titulos, setTitulos] = useState([]);
  const [tituloSeleccionado, setTituloSeleccionado] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState(null);

  const buscar = (filtros = {}) => {
    setCargando(true);
    api
      .listarTitulos(filtros)
      .then(setTitulos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  };

  useEffect(buscar, []);

  const mostrarToast = (mensaje, tipo = "exito") => setToast({ mensaje, tipo });

  return (
    <div className="app">
      <header>
        <h1 onClick={() => setVista("lista")}>🎬 Mi Catálogo</h1>
        <button onClick={() => setVista("agregar")}>+ Agregar</button>
      </header>

      {error && (
        <p className="error">{error} (¿está corriendo el backend en :8000?)</p>
      )}

      {vista === "lista" && (
        <>
          <Filtros onBuscar={buscar} />
          {cargando ? (
            <div className="spinner-container">
              <div className="spinner" />
              <span>Cargando…</span>
            </div>
          ) : (
            <div className="grid">
              {titulos.map((t, i) => (
                <div key={t.id} style={{ "--delay": `${i * 0.05}s` }}>
                  <TituloCard
                    titulo={t}
                    onSeleccionar={(id) => {
                      setTituloSeleccionado(id);
                      setVista("detalle");
                    }}
                  />
                </div>
              ))}
              {titulos.length === 0 && (
                <p>No hay resultados para esta búsqueda.</p>
              )}
            </div>
          )}
        </>
      )}

      {vista === "detalle" && (
        <TituloDetalle
          tituloId={tituloSeleccionado}
          onVolver={() => {
            setVista("lista");
            buscar();
          }}
          onComentario={() => mostrarToast("Comentario agregado")}
        />
      )}

      {vista === "agregar" && (
        <AgregarTitulo
          onCreado={() => {
            setVista("lista");
            buscar();
            mostrarToast("Guardado correctamente");
          }}
        />
      )}

      {toast && (
        <Toast
          mensaje={toast.mensaje}
          tipo={toast.tipo}
          onCerrar={() => setToast(null)}
        />
      )}
    </div>
  );
}
