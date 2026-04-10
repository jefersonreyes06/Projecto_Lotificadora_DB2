import { useState } from "react";

import {
  PageHeader, PageContent, Card, DataTable, Badge, Button, FormField, Select, StatCard,
} from "../../components/index";

// ──── REPORTE 1: vw_ocupacion_lotes ────────────────
function OcupacionLotes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estado, setEstado] = useState("");

  const buscar = () => {
    setLoading(true);
    reportesApi
      .ocupacionLotes({ estado })
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  const cols = [
    { key: "proyecto", label: "Proyecto" },
    { key: "etapa", label: "Etapa" },
    { key: "total_lotes", label: "Total" },
    {
      key: "disponibles",
      label: "Disponibles",
      render: (v) => <Badge variant="success">{v}</Badge>,
    },
    {
      key: "vendidos",
      label: "Vendidos",
      render: (v) => <Badge variant="danger">{v}</Badge>,
    },
    {
      key: "reservados",
      label: "Reservados",
      render: (v) => <Badge variant="warning">{v}</Badge>,
    },
    {
      key: "pct_ocupacion",
      label: "% Ocupación",
      render: (v) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full"
              style={{ width: `${Math.min(v, 100)}%` }}
            />
          </div>
          <span className="text-stone-300 text-xs">{Number(v).toFixed(1)}%</span>
        </div>
      ),
    },
  ];

  return (
    <Card className="p-6 space-y-5">
      <div>
        <p className="font-semibold text-stone-100">Ocupación de lotes por etapa</p>
        <p className="text-xs text-stone-500 mt-0.5">Vista: vw_ocupacion_lotes</p>
      </div>
      <div className="flex gap-4 items-end">
        <FormField label="Filtrar estado">
          <Select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-40">
            <option value="">Todos</option>
            <option value="Disponible">Disponible</option>
            <option value="Vendido">Vendido</option>
            <option value="Reservado">Reservado</option>
          </Select>
        </FormField>
        <Button onClick={buscar}>Consultar vista</Button>
      </div>
      <DataTable columns={cols} data={data} loading={loading} />
    </Card>
  );
}

// ──── REPORTE 2: vw_resumen_proyectos ──────────────
function ResumenProyectos() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const cargar = () => {
    setLoading(true);
    reportesApi
      .resumenProyectos()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <Card className="p-6 space-y-5">
      <div>
        <p className="font-semibold text-stone-100">Resumen ejecutivo de proyectos</p>
        <p className="text-xs text-stone-500 mt-0.5">Vista: vw_resumen_proyectos</p>
      </div>
      <Button onClick={cargar} disabled={loading}>
        {loading ? "Cargando..." : "Cargar desde vista SQL"}
      </Button>
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(data).map(([k, v]) => (
            <div key={k} className="bg-stone-800 rounded-md p-4">
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">
                {k.replace(/_/g, " ")}
              </p>
              <p className="text-xl font-semibold text-amber-400">
                {typeof v === "number" ? v.toLocaleString("es-HN") : v}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ──── PAGE ─────────────────────────────────────────
export default function ReporteVistas() {
  return (
    <div>
      <PageHeader
        title="Consultas — Vistas SQL"
        subtitle="Formularios que consumen vistas definidas en SQL Server"
      />
      <PageContent>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-800" />
            <p className="text-xs text-stone-600 uppercase tracking-widest">Vista 1</p>
            <div className="h-px flex-1 bg-stone-800" />
          </div>
          <OcupacionLotes />

          <div className="flex items-center gap-3 mt-8">
            <div className="h-px flex-1 bg-stone-800" />
            <p className="text-xs text-stone-600 uppercase tracking-widest">Vista 2</p>
            <div className="h-px flex-1 bg-stone-800" />
          </div>
          <ResumenProyectos />
        </div>
      </PageContent>
    </div>
  );
}
