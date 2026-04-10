// ── ProyectosList.jsx ──────────────────────────
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import {
  PageHeader, PageContent, Button, DataTable, Badge, Card,
} from "../../components/index";

export default function ProyectosList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    
  };

  useEffect(load, []);

  const columns = [
    { key: "nombre", label: "Proyecto" },
    { key: "ubicacion", label: "Ubicación" },
    {
      key: "total_etapas",
      label: "Etapas",
      render: (v) => <Badge>{v ?? 0}</Badge>,
    },
    {
      key: "total_lotes",
      label: "Lotes",
      render: (v) => <span className="text-stone-400">{v ?? 0}</span>,
    },
    {
      key: "lotes_disponibles",
      label: "Disponibles",
      render: (v) => <Badge variant="success">{v ?? 0}</Badge>,
    },
    {
      key: "estado",
      label: "Estado",
      render: (v) => (
        <Badge variant={v === "Activo" ? "success" : "default"}>{v}</Badge>
      ),
    },
    {
      key: "id",
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
        subtitle="sp_proyectos_listar — procesamiento en servidor"
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
        <Card>
          <DataTable
            columns={columns}
            data={data}
            loading={loading}
            onRowClick={(row) => navigate(`/proyectos/${row.id}/editar`)}
          />
        </Card>
      </PageContent>
    </div>
  );
}
