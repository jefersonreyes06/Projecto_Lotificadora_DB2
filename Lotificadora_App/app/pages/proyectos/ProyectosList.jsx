// ── ProyectosList.jsx ──────────────────────────
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

import { proyectosApi } from "../../services/api.js";
import {
  PageHeader, PageContent, Button, DataTable, Badge, Card, Input,
} from "../../components/index";

export default function ProyectosList() {
  const [filters, setFilters] = useState({ proyectoId: "", nombre: "" });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    proyectosApi
      .list()
      .then((d) => { setData(d); })
      .catch((err) => setError(err.message || "Error al cargar proyectos"))
      .finally(() => setLoading(false));
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesId = filters.proyectoId
        ? String(row.ProyectoID ?? "").includes(filters.proyectoId)
        : true;
      const matchesName = filters.nombre
        ? String(row.Nombre ?? "").toLowerCase().includes(filters.nombre.toLowerCase())
        : true;
      return matchesId && matchesName;
    });
  }, [data, filters]);

  const columns = [
    { key: "Nombre", label: "Proyecto" },
    { key: "UbicacionLegal", label: "Ubicación" },
    {
      key: "TotalEtapas",
      label: "Etapas",
      render: (v) => <Badge>{v ?? 0}</Badge>,
    },
    {
      key: "TotalLotes",
      label: "Lotes",
      render: (v) => <span className="text-stone-400">{v ?? 0}</span>,
    },
    {
      key: "TotalLotesDisponibles",
      label: "Disponibles",
      render: (v) => <Badge variant="success">{v ?? 0}</Badge>,
    },
    {
      key: "Estado",
      label: "Estado",
      render: (v) => (
        <Badge variant={v === "Activo" ? "success" : "default"}>{v}</Badge>
      ),
    },
    {
      key: "ProyectoID",
      label: "",
      width: 120,
      render: (id) => (
        <div className="flex gap-2">
          <Link to={`/proyectos/${id}/editar`}>
            <Button size="sm" variant="ghost">Editar</Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Proyectos Habitacionales"
        subtitle="sp_proyectos_listar — filtros por ID o nombre"
        actions={
          <Link to="/proyectos/nuevo">
            <Button>+ Nuevo proyecto</Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/*<div>
              <label className="text-sm font-semibold text-stone-400 block mb-2">Proyecto ID</label>
              <Input
                type="text"
                placeholder="Filtrar por ID"
                value={filters.proyectoId}
                onChange={(e) => setFilters((f) => ({ ...f, proyectoId: e.target.value }))}
              />
            </div>*/}
            <div>
              <label className="text-sm font-semibold text-stone-400 block mb-2">Nombre de proyecto</label>
              <Input
                type="text"
                placeholder="Filtrar por nombre"
                value={filters.nombre}
                onChange={(e) => setFilters((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
          </div>
        </Card>

        <Card>
          <DataTable
            columns={columns}
            data={filteredData}
            loading={loading}
            onRowClick={(row) => navigate(`/proyectos/${row.ProyectoID}/editar`)}
          />
        </Card>
      </PageContent>
    </div>
  );
}
