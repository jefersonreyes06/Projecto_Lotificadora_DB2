import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ventasApi } from "../../services/api.js";
import {
  PageHeader, PageContent, Card, DataTable, Badge, StatCard, Button,
} from "../../components/index";

export default function PlanPagos() {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fmtLps = (v) => v != null ? `L ${Number(v).toLocaleString("es-HN", { minimumFractionDigits: 2 })}` : "—";

  useEffect(() => {
    ventasApi.planPagos(id)
      .then((data) => {
        setCuotas(data); // data es el array de cuotas
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [id]);

  const columns = [
    {
      key: "NumeroCuota",
      label: "# Cuota",
      width: 150,
      render: (v) => <span className="text-stone-500">Cuota N° {v}</span>,
    },
    {
      key: "MontoCuota",
      label: "Monto Cuota Pendiente",
      render: (v) => <span>{fmtLps(v)}</span>,
    },
    {
      key: "FechaVencimiento",
      label: "Vencimiento",
      render: (v) => new Date(v).toLocaleDateString("es-HN"),
    },
    {
      key: "EstadoCuota",
      label: "Estado cuota",
    },
    {
      key: "EstadoVenta",
      label: "Estado venta",
    },
    {
      key: "EstadoCuota",
      label: "Estado",
      render: (v) => (
        <Badge
          variant={
            v === "Pagada" ? "success" : v === "Vencida" ? "danger" : "default"
          }
        >
          {v}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Plan de Pagos"
        subtitle={`fn_plan_pago_cliente(${id}) — función tipo tabla SQL`}
        actions={
          <Link to="/ventas">
            <Button variant="ghost">← Volver</Button>
          </Link>
        }
      />
      <PageContent>
        {plan && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Monto total"
              value={`L ${Number(plan.monto_total ?? 0).toLocaleString("es-HN")}`}
            />
            <StatCard
              label="Cuota mensual"
              value={`L ${Number(plan.cuota_mensual ?? 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`}
              accent
            />
            <StatCard
              label="Plazo"
              value={`${plan.anios ?? 0} años`}
              sub={`${(plan.anios ?? 0) * 12} cuotas`}
            />
            <StatCard
              label="Tasa interés"
              value={`${plan.tasa_interes ?? 0}%`}
              sub="Tasa anual etapa"
            />
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-stone-500">
            Tabla de amortización · Cuotas pagaderas a más tardar el último día de cada mes
          </p>
          <div className="flex gap-3 text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Capital
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Interés
            </span>
          </div>
        </div>

        <Card>
          <DataTable columns={columns} data={cuotas} loading={loading} />
        </Card>
      </PageContent>
    </div>
  );
}
