// EtapaForm.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";

import { PageHeader, PageContent, Button, FormField, Input, Select, Card } from "../../components/index";
import { etapasApi, proyectosApi } from "../../services/api.js";

const EMPTY = { nombre: "", proyectoId: "", precio_vara2: "", tasa_interes: "", limite_anios: 20 };

export default function EtapaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(EMPTY);
  const [proyectos, setProyectos] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { proyectosApi.list().then(setProyectos).catch(() => {}); }, []);
  useEffect(() => {
    if (!isEdit) return;
    etapasApi.get(id).then(setForm).catch(() => {});
  }, [id, isEdit]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      isEdit ? await etapasApi.update(id, form) : await etapasApi.create(form);
      navigate("/etapas");
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? "Editar Etapa" : "Nueva Etapa"}
        subtitle={isEdit ? "sp_etapas_actualizar" : "sp_etapas_insertar"}
        actions={<Link to="/etapas"><Button variant="ghost">← Volver</Button></Link>}
      />
      <PageContent>
        <form onSubmit={handleSubmit}>
          <Card className="p-6 space-y-5 max-w-xl">
            <FormField label="Proyecto" required>
              <Select value={form.proyectoId} onChange={set("proyectoId")} required>
                <option value="">Seleccione proyecto...</option>
                {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </Select>
            </FormField>
            <FormField label="Nombre de etapa" required>
              <Input value={form.nombre} onChange={set("nombre")} placeholder="Etapa I" required />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Precio por vara²" required>
                <Input type="number" value={form.precio_vara2} onChange={set("precio_vara2")} placeholder="0.00" required />
              </FormField>
              <FormField label="Tasa interés anual %" required>
                <Input type="number" value={form.tasa_interes} onChange={set("tasa_interes")} placeholder="12.00" required />
              </FormField>
              <FormField label="Límite años financiamiento">
                <Input type="number" value={form.limite_anios} onChange={set("limite_anios")} min={1} max={30} />
              </FormField>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-stone-800">
              <Link to="/etapas"><Button variant="secondary">Cancelar</Button></Link>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}</Button>
            </div>
          </Card>
        </form>
      </PageContent>
    </div>
  );
}
