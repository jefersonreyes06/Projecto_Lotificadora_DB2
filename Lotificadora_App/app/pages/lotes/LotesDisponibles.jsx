import { useEffect, useState } from "react";

import {
  PageHeader, PageContent, Card, DataTable, Badge, FormField, Select, Button, Input,
} from "../../components/index";

const ESTADO_COLORS = {
  Disponible: "success",
  Vendido: "danger",
  Reservado: "warning",
  "En proceso": "info",
};

export default function LotesDisponibles() {
  const [lotes, setLotes] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    proyectoId: "",
    etapaId: "",
    esquina: "",
    areaMin: "",
    areaMax: "",
  });

  // useEffect(() => {
  //   proyectosApi.list().then(setProyectos).catch(() => {});
  // }, []);

  // useEffect(() => {
  //   if (!filtros.proyectoId) { setEtapas([]); return; }
  //   etapasApi.list(filtros.proyectoId).then(setEtapas).catch(() => {});
  // }, [filtros.proyectoId]);

   const buscar = () => {
    //  setLoading(true);
    //  lotesApi
    //    .disponibles(Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== "")))
    //    .then(setLotes)
    //    .catch(() => setLotes([]))
    //    .finally(() => setLoading(false));
   };

  const set = (k) => (e) =>
    setFiltros((f) => ({ ...f, [k]: e.target.value }));

  const columns = [
    { key: "codigo_lote", label: "Código" },
    { key: "proyecto", label: "Proyecto" },
    { key: "etapa", label: "Etapa" },
    { key: "bloque", label: "Bloque" },
    {
      key: "area_m2",
      label: "Área (v²)",
      render: (v) => <span className="text-stone-300">{Number(v).toLocaleString()}</span>,
    },
    {
      key: "es_esquina",
      label: "Esquina",
      render: (v) => v ? <Badge variant="warning">Sí</Badge> : <span className="text-stone-600">—</span>,
    },
    {
      key: "cerca_parque",
      label: "Parque",
      render: (v) => v ? <Badge variant="info">Sí</Badge> : <span className="text-stone-600">—</span>,
    },
    {
      key: "valor_total",
      label: "Precio",
      render: (v) => (
        <span className="text-amber-400 font-medium">
          L {Number(v).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (v) => <Badge variant={ESTADO_COLORS[v] ?? "default"}>{v}</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Lotes Disponibles"
        subtitle="Vista: vw_lotes_disponibles — consulta directa al servidor"
      />
      <PageContent>
        {/* Filtros */}
        <Card className="p-5 mb-6">
          <p className="text-xs text-stone-500 uppercase tracking-widest mb-4 font-semibold">
            Filtros de búsqueda
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <FormField label="Proyecto">
              <Select value={filtros.proyectoId} onChange={set("proyectoId")}>
                <option value="">Todos</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Etapa">
              <Select
                value={filtros.etapaId}
                onChange={set("etapaId")}
                disabled={!filtros.proyectoId}
              >
                <option value="">Todas</option>
                {etapas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="¿De esquina?">
              <Select value={filtros.esquina} onChange={set("esquina")}>
                <option value="">Cualquiera</option>
                <option value="1">Sí</option>
                <option value="0">No</option>
              </Select>
            </FormField>

            <FormField label="Área mín (v²)">
              <Input
                type="number"
                placeholder="0"
                value={filtros.areaMin}
                onChange={set("areaMin")}
              />
            </FormField>

            <FormField label="Área máx (v²)">
              <Input
                type="number"
                placeholder="9999"
                value={filtros.areaMax}
                onChange={set("areaMax")}
              />
            </FormField>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={buscar}>
              Buscar lotes
            </Button>
          </div>
        </Card>

        {/* Resultados */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-stone-500">
            {lotes.length > 0
              ? `${lotes.length} lote(s) encontrado(s)`
              : "Use los filtros para consultar"}
          </p>
        </div>

        <Card>
          <DataTable columns={columns} data={lotes} loading={loading} />
        </Card>
      </PageContent>
    </div>
  );
}
