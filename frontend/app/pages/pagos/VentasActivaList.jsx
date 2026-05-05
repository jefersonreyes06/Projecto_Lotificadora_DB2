import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { cuentasApi, pagosApi } from "../../services/api.js";

import {
  PageHeader, PageContent, Button, DataTable, Badge, Card, Input, Select,
} from "../../components/index";

const TIPO_COLORS = { Contado: "success", Credito: "info" };
const ESTADO_COLORS = { Activo: "success", Cancelado: "danger", "Al día": "success", "En mora": "danger", "Pagado": "default" };

export default function CuentasActivasList() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState({ estado: "", nombreCompleto: "" });
  const [loading, setLoading] = useState(true);

  const fetchCuentas = async () => {
    setLoading(true);
    try {
      const response = await pagosApi.cuentasPendientes({
        Estado: filtered.estado || null,
        Cliente: filtered.nombreCompleto || null
      });
      const cleanData = Array.isArray(response) ? response : (response.data || []);

      setData(cleanData);
    } catch (err) {
      console.error("Error:", err);
      setData([]); // Si falla, que sea un array vacío para que .map() no explote
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuentas();
  }, [filtered.estado]);

  const handleFilter = () => {
    fetchCuentas();
  }

  const columns = [
    { key: "Lote", label: "Lote" },
    { key: "NombreCompleto", label: "Cliente" },
    { key: "NumeroCuota", label: "No. Cuota" },
    { key: "MontoCuota", label: "Monto de la Cuota" },
    { key: "FechaVencimiento", label: "Fecha de Vencimiento", render: (v) => new Date(v).toLocaleDateString("es-HN") },
    {
      key: "VentaID",
      label: "",
      width: 130,
      render: (id, row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Link to={`/ventas/${id}`}><Button size="sm" variant="ghost">Detalle</Button></Link>

        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Cuotas"
        subtitle="sp_ver_cuentas - Créditos que aún no han sido pagados en su totalidad"
      />
      <Card className="p-4 mx-8 my-3">
        <div className="flex gap-4">
          <Select
            value={filtered.estado}
            onChange={(e) => setFiltered({ ...filtered, estado: e.target.value })}
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="mora">Mora</option>
          </Select>
          <Input
            placeholder="Buscar por cliente"
            value={filtered.nombreCompleto}
            onChange={(e) => setFiltered({ ...filtered, nombreCompleto: e.target.value })}
          />
          <Button onClick={handleFilter} variant="outline">Filtrar</Button>
        </div>
      </Card>
      <PageContent>
        {/* Stats rápidas */}
        <Card>
          <DataTable
            columns={columns}
            data={Array.isArray(data) ? data : []}
            loading={loading}
          />
        </Card>
      </PageContent>
    </div>
  );
}
