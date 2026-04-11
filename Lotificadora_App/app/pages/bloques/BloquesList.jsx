// ════════════════════════════════════════
// BloquesList.jsx
// ════════════════════════════════════════
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

import { bloquesApi } from "../../services/api.js";
import { PageHeader, PageContent, Card, DataTable, Badge, Button, Input } from "../../components/index";

export function BloquesList() {
  const [filters, setFilters] = useState({ nombre: "", proyecto: "", etapa: "" });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    bloquesApi
      .list()
      .then((d) => setData(d))
      .catch((err) => setError(err.message || "Error al cargar bloques"))
      .finally(() => setLoading(false));
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesName = filters.nombre
        ? String(row.Nombre ?? row.nombre ?? "").toLowerCase().includes(filters.nombre.toLowerCase())
        : true;
      const matchesProject = filters.proyecto
        ? String(row.Proyecto ?? row.proyecto ?? "").toLowerCase().includes(filters.proyecto.toLowerCase())
        : true;
      const matchesEtapa = filters.etapa
        ? String(row.EtapaID ?? row.etapa ?? "").toLowerCase().includes(filters.etapa.toLowerCase())
        : true;
      return matchesName && matchesProject && matchesEtapa;
    });
  }, [data, filters]);

  const cols = [
    { key: "BloqueID", label: "ID" },
    { key: "Nombre", label: "Nombre" },
    { key: "NombreProyecto", label: "Proyecto" },
    { key: "EtapaID", label: "Etapa ID" },
    { key: "AreaTotalVaras", label: "Área (varas)" },
    { key: "Estado", label: "Estado" },
    {
      key: "id", label: "", width: 100,
      render: (id) => (
        <Link to={`/bloques/${id}/editar`}>
          <Button size="sm" variant="ghost">Editar</Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Bloques" subtitle="sp_bloques_listar — filtros por nombre, proyecto y etapa"
        actions={
          <Link to="/bloques/nuevo">
            <Button>+ Nuevo bloque</Button>
          </Link>
        }
      />
      <PageContent>
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-4 py-3">
            {error}
          </div>
        )}
        <Card className="mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-stone-400 block mb-2">Nombre</label>
              <Input
                placeholder="Filtrar por nombre" 
                value={filters.nombre}
                onChange={(e) => setFilters((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-stone-400 block mb-2">Proyecto</label>
              <Input
                placeholder="Filtrar por proyecto"
                value={filters.proyecto}
                onChange={(e) => setFilters((f) => ({ ...f, proyecto: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-stone-400 block mb-2">Etapa</label>
              <Input
                placeholder="Filtrar por etapa"
                value={filters.etapa}
                onChange={(e) => setFilters((f) => ({ ...f, etapa: e.target.value }))}
              />
            </div>
          </div>
        </Card>
        <Card>
          <DataTable columns={cols} data={filteredData} loading={loading} onRowClick={(r) => navigate(`/bloques/${r.BloqueID}/editar`)} />
        </Card>
      </PageContent>
    </div>
  );
}
export default BloquesList;
