import { useState } from "react";
import { reportesApi } from "../../services/api.js";

const ReporteOcupacionLotes = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [estado, setEstado] = useState("");

  const buscar = () => {
    setLoading(true);
    setError(null);
    reportesApi
      .ocupacionLotes({ estado: estado || "" })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h1>Ocupación de Lotes por Etapa</h1>

      <div>
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos</option>
          <option value="Disponible">Disponible</option>
          <option value="Vendido">Vendido</option>
          <option value="Reservado">Reservado</option>
        </select>
        <button onClick={buscar}>Consultar</button>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p>Error: {error}</p>}

      <table>
        <thead>
          <tr>
            <th>Proyecto</th>
            <th>Etapa</th>
            <th>Total</th>
            <th>Disponibles</th>
            <th>Vendidos</th>
            <th>Reservados</th>
            <th>% Ocupación</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td>{row.proyecto}</td>
              <td>{row.etapa}</td>
              <td>{row.total_lotes}</td>
              <td>{row.disponibles}</td>
              <td>{row.vendidos}</td>
              <td>{row.reservados}</td>
              <td>{Number(row.pct_ocupacion).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReporteOcupacionLotes;