// LotesList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

import {
  PageHeader,
  PageContent,
  Card,
  DataTable,
  Badge,
  Button,
  Input,
  FormField,
} from "../../components/index";
import { lotesApi } from "../../../services/api";

export default function LotesList() {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({ codigo: "", bloque: "", etapa: "", proyecto: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    lotesApi
      .list()
      .then(setData)
      .catch((err) => setError(err.message || "Error cargando lotes"))
      .finally(() => setLoading(false));
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const codigo = String(item.codigo_lote ?? item.codigo ?? "").toLowerCase();
      const bloque = String(item.bloque ?? item.Bloque ?? "").toLowerCase();
      const etapa = String(item.etapa ?? item.Etapa ?? "").toLowerCase();
      const proyecto = String(item.proyecto ?? item.Proyecto ?? "").toLowerCase();

      return (
        codigo.includes(filters.codigo.toLowerCase()) &&
        bloque.includes(filters.bloque.toLowerCase()) &&
        etapa.includes(filters.etapa.toLowerCase()) &&
        proyecto.includes(filters.proyecto.toLowerCase())
      );
    });
  }, [data, filters]);

  const cols = [
    { key: "numeroLote", label: "Código" },
    { key: "Bloque", label: "Bloque" },
    { key: "Etapa", label: "Etapa" },
    { key: "Proyecto", label: "Proyecto" },
    { key: "areaVaras", label: "Área v²", render: (v) => (v != null ? Number(v).toLocaleString("es-HN") : "") },
    //{ key: "es_esquina", label: "Esquina", render: (v) => (v ? <Badge variant="warning">Sí</Badge> : "—") },
    { key: "estado", label: "Estado", render: (v) => <Badge variant={v === "Disponible" ? "success" : v === "Vendido" ? "danger" : "warning"}>{v}</Badge> },
    { key: "precioFinal", label: "Valor", render: (v) => <span className="text-amber-400">L {Number(v).toLocaleString("es-HN")}</span> },
    { key: "id", label: "", width: 80, render: (id) => <Link to={`/lotes/${id}/editar`}><Button size="sm" variant="ghost">Editar</Button></Link> },
  ];

  return (
    <div>
      <PageHeader title="Lotes" subtitle="sp_lotes_listar" actions={<Link to="/lotes/nuevo"><Button>+ Nuevo lote</Button></Link>} />
      <PageContent>
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-4 py-3">
            {error}
          </div>
        )}
        <Card className="mb-6 p-5">
          <p className="text-xs text-stone-500 uppercase tracking-widest mb-4 font-semibold">Filtros de lotes</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField label="Código de lote">
              <Input
                type="text"
                placeholder="Buscar código"
                value={filters.codigo}
                onChange={(e) => setFilters((prev) => ({ ...prev, codigo: e.target.value }))}
              />
            </FormField>
            <FormField label="Bloque">
              <Input
                type="text"
                placeholder="Buscar por bloque"
                value={filters.bloque}
                onChange={(e) => setFilters((prev) => ({ ...prev, bloque: e.target.value }))}
              />
            </FormField>
            <FormField label="Etapa">
              <Input
                type="text"
                placeholder="Buscar por etapa"
                value={filters.etapa}
                onChange={(e) => setFilters((prev) => ({ ...prev, etapa: e.target.value }))}
              />
            </FormField>
            <FormField label="Proyecto">
              <Input
                type="text"
                placeholder="Buscar por proyecto"
                value={filters.proyecto}
                onChange={(e) => setFilters((prev) => ({ ...prev, proyecto: e.target.value }))}
              />
            </FormField>
          </div>
        </Card>
        <Card>
          <DataTable columns={cols} data={filteredData} loading={loading} onRowClick={(r) => navigate(`/lotes/${r.id}/editar`)} />
        </Card>
      </PageContent>
    </div>
  );
}
