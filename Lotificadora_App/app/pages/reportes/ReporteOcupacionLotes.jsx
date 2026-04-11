import React, { useEffect, useState } from "react";
import axios from "axios";

const ReporteOcupacionLotes = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("/api/vistas/ocupacion-lotes")
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Ocupación de Lotes por Etapa</h1>
      <table>
        <thead>
          <tr>
            <th>Etapa</th>
            <th>Proyecto</th>
            <th>Lotes Disponibles</th>
            <th>Lotes en Proceso</th>
            <th>Lotes Vendidos</th>
            <th>Total Lotes</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td>{row.NombreEtapa}</td>
              <td>{row.NombreProyecto}</td>
              <td>{row.LotesDisponibles}</td>
              <td>{row.LotesEnProceso}</td>
              <td>{row.LotesVendidos}</td>
              <td>{row.TotalLotes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReporteOcupacionLotes;