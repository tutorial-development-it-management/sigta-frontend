"use client";

import { useEffect, useState } from "react";
import { getMetrics, getSubjects, userList, MetricsResponse, Subject, User, getErrorMessage } from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";
import {
  Calendar, CheckCircle, Clock, XCircle, Star, BookOpen, Users, BarChart, TrendingUp,
} from "lucide-react";

const round1 = (n: number | null) =>
  n == null ? "—" : String(Math.round(n * 10) / 10);

const StarRating = ({ value }: { value: number | null }) => {
  if (value == null) return <span className="text-gray-400 text-[13px]">Sin evaluaciones</span>;
  const full  = Math.floor(value);
  const empty = 5 - full;
  return (
    <span className="flex items-center gap-0.5">
      {Array(full).fill(0).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-[#FFC100] text-[#FFC100]" />
      ))}
      {Array(empty).fill(0).map((_, i) => (
        <Star key={i} className="h-4 w-4 text-gray-300" />
      ))}
      <span className="ml-1 text-[13px] font-semibold text-[#0F2547]">{round1(value)}</span>
    </span>
  );
};

export default function CoordinatorDashboard() {
  const [metrics, setMetrics]     = useState<MetricsResponse | null>(null);
  const [subjects, setSubjects]   = useState<Subject[]>([]);
  const [tutors, setTutors]       = useState<User[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // Filtros
  const [filterTutor,   setFilterTutor]   = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const loadMetrics = async (tutorId?: string, subjectId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const [m, subs, usrs] = await Promise.all([
        getMetrics({ tutor_id: tutorId, subject_id: subjectId }),
        subjects.length ? Promise.resolve(subjects) : getSubjects(),
        tutors.length   ? Promise.resolve(tutors)   : userList(100, 0).then((r) => r.items.filter((u) => u.role_name === "tutor")),
      ]);
      setMetrics(m);
      if (!subjects.length) setSubjects(subs);
      if (!tutors.length)   setTutors(usrs);
    } catch (err) {
      setError(getErrorMessage(err, "Error al cargar métricas"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMetrics(); }, []); // eslint-disable-line

  const handleFilter = () => {
    const tid = filterTutor   || undefined;
    const sid = filterSubject ? Number(filterSubject) : undefined;
    loadMetrics(tid, sid);
  };

  const handleReset = () => {
    setFilterTutor("");
    setFilterSubject("");
    loadMetrics();
  };

  const selectClass = "block w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[12px] py-[9px] text-[12px] text-[#374151] outline-none focus:border-[#FFC100]";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Dashboard de Métricas</h1>
        <p className="mt-1 text-sm text-gray-500">Seguimiento académico del programa de tutorías.</p>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Tutor</label>
          <select value={filterTutor} onChange={(e) => setFilterTutor(e.target.value)} className={selectClass}>
            <option value="">Todos los tutores</option>
            {tutors.map((t) => (
              <option key={String(t.id)} value={String(t.id)}>
                {t.first_name} {t.last_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Materia</label>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className={selectClass}>
            <option value="">Todas las materias</option>
            {subjects.map((s) => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={handleFilter}
            className="px-4 py-[9px] rounded-[8px] bg-[#0F2547] text-white text-[12px] font-bold hover:bg-[#1a3a6b] transition-colors">
            Aplicar
          </button>
          <button onClick={handleReset}
            className="px-4 py-[9px] rounded-[8px] border border-[#D1D5DB] text-[12px] font-semibold text-[#374151] hover:bg-gray-50 transition-colors">
            Limpiar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F2547]" />
        </div>
      ) : error ? (
        <p className="text-sm text-center text-red-500 py-10">{error}</p>
      ) : metrics ? (
        <>
          {/* Tarjetas de solicitudes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[10px]">
            <StatCard title="Total solicitudes" value={String(metrics.solicitudes.total)}     icon={BarChart}      iconWrapperClassName="bg-[#E8F0FE] text-[#1A5EB8]" />
            <StatCard title="Pendientes"         value={String(metrics.solicitudes.pendientes)} icon={Clock}       iconWrapperClassName="bg-[#FFF3CC] text-[#B8860B]" />
            <StatCard title="Aceptadas"          value={String(metrics.solicitudes.aceptadas)}  icon={Calendar}    iconWrapperClassName="bg-[#E8F0FE] text-[#1A5EB8]" />
            <StatCard title="Canceladas"         value={String(metrics.solicitudes.canceladas)} icon={XCircle}     iconWrapperClassName="bg-[#FEE2E2] text-[#B91C1C]" />
            <StatCard title="Sesiones realizadas" value={String(metrics.sesiones_realizadas)}  icon={CheckCircle}  iconWrapperClassName="bg-[#E6F4EA] text-[#1E7E34]" />
          </div>

          {/* Promedio evaluación */}
          <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-[10px] bg-[#FFF3CC] text-[#B8860B] flex items-center justify-center">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Promedio de evaluación general</p>
              <StarRating value={metrics.promedio_evaluacion} />
            </div>
            <div className="ml-auto text-right">
              <p className="text-[11px] text-gray-400">Tasa de realización</p>
              <p className="text-[20px] font-bold text-[#0F2547]">
                {metrics.solicitudes.total > 0
                  ? `${Math.round((metrics.sesiones_realizadas / metrics.solicitudes.total) * 100)}%`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Top tutores y materias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top tutores */}
            <div className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0F2547]" />
                <h2 className="text-[13px] font-bold text-[#0F2547]">Tutores con más sesiones realizadas</h2>
              </div>
              {metrics.top_tutores.length === 0 ? (
                <p className="text-[12px] text-gray-400 text-center py-8">Sin datos disponibles</p>
              ) : (
                <div className="divide-y divide-[#F3F4F6]">
                  {metrics.top_tutores.map((t, i) => (
                    <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          i === 0 ? "bg-[#FFC100] text-[#0F2547]"
                            : i === 1 ? "bg-[#E5E7EB] text-[#374151]"
                            : "bg-[#F3F4F6] text-[#6B7280]"
                        }`}>{i + 1}°</span>
                        <p className="text-[13px] font-medium text-[#0F2547]">{t.nombre}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                        <CheckCircle className="h-3.5 w-3.5 text-[#1E7E34]" />
                        <span className="font-semibold text-[#0F2547]">{t.sesiones}</span> sesiones
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top materias */}
            <div className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#0F2547]" />
                <h2 className="text-[13px] font-bold text-[#0F2547]">Materias con mayor demanda</h2>
              </div>
              {metrics.top_materias.length === 0 ? (
                <p className="text-[12px] text-gray-400 text-center py-8">Sin datos disponibles</p>
              ) : (
                <div className="divide-y divide-[#F3F4F6]">
                  {metrics.top_materias.map((m, i) => (
                    <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          i === 0 ? "bg-[#FFC100] text-[#0F2547]"
                            : i === 1 ? "bg-[#E5E7EB] text-[#374151]"
                            : "bg-[#F3F4F6] text-[#6B7280]"
                        }`}>{i + 1}°</span>
                        <div>
                          <p className="text-[13px] font-medium text-[#0F2547]">{m.nombre}</p>
                          <p className="text-[10px] text-gray-400">{m.codigo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                        <TrendingUp className="h-3.5 w-3.5 text-[#1A5EB8]" />
                        <span className="font-semibold text-[#0F2547]">{m.solicitudes}</span> solicitudes
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
