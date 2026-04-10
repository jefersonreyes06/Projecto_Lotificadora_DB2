import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import {
  PageHeader, PageContent, Card, DataTable, Badge, StatCard, Button,
} from "../../components/index";

export default function PlanPagos() {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ventasApi.planPagos(id),
      ventasApi.amortizacion(id), // fn_tabla_amortizacion — función tipo tabla
    ])
      .then(([planData, amortData]) => {
        setPlan(planData);
        setCuotas(amortData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const columns = [
    {
      key: "numero_cuota",
      label: "#",
      width: 60,
      render: (v) => <span className="text-stone-500">{v}</span>,
    },
    {
      key: "fecha_vencimiento",
      label: "Vencimiento",
      render: (v) => new Date(v).toLocaleDateString("es-HN"),
    },
    {
      key: "cuota_total",
      label: "Cuota",
      render: (v) => (
        <span className="font-medium text-stone-200">
          L {Number(v).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "capital",
      label: "Capital",
      render: (v) => (
        <span className="text-blue-400">
          L {Number(v).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "interes",
      label: "Interés",
      render: (v) => (
        <span className="text-amber-400">
          L {Number(v).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "saldo",
      label: "Saldo",
      render: (v) => (
        <span className="text-stone-400">
          L {Number(v).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "estado",
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
        subtitle={`fn_tabla_amortizacion(${id}) — función tipo tabla SQL`}
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
