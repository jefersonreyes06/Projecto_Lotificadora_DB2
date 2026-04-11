import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { lotesApi, bloquesApi, etapasApi, proyectosApi } from "../../services/api.js";
import {
  PageHeader, PageContent, Button, FormField, Input, Select, Card, Alert,
} from "../../components/index";

const EMPTY = {
  bloqueId: "",
  area_m2: "",
  es_esquina: false,
  cerca_parque: false,
  calle_cerrada: false,
  frente_avenida: false,
  estado: "Disponible",
  descripcion: "",
};

export default function LoteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [proyectos, setProyectos] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [proyectoId, setProyectoId] = useState(0);
  const [etapaId, setEtapaId] = useState("");
  const [valorCalculado, setValorCalculado] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    proyectosApi.list().then(setProyectos).catch(() => {});
  }, []);

  useEffect(() => {
    if (!proyectoId) { setEtapas([]); setBloques([]); return; }
    etapasApi.list().then((etapas) => setEtapas(etapas.filter((e) => e.ProyectoID === proyectoId))).catch(() => {});
  }, [proyectoId]);

  useEffect(() => {
    if (!etapaId || !proyectoId) { setBloques([]); return; }
    bloquesApi.list().then((bloques) => setBloques(bloques.filter((b) => b.EtapaID === etapaId))).catch(() => {});
  }, [etapaId, proyectoId]);

  useEffect(() => {
    if (!isEdit) return;
    lotesApi.get(id).then((d) => {
      setForm(d);
      setProyectoId(d.proyectoId ?? "");
      setEtapaId(d.etapaId ?? "");
    }).catch(() => {});
  }, [id]);

  // Calcular valor en tiempo real via fn_valor_lote
  useEffect(() => {
    if (!form.bloqueId || !form.area_m2) { setValorCalculado(null); return; }
    const t = setTimeout(() => {
      if (isEdit) {
        lotesApi.calcularValor(id).then((v) => setValorCalculado(v?.valor_total)).catch(() => {});
      }
    }, 500);
    return () => clearTimeout(t);
  }, [form.area_m2, form.es_esquina, form.cerca_parque, form.calle_cerrada]);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const setCheck = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.checked }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      isEdit ? await lotesApi.update(id, form) : await lotesApi.create(form);
      navigate("/lotes");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? "Editar Lote" : "Nuevo Lote"}
        subtitle={isEdit ? "sp_lotes_actualizar" : "sp_lotes_insertar"}
        actions={
          <Link to="/lotes">
            <Button variant="ghost">← Volver</Button>
          </Link>
        }
      />
      <PageContent>
        {error && <Alert variant="danger">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              {/* Ubicación */}
              <Card className="p-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                  Ubicación del lote
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Proyecto" required>
                    <Select value={proyectoId} onChange={(e) => setProyectoId(parseInt(e.target.value))} required>
                      <option value="">Seleccione...</option>
                      {proyectos.map((p) => (
                        <option key={p.ProyectoID} value={p.ProyectoID}>{p.Nombre}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Etapa" required>
                    <Select value={etapaId} onChange={(e) => setEtapaId(parseInt(e.target.value))} disabled={!proyectoId} required>
                      <option value="">Seleccione...</option>
                      {etapas.map((e) => (
                        <option key={e.EtapaID} value={e.EtapaID}>{e.Etapa}</option>
                      ))}
                    </Select>
                  </FormField>
                  
                </div>

                <div className="grid grid-cols-2 gap-4"><FormField label="Bloque" required>
                    <Select value={form.bloqueId} onChange={set("bloqueId")} disabled={!etapaId} required>
                      <option value="">Seleccione...</option>
                      {bloques.map((b) => (
                        <option key={b.BloqueID} value={b.BloqueID}>{b.Nombre}</option>
                      ))}
                    </Select>
                  </FormField>
                  {/* <FormField label="Código del lote" required>
                    <Input
                      value={form.codigo_lote}
                      onChange={set("codigo_lote")}
                      placeholder="Ej. A-001"
                      required
                    />
                  </FormField> */}
                  <FormField label="Área (varas²)" required>
                    <Input
                      type="number"
                      value={form.area_m2}
                      onChange={set("area_m2")}
                      placeholder="0.00"
                      min={1}
                      step="0.01"
                      required
                    />
                  </FormField>
                </div>

                <FormField label="Estado">
                  <Select value={form.estado} onChange={set("estado")}>
                    <option value="Disponible">Disponible</option>
                    <option value="Reservado">Reservado</option>
                    <option value="Vendido">Vendido</option>
                  </Select>
                </FormField>
              </Card>

              {/* Características */}
              <Card className="p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">
                  Características que afectan el valor
                </p>
                <p className="text-xs text-stone-600 mb-4">
                  Estas características se evalúan mediante{" "}
                  <code className="bg-stone-800 px-1 rounded text-amber-400 text-xs">
                    fn_valor_lote
                  </code>{" "}
                  para calcular el precio final.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "es_esquina", label: "Lote de esquina" },
                    { key: "cerca_parque", label: "Cerca de parque" },
                    { key: "calle_cerrada", label: "Calle cerrada" },
                    { key: "frente_avenida", label: "Frente a avenida" },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md border cursor-pointer transition-all ${
                        form[key]
                          ? "border-amber-400/40 bg-amber-400/5"
                          : "border-stone-700 hover:border-stone-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!form[key]}
                        onChange={setCheck(key)}
                        className="accent-amber-400 w-4 h-4"
                      />
                      <span className="text-sm text-stone-300">{label}</span>
                    </label>
                  ))}
                </div>
              </Card>

              <div className="flex justify-end gap-3">
                <Link to="/lotes">
                  <Button variant="secondary">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : isEdit ? "Actualizar lote" : "Crear lote"}
                </Button>
              </div>
            </div>

            {/* Panel lateral */}
            <div>
              <Card className="p-5 sticky top-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                  Valor estimado
                </p>
                <p className="text-xs text-stone-600">
                  Calculado por{" "}
                  <code className="bg-stone-800 px-1 rounded text-amber-400 text-xs">
                    fn_valor_lote({id || "new"})
                  </code>
                </p>
                {valorCalculado ? (
                  <p className="text-2xl font-semibold text-amber-400">
                    L {Number(valorCalculado).toLocaleString("es-HN", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                ) : (
                  <p className="text-stone-600 text-sm">
                    Complete los datos para calcular
                  </p>
                )}

                <div className="border-t border-stone-800 pt-4 space-y-2 text-xs text-stone-500">
                  <p>Fórmula base:</p>
                  <p className="font-mono bg-stone-800 p-2 rounded text-stone-400 leading-relaxed">
                    área × precio_v² × factores_bonus
                  </p>
                  <p className="text-stone-600 mt-1">
                    Los factores bonus (esquina, parque, etc.) se configuran por proyecto en SQL Server.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </PageContent>
    </div>
  );
}
