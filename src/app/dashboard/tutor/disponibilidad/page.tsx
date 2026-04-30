"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getMyAvailability,
  addAvailabilitySlot,
  removeAvailabilitySlot,
  AvailabilitySlot,
  getErrorMessage,
} from "@/lib/api";
import { Plus, Trash2, Clock } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MODALIDADES = ["presencial", "virtual", "híbrida"];

const COLOR: Record<number, string> = {
  0: "bg-red-100 text-red-700",
  1: "bg-blue-100 text-blue-800",
  2: "bg-green-100 text-green-800",
  3: "bg-purple-100 text-purple-800",
  4: "bg-orange-100 text-orange-800",
  5: "bg-yellow-100 text-yellow-800",
  6: "bg-pink-100 text-pink-800",
};

const inputClass =
  "w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] outline-none focus:border-[#FFC100] focus:shadow-[0_0_0_3px_rgba(255,193,0,0.12)]";

export default function DisponibilidadPage() {
  const [slots, setSlots]       = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  const [form, setForm] = useState({
    dia_semana:  1,
    hora_inicio: "08:00",
    hora_fin:    "10:00",
    modalidad:   "presencial",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSlots(await getMyAvailability());
    } catch (err) {
      setError(getErrorMessage(err, "Error al cargar disponibilidad"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await addAvailabilitySlot(form);
      setSuccess("Franja horaria agregada");
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Error al agregar franja"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    setError(null);
    try {
      await removeAvailabilitySlot(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(getErrorMessage(err, "Error al eliminar franja"));
    } finally {
      setDeleting(null);
    }
  };

  const grouped = DIAS.map((nombre, idx) => ({
    dia: idx,
    nombre,
    slots: slots.filter((s) => s.dia_semana === idx),
  })).filter((g) => g.slots.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Mi Disponibilidad</h1>
        <p className="mt-1 text-sm text-gray-500">
          Define los horarios en que puedes atender tutorías. Los estudiantes solo podrán solicitarte en estos horarios.
        </p>
      </div>

      {/* Formulario agregar franja */}
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5">
        <h2 className="text-[14px] font-bold text-[#0F2547] mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Agregar franja horaria
        </h2>
        <form onSubmit={handleAdd} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block mb-1 text-[11px] font-semibold text-gray-400 uppercase">Día</label>
            <select
              value={form.dia_semana}
              onChange={(e) => setForm((f) => ({ ...f, dia_semana: Number(e.target.value) }))}
              className={inputClass}
            >
              {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-[11px] font-semibold text-gray-400 uppercase">Inicio</label>
            <input type="time" value={form.hora_inicio}
              onChange={(e) => setForm((f) => ({ ...f, hora_inicio: e.target.value }))}
              className={inputClass} required />
          </div>
          <div>
            <label className="block mb-1 text-[11px] font-semibold text-gray-400 uppercase">Fin</label>
            <input type="time" value={form.hora_fin}
              onChange={(e) => setForm((f) => ({ ...f, hora_fin: e.target.value }))}
              className={inputClass} required />
          </div>
          <div>
            <label className="block mb-1 text-[11px] font-semibold text-gray-400 uppercase">Modalidad</label>
            <select value={form.modalidad}
              onChange={(e) => setForm((f) => ({ ...f, modalidad: e.target.value }))}
              className={inputClass}>
              {MODALIDADES.map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-4">
            {error   && <p className="text-[12px] text-red-600 bg-red-50 rounded-[8px] px-3 py-2 mb-2">{error}</p>}
            {success && <p className="text-[12px] text-green-700 bg-green-50 rounded-[8px] px-3 py-2 mb-2">{success}</p>}
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-[10px] rounded-[9px] bg-[#FFC100] text-[13px] font-bold text-[#0F2547] hover:bg-[#e6ad00] disabled:opacity-60">
              <Plus className="h-4 w-4" />
              {saving ? "Guardando..." : "Agregar franja"}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de franjas */}
      {loading ? (
        <p className="text-sm text-center text-gray-400 py-8">Cargando disponibilidad...</p>
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Sin franjas configuradas"
          description="Agrega horarios para que los estudiantes puedan solicitar tutorías contigo."
        />
      ) : (
        <div className="space-y-4">
          {grouped.map(({ dia, nombre, slots: daySlots }) => (
            <div key={dia} className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden">
              <div className={`px-4 py-2 ${COLOR[dia]} font-semibold text-[12px] uppercase tracking-wide`}>
                {nombre}
              </div>
              <div className="divide-y divide-[#F3F4F6]">
                {daySlots.map((s) => (
                  <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-[13px] font-medium text-[#0F2547]">
                        {s.hora_inicio} – {s.hora_fin}
                      </span>
                      <span className="text-[11px] capitalize text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {s.modalidad}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deleting === s.id}
                      className="p-1.5 rounded-md text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
