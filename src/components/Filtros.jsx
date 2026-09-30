import { useState } from "react";

const vacio = {
  titulo: "",
  actor: "",
  director: "",
  anio: "",
  saga: "",
  categoria: "",
  tipo: "",
};

export default function Filtros({ onBuscar }) {
  const [form, setForm] = useState(vacio);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onBuscar(form);
  };

  const limpiar = () => {
    setForm(vacio);
    onBuscar(vacio);
  };

  return (
    <form className="filtros" onSubmit={handleSubmit}>
      <input
        name="titulo"
        placeholder="Título"
        value={form.titulo}
        onChange={handleChange}
      />
      <input
        name="actor"
        placeholder="Actor"
        value={form.actor}
        onChange={handleChange}
      />
      <input
        name="director"
        placeholder="Director"
        value={form.director}
        onChange={handleChange}
      />
      <input
        name="anio"
        placeholder="Año"
        type="number"
        value={form.anio}
        onChange={handleChange}
      />
      <input
        name="saga"
        placeholder="Saga"
        value={form.saga}
        onChange={handleChange}
      />
      <input
        name="categoria"
        placeholder="Categoría"
        value={form.categoria}
        onChange={handleChange}
      />

      <select name="tipo" value={form.tipo} onChange={handleChange}>
        <option value="">Todos</option>
        <option value="pelicula">Solo películas</option>
        <option value="serie">Solo series</option>
      </select>

      <button type="submit">Buscar</button>
      <button type="button" onClick={limpiar} className="secundario">
        Limpiar
      </button>
    </form>
  );
}
