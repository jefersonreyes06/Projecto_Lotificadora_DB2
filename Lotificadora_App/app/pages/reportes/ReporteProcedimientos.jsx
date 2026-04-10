// ReporteProcedimientos.jsx
import { useState } from "react";

import {
  PageHeader, PageContent, Card, DataTable, Badge, Button, FormField, Input, Select,
} from "../../components/index";

function ReporteMorosos() {
  const [dias, setDias] = useState(30);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const cols = [
    { key: "cliente", label: "Cliente" },
    { key: "dni", label: "DNI" },
    { key: "lote", label: "Lote" },
    { key: "cuotas_vencidas", label: "Cuotas vencidas", render: (v) => <Badge variant="danger">{v}</Badge> },
    { key: "dias_mora", label: "Días mora", render: (v) => <span className="text-red-400">{v}</span> },
    {
      key: "monto_vencido",
      label: "Monto vencido",
      render: (v) => (
        <span className="text-red-400 font-medium">
          L {Number(v).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    { key: "telefono", label: "Teléfono" },
  ];

  return (
    <Card className="p-6 space-y-5">
      <div>
        <p className="font-semibold text-stone-100">Reporte de clientes morosos</p>
        <p className="text-xs text-stone-500 mt-0.5">Procedimiento: sp_reporte_morosos @dias_mora</p>
      </div>
      <div className="flex gap-4 items-end">
        <FormField label="Días en mora (mínimo)">
          <Input
            type="number"
            value={dias}
            onChange={(e) => setDias(e.target.value)}
            className="w-32"
            min={1}
          />
        </FormField>
        <Button
          onClick={() => {
            setLoading(true);
            reportesApi.morosos(dias).then(setData).catch(() => setData([])).finally(() => setLoading(false));
          }}
        >
          Ejecutar SP
        </Button>
      </div>
      <DataTable columns={cols} data={data} loading={loading} />
    </Card>
  );
}

function ReporteIngresos() {
  const now = new Date();
  const [año, setAño] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  return (
    <Card className="p-6 space-y-5">
      <div>
        <p className="font-semibold text-stone-100">Ingresos por mes</p>
        <p className="text-xs text-stone-500 mt-0.5">Procedimiento: sp_ingresos_mes @anio, @mes</p>
      </div>
      <div className="flex gap-4 items-end flex-wrap">
        <FormField label="Año">
          <Input type="number" value={año} onChange={(e) => setAño(e.target.value)} className="w-24" />
        </FormField>
        <FormField label="Mes">
          <Select value={mes} onChange={(e) => setMes(e.target.value)} className="w-36">
            {meses.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </Select>
        </FormField>
        <Button
          onClick={() => {
            setLoading(true);
            reportesApi.ingresosMes(año, mes).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
          }}
        >
          Ejecutar SP
        </Button>
      </div>
      {loading && <p className="text-sm text-stone-500 animate-pulse">Consultando...</p>}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total recaudado", value: `L ${Number(data.total_recaudado ?? 0).toLocaleString("es-HN")}`, accent: true },
            { label: "Pagos en caja", value: data.pagos_caja ?? 0 },
            { label: "Pagos bancarios", value: data.pagos_banco ?? 0 },
            { label: "Cuotas canceladas", value: data.cuotas_canceladas ?? 0 },
          ].map((item) => (
            <div key={item.label} className="bg-stone-800 rounded-md p-4">
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">{item.label}</p>
              <p className={`text-xl font-semibold ${item.accent ? "text-amber-400" : "text-stone-100"}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function ReporteProcedimientos() {
  return (
    <div>
      <PageHeader
        title="Consultas — Procedimientos Almacenados"
        subtitle="Formularios que ejecutan SPs en SQL Server"
      />
      <PageContent>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-800" />
            <p className="text-xs text-stone-600 uppercase tracking-widest">SP 1</p>
            <div className="h-px flex-1 bg-stone-800" />
          </div>
          <ReporteMorosos />

          <div className="flex items-center gap-3 mt-8">
            <div className="h-px flex-1 bg-stone-800" />
            <p className="text-xs text-stone-600 uppercase tracking-widest">SP 2</p>
            <div className="h-px flex-1 bg-stone-800" />
          </div>
          <ReporteIngresos />
        </div>
      </PageContent>
    </div>
  );
}
