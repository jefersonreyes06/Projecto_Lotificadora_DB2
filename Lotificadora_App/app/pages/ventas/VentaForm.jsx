import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { clientesApi, lotesApi, ventasApi } from "../../services/api.js";

import {
  PageHeader, PageContent, Button, FormField, Input, Select, Card, Alert, Badge,
} from "../../components/index";
//import { ventasApi } from "../../../services/api";

export default function VentaForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    clienteId: "",
    loteId: "",
    tipo_venta: "Contado",
    prima: "",
    anios_financiamiento: 10,
    avalId: "",
    beneficiarioNombre: "",
    beneficiarioDni: "",
    beneficiarioRelacion: "",
  });

  const [loteInfo, setLoteInfo] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [searchCliente, setSearchCliente] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [step, setStep] = useState(1); // 1: datos, 2: financiamiento, 3: confirmación

  useEffect(() => {
    if (searchCliente.length < 2) return;
    const t = setTimeout(() => {
      clientesApi.list(searchCliente).then(setClientes).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [searchCliente]);

  useEffect(() => {
    if (!form.loteId) { setLoteInfo(null); return; }
    lotesApi.calcularValor(form.loteId).then(setLoteInfo).catch(() => {});
  }, [form.loteId]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const montoFinanciar =
    loteInfo
      ? form.tipo_venta === "Credito"
        ? loteInfo.valor_total - (parseFloat(form.prima) || 0)
        : loteInfo.valor_total
      : 0;

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await ventasApi.create(form);
      // sp_generar_plan_pagos se llama automáticamente en el SP de venta (transaccional)
      setSuccess(res.ventaId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div>
        <PageHeader title="Venta registrada" />
        <PageContent>
          <Card className="p-8 max-w-md text-center">
            <div className="text-5xl mb-4">◆</div>
            <p className="text-lg font-semibold text-stone-100 mb-2">
              Venta creada exitosamente
            </p>
            <p className="text-sm text-stone-400 mb-6">
              El plan de pagos fue generado automáticamente.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to={`/ventas/${success}/plan-pagos`}>
                <Button>Ver plan de pagos</Button>
              </Link>
              <Link to="/ventas">
                <Button variant="secondary">Ver ventas</Button>
              </Link>
            </div>
          </Card>
        </PageContent>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Nueva Venta"
        subtitle="sp_crear_venta + sp_generar_plan_pagos — transaccional"
        actions={
          <Link to="/ventas">
            <Button variant="ghost">← Volver</Button>
          </Link>
        }
      />
      <PageContent>
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Step indicator */}
        <div className="flex gap-1 mb-8">
          {["Datos del lote", "Cliente & tipo", "Financiamiento"].map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <button
                onClick={() => setStep(i + 1)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                  step === i + 1
                    ? "bg-amber-400 text-stone-950"
                    : step > i + 1
                    ? "bg-stone-700 text-stone-300"
                    : "bg-stone-900 text-stone-600"
                }`}
              >
                {i + 1}. {s}
              </button>
              {i < 2 && <span className="text-stone-700">›</span>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Step 1 */}
            {step === 1 && (
              <Card className="p-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                  Selección de lote
                </p>
                <FormField label="ID del lote" required>
                  <Input
                    type="number"
                    value={form.loteId}
                    onChange={set("loteId")}
                    placeholder="Ingrese el ID del lote"
                  />
                </FormField>
                {loteInfo && (
                  <div className="bg-stone-800 rounded-md p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Código:</span>
                      <span className="text-stone-200">{loteInfo.codigo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Área:</span>
                      <span className="text-stone-200">{loteInfo.area_m2} v²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Valor base:</span>
                      <span className="text-amber-400 font-semibold">
                        L {Number(loteInfo.valor_total).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {loteInfo.es_esquina && <Badge variant="warning">Esquina</Badge>}
                      {loteInfo.cerca_parque && <Badge variant="info">Cerca de parque</Badge>}
                      {loteInfo.calle_cerrada && <Badge variant="success">Calle cerrada</Badge>}
                    </div>
                  </div>
                )}
                <Button onClick={() => setStep(2)} disabled={!form.loteId}>
                  Continuar →
                </Button>
              </Card>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <Card className="p-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                  Cliente & tipo de venta
                </p>
                <FormField label="Buscar cliente">
                  <Input
                    placeholder="Nombre, DNI o correo..."
                    value={searchCliente}
                    onChange={(e) => setSearchCliente(e.target.value)}
                  />
                </FormField>
                {clientes.length > 0 && (
                  <div className="bg-stone-800 border border-stone-700 rounded-md overflow-hidden">
                    {clientes.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setForm((f) => ({ ...f, clienteId: c.id }));
                          setSearchCliente(`${c.nombre} ${c.apellido}`);
                          setClientes([]);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-stone-700 transition-colors border-b border-stone-700/50 last:border-0 ${
                          form.clienteId === c.id ? "bg-amber-400/10 text-amber-400" : "text-stone-300"
                        }`}
                      >
                        {c.nombre} {c.apellido} · {c.dni}
                      </button>
                    ))}
                  </div>
                )}
                
                <FormField label="Tipo de venta" required>
                  <Select value={form.tipo_venta} onChange={set("tipo_venta")}>
                    <option value="Contado">Contado</option>
                    <option value="Credito">Crédito (financiado)</option>
                  </Select>
                </FormField>

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(1)}>← Atrás</Button>
                  <Button onClick={() => setStep(3)} disabled={!form.clienteId}>Continuar →</Button>
                </div>
              </Card>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <Card className="p-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                  {form.tipo_venta === "Credito" ? "Financiamiento" : "Confirmación"}
                </p>

                {form.tipo_venta === "Credito" && (
                  <>
                    <FormField label="Prima (opcional)">
                      <Input
                        type="number"
                        value={form.prima}
                        onChange={set("prima")}
                        placeholder="0.00"
                        min={0}
                      />
                    </FormField>
                    <FormField label="Años de financiamiento" required>
                      <Input
                        type="number"
                        value={form.anios_financiamiento}
                        onChange={set("anios_financiamiento")}
                        min={1}
                        max={30}
                      />
                    </FormField>
                    <div className="border-t border-stone-800 pt-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                        Aval y beneficiario
                      </p>
                      <FormField label="ID del aval" required>
                        <Input
                          type="number"
                          value={form.avalId}
                          onChange={set("avalId")}
                          placeholder="ID del cliente aval"
                        />
                      </FormField>
                      <FormField label="Beneficiario (nombre)" required>
                        <Input value={form.beneficiarioNombre} onChange={set("beneficiarioNombre")} />
                      </FormField>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="DNI beneficiario">
                          <Input value={form.beneficiarioDni} onChange={set("beneficiarioDni")} />
                        </FormField>
                        <FormField label="Relación">
                          <Input value={form.beneficiarioRelacion} onChange={set("beneficiarioRelacion")} placeholder="Cónyuge, hijo..." />
                        </FormField>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(2)}>← Atrás</Button>
                  <Button onClick={handleSubmit} disabled={saving}>
                    {saving ? "Procesando..." : "Confirmar venta"}
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Resumen lateral */}
          <div>
            <Card className="p-5 sticky top-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                Resumen
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Tipo</span>
                  <Badge variant={form.tipo_venta === "Credito" ? "info" : "success"}>
                    {form.tipo_venta}
                  </Badge>
                </div>
                {loteInfo && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Valor lote</span>
                      <span className="text-stone-300">
                        L {Number(loteInfo.valor_total).toLocaleString("es-HN")}
                      </span>
                    </div>
                    {form.tipo_venta === "Credito" && form.prima && (
                      <div className="flex justify-between">
                        <span className="text-stone-500">Prima</span>
                        <span className="text-stone-300">
                          L {Number(form.prima).toLocaleString("es-HN")}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-stone-800 pt-2 mt-2">
                      <span className="text-stone-400 font-medium">A financiar</span>
                      <span className="text-amber-400 font-semibold">
                        L {Number(montoFinanciar).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {form.tipo_venta === "Credito" && form.anios_financiamiento && (
                      <p className="text-xs text-stone-600 pt-1">
                        {form.anios_financiamiento} años ·{" "}
                        {form.anios_financiamiento * 12} cuotas mensuales
                      </p>
                    )}
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </PageContent>
    </div>
  );
}
