const BASE_URL = "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detalle = await res.json().catch(() => ({}));
    throw new Error(detalle.detail || `Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  listarTitulos: (filtros = {}) => {
    const params = new URLSearchParams(
      Object.entries(filtros).filter(([, v]) => v !== "" && v != null),
    );
    const qs = params.toString();
    return request(`/titulos${qs ? `?${qs}` : ""}`);
  },
  obtenerTitulo: (id) => request(`/titulos/${id}`),
  crearPelicula: (data) =>
    request("/peliculas", { method: "POST", body: JSON.stringify(data) }),
  crearSerie: (data) =>
    request("/series", { method: "POST", body: JSON.stringify(data) }),
  comentarTitulo: (tituloId, data) =>
    request(`/titulos/${tituloId}/comentarios`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  comentarCapitulo: (capituloId, data) =>
    request(`/capitulos/${capituloId}/comentarios`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  listarActores: () => request("/actores"),
  listarCategorias: () => request("/categorias"),
  listarSagas: () => request("/sagas"),
};
