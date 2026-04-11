// ════════════════════════════════════════
// BloquesList.jsx
// ════════════════════════════════════════
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { PageHeader, PageContent, Card, DataTable, Badge, Button, Input } from "../../components/index";

export function BloquesList() {
  const [filters, setFilters] = useState({ nombre: "", proyecto: "", etapa: "" });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:3001/api/bloques")
      .then((res) => res.json())
      .then(setData)
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
    { key: "Proyecto", label: "Proyecto" },
    { key: "EtapaID", label: "Etapa ID" },
    { key: "AreaTotalVaras", label: "Área (varas)" },
    { key: "Estado", label: "Estado" },
  ];

  return (
    <div>
      <PageHeader title="Bloques" subtitle="sp_bloques_listar — filtros por nombre, proyecto y etapa"
        actions={<Button>+ Nuevo bloque</Button>}
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
          <DataTable columns={cols} data={filteredData} loading={loading} />
        </Card>
      </PageContent>
    </div>
  );
}
export default BloquesList;
