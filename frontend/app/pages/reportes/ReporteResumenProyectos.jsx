import React, { useEffect, useState } from "react";
import axios from "axios";

const ReporteResumenProyectos = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("/api/vistas/resumen-proyectos")
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
      <h1>Resumen Ejecutivo de Proyectos</h1>
      <table>
        <thead>
          <tr>
            <th>Proyecto</th>
            <th>Total Etapas</th>
            <th>Total Bloques</th>
            <th>Total Lotes</th>
            <th>Total Ingresos</th>
            <th>Precio Promedio Lotes Vendidos</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td>{row.NombreProyecto}</td>
              <td>{row.TotalEtapas}</td>
              <td>{row.TotalBloques}</td>
              <td>{row.TotalLotes}</td>
              <td>{row.TotalIngresos}</td>
              <td>{row.PrecioPromedioLotesVendidos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReporteResumenProyectos;