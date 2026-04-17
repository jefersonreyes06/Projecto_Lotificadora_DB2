import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { lotesApi, bloquesApi, etapasApi, proyectosApi } from "../../services/api.js";
import { notify, useNotifyError } from "../../utils/notify";
import {
  PageHeader, PageContent, Button, FormField, Input, Select, Card, Alert,
} from "../../components/index";

const EMPTY = {
  AreaVaras: "",
  NumeroLote: "",
  Proyecto: "",
  Etapa: "",
  Bloque: "",  
  BloqueID: "",
  LoteID: "",
  FechaReserva: "",
  Estado: "Disponible",
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
  const [bloqueId, setBloqueId] = useState("");
  const [valorCalculado, setValorCalculado] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useNotifyError(error);

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

  console.log(form)

  useEffect(() => {
    if (!isEdit) return;
    lotesApi.get(id).then((d) => {
      console.log("Lote data:", d);
      setForm(d);
      setProyectoId(d.proyectoId ?? "");
      setEtapaId(d.etapaId ?? "");
      setBloqueId(d.bloqueId ?? "");
    }).catch(() => {});
  }, [id]);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const setCheck = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.checked }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isEdit) {
        await lotesApi.update(id, form);
        notify.success("Lote actualizado correctamente");
      } else {
        await lotesApi.create(form);
        notify.success("Lote creado correctamente");
      }
      navigate("/lotes");
    } catch (err) {
      const message = err.message || "Error al guardar el lote";
      setError(message);
      notify.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? "Editar Lote" : "Nuevo Lote"}
        subtitle={isEdit ? "sp_lotes_actualizar" : "sp_lotes_crear"}
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
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Proyecto" required>
                    <Select value={proyectoId} onChange={(e) => setProyectoId(parseInt(e.target.value))} required disabled={isEdit}>
                      {isEdit && (
                        <option value={proyectoId}>
                          {form.proyecto ?? form.Proyecto ?? "Proyecto actual"}
                        </option>
                      )}
                      {!isEdit && <option value="">Seleccione...</option>}
                      {!isEdit && proyectos.map((p) => (
                        <option key={p.ProyectoID} value={p.ProyectoID}>{p.Nombre}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Etapa" required>
                    <Select value={etapaId} onChange={(e) => setEtapaId(parseInt(e.target.value))} disabled={!proyectoId} required>
                      {isEdit && (
                        <option value={etapaId}>
                          {form.proyecto ?? form.Etapa ?? "Etapa actual"}
                        </option>
                      )}
                      {!isEdit && <option value="">Seleccione...</option>}
                      {!isEdit && etapas.map((e) => (
                        <option key={e.EtapaID} value={e.EtapaID}>{e.Etapa}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Bloque" required>
                    <Select value={form.BloqueID} onChange={set("BloqueID")} disabled={!etapaId} required>
                      {isEdit && (
                        <option value={form.BloqueID}>
                          {form.Bloque ?? "Bloque actual"}
                        </option>
                      )}
                      {!isEdit && <option value="">Seleccione...</option>}
                      {!isEdit && bloques.map((b) => (
                        <option key={b.BloqueID} value={b.BloqueID}>{b.Bloque}</option>
                      ))}
                    </Select>
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Área (varas²)" required>
                    <Input
                      type="number"
                      value={form.AreaVaras}
                      onChange={set("AreaVaras")}
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
