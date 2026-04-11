import { useEffect, useMemo, useState } from "react";

import {
  PageHeader, PageContent, Card, DataTable, Badge, FormField, Select, Button, Input,
} from "../../components/index";
import { lotesApi, proyectosApi, etapasApi } from "../../services/api";

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
  const [error, setError] = useState(null);
  const [draftFiltros, setDraftFiltros] = useState({
    proyectoId: "",
    etapaId: "",
    areaMin: "",
    areaMax: "",
  });
  const [filtros, setFiltros] = useState({
    proyectoId: "",
    etapaId: "",
    areaMin: "",
    areaMax: "",
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([proyectosApi.list(), lotesApi.disponibles({})])
      .then(([projectList, lotesList]) => {
        setProyectos(projectList);
        setLotes(lotesList);
      })
      .catch((err) => setError(err.message || "Error cargando datos"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!draftFiltros.proyectoId) {
      setEtapas([]);
      return;
    }
    etapasApi.list(draftFiltros.proyectoId).then(setEtapas).catch(() => setEtapas([]));
  }, [draftFiltros.proyectoId]);

  const buscar = () => {
    setFiltros(draftFiltros);
  };

  const handleChange = (key) => (event) =>
    setDraftFiltros((prev) => ({ ...prev, [key]: event.target.value }));

  const filteredLotes = useMemo(() => {
    return lotes.filter((item) => {
      const proyectoId = String(item.proyectoId ?? "");
      const etapaId = String(item.etapaId ?? "");
      const area = parseFloat(item.area_m2 ?? 0) || 0;

      const matchesProyecto = filtros.proyectoId
        ? proyectoId === filtros.proyectoId
        : true;
      const matchesEtapa = filtros.etapaId
        ? etapaId === filtros.etapaId
        : true;
      const matchesAreaMin = filtros.areaMin ? area >= parseFloat(filtros.areaMin) : true;
      const matchesAreaMax = filtros.areaMax ? area <= parseFloat(filtros.areaMax) : true;

      const result = matchesProyecto && matchesEtapa && matchesAreaMin && matchesAreaMax;
      return result;
    });
  }, [lotes, filtros]);

  const columns = [
    { key: "codigo_lote", label: "Código" },
    { key: "proyecto", label: "Proyecto" },
    { key: "etapa", label: "Etapa" },
    { key: "bloque", label: "Bloque" },
    {
      key: "area_m2",
      label: "Área (v²)",
      render: (v) => {
        const numValue = parseFloat(v) || 0;
        return <span className="text-stone-300">{numValue.toLocaleString()}</span>;
      },
    },
    {
      key: "precio_base",
      label: "Precio Base",
      render: (v) => {
        const numValue = parseFloat(v) || 0;
        return (
          <span className="text-green-400 font-medium">
            L {numValue.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      key: "precio_final",
      label: "Precio Final",
      render: (v) => {
        const numValue = parseFloat(v) || 0;
        return (
          <span className="text-amber-400 font-medium">
            L {numValue.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
          </span>
        );
      },
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
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-4 py-3">
            {error}
          </div>
        )}
        {/* Filtros */}
        <Card className="p-5 mb-6">
          <p className="text-xs text-stone-500 uppercase tracking-widest mb-4 font-semibold">
            Filtros de búsqueda
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField label="Proyecto">
              <Select value={draftFiltros.proyectoId} onChange={handleChange("proyectoId")}>
                <option value="">Todos</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Etapa">
              <Select
                value={draftFiltros.etapaId}
                onChange={handleChange("etapaId")}
                disabled={!draftFiltros.proyectoId}
              >
                <option value="">Todas</option>
                {etapas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Área mín (v²)">
              <Input
                type="number"
                placeholder="0"
                value={draftFiltros.areaMin}
                onChange={handleChange("areaMin")}
              />
            </FormField>

            <FormField label="Área máx (v²)">
              <Input
                type="number"
                placeholder="9999"
                value={draftFiltros.areaMax}
                onChange={handleChange("areaMax")}
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
            {filteredLotes.length > 0
              ? `${filteredLotes.length} lote(s) encontrado(s)`
              : "Use los filtros para consultar"}
          </p>
        </div>

        <Card>
          <DataTable columns={columns} data={filteredLotes} loading={loading} />
        </Card>
      </PageContent>
    </div>
  );
}
