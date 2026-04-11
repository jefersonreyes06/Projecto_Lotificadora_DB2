import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { lotesApi } from "../../services/api.js";
import {
  PageHeader, PageContent, Button, FormField, Select, Card, Alert, Badge,
} from "../../components/index";

const ESTADO_COLOR = {
  Disponible: "success",
  Reservado:  "warning",
  Vendido:    "danger",
};

const ESTADO_ICON = {
  Disponible: "◉",
  Reservado:  "◎",
  Vendido:    "◆",
};

const fmtLps = (v) =>
  v != null
    ? `L ${Number(v).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
    : "—";

function InfoRow({ label, value, accent }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-stone-800/60 last:border-0 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className={`font-medium ${accent ? "text-amber-400" : "text-stone-200"}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function LoteForm() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [lote,    setLote]    = useState(null);
  const [estado,  setEstado]  = useState("Disponible");
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  // Cargar lote
  useEffect(() => {
    if (!id) { setLoading(false); return; }
    lotesApi
      .get(id)
      .then((d) => {
        setLote(d);
        setEstado(d.estado ?? "Disponible");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Guardar solo el estado ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await lotesApi.update(id, { estado });
      navigate(`/lotes/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar lote ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await lotesApi.remove(id);
      navigate("/lotes");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  // ── Sin ID (ruta /lotes/nuevo) ────────────────────────────────────────────
  if (!id) {
    return (
      <div>
        <PageHeader
          title="Nuevo Lote"
          actions={<Link to="/lotes"><Button variant="ghost">← Volver</Button></Link>}
        />
        <PageContent>
          <Card className="p-10 text-center max-w-md">
            <p className="text-4xl mb-3">▣</p>
            <p className="text-stone-300 font-medium mb-1">Creación no disponible aquí</p>
            <p className="text-sm text-stone-500 mt-1">
              Los lotes se crean desde la administración de bloques en SQL Server
              mediante <code className="bg-stone-800 px-1 rounded text-amber-400 text-xs">sp_lotes_insertar</code>.
            </p>
            <div className="mt-6">
              <Link to="/lotes">
                <Button variant="secondary">Ver listado de lotes</Button>
              </Link>
            </div>
          </Card>
        </PageContent>
      </div>
    );
  }

  // ── Cargando ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <PageHeader title="Editar Lote" />
        <PageContent>
          <p className="text-stone-500 text-sm animate-pulse">Cargando lote...</p>
        </PageContent>
      </div>
    );
  }

  const estadoSinCambio = estado === lote?.estado;
  const esVendido       = lote?.estado === "Vendido";

  // ── Vista principal ───────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title={`Lote ${lote?.codigo_lote ?? id}`}
        subtitle={`${lote?.etapa ?? ""} · ${lote?.proyecto ?? ""} · sp_lotes_actualizar`}
        actions={
          <div className="flex gap-2">
            <Link to={`/lotes/${id}`}>
              <Button variant="ghost">← Ver detalle</Button>
            </Link>
          </div>
        }
      />

      <PageContent>
        {error && <Alert variant="danger" className="mb-5">{error}</Alert>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl">

          {/* ── Columna principal ────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Datos de solo lectura */}
            

            {/* Editar estado */}
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">
                Cambiar estado
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <FormField label="Nuevo estado">
                      <Select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                      >
                        <option value="Disponible">Disponible</option>
                        <option value="Reservado">Reservado</option>
                        <option value="Vendido">Vendido</option>
                      </Select>
                    </FormField>
                  </div>
                  <div className="pb-0.5">
                    <Badge variant={ESTADO_COLOR[estado] ?? "default"}>
                      {estado}
                    </Badge>
                  </div>
                </div>

                {/* Aviso al pasar a Vendido manualmente */}
                {estado === "Vendido" && !esVendido && (
                  <Alert variant="warning">
                    Cambiar a <strong>Vendido</strong> sin registrar una venta puede
                    generar inconsistencias. Se recomienda usar el módulo de Ventas.
                  </Alert>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-stone-800">
                  <Link to={`/lotes/${id}`}>
                    <Button variant="secondary">Cancelar</Button>
                  </Link>
                  <Button type="submit" disabled={saving || estadoSinCambio}>
                    {saving ? "Guardando..." : "Actualizar estado"}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Zona de peligro */}
            <Card className="p-6 border-red-500/20 bg-red-500/5">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-400/70 mb-4">
                Zona de peligro
              </p>

              {!confirmDel ? (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-stone-300">Eliminar lote</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Ejecuta{" "}
                      <code className="bg-stone-800 px-1 rounded text-red-400 text-[11px]">
                        sp_lotes_eliminar
                      </code>{" "}
                      — acción permanente e irreversible.
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => setConfirmDel(true)}
                    disabled={esVendido}
                  >
                    Eliminar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert variant="danger">
                    ¿Confirma eliminar el lote <strong>{lote?.codigo_lote}</strong>?
                    Esta acción no puede deshacerse.
                  </Alert>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmDel(false)}
                      disabled={deleting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? "Eliminando..." : "Sí, eliminar"}
                    </Button>
                  </div>
                </div>
              )}

              {esVendido && (
                <p className="text-xs text-stone-600 mt-3">
                  No es posible eliminar un lote con estado <strong>Vendido</strong>.
                </p>
              )}
            </Card>
          </div>

          {/* ── Panel lateral ─────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Estado visual */}
            <Card className="p-5 flex flex-col items-center text-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 self-start">
                Estado actual
              </p>
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 mt-1 ${
                  lote?.estado === "Disponible"
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
                    : lote?.estado === "Vendido"
                    ? "border-red-400/40 bg-red-400/10 text-red-400"
                    : "border-amber-400/40 bg-amber-400/10 text-amber-400"
                }`}
              >
                {ESTADO_ICON[lote?.estado] ?? "?"}
              </div>
              <Badge variant={ESTADO_COLOR[lote?.estado] ?? "default"}>
                {lote?.estado}
              </Badge>
              <p className="text-xs text-stone-500 leading-relaxed">
                {lote?.estado === "Disponible" && "Disponible para la venta."}
                {lote?.estado === "Reservado"  && "Con reserva activa."}
                {lote?.estado === "Vendido"    && "Ya vendido. No editable ni eliminable."}
              </p>
            </Card>

            {/* Permisos */}
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">
                Permisos en este formulario
              </p>
              <div className="space-y-2.5 text-sm">
                {[
                  { campo: "Estado",          editable: true  },
                  { campo: "Eliminar lote",   editable: !esVendido },
                  { campo: "Código",          editable: false },
                  { campo: "Área / Precio",   editable: false },
                  { campo: "Características", editable: false },
                  { campo: "Bloque / Etapa",  editable: false },
                ].map(({ campo, editable }) => (
                  <div key={campo} className="flex justify-between items-center">
                    <span className="text-stone-400">{campo}</span>
                    {editable
                      ? <Badge variant="success">Permitido</Badge>
                      : <span className="text-xs text-stone-600">Bloqueado</span>
                    }
                  </div>
                ))}
              </div>
            </Card>

            {/* Atajo a venta si está disponible */}
            {lote?.estado === "Disponible" && (
              <Card className="p-5 bg-emerald-400/5 border-emerald-400/20">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/70 mb-2">
                  Acción rápida
                </p>
                <p className="text-xs text-stone-400 mb-3">
                  Este lote puede venderse desde el módulo de Ventas.
                </p>
                <Link to={`/ventas/nueva?loteId=${id}`}>
                  <Button className="w-full justify-center">Vender este lote</Button>
                </Link>
              </Card>
            )}
          </div>
        </div>
      </PageContent>
    </div>
  );
}