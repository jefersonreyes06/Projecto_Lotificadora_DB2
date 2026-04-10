// LotesList.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import { PageHeader, PageContent, Card, DataTable, Badge, Button } from "../../components/index";

export default function LotesList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // useEffect(() => { lotesApi.list().then(setData).catch(() => {}).finally(() => setLoading(false)); }, []);
  const cols = [
    { key: "codigo_lote", label: "Código" },
    { key: "bloque", label: "Bloque" },
    { key: "etapa", label: "Etapa" },
    { key: "area_m2", label: "Área v²" },
    { key: "es_esquina", label: "Esquina", render: (v) => v ? <Badge variant="warning">Sí</Badge> : "—" },
    { key: "estado", label: "Estado", render: (v) => <Badge variant={v === "Disponible" ? "success" : v === "Vendido" ? "danger" : "warning"}>{v}</Badge> },
    { key: "valor_total", label: "Valor", render: (v) => <span className="text-amber-400">L {Number(v).toLocaleString("es-HN")}</span> },
    { key: "id", label: "", width: 80, render: (id) => <Link to={`/lotes/${id}/editar`}><Button size="sm" variant="ghost">Editar</Button></Link> },
  ];
  return (
    <div>
      <PageHeader title="Lotes" subtitle="sp_lotes_listar" actions={<Link to="/lotes/nuevo"><Button>+ Nuevo lote</Button></Link>} />
      <PageContent><Card><DataTable columns={cols} data={data} loading={loading} onRowClick={(r) => navigate(`/lotes/${r.id}/editar`)} /></Card></PageContent>
    </div>
  );
}
