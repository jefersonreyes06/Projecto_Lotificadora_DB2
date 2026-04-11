import { useEffect, useState } from "react";
import { Link } from "react-router";

import {
  PageHeader, PageContent, Card, DataTable, Badge, Button, Alert,
} from "../../components/index";
import { ventasApi } from "../../../services/api";

const ESTADO_COLORS = {
  Activa: "success",
  Cancelada: "danger",
  Completada: "info",
};

export default function VentasList() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    ventasApi.list()
      .then(setVentas)
      .catch((err) => setError(err.message || "Error cargando ventas"))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: "VentaID", header: "ID", sortable: true },
    { key: "ClienteNombre", header: "Cliente", sortable: true },
    { key: "NumeroLote", header: "Lote", sortable: true },
    { key: "FechaVenta", header: "Fecha", sortable: true, type: "date" },
    { key: "TipoVenta", header: "Tipo", sortable: true },
    { key: "MontoTotal", header: "Monto Total", sortable: true, type: "currency" },
    { key: "Estado", header: "Estado", sortable: true, render: (value) => (
      <Badge variant={ESTADO_COLORS[value] || "default"}>{value}</Badge>
    ) },
    { key: "actions", header: "Acciones", render: (_, row) => (
      <div className="flex gap-2">
        <Link to={`/ventas/${row.VentaID}/plan-pagos`}>
          <Button size="sm" variant="secondary">Plan de Pagos</Button>
        </Link>
        <Link to={`/ventas/${row.VentaID}/amortizacion`}>
          <Button size="sm" variant="secondary">Amortización</Button>
        </Link>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader
        title="Ventas"
        subtitle="Gestión de ventas de lotes"
        actions={
          <Link to="/ventas/nueva">
            <Button>Nueva Venta</Button>
          </Link>
        }
      />
      <PageContent>
        {error && <Alert variant="error">{error}</Alert>}
        <Card>
          <DataTable
            data={ventas}
            columns={columns}
            loading={loading}
            emptyMessage="No hay ventas registradas"
          />
        </Card>
      </PageContent>
    </div>
  );
}