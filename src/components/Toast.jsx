import { useEffect } from "react";

export default function Toast({ mensaje, tipo = "exito", onCerrar }) {
  useEffect(() => {
    const timer = setTimeout(onCerrar, 3000);
    return () => clearTimeout(timer);
  }, [onCerrar]);

  return (
    <div className={`toast toast-${tipo}`} onClick={onCerrar}>
      {tipo === "exito" ? "✓" : "⚠"} {mensaje}
    </div>
  );
}
