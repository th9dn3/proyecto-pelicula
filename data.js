import { db } from "./db.js";

// ============================================================
// Helpers "obtener o crear" (evitan actores/categorías/sagas duplicados)
// ============================================================

function getOrCreateActor(nombre) {
  nombre = nombre.trim();
  let row = db
    .prepare("SELECT * FROM actores WHERE nombre = ? COLLATE NOCASE")
    .get(nombre);
  if (!row) {
    const info = db
      .prepare("INSERT INTO actores (nombre) VALUES (?)")
      .run(nombre);
    row = { id: info.lastInsertRowid, nombre };
  }
  return row;
}

function getOrCreateCategoria(nombre) {
  nombre = nombre.trim();
  let row = db
    .prepare("SELECT * FROM categorias WHERE nombre = ? COLLATE NOCASE")
    .get(nombre);
  if (!row) {
    const info = db
      .prepare("INSERT INTO categorias (nombre) VALUES (?)")
      .run(nombre);
    row = { id: info.lastInsertRowid, nombre };
  }
  return row;
}

function getOrCreateSaga(nombre) {
  nombre = nombre.trim();
  let row = db
    .prepare("SELECT * FROM sagas WHERE nombre = ? COLLATE NOCASE")
    .get(nombre);
  if (!row) {
    const info = db
      .prepare("INSERT INTO sagas (nombre) VALUES (?)")
      .run(nombre);
    row = { id: info.lastInsertRowid, nombre };
  }
  return row;
}

// Vincula actores/categorías a un titulo_id (se usa para películas y series)
function vincularActoresYCategorias(tituloId, actores = [], categorias = []) {
  const linkActor = db.prepare(
    "INSERT OR IGNORE INTO titulo_actor (titulo_id, actor_id) VALUES (?, ?)",
  );
  for (const nombre of actores) {
    const actor = getOrCreateActor(nombre);
    linkActor.run(tituloId, actor.id);
  }

  const linkCategoria = db.prepare(
    "INSERT OR IGNORE INTO titulo_categoria (titulo_id, categoria_id) VALUES (?, ?)",
  );
  for (const nombre of categorias) {
    const cat = getOrCreateCategoria(nombre);
    linkCategoria.run(tituloId, cat.id);
  }
}

// ============================================================
// Crear película
// ============================================================

export function crearPelicula(data) {
  const {
    titulo,
    fecha_estreno = null,
    descripcion = null,
    director = null,
    duracion_minutos = null,
    saga = null,
    actores = [],
    categorias = [],
  } = data;

  if (!titulo || !titulo.trim()) throw new Error("El título es obligatorio");

  const sagaRow = saga ? getOrCreateSaga(saga) : null;

  const infoTitulo = db
    .prepare(
      `
    INSERT INTO titulos (tipo, titulo, fecha_estreno, descripcion, director, saga_id)
    VALUES ('pelicula', ?, ?, ?, ?, ?)
  `,
    )
    .run(titulo, fecha_estreno, descripcion, director, sagaRow?.id ?? null);

  const tituloId = infoTitulo.lastInsertRowid;

  db.prepare(
    "INSERT INTO peliculas (titulo_id, duracion_minutos) VALUES (?, ?)",
  ).run(tituloId, duracion_minutos);

  vincularActoresYCategorias(tituloId, actores, categorias);

  return obtenerTitulo(tituloId);
}

// ============================================================
// Crear serie (con temporadas y capítulos anidados)
// ============================================================

export function crearSerie(data) {
  const {
    titulo,
    fecha_estreno = null,
    descripcion = null,
    director = null,
    saga = null,
    actores = [],
    categorias = [],
    temporadas = [],
  } = data;

  if (!titulo || !titulo.trim()) throw new Error("El título es obligatorio");

  const sagaRow = saga ? getOrCreateSaga(saga) : null;

  const infoTitulo = db
    .prepare(
      `
    INSERT INTO titulos (tipo, titulo, fecha_estreno, descripcion, director, saga_id)
    VALUES ('serie', ?, ?, ?, ?, ?)
  `,
    )
    .run(titulo, fecha_estreno, descripcion, director, sagaRow?.id ?? null);

  const tituloId = infoTitulo.lastInsertRowid;

  db.prepare("INSERT INTO series (titulo_id) VALUES (?)").run(tituloId);

  vincularActoresYCategorias(tituloId, actores, categorias);

  const insertTemporada = db.prepare(`
    INSERT INTO temporadas (serie_id, numero, titulo, fecha_estreno) VALUES (?, ?, ?, ?)
  `);
  const insertCapitulo = db.prepare(`
    INSERT INTO capitulos (temporada_id, numero, titulo, duracion_minutos, descripcion, fecha_emision)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const temp of temporadas) {
    const infoTemp = insertTemporada.run(
      tituloId,
      temp.numero,
      temp.titulo ?? null,
      temp.fecha_estreno ?? null,
    );
    const temporadaId = infoTemp.lastInsertRowid;

    for (const cap of temp.capitulos ?? []) {
      insertCapitulo.run(
        temporadaId,
        cap.numero,
        cap.titulo ?? null,
        cap.duracion_minutos ?? null,
        cap.descripcion ?? null,
        cap.fecha_emision ?? null,
      );
    }
  }

  return obtenerTitulo(tituloId);
}

// ============================================================
// Calificación promedio
// ============================================================

// Promedio de un título: si es película, de sus propios comentarios.
// Si es serie, junta los comentarios generales de la serie MÁS los de
// todos sus capítulos.
function calificacionPromedioTitulo(tituloId) {
  const row = db
    .prepare(
      `
    SELECT AVG(calificacion) AS promedio FROM (
      SELECT calificacion FROM comentarios WHERE titulo_id = ?
      UNION ALL
      SELECT c.calificacion FROM comentarios c
      JOIN capitulos cap ON cap.id = c.capitulo_id
      JOIN temporadas t ON t.id = cap.temporada_id
      WHERE t.serie_id = ?
    )
  `,
    )
    .get(tituloId, tituloId);
  return row.promedio != null ? Math.round(row.promedio * 100) / 100 : null;
}

function calificacionPromedioCapitulo(capituloId) {
  const row = db
    .prepare(
      "SELECT AVG(calificacion) AS promedio FROM comentarios WHERE capitulo_id = ?",
    )
    .get(capituloId);
  return row.promedio != null ? Math.round(row.promedio * 100) / 100 : null;
}

// ============================================================
// Obtener un título completo (película o serie) por id
// ============================================================

export function obtenerTitulo(id) {
  const titulo = db.prepare("SELECT * FROM titulos WHERE id = ?").get(id);
  if (!titulo) return null;

  titulo.saga = titulo.saga_id
    ? db.prepare("SELECT * FROM sagas WHERE id = ?").get(titulo.saga_id)
    : null;

  titulo.actores = db
    .prepare(
      `
    SELECT a.* FROM actores a
    JOIN titulo_actor ta ON ta.actor_id = a.id
    WHERE ta.titulo_id = ? ORDER BY a.nombre
  `,
    )
    .all(id);

  titulo.categorias = db
    .prepare(
      `
    SELECT c.* FROM categorias c
    JOIN titulo_categoria tc ON tc.categoria_id = c.id
    WHERE tc.titulo_id = ? ORDER BY c.nombre
  `,
    )
    .all(id);

  titulo.calificacion_promedio = calificacionPromedioTitulo(id);

  if (titulo.tipo === "pelicula") {
    const pelicula = db
      .prepare("SELECT duracion_minutos FROM peliculas WHERE titulo_id = ?")
      .get(id);
    titulo.duracion_minutos = pelicula?.duracion_minutos ?? null;
    titulo.comentarios = db
      .prepare("SELECT * FROM comentarios WHERE titulo_id = ? ORDER BY id DESC")
      .all(id);
  }

  if (titulo.tipo === "serie") {
    titulo.comentarios = db
      .prepare("SELECT * FROM comentarios WHERE titulo_id = ? ORDER BY id DESC")
      .all(id);

    const temporadas = db
      .prepare("SELECT * FROM temporadas WHERE serie_id = ? ORDER BY numero")
      .all(id);

    for (const temp of temporadas) {
      temp.capitulos = db
        .prepare(
          "SELECT * FROM capitulos WHERE temporada_id = ? ORDER BY numero",
        )
        .all(temp.id);

      for (const cap of temp.capitulos) {
        cap.calificacion_promedio = calificacionPromedioCapitulo(cap.id);
        cap.comentarios = db
          .prepare(
            "SELECT * FROM comentarios WHERE capitulo_id = ? ORDER BY id DESC",
          )
          .all(cap.id);
      }
    }
    titulo.temporadas = temporadas;
  }

  return titulo;
}

// ============================================================
// Listar / buscar títulos (películas y series juntas)
// ============================================================

export function listarTitulos(filtros = {}) {
  const {
    actor,
    director,
    anio,
    saga,
    categoria,
    titulo: textoTitulo,
    tipo,
  } = filtros;

  let sql = "SELECT DISTINCT t.* FROM titulos t";
  const condiciones = [];
  const params = [];

  if (saga) {
    sql += " JOIN sagas s ON s.id = t.saga_id";
    condiciones.push("s.nombre LIKE ? COLLATE NOCASE");
    params.push(`%${saga}%`);
  }
  if (actor) {
    sql +=
      " JOIN titulo_actor ta ON ta.titulo_id = t.id JOIN actores a ON a.id = ta.actor_id";
    condiciones.push("a.nombre LIKE ? COLLATE NOCASE");
    params.push(`%${actor}%`);
  }
  if (categoria) {
    sql +=
      " JOIN titulo_categoria tc ON tc.titulo_id = t.id JOIN categorias c ON c.id = tc.categoria_id";
    condiciones.push("c.nombre LIKE ? COLLATE NOCASE");
    params.push(`%${categoria}%`);
  }
  if (textoTitulo) {
    condiciones.push("t.titulo LIKE ? COLLATE NOCASE");
    params.push(`%${textoTitulo}%`);
  }
  if (director) {
    condiciones.push("t.director LIKE ? COLLATE NOCASE");
    params.push(`%${director}%`);
  }
  if (anio) {
    condiciones.push("strftime('%Y', t.fecha_estreno) = ?");
    params.push(String(anio));
  }
  if (tipo) {
    condiciones.push("t.tipo = ?");
    params.push(tipo);
  }

  if (condiciones.length) sql += " WHERE " + condiciones.join(" AND ");
  sql += " ORDER BY t.titulo";

  const rows = db.prepare(sql).all(...params);

  return rows.map((row) => {
    row.saga = row.saga_id
      ? db.prepare("SELECT * FROM sagas WHERE id = ?").get(row.saga_id)
      : null;
    row.calificacion_promedio = calificacionPromedioTitulo(row.id);
    if (row.tipo === "pelicula") {
      const p = db
        .prepare("SELECT duracion_minutos FROM peliculas WHERE titulo_id = ?")
        .get(row.id);
      row.duracion_minutos = p?.duracion_minutos ?? null;
    }
    return row;
  });
}

// Nota a propósito: no existe ninguna función para eliminar títulos,
// películas, series, temporadas ni capítulos. Solo se agregan y comentan.

// ============================================================
// Comentarios
// ============================================================

// Comenta un título completo (película, o serie en general)
export function comentarTitulo(tituloId, data) {
  const titulo = db
    .prepare("SELECT id FROM titulos WHERE id = ?")
    .get(tituloId);
  if (!titulo) return null;

  const { texto = null, calificacion, fecha = null } = data;
  if (calificacion == null || calificacion < 0 || calificacion > 10) {
    throw new Error("La calificación debe ser un número entre 0 y 10");
  }

  const info = db
    .prepare(
      "INSERT INTO comentarios (titulo_id, texto, calificacion, fecha) VALUES (?, ?, ?, ?)",
    )
    .run(tituloId, texto, calificacion, fecha);

  return db
    .prepare("SELECT * FROM comentarios WHERE id = ?")
    .get(info.lastInsertRowid);
}

// Comenta un capítulo específico
export function comentarCapitulo(capituloId, data) {
  const capitulo = db
    .prepare("SELECT id FROM capitulos WHERE id = ?")
    .get(capituloId);
  if (!capitulo) return null;

  const { texto = null, calificacion, fecha = null } = data;
  if (calificacion == null || calificacion < 0 || calificacion > 10) {
    throw new Error("La calificación debe ser un número entre 0 y 10");
  }

  const info = db
    .prepare(
      "INSERT INTO comentarios (capitulo_id, texto, calificacion, fecha) VALUES (?, ?, ?, ?)",
    )
    .run(capituloId, texto, calificacion, fecha);

  return db
    .prepare("SELECT * FROM comentarios WHERE id = ?")
    .get(info.lastInsertRowid);
}

// ============================================================
// Catálogos
// ============================================================

export function listarActores() {
  return db.prepare("SELECT * FROM actores ORDER BY nombre").all();
}
export function listarCategorias() {
  return db.prepare("SELECT * FROM categorias ORDER BY nombre").all();
}
export function listarSagas() {
  return db.prepare("SELECT * FROM sagas ORDER BY nombre").all();
}
