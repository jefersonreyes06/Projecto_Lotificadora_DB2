import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { pagosApi } from "../../services/api.js";

import {
  PageHeader, PageContent, Button, DataTable, Badge, Card, Input, Select,
} from "../../components/index";

const TIPO_COLORS = { Contado: "success", Credito: "info" };
const ESTADO_COLORS = { Activo: "success", Cancelado: "danger", "Al día": "success", "En mora": "danger", "Pagado": "default" };

export default function CuentasActivasList() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    pagosApi.cuentasPendientes()
      .then((cuentasData) => {
        setData(cuentasData);
        setFiltered(cuentasData);
      })
      .catch((err) => {
        console.error("Error cargando cuentas pendientes:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: "VentaID", label: "#", width: 60, render: (v) => <span className="text-stone-500 font-mono text-xs">{v}</span> },
    { key: "Proyecto", label: "Proyecto" },
    { key: "Etapa", label: "Etapa" },
    { key: "Bloque", label: "Bloque" },
    { key: "NumeroLote", label: "Número de Lote" },
    { key: "PrecioFinal", label: "Precio Final" },
    { key: "NombreCompleto", label: "Nombre Completo" },
    { key: "DNI", label: "DNI" },
    { key: "Estado", label: "Estado" },
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
        title="Cuentas Activas"
        subtitle="vw_prestamos_activos - Créditos que aún no han sido pagados en su totalidad"
      />
      <PageContent>
        {/* Stats rápidas */}
        <Card>
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
          />
        </Card>
      </PageContent>
    </div>
  );
}
