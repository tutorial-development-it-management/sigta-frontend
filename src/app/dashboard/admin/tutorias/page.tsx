"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getSessions, TutoringSession, getErrorMessage } from "@/lib/api";
import { cn } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ClipboardList,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  BookOpen,
  User,
} from "lucide-react";
import { estadoBadge, ESTADO_LABEL } from "@/lib/estados";
import { formatSesion } from "@/lib/format";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDatetime(iso: string) {
  return formatSesion(iso, {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// Estados reales de una sesión (coinciden con el enum del backend).
const ESTADOS = ["", "agendada", "programada", "realizada", "cancelada"] as const;

// ─── Row ─────────────────────────────────────────────────────────────────────

function SessionRow({ session }: { session: TutoringSession }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = estadoBadge(session.estado);

  return (
    <>
      <tr className="border-b border-[#E5E7EB] hover:bg-[#FAFBFC] transition-colors">
        <td className="px-4 py-3 text-[12px] text-[#0F2547] font-medium">
          {session.tutor.full_name}
          <p className="text-[11px] text-gray-400 font-normal">{session.tutor.email}</p>
        </td>
        <td className="px-4 py-3 text-[12px] text-[#0F2547]">
          {session.estudiante.full_name}
          <p className="text-[11px] text-gray-400">{session.estudiante.email}</p>
        </td>
        <td className="px-4 py-3 text-[12px] text-gray-600">
          {session.materia.nombre}
          <p className="text-[11px] text-gray-400">{session.materia.codigo}</p>
        </td>
        <td className="px-4 py-3 text-[11px] text-gray-500">
          {formatDatetime(session.fecha_hora_inicio)}
        </td>
        <td className="px-4 py-3">
          <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold", cfg.className)}>
            {cfg.label}
          </span>
        </td>
        <td className="px-4 py-3 text-[11px] text-gray-500 capitalize">
          {session.modalidad}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-[#FAFBFC] border-b border-[#E5E7EB]">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[12px]">
              <div>
                <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wide mb-1">Fecha fin</p>
                <p className="text-gray-700">{formatDatetime(session.fecha_hora_fin)}</p>
              </div>
              {session.lugar_o_enlace && (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wide mb-1">Lugar / enlace</p>
                  <p className="text-gray-700 break-all">{session.lugar_o_enlace}</p>
                </div>
              )}
              {session.bitacoras.length > 0 && (
                <div className="col-span-2 md:col-span-3">
                  <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wide mb-1">Bitácora</p>
                  {session.bitacoras.map((b) => (
                    <div key={b.id} className="text-gray-700 space-y-0.5">
                      {b.temas_tratados && <p><span className="font-medium">Temas:</span> {b.temas_tratados}</p>}
                      {b.logros && <p><span className="font-medium">Logros:</span> {b.logros}</p>}
                      {b.compromisos && <p><span className="font-medium">Compromisos:</span> {b.compromisos}</p>}
                    </div>
                  ))}
                </div>
              )}
              {session.retroalimentaciones.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wide mb-1">Calificación</p>
                  <p className="text-gray-700 font-bold text-base">
                    {session.retroalimentaciones[0].calificacion} / 5
                  </p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AdminTutoriasPage() {
  const [sessions, setSessions]   = useState<TutoringSession[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [filterEstado, setFilterEstado]       = useState("");
  const [filterTutor, setFilterTutor]         = useState("");
  const [filterEstudiante, setFilterEstudiante] = useState("");

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filterEstado ? { estado: filterEstado } : {};
      const { items } = await getSessions(params);
      setSessions(items);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar las sesiones"));
    } finally {
      setLoading(false);
    }
  }, [filterEstado]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const filtered = useMemo(() => {
    const tutorQ      = filterTutor.trim().toLowerCase();
    const estudianteQ = filterEstudiante.trim().toLowerCase();
    return sessions.filter((s) => {
      const tutorMatch = !tutorQ
        || s.tutor.full_name.toLowerCase().includes(tutorQ)
        || s.tutor.email.toLowerCase().includes(tutorQ);
      const estudianteMatch = !estudianteQ
        || s.estudiante.full_name.toLowerCase().includes(estudianteQ)
        || s.estudiante.email.toLowerCase().includes(estudianteQ);
      return tutorMatch && estudianteMatch;
    });
  }, [sessions, filterTutor, filterEstudiante]);

  const countByEstado = (estado: string) => sessions.filter((s) => s.estado === estado).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Tutorías</h1>
        <p className="mt-1 text-sm text-gray-500">Vista completa de todas las sesiones de tutoría registradas.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[10px]">
        {[
          { label: "Programadas", estado: "programada", color: "bg-[#E8F0FE] text-[#1A5EB8]" },
          { label: "Completadas", estado: "completada", color: "bg-[#E6F4EA] text-[#1E7E34]" },
          { label: "Canceladas",  estado: "cancelada",  color: "bg-red-50 text-red-600" },
          { label: "Total",       estado: "",           color: "bg-gray-100 text-gray-700" },
        ].map(({ label, estado, color }) => (
          <div key={label} className="bg-white border border-[#E5E7EB] rounded-[10px] p-3 flex items-center gap-3">
            <div className={cn("h-8 w-8 rounded-[8px] flex items-center justify-center flex-shrink-0", color)}>
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">{label}</p>
              <p className="text-lg font-bold text-[#0F2547]">
                {estado ? countByEstado(estado) : sessions.length}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-3 flex flex-col sm:flex-row gap-3 items-center">
        {/* Estado */}
        <div className="flex items-center gap-2 w-full sm:w-48 flex-shrink-0">
          <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full py-[7px] px-3 border border-[#E5E7EB] rounded-[7px] text-[12px] bg-[#F8FAFC] focus:outline-none focus:border-[#FFC100]"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.filter(Boolean).map((e) => (
              <option key={e} value={e}>{ESTADO_LABEL[e] ?? e}</option>
            ))}
          </select>
        </div>

        {/* Buscar tutor */}
        <div className="relative w-full sm:flex-1">
          <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar tutor..."
            value={filterTutor}
            onChange={(e) => setFilterTutor(e.target.value)}
            className="w-full pl-8 pr-3 py-[7px] border border-[#E5E7EB] rounded-[7px] bg-[#F8FAFC] text-[12px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#FFC100]"
          />
        </div>

        {/* Buscar estudiante */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar estudiante..."
            value={filterEstudiante}
            onChange={(e) => setFilterEstudiante(e.target.value)}
            className="w-full pl-8 pr-3 py-[7px] border border-[#E5E7EB] rounded-[7px] bg-[#F8FAFC] text-[12px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#FFC100]"
          />
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-sm text-center text-gray-400 py-12">Cargando sesiones...</p>
      ) : error ? (
        <p className="text-sm text-center text-red-500 py-12">{error}</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Sin sesiones"
          description="No hay sesiones que coincidan con los filtros aplicados."
        />
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#FAFBFC]">
                <tr>
                  {["Tutor", "Estudiante", "Materia", "Fecha inicio", "Estado", "Modalidad", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2 text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.5px] border-b border-[#E5E7EB]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <SessionRow key={s.id} session={s} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2 border-t border-[#E5E7EB] text-[11px] text-gray-400">
            Mostrando {filtered.length} de {sessions.length} sesiones
          </div>
        </div>
      )}
    </div>
  );
}
