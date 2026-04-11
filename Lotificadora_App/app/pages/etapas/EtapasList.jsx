// ── EtapasList.jsx ──────────────────────
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

import { PageHeader, PageContent, Button, DataTable, Badge, Card, Input } from "../../components/index";

export default function EtapasList() {
  const [filters, setFilters] = useState({ etapaId: "", nombre: "", proyecto: "" });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:3001/api/etapas")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => setError(err.message || "Error al cargar etapas"))
      .finally(() => setLoading(false));
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesId = filters.etapaId
        ? String(row.id ?? row.EtapaID ?? "").includes(filters.etapaId)
        : true;
      const matchesName = filters.nombre
        ? String(row.Nombre ?? row.nombre ?? "").toLowerCase().includes(filters.nombre.toLowerCase())
        : true;
      const matchesProject = filters.proyecto
        ? String(row.Proyecto ?? row.proyecto ?? "").toLowerCase().includes(filters.proyecto.toLowerCase())
        : true;
      return matchesId && matchesName && matchesProject;
    });
  }, [data, filters]);

  const columns = [
    { key: "Nombre", label: "Etapa" },
    { key: "Proyecto", label: "Proyecto" },
    { key: "AreaTotalVaras", label: "Area Total" },
    { key: "PrecioVaraCuadrada", label: "Precio v²", render: (v) => `L ${Number(v).toLocaleString("es-HN")}` },
    { key: "TasaInteresAnual", label: "Tasa %", render: (v) => `${v}%` },
    { key: "Estado", label: "Estado", render: (v) => <Badge variant={v === "Activo" ? "success" : "default"}>{v}</Badge> },
    {
      key: "id", label: "", width: 100,
      render: (id) => (
        <Link to={`/etapas/${id}/editar`}>
          <Button size="sm" variant="ghost">Editar</Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Etapas"
        subtitle="sp_etapas_listar — filtros por ID, etapa o proyecto"
        actions={<Link to="/etapas/nueva"><Button>+ Nueva etapa</Button></Link>}
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
              <label className="text-sm font-semibold text-stone-400 block mb-2">Etapa ID</label>
              <Input
                type="text"
                placeholder="Filtrar por ID"
                value={filters.etapaId}
                onChange={(e) => setFilters((f) => ({ ...f, etapaId: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-stone-400 block mb-2">Nombre de etapa</label>
              <Input
                type="text"
                placeholder="Filtrar por nombre"
                value={filters.nombre}
                onChange={(e) => setFilters((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-stone-400 block mb-2">Proyecto</label>
              <Input
                type="text"
                placeholder="Filtrar por proyecto"
                value={filters.proyecto}
                onChange={(e) => setFilters((f) => ({ ...f, proyecto: e.target.value }))}
              />
            </div>
          </div>
        </Card>
        <Card>
          <DataTable columns={columns} data={filteredData} loading={loading} onRowClick={(r) => navigate(`/etapas/${r.id}/editar`)} />
        </Card>
      </PageContent>
    </div>
  );
}
