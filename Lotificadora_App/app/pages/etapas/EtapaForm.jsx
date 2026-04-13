// EtapaForm.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";

import { PageHeader, PageContent, Button, FormField, Input, Select, Card } from "../../components/index";
import { etapasApi, proyectosApi } from "../../services/api.js";

const EMPTY = {
  Nombre: "",
  ProyectoID: "",
  AreaTotalVaras: "",
  PorcentajeAreasVerdes: "",
  PorcentajeAreasComunes: "",
  PrecioVaraCuadrada: "",
  TasaInteresAnual: "",
  //Estado: "EnPlanificacion",
};

const normalizeEtapa = (data) => ({
  Nombre: data.Nombre ?? data.nombre ?? "",
  ProyectoID: data.ProyectoID ?? data.proyectoId ?? data.proyecto_id ?? "",
  AreaTotalVaras: data.AreaTotalVaras ?? data.area_total_varas ?? data.areaTotalVaras ?? "",
  PorcentajeAreasVerdes: data.PorcentajeAreasVerdes ?? data.porcentaje_areas_verdes ?? "",
  PorcentajeAreasComunes: data.PorcentajeAreasComunes ?? data.porcentaje_areas_comunes ?? "",
  PrecioVaraCuadrada: data.PrecioVaraCuadrada ?? data.precio_vara2 ?? data.precioVaraCuadrada ?? "",
  TasaInteresAnual: data.TasaInteresAnual ?? data.tasa_interes ?? data.tasaInteresAnual ?? "",
  //Estado: data.Estado ?? data.estado ?? "EnPlanificacion",
});

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
    etapasApi.get(id).then((d) => setForm(normalizeEtapa(d))).catch(() => {});
  }, [id, isEdit]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    console.log(form)
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
            <FormField label="Proyecto" required isDisabled>
              <Select value={form.ProyectoID} onChange={set("ProyectoID")} required disabled={isEdit}>
                <option value="">Seleccione proyecto...</option>
                {proyectos.map((p) => <option key={p.ProyectoID} value={p.ProyectoID}>{p.Nombre}</option>)}
              </Select>
            </FormField>
            <FormField label="Etapa" required>
              <Input value={form.Nombre} onChange={set("Nombre")} placeholder="Etapa 1 - Zona Norte" required />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Área total (varas)" required>
                <Input type="number" value={form.AreaTotalVaras} onChange={set("AreaTotalVaras")} placeholder="50000" required />
              </FormField>
              <FormField label="Precio por vara²" required>
                <Input type="number" value={form.PrecioVaraCuadrada} onChange={set("PrecioVaraCuadrada")} placeholder="2500" required />
              </FormField>
              <FormField label="% Áreas verdes" required>
                <Input type="number" value={form.PorcentajeAreasVerdes} onChange={set("PorcentajeAreasVerdes")} placeholder="15" required />
              </FormField>
              <FormField label="% Áreas comunes" required>
                <Input type="number" value={form.PorcentajeAreasComunes} onChange={set("PorcentajeAreasComunes")} placeholder="10" required />
              </FormField>
              <FormField label="Tasa interés anual %" required>
                <Input type="number" value={form.TasaInteresAnual} onChange={set("TasaInteresAnual")} placeholder="9.5" required />
              </FormField>
              {/*<FormField label="Estado" required>
                <Select value={form.Estado} onChange={set("Estado")} required>
                  <option value="EnPlanificacion">EnPlanificacion</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Completado">Completado</option>
                </Select>
              </FormField>*/}
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
