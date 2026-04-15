// ════════════════════════════════════════
// CuentaForm.jsx
// ════════════════════════════════════════
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { cuentasApi, etapasApi, proyectosApi } from "../../services/api.js";
import {
  PageHeader, PageContent, Button, Card, Input, Select, FormField,
} from "../../components/index";

export function CuentaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    EtapaID: "",
    //Proyecto: "",
    //Etapa: "",
    Banco: "",
    NumeroCuenta: "",
    TipoCuenta: "Corriente",
    SaldoActual: 0,
    Estado: "Activa"
  });

  const [etapas, setEtapas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [proyectoId, setProyectoId] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar etapas
      const etapasData = await etapasApi.list();
      setEtapas(etapasData);

      const proyectosData = await proyectosApi.list();
      setProyectos(proyectosData);

      // Si estamos editando, cargar la cuenta
      if (isEditing) {
        const cuentaData = await cuentasApi.get(id);
        setFormData({
          EtapaID: cuentaData.EtapaID.toString(),
          Proyecto: cuentaData.Proyecto,
          Etapa: cuentaData.Etapa,
          Banco: cuentaData.Banco,
          NumeroCuenta: cuentaData.NumeroCuenta,
          TipoCuenta: cuentaData.TipoCuenta,
          SaldoActual: cuentaData.SaldoActual || 0,
          Estado: cuentaData.Estado
        });
      }
    } catch (err) {
      setError(err.message || "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!proyectoId) { setEtapas([]); return; }
    etapasApi.list().then((etapas) => setEtapas(etapas.filter((e) => e.ProyectoID === proyectoId))).catch(() => {});
  }, [proyectoId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const dataToSend = {
        ...formData,
        EtapaID: parseInt(formData.EtapaID),
        SaldoActual: parseFloat(formData.SaldoActual) || 0
      };

      if (isEditing) {
        await cuentasApi.update(id, dataToSend);
      } else {
        await cuentasApi.create(dataToSend);
      }

      navigate("/cuentas");
    } catch (err) {
      setError(err.message || "Error al guardar la cuenta");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const tiposCuenta = [
    { value: "Corriente", label: "Corriente" },
    { value: "Ahorro", label: "Ahorro" },
    { value: "Plazo Fijo", label: "Plazo Fijo" },
  ];

  const estados = [
    { value: "Activa", label: "Activa" },
    { value: "Inactiva", label: "Inactiva" },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title={isEditing ? "Editar Cuenta" : "Nueva Cuenta"} subtitle="Cargando..." />
        <PageContent>
          <div className="text-center text-stone-400 py-8">
            Cargando datos...
          </div>
        </PageContent>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEditing ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}
        subtitle={isEditing ? "sp_cuentas_actualizar" : "sp_cuentas_crear"}
      />
      <PageContent>
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mostrar error */}
            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded p-4 text-red-200">
                {error}
              </div>
            )}

            <Card className="p-6 space-y-4">
              <FormField label="Proyecto" required isDisabled>
                <Select value={proyectoId} onChange={(e) => setProyectoId(parseInt(e.target.value))} required disabled={isEditing}>
                  {/* <option value="">Seleccione proyecto...</option>*/}
                  {isEditing ? <option value="">{formData.Proyecto || "Proyecto Actual"}</option> : <option value="">Seleccione proyecto...</option>}
                  {proyectos.map((p) => <option key={p.ProyectoID} value={p.ProyectoID}>{p.Nombre}</option>)}
                </Select>
              </FormField>
              <FormField label="Etapa" required>
                <Select
                  value={formData.EtapaID}
                  onChange={(e) => handleChange("EtapaID", e.target.value)}
                  disabled={isEditing}
                  required
                >
                  {isEditing ? <option value="">{formData.Etapa || "Etapa Actual"}</option> : <option value="">Seleccione etapa...</option>}
{/*
                  <option value="">Seleccionar etapa</option>*/}
                  {etapas.map(etapa => (
                    <option key={etapa.EtapaID} value={etapa.EtapaID}>
                      {etapa.Etapa}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Banco" required>
                <Input
                  placeholder="Nombre del banco"
                  value={formData.Banco}
                  onChange={(e) => handleChange("Banco", e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Número de Cuenta" required>
                <Input
                  placeholder="Número de cuenta bancaria"
                  value={formData.NumeroCuenta}
                  onChange={(e) => handleChange("NumeroCuenta", e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Tipo de Cuenta" required>
                <Select
                  value={formData.TipoCuenta}
                  onChange={(e) => handleChange("TipoCuenta", e.target.value)}
                  required
                >
                  {tiposCuenta.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Saldo Actual">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.SaldoActual}
                  onChange={(e) => handleChange("SaldoActual", e.target.value)}
                />
              </FormField>

              <FormField label="Estado" required>
                <Select
                  value={formData.Estado}
                  onChange={(e) => handleChange("Estado", e.target.value)}
                  required
                >
                  {estados.map(estado => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </Card>

            {/* Botones de acción */}
            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
              >
                {saving ? "Guardando..." : (isEditing ? "Actualizar Cuenta" : "Crear Cuenta")}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/cuentas")}
                disabled={saving}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </PageContent>
    </div>
  );
}

export default CuentaForm;