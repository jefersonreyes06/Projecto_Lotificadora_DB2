// ════════════════════════════════════════
// ClientesList.jsx
// ════════════════════════════════════════
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router";

import {
  PageHeader, PageContent, Button, Card, DataTable, Badge, Input,
} from "../../components/index";

export function ClientesList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // const load = useCallback((q = "") => {
  //   setLoading(true);
  //   clientesApi
  //     .list(q)
  //     .then(setData)
  //     .catch(() => {})
  //     .finally(() => setLoading(false));
  // }, []);

  // useEffect(() => { load(); }, []);

  // useEffect(() => {
  //   const t = setTimeout(() => load(search), 350);
  //   return () => clearTimeout(t);
  // }, [search]);

  const cols = [
    { key: "nombre", label: "Nombre", render: (v, r) => `${v} ${r.apellido}` },
    { key: "dni", label: "DNI / Identidad" },
    { key: "telefono", label: "Teléfono" },
    { key: "correo", label: "Correo" },
    { key: "empresa", label: "Empresa / Empleador" },
    {
      key: "total_compras",
      label: "Compras",
      render: (v) => <Badge variant={v > 0 ? "success" : "default"}>{v ?? 0}</Badge>,
    },
    {
      key: "id",
      label: "",
      width: 90,
      render: (id) => (
        <Link to={`/clientes/${id}/editar`}>
          <Button size="sm" variant="ghost">Editar</Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="sp_clientes_listar — búsqueda en servidor"
        actions={
          <Link to="/clientes/nuevo">
            <Button>+ Nuevo cliente</Button>
          </Link>
        }
      />
      <PageContent>
        <div className="mb-4">
          <Input
            placeholder="Buscar por nombre, DNI o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Card>
          <DataTable
            columns={cols}
            data={data}
            loading={loading}
            onRowClick={(r) => navigate(`/clientes/${r.id}/editar`)}
          />
        </Card>
      </PageContent>
    </div>
  );
}

export default ClientesList;
