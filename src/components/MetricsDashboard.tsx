"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  getMetrics, getSessions, getSubjects, userList, getRequests, assignTutorToRequest,
  MetricsResponse, Subject, User, TutoringRequest, TutoringSession, getErrorMessage,
} from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";
import { cn } from "@/components/ui/Button";
import {
  Calendar, CheckCircle, Clock, XCircle, Star, BookOpen,
  Users, BarChart, TrendingUp, UserPlus, RefreshCw,
} from "lucide-react";

// ─── Periodo presets ──────────────────────────────────────────────────────────

const PERIODOS = [
  { label: "Sem. I 2025",  from: "2025-01-15", to: "2025-06-15" },
  { label: "Sem. II 2025", from: "2025-07-15", to: "2025-12-15" },
  { label: "Todo 2025",    from: "2025-01-01", to: "2025-12-31" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const round1 = (n: number | null) =>
  n == null ? "—" : String(Math.round(n * 10) / 10);

function StarRating({ value, size = "md" }: { value: number | null; size?: "sm" | "md" }) {
  if (value == null) return <span className="text-gray-400 text-[12px]">Sin eval.</span>;
  const full  = Math.round(value);
  const empty = 5 - full;
  const cls   = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className="flex items-center gap-0.5">
      {Array(full).fill(0).map((_, i) => (
        <Star key={`f${i}`} className={cn(cls, "fill-[#FFC100] text-[#FFC100]")} />
      ))}
      {Array(empty).fill(0).map((_, i) => (
        <Star key={`e${i}`} className={cn(cls, "text-gray-300")} />
      ))}
      <span className="ml-1 text-[13px] font-semibold text-[#0F2547]">{round1(value)}</span>
    </span>
  );
}

// ─── Per-tutor stats computation ──────────────────────────────────────────────

interface TutorStat {
  id: string;
  nombre: string;
  total: number;
  realizadas: number;
  tasaAsistencia: number;
  avgRating: number | null;
}

function buildTutorStats(
  sessions: TutoringSession[],
  fromDate?: string,
  toDate?: string,
): TutorStat[] {
  let filtered = sessions;
  if (fromDate) filtered = filtered.filter((s) => s.fecha_hora_inicio >= fromDate);
  if (toDate)   filtered = filtered.filter((s) => s.fecha_hora_inicio <= `${toDate}T23:59:59`);

  const map = new Map<string, {
    nombre: string; total: number; realizadas: number; ratings: number[];
  }>();

  for (const s of filtered) {
    if (!map.has(s.tutor.id)) {
      map.set(s.tutor.id, { nombre: s.tutor.full_name, total: 0, realizadas: 0, ratings: [] });
    }
    const stat = map.get(s.tutor.id)!;
    stat.total++;
    if (s.estado === "realizada") stat.realizadas++;
    for (const r of s.retroalimentaciones) stat.ratings.push(r.calificacion);
  }

  return Array.from(map.entries())
    .map(([id, stat]) => ({
      id,
      nombre: stat.nombre,
      total: stat.total,
      realizadas: stat.realizadas,
      tasaAsistencia: stat.total > 0
        ? Math.round((stat.realizadas / stat.total) * 100)
        : 0,
      avgRating: stat.ratings.length > 0
        ? Math.round((stat.ratings.reduce((a, b) => a + b, 0) / stat.ratings.length) * 10) / 10
        : null,
    }))
    .sort((a, b) => b.realizadas - a.realizadas);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MetricsDashboard() {
  const [metrics, setMetrics]         = useState<MetricsResponse | null>(null);
  const [subjects, setSubjects]       = useState<Subject[]>([]);
  const [tutors, setTutors]           = useState<User[]>([]);
  const [allSessions, setAllSessions] = useState<TutoringSession[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pending, setPending]         = useState<TutoringRequest[]>([]);
  const [assigning, setAssigning]     = useState<string | null>(null);
  const [assignTutor, setAssignTutor] = useState<Record<string, string>>({});

  // Filters
  const [filterTutor,    setFilterTutor]    = useState("");
  const [filterSubject,  setFilterSubject]  = useState("");
  const [filterPrograma, setFilterPrograma] = useState("");
  const [filterFrom,     setFilterFrom]     = useState("");
  const [filterTo,       setFilterTo]       = useState("");
  const [filterPeriodo,  setFilterPeriodo]  = useState("");

  // Ref so the auto-refresh timeout always reads current filter values
  const filterRef = useRef({ filterTutor, filterSubject, filterFrom, filterTo });
  filterRef.current = { filterTutor, filterSubject, filterFrom, filterTo };

  const programas = useMemo(
    () => Array.from(new Set(subjects.map((s) => s.program).filter(Boolean))) as string[],
    [subjects],
  );

  const subjectsByPrograma = useMemo(
    () => filterPrograma ? subjects.filter((s) => s.program === filterPrograma) : subjects,
    [subjects, filterPrograma],
  );

  const tutorStats = useMemo(
    () => buildTutorStats(allSessions, filterFrom || undefined, filterTo || undefined),
    [allSessions, filterFrom, filterTo],
  );

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  const loadSessions = useCallback(async () => {
    try {
      const { items } = await getSessions({ limit: 500 });
      setAllSessions(items);
    } catch { /* silencioso */ }
  }, []);

  const loadAll = useCallback(async (
    tutorId?: string,
    subjectId?: number,
    from?: string,
    to?: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const [m, subs, usrs, pendReqs] = await Promise.all([
        getMetrics({ tutor_id: tutorId, subject_id: subjectId, from, to }),
        getSubjects(),
        userList(100, 0).then((r) => r.items.filter((u) => u.role_name === "tutor")),
        getRequests({ status: "pendiente", limit: 50 }).then((r) =>
          r.items.filter((req) => !req.tutor),
        ),
      ]);
      setMetrics(m);
      setPending(pendReqs);
      setSubjects(subs);
      setTutors(usrs);
      setLastUpdated(new Date());
    } catch (err) {
      setError(getErrorMessage(err, "Error al cargar datos"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    loadSessions();
  }, []); // eslint-disable-line

  // Auto-refresh every 60 s — re-schedules after each successful load
  useEffect(() => {
    if (!lastUpdated) return;
    const tid = setTimeout(() => {
      const { filterTutor, filterSubject, filterFrom, filterTo } = filterRef.current;
      loadAll(
        filterTutor   || undefined,
        filterSubject ? Number(filterSubject) : undefined,
        filterFrom    || undefined,
        filterTo      || undefined,
      );
      loadSessions();
    }, 60_000);
    return () => clearTimeout(tid);
  }, [lastUpdated, loadAll, loadSessions]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleFilter = () => {
    loadAll(
      filterTutor   || undefined,
      filterSubject ? Number(filterSubject) : undefined,
      filterFrom    || undefined,
      filterTo      || undefined,
    );
    loadSessions();
  };

  const handlePeriodo = (p: { label: string; from: string; to: string }) => {
    setFilterPeriodo(p.label);
    setFilterFrom(p.from);
    setFilterTo(p.to);
    loadAll(
      filterTutor   || undefined,
      filterSubject ? Number(filterSubject) : undefined,
      p.from,
      p.to,
    );
    loadSessions();
  };

  const handleReset = () => {
    setFilterTutor(""); setFilterSubject(""); setFilterPrograma("");
    setFilterFrom("");  setFilterTo("");      setFilterPeriodo("");
    loadAll();
    loadSessions();
  };

  const handleAssign = async (requestId: string) => {
    const tutorId = assignTutor[requestId];
    if (!tutorId) return;
    setAssigning(requestId);
    try {
      await assignTutorToRequest(requestId, tutorId);
      setPending((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      alert(getErrorMessage(err, "Error al asignar tutor"));
    } finally {
      setAssigning(null);
    }
  };

  const selectClass =
    "block w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[12px] py-[9px] text-[12px] text-[#374151] outline-none focus:border-[#FFC100]";

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Dashboard de Métricas</h1>
          <p className="mt-1 text-sm text-gray-500">Seguimiento académico del programa de tutorías.</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {lastUpdated && (
            <span className="text-[11px] text-gray-400">
              Actualizado:{" "}
              {lastUpdated.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={handleFilter}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#D1D5DB] text-[12px] font-semibold text-[#374151] hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Periodo quick-select */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mr-1">
          Periodo:
        </span>
        {PERIODOS.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePeriodo(p)}
            className={cn(
              "px-3 py-1 rounded-full text-[12px] font-medium border transition-colors",
              filterPeriodo === p.label
                ? "bg-[#0F2547] text-white border-[#0F2547]"
                : "bg-white text-[#374151] border-[#D1D5DB] hover:border-[#0F2547]",
            )}
          >
            {p.label}
          </button>
        ))}
        {filterPeriodo && (
          <button
            onClick={handleReset}
            className="text-[11px] text-gray-400 hover:text-gray-600 underline ml-1"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[140px]">
          <label className="block mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Programa
          </label>
          <select
            value={filterPrograma}
            onChange={(e) => { setFilterPrograma(e.target.value); setFilterSubject(""); }}
            className={selectClass}
          >
            <option value="">Todos los programas</option>
            {programas.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Tutor
          </label>
          <select value={filterTutor} onChange={(e) => setFilterTutor(e.target.value)} className={selectClass}>
            <option value="">Todos los tutores</option>
            {tutors.map((t) => (
              <option key={String(t.id)} value={String(t.id)}>
                {t.first_name} {t.last_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Materia
          </label>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className={selectClass}>
            <option value="">Todas las materias</option>
            {subjectsByPrograma.map((s) => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Desde
          </label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => { setFilterFrom(e.target.value); setFilterPeriodo(""); }}
            className={selectClass}
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Hasta
          </label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => { setFilterTo(e.target.value); setFilterPeriodo(""); }}
            className={selectClass}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFilter}
            className="px-4 py-[9px] rounded-[8px] bg-[#0F2547] text-white text-[12px] font-bold hover:bg-[#1a3a6b] transition-colors"
          >
            Aplicar
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-[9px] rounded-[8px] border border-[#D1D5DB] text-[12px] font-semibold text-[#374151] hover:bg-gray-50 transition-colors"
          >
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
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[10px]">
            <StatCard title="Solicitadas"  value={String(metrics.solicitudes.total)}      icon={BarChart}    iconWrapperClassName="bg-[#E8F0FE] text-[#1A5EB8]" />
            <StatCard title="Pendientes"   value={String(metrics.solicitudes.pendientes)} icon={Clock}       iconWrapperClassName="bg-[#FFF3CC] text-[#B8860B]" />
            <StatCard title="Aceptadas"    value={String(metrics.solicitudes.aceptadas)}  icon={Calendar}    iconWrapperClassName="bg-[#E8F0FE] text-[#1A5EB8]" />
            <StatCard title="Realizadas"   value={String(metrics.sesiones_realizadas)}    icon={CheckCircle} iconWrapperClassName="bg-[#E6F4EA] text-[#1E7E34]" />
            <StatCard title="Canceladas"   value={String(metrics.solicitudes.canceladas)} icon={XCircle}     iconWrapperClassName="bg-[#FEE2E2] text-[#B91C1C]" />
            <StatCard title="Rechazadas"   value={String(metrics.solicitudes.rechazadas)} icon={XCircle}     iconWrapperClassName="bg-[#FEE2E2] text-[#B91C1C]" />
          </div>

          {/* Promedio evaluación + tasa de realización */}
          <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-[10px] bg-[#FFF3CC] text-[#B8860B] flex items-center justify-center">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">
                Promedio de evaluación general
              </p>
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

          {/* Per-tutor metrics table */}
          <div className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center gap-2">
              <Users className="h-4 w-4 text-[#0F2547]" />
              <h2 className="text-[13px] font-bold text-[#0F2547]">Métricas por tutor</h2>
              {(filterFrom || filterTo) && (
                <span className="ml-2 text-[11px] text-gray-400 italic">
                  {[filterFrom, filterTo].filter(Boolean).join(" → ")}
                </span>
              )}
            </div>
            {tutorStats.length === 0 ? (
              <p className="text-[12px] text-gray-400 text-center py-8">Sin datos de sesiones disponibles</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F8FAFC]">
                      {["#", "Tutor", "Total sesiones", "Realizadas", "Tasa asistencia", "Promedio evaluación"].map((h) => (
                        <th
                          key={h}
                          className={cn(
                            "px-5 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide",
                            h === "#" || h === "Tutor" ? "text-left" : "text-center",
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {tutorStats.map((stat, i) => (
                      <tr key={stat.id} className="hover:bg-[#F8FAFC]">
                        <td className="px-5 py-3">
                          <span className={cn(
                            "text-[11px] font-bold px-2 py-0.5 rounded-full",
                            i === 0 ? "bg-[#FFC100] text-[#0F2547]"
                              : i === 1 ? "bg-[#E5E7EB] text-[#374151]"
                              : "bg-[#F3F4F6] text-[#6B7280]",
                          )}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[13px] font-medium text-[#0F2547]">
                          {stat.nombre}
                        </td>
                        <td className="px-5 py-3 text-center text-[13px] text-gray-600">
                          {stat.total}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-[13px] font-semibold text-[#1E7E34]">
                            {stat.realizadas}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold",
                            stat.tasaAsistencia >= 80
                              ? "bg-[#E6F4EA] text-[#1E7E34]"
                              : stat.tasaAsistencia >= 50
                              ? "bg-[#FFF3CC] text-[#B8860B]"
                              : "bg-[#FEE2E2] text-[#B91C1C]",
                          )}>
                            {stat.tasaAsistencia}%
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-center">
                            <StarRating value={stat.avgRating} size="sm" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      <span className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full",
                        i === 0 ? "bg-[#FFC100] text-[#0F2547]"
                          : i === 1 ? "bg-[#E5E7EB] text-[#374151]"
                          : "bg-[#F3F4F6] text-[#6B7280]",
                      )}>
                        {i + 1}°
                      </span>
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

          {/* Solicitudes sin tutor asignado */}
          {pending.length > 0 && (
            <div className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#0F2547]" />
                <h2 className="text-[13px] font-bold text-[#0F2547]">
                  Solicitudes pendientes sin tutor asignado
                </h2>
                <span className="ml-auto bg-[#FFF3CC] text-[#B8860B] text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {pending.length}
                </span>
              </div>
              <div className="divide-y divide-[#F3F4F6]">
                {pending.map((req) => (
                  <div key={req.id} className="px-5 py-3 flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#0F2547] truncate">
                        {req.student.full_name}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {req.subject.name} · {new Date(req.preferred_date).toLocaleDateString("es-CO")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={assignTutor[req.id] ?? ""}
                        onChange={(e) =>
                          setAssignTutor((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        className="rounded-[7px] border border-[#D1D5DB] text-[12px] px-2 py-1.5 outline-none focus:border-[#FFC100]"
                      >
                        <option value="">Seleccionar tutor...</option>
                        {tutors.map((t) => (
                          <option key={String(t.id)} value={String(t.id)}>
                            {t.first_name} {t.last_name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssign(req.id)}
                        disabled={!assignTutor[req.id] || assigning === req.id}
                        className="px-3 py-1.5 rounded-[7px] bg-[#0F2547] text-white text-[12px] font-semibold hover:bg-[#1a3a6b] disabled:opacity-50"
                      >
                        {assigning === req.id ? "Asignando..." : "Asignar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
