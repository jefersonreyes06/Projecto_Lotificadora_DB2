// ════════════════════════════════════════
// BloquesList.jsx
// ════════════════════════════════════════
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { PageHeader, PageContent, Card, DataTable, Badge, Button } from "../../components/index";

export function BloquesList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  // useEffect(() => { bloquesApi.list().then(setData).catch(() => {}).finally(() => setLoading(false)); }, []);
  const cols = [
    { key: "codigo", label: "Código" },
    { key: "etapa", label: "Etapa" },
    { key: "total_lotes", label: "Lotes", render: (v) => <Badge>{v}</Badge> },
    { key: "lotes_disponibles", label: "Disponibles", render: (v) => <Badge variant="success">{v}</Badge> },
  ];
  return (
    <div>
      <PageHeader title="Bloques" subtitle="sp_bloques_listar"
        actions={<Button>+ Nuevo bloque</Button>}
      />
      <PageContent><Card><DataTable columns={cols} data={data} loading={loading} /></Card></PageContent>
    </div>
  );
}
export default BloquesList;
