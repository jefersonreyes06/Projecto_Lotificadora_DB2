// ── EtapasList.jsx ──────────────────────
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import { PageHeader, PageContent, Button, DataTable, Badge, Card } from "../../components/index";

export default function EtapasList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // useEffect(() => {
  //   etapasApi.list().then(setData).catch(() => {}).finally(() => setLoading(false));
  // }, []);

  const columns = [
    { key: "nombre", label: "Etapa" },
    { key: "proyecto", label: "Proyecto" },
    { key: "precio_vara2", label: "Precio v²", render: (v) => `L ${Number(v).toLocaleString("es-HN")}` },
    { key: "tasa_interes", label: "Tasa %", render: (v) => `${v}%` },
    { key: "total_lotes", label: "Lotes", render: (v) => <Badge>{v}</Badge> },
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
        subtitle="sp_etapas_listar"
        actions={<Link to="/etapas/nueva"><Button>+ Nueva etapa</Button></Link>}
      />
      <PageContent>
        <Card>
          <DataTable columns={columns} data={data} loading={loading} onRowClick={(r) => navigate(`/etapas/${r.id}/editar`)} />
        </Card>
      </PageContent>
    </div>
  );
}
