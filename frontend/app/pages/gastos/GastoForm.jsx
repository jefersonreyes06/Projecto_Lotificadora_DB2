import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { notify, useNotifyError } from "../../utils/notify.js";

import {
  PageHeader, PageContent, Button, FormField, Input, Select, Card, Alert,
} from "../../components/index";
import { proyectosApi, gastosApi } from "../../services/api.js";

const EMPTY = {
  Nombre: "",
  ProyectoID: 0,
  TipoGastoID: 0,
  MontoTotal: 0,
  Concepto: "",
  Proveedor: "",
  Estado: "Pendiente"
};

export default function ProyectoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useNotifyError(error);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    proyectosApi
      .get(id)
      .then((d) => setForm(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);


  useEffect(() => {
    setLoading(true);

    gastosApi.listTipos()
      .then((data) => {
        setTipos(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);


  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    console.log({ ProyectoID: id, TipoGastoID: form.TipoGastoID, MontoTotal: form.MontoTotal, Concepto: form.Concepto, Proveedor: form.Proveedor });

    try {
      await gastosApi.create({ ProyectoID: id, TipoGastoID: form.TipoGastoID, MontoTotal: form.MontoTotal, Concepto: form.Concepto, Proveedor: form.Proveedor });
      notify.success("Gasto creado correctamente");
      navigate("/gastos");
    } catch (err) {
      const message = err.message || "No se pudo crear el gasto";
      setError(message);
      notify.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    setError(null);
    try {
      await proyectosApi.remove(id);
      navigate("/proyectos");
    } catch (err) {
      const message = err.message || "No se pudo eliminar el proyecto";
      setError(message);
      notify.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={"Nuevo Gasto"}
        subtitle={`sp_proyectos_actualizar @id=${id}`}
        actions={
          <Link to="/gastos">
            <Button variant="ghost">← Volver</Button>
          </Link>
        }
      />
      <PageContent>
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}
        {loading ? (
          <p className="text-sm text-stone-500 animate-pulse">Cargando...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card className="p-6 space-y-5 max-w-2xl">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <FormField label="Nombre del proyecto" required>
                    <Input
                      value={form.Nombre}
                      onChange={set("Nombre")}
                      placeholder="Ej. Residencial Los Pinos"
                      disabled={true}
                      required
                    />
                  </FormField>
                </div>
                {/*
                <div>
                  <FormField label="Etapa" required>
                    <Select value={form.Etapa} onChange={set("Etapa")}>
                      <option value="">Seleccionar Etapa</option>
                      {etapas.map((etapa) => (
                        <option key={etapa.EtapaID} value={etapa.EtapaID}>
                          {etapa.Etapa}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>*/}

                <div className="col-span-2">
                  <FormField label="Tipo de Gasto" required>
                    <Select value={form.TipoGastoID} onChange={set("TipoGastoID")}>
                      <option value="">Seleccionar Tipo de Gasto</option>
                      {tipos.map((tipo) => (
                        <option key={tipo.TipoGastoID} value={tipo.TipoGastoID}>
                          {tipo.Nombre}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>

                <FormField label="Monto total" required>
                  <p className="text-xs text-stone-500">El monto se dividirá equitativamente entre las etapas del proyecto</p>
                  <Input
                    type="number"
                    value={form.MontoTotal}
                    onChange={set("MontoTotal")}
                    min={0}
                    required
                  />
                </FormField>

                <FormField label="Concepto" required>
                  <Input
                    value={form.Concepto}
                    onChange={set("Concepto")}
                    placeholder="Descripción del gasto"
                    required
                  />
                </FormField>

                <FormField label="Proveedor" required>
                  <Input
                    value={form.Proveedor}
                    onChange={set("Proveedor")}
                    placeholder="Nombre del proveedor"
                    required
                  />
                </FormField>


              </div>

              <div className="flex justify-between gap-3 pt-2 border-t border-stone-800">
                <div>
                  {isEdit && (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleting ? "Eliminando..." : "Eliminar proyecto"}
                    </Button>
                  )}
                </div>
                <div className="flex gap-3">
                  <Link to="/proyectos">
                    <Button variant="secondary">Cancelar</Button>
                  </Link>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear proyecto"}
                  </Button>
                </div>
              </div>
            </Card>
          </form>
        )}
      </PageContent>
    </div>
  );
}
