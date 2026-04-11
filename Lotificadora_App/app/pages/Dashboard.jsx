import { useEffect, useState } from "react";
import { Link } from "react-router";
import { StatCard, Card, Badge, PageHeader, PageContent } from "../components/index";

const quickLinks = [
  { to: "/lotes/disponibles", label: "Ver lotes disponibles", icon: "◉", desc: "Consulta en tiempo real" },
  { to: "/ventas/nueva", label: "Nueva venta", icon: "◆", desc: "Venta contado o crédito" },
  { to: "/pagos/nuevo", label: "Registrar pago", icon: "◎", desc: "Efectivo o depósito" },
  { to: "/reportes/vistas", label: "Reportes de vistas", icon: "◐", desc: "Ocupación y resumen" },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    proyectosApi
      .dashboard()
      .then((result) => {
        if (mounted) setStats(result);
      })
      .catch(() => {
        if (mounted) setStats({});
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const s = stats || {};

  return (
    <div>
      <PageHeader
        title="Panel General"
        subtitle="Resumen ejecutivo · Proyectos Habitacionales"
      />
      <PageContent>
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Proyectos activos"
            value={loading ? "—" : s.proyectos ?? 0}
            sub="En operación"
          />
          <StatCard
            label="Lotes disponibles"
            value={loading ? "—" : s.lotes_disponibles ?? 0}
            sub="Para la venta"
            accent
          />
          <StatCard
            label="Ventas este mes"
            value={loading ? "—" : `L ${Number(s.ventas_mes ?? 0).toLocaleString()}`}
            sub="Ingresos registrados"
          />
          <StatCard
            label="Pagos pendientes"
            value={loading ? "—" : s.cuotas_vencidas ?? 0}
            sub="Cuotas en mora"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Accesos rápidos */}
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">
              Accesos rápidos
            </p>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((ql) => (
                <Link
                  key={ql.to}
                  to={ql.to}
                  className="group bg-stone-900 border border-stone-800 hover:border-amber-400/30 rounded-lg p-4 transition-all"
                >
                  <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform origin-left">
                    {ql.icon}
                  </span>
                  <p className="text-sm font-medium text-stone-200 group-hover:text-amber-400 transition-colors">
                    {ql.label}
                  </p>
                  <p className="text-xs text-stone-600 mt-0.5">{ql.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Server-side legend */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">
              Procesamiento servidor
            </p>
            <Card className="p-4 space-y-3">
              {[
                { label: "Procedimientos almacenados", count: "CRUD completo", color: "success" },
                { label: "Triggers activos", count: "≥ 10 definidos", color: "info" },
                { label: "Funciones escalares", count: "5 funciones", color: "warning" },
                { label: "Funciones tipo tabla", count: "5 funciones", color: "warning" },
                { label: "Cursores", count: "3 procedimientos", color: "info" },
                { label: "Manejo transaccional", count: "3 procedimientos", color: "success" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-stone-400">{item.label}</span>
                  <Badge variant={item.color}>{item.count}</Badge>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </PageContent>
    </div>
  );
}
