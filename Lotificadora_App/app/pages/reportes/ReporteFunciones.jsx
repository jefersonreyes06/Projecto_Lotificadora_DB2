import { useEffect, useState } from "react";
import { proyectosApi, etapasApi, reportesApi } from "../../services/api.js";

import {
  PageHeader, PageContent, Card, DataTable, Badge, Button, FormField, Select,
} from "../../components/index";

// fn_lotes_por_etapa(etapaId) — función tipo tabla
function LotesPorEtapa() {
  const [proyectos, setProyectos] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [proyectoId, setProyectoId] = useState("");
  const [etapaId, setEtapaId] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { proyectosApi.list().then(setProyectos).catch(() => {}); }, []);
  useEffect(() => {
    if (!proyectoId) { setEtapas([]); return; }
    etapasApi.list(proyectoId).then(setEtapas).catch(() => {});
  }, [proyectoId]);

  const cols = [
    { key: "codigo_lote", label: "Código" },
    { key: "bloque", label: "Bloque" },
    { key: "area_m2", label: "Área v²", render: (v) => Number(v).toLocaleString() },
    { key: "estado", label: "Estado", render: (v) => <Badge variant={v === "Disponible" ? "success" : v === "Vendido" ? "danger" : "warning"}>{v}</Badge> },
    { key: "valor_total", label: "Valor", render: (v) => <span className="text-amber-400">L {Number(v).toLocaleString("es-HN")}</span> },
  ];

  return (
    <Card className="p-6 space-y-5">
      <div>
        <p className="font-semibold text-stone-100">Lotes por etapa</p>
        <p className="text-xs text-stone-500 mt-0.5">Función tabla: fn_lotes_por_etapa(@etapaId)</p>
      </div>
      <div className="flex gap-4 flex-wrap items-end">
        <FormField label="Proyecto">
          <Select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)} className="w-48">
            <option value="">Seleccione...</option>
            {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Select>
        </FormField>
        <FormField label="Etapa">
          <Select value={etapaId} onChange={(e) => setEtapaId(e.target.value)} className="w-44" disabled={!proyectoId}>
            <option value="">Seleccione...</option>
            {etapas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </Select>
        </FormField>
        <Button
          disabled={!etapaId}
          onClick={() => {
            setLoading(true);
            reportesApi.lotesPorEtapa(etapaId).then(setData).catch(() => setData([])).finally(() => setLoading(false));
          }}
        >
          Ejecutar función
        </Button>
      </div>
      <DataTable columns={cols} data={data} loading={loading} />
    </Card>
  );
}

// fn_clientes_por_proyecto(proyectoId) — función tipo tabla
function ClientesPorProyecto() {
  const [proyectos, setProyectos] = useState([]);
  const [proyectoId, setProyectoId] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { proyectosApi.list().then(setProyectos).catch(() => {}); }, []);

  const cols = [
    { key: "nombre_completo", label: "Cliente" },
    { key: "dni", label: "DNI" },
    { key: "telefono", label: "Teléfono" },
    { key: "lote", label: "Lote" },
    { key: "tipo_venta", label: "Tipo", render: (v) => <Badge variant={v === "Credito" ? "info" : "success"}>{v}</Badge> },
    { key: "estado_cuenta", label: "Estado", render: (v) => <Badge variant={v === "Al día" ? "success" : "danger"}>{v}</Badge> },
    { key: "cuotas_pendientes", label: "Cuotas pend.", render: (v) => <span className={v > 0 ? "text-red-400" : "text-stone-500"}>{v}</span> },
  ];

  return (
    <Card className="p-6 space-y-5">
      <div>
        <p className="font-semibold text-stone-100">Clientes por proyecto</p>
        <p className="text-xs text-stone-500 mt-0.5">Función tabla: fn_clientes_por_proyecto(@proyectoId)</p>
      </div>
      <div className="flex gap-4 items-end">
        <FormField label="Proyecto">
          <Select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)} className="w-52">
            <option value="">Seleccione...</option>
            {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Select>
        </FormField>
        <Button
          disabled={!proyectoId}
          onClick={() => {
            setLoading(true);
            reportesApi.clientesPorProyecto(proyectoId).then(setData).catch(() => setData([])).finally(() => setLoading(false));
          }}
        >
          Ejecutar función
        </Button>
      </div>
      <DataTable columns={cols} data={data} loading={loading} />
    </Card>
  );
}

export default function ReporteFunciones() {
  return (
    <div>
      <PageHeader
        title="Consultas — Funciones Tipo Tabla"
        subtitle="Formularios que consumen Table-Valued Functions en SQL Server"
      />
      <PageContent>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-800" />
            <p className="text-xs text-stone-600 uppercase tracking-widest">TVF 1</p>
            <div className="h-px flex-1 bg-stone-800" />
          </div>
          <LotesPorEtapa />

          <div className="flex items-center gap-3 mt-8">
            <div className="h-px flex-1 bg-stone-800" />
            <p className="text-xs text-stone-600 uppercase tracking-widest">TVF 2</p>
            <div className="h-px flex-1 bg-stone-800" />
          </div>
          <ClientesPorProyecto />
        </div>
      </PageContent>
    </div>
  );
}
