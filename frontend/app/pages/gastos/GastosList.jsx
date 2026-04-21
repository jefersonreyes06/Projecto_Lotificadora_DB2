import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { gastosApi } from "../../services/api.js";
import {
    PageHeader, PageContent, Button, DataTable, Badge, Card, Input, Select, Alert, StatCard, FormField,
} from "../../components/index";

const fmtLps = (v) => `L ${Number(v ?? 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;
const fmtDate = (v) => v ? new Date(v).toLocaleDateString("es-HN") : "—";

export default function PagosList() {
    const [searchParams] = useSearchParams();
    const ventaIdParam = searchParams.get("ventaId") ?? "";
    const [data, setData] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tipoFiltro, setTipo] = useState("conGastos");
    const [busquedaProyecto, setBusquedaProyecto] = useState("");

    const handleBuscarProyecto = () => {
        setLoading(true);
        gastosApi.list(tipoFiltro === "conGastos" ? 1 : 0, busquedaProyecto).then((data) => {
            setData(data);
            setFiltered(data);
        }).finally(() => setLoading(false));
    };

    useEffect(() => {
        handleBuscarProyecto();
    }, [tipoFiltro, busquedaProyecto]);

    const totalEfectivo = (data ?? []).filter((p) => p?.TipoPago === "Efectivo").reduce((s, p) => s + Number(p.MontoCuota ?? 0), 0);
    const totalBanco = (data ?? []).filter((p) => p?.TipoPago !== "Efectivo").reduce((s, p) => s + Number(p.MontoCuota ?? 0), 0);

    const columns = [
        { key: "ProyectoID", label: "#", width: 60, render: (v) => <span className="text-stone-500 font-mono text-xs">{v}</span> },
        { key: "Proyecto", label: "Proyecto" },
        { key: "UbicacionLegal", label: "Ubicacion" },
        tipoFiltro === 'conGastos' ? { key: "TotalGastos", label: "Total gastos", render: fmtLps } : null,
        { key: "FechaCreacion", label: "Fecha de creacion", render: fmtDate },
        { key: "Estado", label: "Estado", render: (v) => <Badge variant={v === "Activo" ? "success" : "warning"}>{v}</Badge> },
        {
            key: "ProyectoID", label: `Accion`, width: 80, render: (v) => (
                <Link to={tipoFiltro === 'sinGastos' ? `/gastos/nuevo/${v}` : `/gastos/ver/${v}`}>
                    <Button size="sm" variant="ghost">{tipoFiltro === 'sinGastos' ? 'Registrar Gastos' : 'Ver Gastos'}</Button>
                </Link>
            )
        },
    ].filter(Boolean);

    return (
        <div>
            <PageHeader
                title={ventaIdParam ? `Pagos — Venta #${ventaIdParam}` : "Gastos en los proyectos"}
                subtitle="sp_gastos_listar — procesamiento en servidor"
                actions={<Link to="/gastos/nuevo"><Button>+ Registrar gastos en proyectos</Button></Link>}
            />

            <PageContent>
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total recaudado" value={fmtLps(totalEfectivo + totalBanco)} accent />
                    <StatCard label="En caja (efectivo)" value={fmtLps(totalEfectivo)} sub="Por depositar al banco" />
                    <StatCard label="Bancarios" value={fmtLps(totalBanco)} sub="Depósitos y transferencias" />
                    <StatCard label="Registros" value={data?.length} />
                </div>

                <Card className="p-6 mb-3 border border-blue-400/20 bg-blue-50 rounded-lg shadow-sm">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                            Nombre del proyecto
                        </label>
                        <Input
                            type="text"
                            value={busquedaProyecto}
                            onChange={(e) => setBusquedaProyecto(e.target.value)}
                            placeholder="Ingrese el nombre del proyecto"
                            className="w-full mb-5"
                            onKeyDown={(e) => e.key === 'Enter' && handleBuscarProyecto()}
                        />
                    </div>
                    <div className="flex items-center gap-6 mb-4">
                        <label className="text-sm font-semibold text-stone-600">Filtros</label>
                        <Select
                            className="min-w-[180px]"
                            value={tipoFiltro}
                            onChange={(e) => setTipo(e.target.value)}
                            required
                        >
                            <option value="">Seleccione...</option>
                            <option key="sinGastos" value="sinGastos">Sin gastos</option>
                            <option key="conGastos" value="conGastos">Con gastos</option>
                        </Select>
                    </div>
                </Card>

                <div className="mt-6 mb-3">
                    <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                        {tipoFiltro === 'conGastos' ? 'Gastos en proyectos' : 'Proyectos sin gastos'}
                    </label>
                </div>
                <Card>
                    <DataTable
                        columns={columns}
                        data={filtered}
                        loading={loading}
                    />
                </Card>
            </PageContent>
        </div>
    );
}
