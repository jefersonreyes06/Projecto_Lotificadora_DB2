import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";

import {
  PageHeader, PageContent, Button, FormField, Input, Select, Card, Alert,
} from "../../components/index";
import { proyectosApi } from "../../services/api.js";

const EMPTY = {
  Nombre: "",
  UbicacionLegal: "",
  MaxAniosFinanciamiento: 20,
  Estado: "Activo",
};

export default function ProyectoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    proyectosApi
      .get(id)
      .then((d) => setForm(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await proyectosApi.update(id, form);
      } else {
        await proyectosApi.create(form);
      }
      navigate("/proyectos");
    } catch (err) {
      setError(err.message);
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
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? "Editar Proyecto" : "Nuevo Proyecto"}
        subtitle={
          isEdit
            ? `sp_proyectos_actualizar @id=${id}`
            : "sp_proyectos_insertar"
        }
        actions={
          <Link to="/proyectos">
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
                      required
                    />
                  </FormField>
                </div>

                <div className="col-span-2">
                  <FormField label="Ubicación Legal" required>
                    <Input
                      value={form.UbicacionLegal}
                      onChange={set("UbicacionLegal")}
                      placeholder="Dirección legal del proyecto"
                      required
                    />
                  </FormField>
                </div>

                <FormField label="Máximo años financiamiento" required>
                  <Input
                    type="number"
                    value={form.MaxAniosFinanciamiento}
                    onChange={set("MaxAniosFinanciamiento")}
                    min={1}
                    max={30}
                    required
                  />
                </FormField>

                <FormField label="Estado">
                  <Select value={form.Estado} onChange={set("Estado")}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Completado">Completado</option>
                  </Select>
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
