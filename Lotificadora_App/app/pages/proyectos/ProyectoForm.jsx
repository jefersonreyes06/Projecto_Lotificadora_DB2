import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";

import {
  PageHeader, PageContent, Button, FormField, Input, Select, Card, Alert,
} from "../../components/index";

const EMPTY = {
  nombre: "",
  descripcion: "",
  ubicacion: "",
  departamento: "",
  municipio: "",
  limite_anios_financiamiento: 20,
  estado: "Activo",
};

export default function ProyectoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    proyectosApi
      .get(id)
      .then((d) => setForm(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

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
                      value={form.nombre}
                      onChange={set("nombre")}
                      placeholder="Ej. Residencial Los Pinos"
                      required
                    />
                  </FormField>
                </div>

                <FormField label="Departamento" required>
                  <Input
                    value={form.departamento}
                    onChange={set("departamento")}
                    placeholder="Francisco Morazán"
                    required
                  />
                </FormField>

                <FormField label="Municipio" required>
                  <Input
                    value={form.municipio}
                    onChange={set("municipio")}
                    placeholder="Tegucigalpa"
                    required
                  />
                </FormField>

                <div className="col-span-2">
                  <FormField label="Ubicación / Dirección">
                    <Input
                      value={form.ubicacion}
                      onChange={set("ubicacion")}
                      placeholder="Km 12 carretera al norte..."
                    />
                  </FormField>
                </div>

                <div className="col-span-2">
                  <FormField label="Descripción">
                    <textarea
                      value={form.descripcion}
                      onChange={set("descripcion")}
                      rows={3}
                      className="w-full bg-stone-800 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/20 transition-all resize-none"
                      placeholder="Descripción del proyecto habitacional..."
                    />
                  </FormField>
                </div>

                <FormField label="Límite años financiamiento" required>
                  <Input
                    type="number"
                    value={form.limite_anios_financiamiento}
                    onChange={set("limite_anios_financiamiento")}
                    min={1}
                    max={30}
                    required
                  />
                </FormField>

                <FormField label="Estado">
                  <Select value={form.estado} onChange={set("estado")}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Completado">Completado</option>
                  </Select>
                </FormField>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-stone-800">
                <Link to="/proyectos">
                  <Button variant="secondary">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear proyecto"}
                </Button>
              </div>
            </Card>
          </form>
        )}
      </PageContent>
    </div>
  );
}
