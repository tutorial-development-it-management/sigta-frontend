"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getSessions, completarSession, reprogramarSession, TutoringSession, getErrorMessage } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { Calendar, CheckCircle, Clock, BookOpen, ChevronDown, ChevronUp, X, RefreshCw } from "lucide-react";
import { cn } from "@/components/ui/Button";

type Tab = "programada" | "realizada";

const TABS: { key: Tab; label: string }[] = [
  { key: "programada", label: "Programadas" },
  { key: "realizada",  label: "Realizadas" },
];

const fmt = (d: string) =>
  new Date(d).toLocaleString("es-CO", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });

// ─── Modal Reprogramar ────────────────────────────────────────────────────────

function ReprogramarModal({
  session,
  onClose,
  onDone,
}: {
  session: TutoringSession;
  onClose: () => void;
  onDone: () => void;
}) {
  const [fechaInicio, setFechaInicio] = useState(
    session.fecha_hora_inicio.slice(0, 16)
  );
  const [fechaFin, setFechaFin] = useState(
    session.fecha_hora_fin.slice(0, 16)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin) { setError("Ambas fechas son obligatorias"); return; }
    if (fechaInicio >= fechaFin)   { setError("La fecha de inicio debe ser anterior al fin"); return; }
    setLoading(true);
    setError(null);
    try {
      await reprogramarSession(session.id, {
        fecha_hora_inicio: new Date(fechaInicio).toISOString(),
        fecha_hora_fin:    new Date(fechaFin).toISOString(),
      });
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, "Error al reprogramar la sesión"));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] outline-none focus:border-[#FFC100] focus:shadow-[0_0_0_3px_rgba(255,193,0,0.12)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-md rounded-[12px] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div>
            <h2 className="text-[15px] font-bold text-[#0F2547]">Reprogramar sesión</h2>
            <p className="text-[12px] text-gray-500">{session.materia.nombre} · {session.estudiante.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block mb-[6px] text-[13px] font-normal text-[#374151]">
              Nueva fecha y hora de inicio <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block mb-[6px] text-[13px] font-normal text-[#374151]">
              Nueva fecha y hora de fin <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              min={fechaInicio || new Date().toISOString().slice(0, 16)}
              required
              className={inputClass}
            />
          </div>
          {error && <p className="text-[12px] text-red-600 bg-red-50 rounded-[8px] px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-[11px] rounded-[9px] border border-[#D1D5DB] text-[13px] font-semibold text-[#374151] hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-[11px] rounded-[9px] bg-[#FFC100] text-[13px] font-bold text-[#0F2547] hover:bg-[#e6ad00] disabled:opacity-60">
              {loading ? "Guardando..." : "Confirmar reprogramación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Formulario Bitácora ──────────────────────────────────────────────────────

function BitacoraModal({
  session,
  onClose,
  onDone,
}: {
  session: TutoringSession;
  onClose: () => void;
  onDone: () => void;
}) {
  const [temas, setTemas]           = useState("");
  const [logros, setLogros]         = useState("");
  const [compromisos, setCompromisos] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!temas.trim()) { setError("Los temas tratados son obligatorios"); return; }
    setLoading(true);
    setError(null);
    try {
      await completarSession(session.id, {
        temas_tratados: temas.trim(),
        logros:         logros.trim() || undefined,
        compromisos:    compromisos.trim() || undefined,
      });
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, "Error al registrar la sesión"));
    } finally {
      setLoading(false);
    }
  };

  const ta = "w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] text-[#111827] outline-none focus:border-[#FFC100] focus:shadow-[0_0_0_3px_rgba(255,193,0,0.12)] resize-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-lg rounded-[12px] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div>
            <h2 className="text-[15px] font-bold text-[#0F2547]">Registrar sesión como Realizada</h2>
            <p className="text-[12px] text-gray-500">{session.materia.nombre} · {session.estudiante.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block mb-[6px] text-[13px] font-normal text-[#374151]">
              Temas tratados <span className="text-red-500">*</span>
            </label>
            <textarea rows={3} value={temas} onChange={(e) => setTemas(e.target.value)}
              placeholder="Describe los temas abordados en la sesión..."
              className={ta} required />
          </div>
          <div>
            <label className="block mb-[6px] text-[13px] font-normal text-[#374151]">Logros y avances</label>
            <textarea rows={2} value={logros} onChange={(e) => setLogros(e.target.value)}
              placeholder="¿Qué logros se alcanzaron?" className={ta} />
          </div>
          <div>
            <label className="block mb-[6px] text-[13px] font-normal text-[#374151]">Compromisos y próximos pasos</label>
            <textarea rows={2} value={compromisos} onChange={(e) => setCompromisos(e.target.value)}
              placeholder="Tareas o compromisos para la próxima sesión..." className={ta} />
          </div>
          {error && <p className="text-[12px] text-red-600 bg-red-50 rounded-[8px] px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-[11px] rounded-[9px] border border-[#D1D5DB] text-[13px] font-semibold text-[#374151] hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-[11px] rounded-[9px] bg-[#0F2547] text-[13px] font-bold text-white hover:bg-[#1a3a6b] disabled:opacity-60">
              {loading ? "Guardando..." : "Registrar como Realizada"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Card de sesión ───────────────────────────────────────────────────────────

function SessionCard({
  session,
  onComplete,
  onReprogramar,
}: {
  session: TutoringSession;
  onComplete: (s: TutoringSession) => void;
  onReprogramar: (s: TutoringSession) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isProgramada = session.estado === "programada";

  return (
    <div className={cn(
      "bg-white border rounded-[10px] overflow-hidden",
      isProgramada ? "border-[#FFC100]/60 shadow-sm" : "border-[#E5E7EB]"
    )}>
      <div className="p-4 flex items-start gap-3">
        <div className={cn(
          "h-9 w-9 flex-shrink-0 rounded-[9px] flex items-center justify-center",
          isProgramada ? "bg-[#FFF3CC] text-[#B8860B]" : "bg-[#E6F4EA] text-[#1E7E34]"
        )}>
          {isProgramada ? <Clock className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#0F2547]">{session.estudiante.full_name}</span>
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
              isProgramada ? "bg-[#FFF3CC] text-[#B8860B]" : "bg-[#E6F4EA] text-[#1E7E34]"
            )}>
              {isProgramada ? "Programada" : "Realizada"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{session.materia.nombre}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmt(session.fecha_hora_inicio)}</span>
            {session.modalidad && <span className="capitalize">{session.modalidad}</span>}
          </div>
          {isProgramada && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onComplete(session)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] bg-[#0F2547] text-white text-[12px] font-semibold hover:bg-[#1a3a6b] transition-colors"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Registrar como Realizada
              </button>
              <button
                onClick={() => onReprogramar(session)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] border border-[#D1D5DB] text-[#374151] text-[12px] font-semibold hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reprogramar
              </button>
            </div>
          )}
          {!isProgramada && session.bitacoras.length > 0 && (
            <p className="mt-2 text-[12px] text-gray-500 italic truncate">
              {session.bitacoras[0].temas_tratados}
            </p>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex-shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-[#F3F4F6] space-y-3 text-[12px]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-400 uppercase text-[10px] font-semibold mb-0.5">Inicio</p>
              <p className="text-gray-700">{fmt(session.fecha_hora_inicio)}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase text-[10px] font-semibold mb-0.5">Fin</p>
              <p className="text-gray-700">{fmt(session.fecha_hora_fin)}</p>
            </div>
          </div>
          {session.bitacoras.map((b) => (
            <div key={b.id} className="bg-[#F8FAFC] rounded-[8px] p-3 space-y-1.5">
              <p className="text-gray-400 uppercase text-[10px] font-semibold">Bitácora</p>
              <p><span className="font-medium text-gray-700">Temas:</span> {b.temas_tratados}</p>
              {b.logros && <p><span className="font-medium text-gray-700">Logros:</span> {b.logros}</p>}
              {b.compromisos && <p><span className="font-medium text-gray-700">Compromisos:</span> {b.compromisos}</p>}
            </div>
          ))}
          {session.retroalimentaciones.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Evaluación del estudiante:</span>
              <span className="font-semibold text-[#0F2547]">
                {"★".repeat(session.retroalimentaciones[0].calificacion)}
                {"☆".repeat(5 - session.retroalimentaciones[0].calificacion)}
              </span>
              <span className="text-[#0F2547] font-bold">{session.retroalimentaciones[0].calificacion}/5</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function TutorSesionesPage() {
  const { user } = useAuth();
  const [tab, setTab]               = useState<Tab>("programada");
  const [sessions, setSessions]     = useState<TutoringSession[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [completing,    setCompleting]    = useState<TutoringSession | null>(null);
  const [reprogramando, setReprogramando] = useState<TutoringSession | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { items } = await getSessions({ tutor_id: String(user.id), limit: 100 });
      setSessions(items);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar las sesiones"));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const filtered = sessions.filter((s) => s.estado === tab);
  const count = (t: Tab) => sessions.filter((s) => s.estado === t).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Mis Sesiones</h1>
        <p className="mt-1 text-sm text-gray-500">Gestiona y registra tus sesiones de tutoría.</p>
      </div>

      <div className="grid grid-cols-2 gap-[10px]">
        {[
          { key: "programada" as Tab, label: "Programadas",  color: "bg-[#FFF3CC] text-[#B8860B]", icon: Clock },
          { key: "realizada"  as Tab, label: "Realizadas",   color: "bg-[#E6F4EA] text-[#1E7E34]", icon: CheckCircle },
        ].map(({ key, label, color, icon: Icon }) => (
          <div key={key} className="bg-white border border-[#E5E7EB] rounded-[10px] p-3 flex items-center gap-3">
            <div className={cn("h-8 w-8 rounded-[8px] flex items-center justify-center", color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">{label}</p>
              <p className="text-lg font-bold text-[#0F2547]">{count(key)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-colors",
              tab === t.key ? "bg-[#0F2547] text-white" : "text-gray-500 hover:bg-gray-100"
            )}>
            {t.label}
            {count(t.key) > 0 && (
              <span className="ml-1.5 bg-[#FFC100] text-[#0F2547] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {count(t.key)}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-center text-gray-400 py-10">Cargando sesiones...</p>
      ) : error ? (
        <p className="text-sm text-center text-red-500 py-10">{error}</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={tab === "programada" ? "No tienes sesiones programadas" : "No tienes sesiones realizadas"}
          description={tab === "programada" ? "Las sesiones aparecen aquí cuando aceptas solicitudes de tutoría." : "Las sesiones que marques como realizadas aparecerán aquí."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              onComplete={setCompleting}
              onReprogramar={setReprogramando}
            />
          ))}
        </div>
      )}

      {completing && (
        <BitacoraModal
          session={completing}
          onClose={() => setCompleting(null)}
          onDone={() => { setCompleting(null); fetchSessions(); }}
        />
      )}

      {reprogramando && (
        <ReprogramarModal
          session={reprogramando}
          onClose={() => setReprogramando(null)}
          onDone={() => { setReprogramando(null); fetchSessions(); }}
        />
      )}
    </div>
  );
}
