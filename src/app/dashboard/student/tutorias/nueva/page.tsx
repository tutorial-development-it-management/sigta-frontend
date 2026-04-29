"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getSubjects,
  getTutorsBySubject,
  createTutoringRequest,
  Subject,
  TutorBasic,
  getErrorMessage,
} from "@/lib/api";
import { BookOpen, User, Calendar, Clock, ArrowLeft, CheckCircle } from "lucide-react";

const MODALITIES = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual",    label: "Virtual" },
  { value: "híbrida",    label: "Híbrida" },
];

function getLocalDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function NuevaSolicitudPage() {
  const router  = useRouter();
  const { user } = useAuth();

  const [subjects, setSubjects]       = useState<Subject[]>([]);
  const [tutors, setTutors]           = useState<TutorBasic[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingTutors, setLoadingTutors]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const [form, setForm] = useState({
    subject_id: "",
    tutor_id:   "",
    preferred_date: "",
    preferred_time: "",
    modality:   "presencial",
    topic:      "",
  });

  // Cargar materias al montar
  useEffect(() => {
    getSubjects()
      .then(setSubjects)
      .catch(() => setError("No se pudieron cargar las materias"))
      .finally(() => setLoadingSubjects(false));
  }, []);

  // Cargar tutores cuando cambia la materia
  useEffect(() => {
    if (!form.subject_id) {
      setTutors([]);
      setForm((f) => ({ ...f, tutor_id: "" }));
      return;
    }
    setLoadingTutors(true);
    setForm((f) => ({ ...f, tutor_id: "" }));
    getTutorsBySubject(Number(form.subject_id))
      .then(setTutors)
      .catch(() => setTutors([]))
      .finally(() => setLoadingTutors(false));
  }, [form.subject_id]);

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!form.subject_id || !form.preferred_date || !form.preferred_time || !form.modality) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createTutoringRequest({
        student_id:     String(user.id),
        subject_id:     Number(form.subject_id),
        tutor_id:       form.tutor_id || undefined,
        preferred_date: form.preferred_date,
        preferred_time: `${form.preferred_time}:00`,
        modality:       form.modality,
        topic:          form.topic.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/student/tutorias"), 1800);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo crear la solicitud"));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] text-[#111827] outline-none transition-[border,box-shadow] focus:border-[#FFC100] focus:shadow-[0_0_0_3px_rgba(255,193,0,0.12)] disabled:bg-gray-50 disabled:text-gray-400";

  const labelClass = "block mb-[6px] text-[13px] font-normal text-[#374151]";

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-14 w-14 rounded-full bg-[#E6F4EA] flex items-center justify-center">
          <CheckCircle className="h-7 w-7 text-[#1E7E34]" />
        </div>
        <h2 className="text-xl font-bold text-[#0F2547]">Solicitud enviada</h2>
        <p className="text-sm text-gray-500">Tu solicitud quedó en estado pendiente. Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-[8px] border border-[#E5E7EB] hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#0F2547]">Solicitar tutoría</h1>
          <p className="text-[13px] text-gray-500">Completa los datos para enviar tu solicitud</p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#E5E7EB] rounded-[10px] p-6 space-y-5">

        {/* Materia */}
        <div>
          <label className={labelClass}>
            <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-[#FFC100]" />Materia <span className="text-red-500">*</span></span>
          </label>
          {loadingSubjects ? (
            <p className="text-[13px] text-gray-400 py-2">Cargando materias...</p>
          ) : (
            <select value={form.subject_id} onChange={set("subject_id")} required className={inputClass}>
              <option value="">Selecciona una materia</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Tutor */}
        <div>
          <label className={labelClass}>
            <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-[#FFC100]" />Tutor (opcional)</span>
          </label>
          <select
            value={form.tutor_id}
            onChange={set("tutor_id")}
            disabled={!form.subject_id || loadingTutors}
            className={inputClass}
          >
            <option value="">
              {!form.subject_id
                ? "Selecciona una materia primero"
                : loadingTutors
                ? "Cargando tutores..."
                : tutors.length === 0
                ? "No hay tutores disponibles"
                : "Sin preferencia (asignar después)"}
            </option>
            {tutors.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
          {form.subject_id && !loadingTutors && tutors.length > 0 && (
            <p className="mt-1 text-[11px] text-gray-400">Si no seleccionas tutor, el coordinador asignará uno.</p>
          )}
        </div>

        {/* Fecha y hora */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[#FFC100]" />Fecha preferida <span className="text-red-500">*</span></span>
            </label>
            <input
              type="date"
              value={form.preferred_date}
              onChange={set("preferred_date")}
              min={getLocalDateString()}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-[#FFC100]" />Hora preferida <span className="text-red-500">*</span></span>
            </label>
            <input
              type="time"
              value={form.preferred_time}
              onChange={set("preferred_time")}
              required
              className={inputClass}
            />
          </div>
        </div>

        {/* Modalidad */}
        <div>
          <label className={labelClass}>Modalidad <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            {MODALITIES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, modality: m.value }))}
                className={`flex-1 py-2 rounded-[8px] text-[12px] font-medium border transition-colors ${
                  form.modality === m.value
                    ? "bg-[#0F2547] text-white border-[#0F2547]"
                    : "bg-white text-gray-600 border-[#D1D5DB] hover:border-[#0F2547]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tema */}
        <div>
          <label className={labelClass}>Tema o consulta específica</label>
          <textarea
            value={form.topic}
            onChange={set("topic")}
            rows={3}
            placeholder="Ej: Tengo dificultades con derivadas implícitas y la regla de la cadena..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && (
          <p className="text-[12px] text-red-600 bg-red-50 rounded-[8px] px-3 py-2">{error}</p>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-[11px] rounded-[9px] border border-[#D1D5DB] text-[13px] font-semibold text-[#374151] hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-[11px] rounded-[9px] bg-[#FFC100] text-[13px] font-bold text-[#0F2547] hover:bg-[#e6ad00] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Enviando..." : "Enviar solicitud"}
          </button>
        </div>
      </form>
    </div>
  );
}
