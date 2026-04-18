import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { pagosApi } from "../../services/api.js";

import {
  PageHeader, PageContent, Button, DataTable, Badge, Card, Input, Select, Alert, StatCard,
} from "../../components/index";
import { notify } from "../../utils/notify";

const fmtLps  = (v) => `L ${Number(v ?? 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;
const fmtDate = (v) => v ? new Date(v).toLocaleDateString("es-HN") : "—";

export default function PagosList() {
  const [searchParams]          = useSearchParams();
  const ventaIdParam            = searchParams.get("ventaId") ?? "";
  const [data, setData]         = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [tipoFiltro, setTipo]   = useState("");
  const [cierreFecha, setCierre] = useState(new Date().toISOString().split("T")[0]);
  const [cierreLoading, setCierreLoading] = useState(false);
  const [cierreMsg, setCierreMsg]         = useState(null);
  const [busquedaLote, setBusquedaLote] = useState("");
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    pagosApi.cierreDiario(cierreFecha)
      .then((d) => {
        // d es un array de cierres
        setData(d);
        setFiltered(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };


  useEffect(load, [ventaIdParam]);

  /*useEffect(() => {
    let d = data;
    //if (search)     d = d.filter((r) => `${r.cliente} ${r.id} ${r.factura_id}`.toLowerCase().includes(search.toLowerCase()));
    //if (tipoFiltro) d = d.filter((r) => r.tipo_pago === tipoFiltro);
    setFiltered(d);
  }, [search, tipoFiltro, data]);
*/
  const handleVerResumenDiario = async () => {
    if (!cierreFecha) {
      notify.error("Por favor, seleccione una fecha para el resumen diario.");
      return;
    }
    setCierreLoading(true);
    try {
      console.log("Obteniendo resumen diario para fecha:", cierreFecha);
      const res = await pagosApi.cierreDiario(cierreFecha);
      // Aquí podrías mostrar el resumen en un modal o una nueva página
      console.log("Resumen diario:", res);
      notify.success("Resumen diario obtenido. Revisa la consola para más detalles.");
    } catch (e) {
      const message = e.message || "Error al obtener el resumen diario.";
      notify.error(message);
    } finally {
      setCierreLoading(false);
    }
  };


  const handleCierreDiario = async () => {
    setCierreLoading(true);
    setCierreMsg(null);
    try {
      const res = await pagosApi.crearCierreDiario(cierreFecha);
      const message = 'Cierre realizado:'; // ${res.total_depositos} depósito(s) por ${fmtLps(res.monto_total)}`;
      setCierreMsg({ type: "success", text: message });
      notify.success(message);
      load();
    } catch (e) {
      const message = e.message || "Error al ejecutar el cierre diario.";
      setCierreMsg({ type: "danger", text: message });
      notify.error(message);
    } finally {
      setCierreLoading(false);
    }
  };

  const handleBuscarLote = () => {
    if (!busquedaLote.trim()) return;
    navigate(`/pagos/nuevo?numeroLote=${encodeURIComponent(busquedaLote)}`);
  };

  const handlecuentasPendientes = () => {
    //const res = await pagosApi.cuentasPendientes();
    navigate("/pagos/cuentas-activas");//, { state: { cuentas: res } });
  }

  const totalEfectivo = (data ?? []).filter((p) => p?.TipoPago === "Efectivo").reduce((s, p) => s + Number(p.MontoCuota ?? 0), 0);
  const totalBanco = (data ?? []).filter((p) => p?.TipoPago !== "Efectivo").reduce((s, p) => s + Number(p.MontoCuota ?? 0), 0);

  const columns = [
    { key: "id",           label: "#", width: 60, render: (v) => <span className="text-stone-500 font-mono text-xs">{v}</span> },
    { key: "fecha_pago",   label: "Fecha",    render: fmtDate },
    { key: "cliente",      label: "Cliente" },
    { key: "lote",         label: "Lote" },
    { key: "tipo_pago",    label: "Tipo",
      render: (v) => <Badge variant={v === "Efectivo" ? "success" : v === "Deposito" ? "info" : "warning"}>{v}</Badge> },
    { key: "monto_pagado", label: "Monto",
      render: (v) => <span className="text-emerald-400 font-medium">{fmtLps(v)}</span> },
    { key: "capital",      label: "Capital",  render: (v) => <span className="text-blue-400">{fmtLps(v)}</span> },
    { key: "interes",      label: "Interés",  render: (v) => <span className="text-amber-400">{fmtLps(v)}</span> },
    { key: "factura_id",   label: "Factura",  render: (v) => v ? <Badge variant="default">#{v}</Badge> : "—" },
    { key: "depositado",   label: "Depositado",
      render: (v, row) => row.tipo_pago !== "Efectivo"
        ? <span className="text-stone-600">N/A</span>
        : v ? <Badge variant="success">Sí</Badge> : <Badge variant="warning">Pendiente</Badge> },
    { key: "id", label: "", width: 80,
      render: (id) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Link to={`/pagos/${id}/factura`}><Button size="sm" variant="ghost">Factura</Button></Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={ventaIdParam ? `Pagos — Venta #${ventaIdParam}` : "Pagos & Caja"}
        subtitle="sp_pagos_listar — procesamiento en servidor"
        actions={<Link to="/pagos/nuevo"><Button>+ Registrar pago</Button></Link>}
      />

      <PageContent>
        {/* Búsqueda rápida de lote */}
        <Card className="p-5 mb-6 border-blue-400/20 bg-blue-400/5">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/70 mb-3">
            Buscar lote para pagar
          </p>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-xs">
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                Número de lote (ej: A-01, B-05)
              </label>
              <Input
                type="text"
                value={busquedaLote}
                onChange={(e) => setBusquedaLote(e.target.value)}
                placeholder="Ingrese número de lote"
                onKeyDown={(e) => e.key === 'Enter' && handleBuscarLote()}
              />
            </div>
            <Button onClick={handleBuscarLote} disabled={!busquedaLote.trim()}>
              Ir a pagar
            </Button>
            <p className="text-xs text-stone-500 self-center">
              Se valida automáticamente: Crédito + Proceso
            </p>
          </div>
        </Card>

        {/* Cuentas Pendientes */}
        <Card className="p-5 mb-6 border-blue-400/20 bg-blue-400/5">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/70 mb-3">
            Ver cuentas pendientes de clientes
          </p>
          <div className="flex gap-3 items-end flex-wrap">
            <Button onClick={handlecuentasPendientes}>
              Ver cuentas
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total recaudado"  value={fmtLps(totalEfectivo + totalBanco)} accent />
          <StatCard label="En caja (efectivo)" value={fmtLps(totalEfectivo)} sub="Por depositar al banco" />
          <StatCard label="Bancarios"        value={fmtLps(totalBanco)} sub="Depósitos y transferencias" />
          <StatCard label="Registros"        value={data?.length} />
        </div>

        {/* Cierre de caja diario */}
        <Card className="p-5 mb-6 border-amber-400/20 bg-amber-400/5">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/70 mb-3">
            Cierre de caja diario — sp_cierre_caja_diario (cursor)
          </p>
          {cierreMsg && (
            <Alert variant={cierreMsg.type} className="mb-3">{cierreMsg.text}</Alert>
          )}
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                Fecha de cierre
              </label>
              <input
                type="date"
                value={cierreFecha}
                onChange={(e) => setCierre(e.target.value)}
                className="bg-stone-800 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-400/60 transition-all"
              />
            </div>
            <Button onClick={handleCierreDiario} disabled={cierreLoading}>
              {cierreLoading ? "Procesando..." : "Ejecutar cierre"}
            </Button>
            <p className="text-xs text-stone-500 self-center">
              Deposita los cobros en efectivo del día a las cuentas bancarias de cada etapa.
            </p>
          </div>
        </Card>

        {/* Filtros */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <Input
            placeholder="Buscar por cliente, factura o #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <input
                type="date"
                value={cierreFecha}
                onChange={(e) => setCierre(e.target.value)}
                className="bg-stone-800 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-400/60 transition-all"
          />
              
          <Button onClick={handleVerResumenDiario} disabled={cierreLoading}>
            {cierreLoading ? "Procesando..." : "Ver resumen diario"}
          </Button>
          <Select value={tipoFiltro} onChange={(e) => setTipo(e.target.value)} className="w-44">
            <option value="">Todos los tipos</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Deposito">Depósito</option>
          </Select>
          {(search || tipoFiltro) && (
            <Button variant="ghost" onClick={() => { setSearch(""); setTipo(""); }}>Limpiar</Button>
          )}
          {ventaIdParam && (
            <Button variant="ghost" onClick={() => navigate("/pagos")}>Ver todos los pagos</Button>
          )}
        </div>

        <Card>
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            //onRowClick={(row) => navigate(`/pagos/${row.id}/factura`)}
          />
        </Card>
      </PageContent>
    </div>
  );
}
