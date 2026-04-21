import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { avalApi } from "../../services/api";
import { notify, useNotifyError } from "../../utils/notify";
import {
  PageHeader, PageContent, Card, Badge, Button, DataTable, StatCard, Alert,
} from "../../components/ui";

const fmtLps  = (v) => `L ${Number(v ?? 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;
const fmtDate = (v) => v ? new Date(v).toLocaleDateString("es-HN") : "—";

function InfoRow({ label, value, accent }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-stone-800/60 last:border-0 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className={`font-medium ${accent ? "text-amber-400" : "text-stone-200"}`}>{value ?? "—"}</span>
    </div>
  );
}

export default function ClienteDetalle() {
  const { id }            = useParams();
  const [cliente, setCliente] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useNotifyError(error);

  useEffect(() => {
    Promise.all([
      clientesApi.get(id),
      clientesApi.historial(id), // vista vw_historial_cliente
    ])
      .then(([c, h]) => { setCliente(c); setHistorial(h); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const historialCols = [
    { key: "lote",          label: "Lote" },
    { key: "proyecto",      label: "Proyecto" },
    { key: "fecha_venta",   label: "Fecha",  render: fmtDate },
    { key: "tipo_venta",    label: "Tipo",   render: (v) => <Badge variant={v === "Contado" ? "success" : "info"}>{v}</Badge> },
    { key: "monto_total",   label: "Monto",  render: (v) => <span className="text-amber-400">{fmtLps(v)}</span> },
    { key: "monto_pagado",  label: "Pagado", render: (v) => <span className="text-emerald-400">{fmtLps(v)}</span> },
    { key: "estado_cuenta", label: "Estado", render: (v) => <Badge variant={v === "Al día" ? "success" : v === "En mora" ? "danger" : "default"}>{v}</Badge> },
    { key: "venta_id", label: "", width: 80,
      render: (vid) => <Link to={`/ventas/${vid}`} onClick={(e) => e.stopPropagation()}><Button size="sm" variant="ghost">Ver</Button></Link>,
    },
  ];

  if (loading) return (
    <div><PageHeader title="Perfil de cliente" />
      <PageContent><p className="text-stone-500 text-sm animate-pulse">Cargando perfil...</p></PageContent>
    </div>
  );

  if (error || !cliente) return (
    <div><PageHeader title="Perfil de cliente" />
      <PageContent><Alert variant="danger">{error ?? "Cliente no encontrado"}</Alert></PageContent>
    </div>
  );

  const initials = ((cliente.nombre?.[0] ?? "") + (cliente.apellido?.[0] ?? "")).toUpperCase();
  const cuota30  = cliente.ingreso_mensual ? Number(cliente.ingreso_mensual) * 0.3 : null;

  return (
    <div>
      <PageHeader
        title={`${cliente.nombre} ${cliente.apellido}`}
        subtitle={`DNI: ${cliente.dni} · vw_historial_cliente`}
        actions={
          <div className="flex gap-2">
            <Link to={`/clientes/${id}/editar`}><Button variant="secondary">Editar perfil</Button></Link>
            <Link to="/clientes"><Button variant="ghost">← Volver</Button></Link>
          </div>
        }
      />

      <PageContent>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Compras realizadas" value={historial.length} />
          <StatCard label="Total invertido"    value={fmtLps(historial.reduce((s, h) => s + Number(h.monto_total ?? 0), 0))} accent />
          <StatCard label="Créditos activos"   value={historial.filter((h) => h.tipo_venta === "Credito" && h.estado_cuenta !== "Pagado").length} />
          <StatCard label="Ingreso mensual"    value={cliente.ingreso_mensual ? fmtLps(cliente.ingreso_mensual) : "—"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda */}
          <div className="space-y-5">
            {/* Avatar card */}
            <Card className="p-5 flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-amber-400/10 border-2 border-amber-400/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-amber-400">{initials}</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-stone-100">{cliente.nombre} {cliente.apellido}</p>
                <p className="text-xs text-stone-500">{cliente.dni}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={cliente.estado === "Activo" ? "success" : "default"}>{cliente.estado}</Badge>
                {cliente.tipo_empleo && <Badge variant="info">{cliente.tipo_empleo}</Badge>}
              </div>
            </Card>

            {/* Datos personales */}
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">Datos personales</p>
              <InfoRow label="Correo"      value={cliente.correo} />
              <InfoRow label="Teléfono"    value={cliente.telefono} />
              <InfoRow label="Teléf. alt." value={cliente.telefono_alt} />
              <InfoRow label="Género"      value={cliente.genero} />
              <InfoRow label="Estado civil" value={cliente.estado_civil} />
              <InfoRow label="Nacimiento"  value={fmtDate(cliente.fecha_nacimiento)} />
            </Card>

            {/* Dirección */}
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">Dirección</p>
              <InfoRow label="Departamento" value={cliente.departamento} />
              <InfoRow label="Municipio"    value={cliente.municipio} />
              {cliente.direccion && (
                <div className="pt-2.5 text-sm">
                  <span className="text-stone-500 block mb-1">Dirección</span>
                  <span className="text-stone-300">{cliente.direccion}</span>
                </div>
              )}
            </Card>
          </div>

          {/* Columna derecha */}
          <div className="lg:col-span-2 space-y-5">
            {/* Datos laborales */}
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">Datos laborales</p>
              <div className="grid grid-cols-2 gap-x-8">
                <InfoRow label="Empresa"        value={cliente.empresa} />
                <InfoRow label="Cargo"          value={cliente.cargo} />
                <InfoRow label="Tipo empleo"    value={cliente.tipo_empleo} />
                <InfoRow label="Años laborando" value={cliente.anios_laborando ? `${cliente.anios_laborando} años` : null} />
                <InfoRow label="Tel. trabajo"   value={cliente.telefono_trabajo} />
                <InfoRow label="Ingreso mensual" value={cliente.ingreso_mensual ? fmtLps(cliente.ingreso_mensual) : null} accent />
              </div>

              {cuota30 && (
                <div className="mt-4 bg-amber-400/5 border border-amber-400/20 rounded-md px-4 py-3">
                  <p className="text-xs text-amber-400/70 font-semibold uppercase tracking-wider mb-0.5">
                    Capacidad de pago (30%)
                  </p>
                  <p className="text-xl font-semibold text-amber-400">{fmtLps(cuota30)}</p>
                  <p className="text-xs text-stone-500 mt-0.5">Cuota mensual máxima estimada</p>
                </div>
              )}
            </Card>

            {/* Acciones */}
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">Acciones</p>
              <div className="flex gap-3 flex-wrap">
                <Link to={`/ventas/nueva?clienteId=${id}`}>
                  <Button>Nueva venta</Button>
                </Link>
                <Link to={`/pagos?clienteId=${id}`}>
                  <Button variant="secondary">Ver pagos</Button>
                </Link>
                <Link to={`/clientes/${id}/editar`}>
                  <Button variant="ghost">Editar perfil</Button>
                </Link>
              </div>
            </Card>

            {/* Historial — vista SQL */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">
                Historial de compras · vw_historial_cliente
              </p>
              <Card>
                <DataTable
                  columns={historialCols}
                  data={historial}
                />
              </Card>
            </div>
          </div>
        </div>
      </PageContent>
    </div>
  );
}
