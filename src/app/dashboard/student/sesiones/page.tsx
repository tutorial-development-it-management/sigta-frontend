"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getSessions,
  submitFeedback,
  TutoringSession,
  getErrorMessage,
} from "@/lib/api";
import { SigCalendar } from "@/components/ui/SigCalendar";
import { StatCard } from "@/components/ui/StatCard";
import { Calendar, CheckCircle, Clock, Star, X, BookOpen, LayoutList } from "lucide-react";
import { cn } from "@/components/ui/Button";

const fmt = (d: string) =>
  new Date(d).toLocaleString("es-CO", {
    weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit",
  });

// ─── Modal evaluación ─────────────────────────────────────────────────────────
function FeedbackModal({ session, onClose, onDone }: {
  session: TutoringSession; onClose: () => void; onDone: () => void;
}) {
  const [rating, setRating]   = useState(0);
  const [hover, setHover]     = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { setError("Selecciona una calificación"); return; }
    setLoading(true);
    setError(null);
    try {
      await submitFeedback(session.id, { calificacion: rating, comentario: comment.trim() || undefined });
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, "Error al enviar evaluación"));
    } finally {
      setLoading(false);
    }
  };

  const labels = ["", "Muy insatisfecho", "Insatisfecho", "Regular", "Satisfecho", "Muy satisfecho"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-md rounded-[12px] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div>
            <h2 className="text-[15px] font-bold text-[#0F2547]">Evaluar tutoría</h2>
            <p className="text-[12px] text-gray-500">{session.materia.nombre} · {session.tutor.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-center">
            <p className="text-[13px] text-[#374151] mb-3">¿Qué tan satisfecho quedaste?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110">
                  <Star className={cn("h-8 w-8 transition-colors", (hover || rating) >= star ? "fill-[#FFC100] text-[#FFC100]" : "text-gray-300")} />
                </button>
              ))}
            </div>
            {rating > 0 && <p className="text-[12px] text-gray-500 mt-1">{labels[rating]}</p>}
          </div>
          <div>
            <label className="block mb-1 text-[13px] text-[#374151]">Comentario <span className="text-gray-400">(opcional)</span></label>
            <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué mejorarías de la sesión?"
              className="w-full rounded-[8px] border border-[#D1D5DB] px-[14px] py-[11px] text-[13px] outline-none focus:border-[#FFC100] resize-none" />
          </div>
          {error && <p className="text-[12px] text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-[11px] rounded-[9px] border border-[#D1D5DB] text-[13px] font-semibold text-[#374151] hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading || !rating} className="flex-1 py-[11px] rounded-[9px] bg-[#FFC100] text-[13px] font-bold text-[#0F2547] hover:bg-[#e6ad00] disabled:opacity-60">
              {loading ? "Enviando..." : "Enviar evaluación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Panel detalle de sesión ──────────────────────────────────────────────────
function SessionDetail({ session, onClose, onEvaluar }: {
  session: TutoringSession; onClose: () => void; onEvaluar: (s: TutoringSession) => void;
}) {
  const yaEvaluo = session.retroalimentaciones.length > 0;
  const estadoLabel: Record<string, string> = { programada: "Programada", realizada: "Realizada", cancelada: "Cancelada" };
  const estadoColor: Record<string, string> = {
    programada: "bg-[#FFF3CC] text-[#B8860B]",
    realizada:  "bg-[#E6F4EA] text-[#1E7E34]",
    cancelada:  "bg-red-50 text-red-600",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-md rounded-[12px] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-[15px] font-bold text-[#0F2547]">Detalle de sesión</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6 space-y-4 text-[13px]">
          <div className="flex items-center justify-between">
            <p className="font-bold text-[#0F2547] text-[15px]">{session.materia.nombre}</p>
            <span className={cn("px-2 py-1 rounded-full text-[11px] font-semibold", estadoColor[session.estado])}>
              {estadoLabel[session.estado]}
            </span>
          </div>
          <div className="space-y-1.5 text-gray-600">
            <p><span className="font-medium text-gray-800">Tutor:</span> {session.tutor.full_name}</p>
            <p><span className="font-medium text-gray-800">Inicio:</span> {fmt(session.fecha_hora_inicio)}</p>
            <p><span className="font-medium text-gray-800">Fin:</span> {fmt(session.fecha_hora_fin)}</p>
            <p className="capitalize"><span className="font-medium text-gray-800">Modalidad:</span> {session.modalidad}</p>
          </div>
          {session.bitacoras.length > 0 && (
            <div className="bg-[#F8FAFC] rounded-[8px] p-3 space-y-1.5">
              <p className="text-gray-400 uppercase text-[10px] font-semibold flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Bitácora
              </p>
              <p className="text-gray-700">{session.bitacoras[0].temas_tratados}</p>
              {session.bitacoras[0].logros && <p className="text-gray-500"><span className="font-medium">Logros:</span> {session.bitacoras[0].logros}</p>}
              {session.bitacoras[0].compromisos && <p className="text-gray-500"><span className="font-medium">Compromisos:</span> {session.bitacoras[0].compromisos}</p>}
            </div>
          )}
          {session.estado === "realizada" && (
            yaEvaluo ? (
              <div className="flex items-center gap-2 bg-[#E6F4EA] rounded-[8px] px-3 py-2">
                <span className="text-[#1E7E34] text-[12px] font-medium">Evaluada:</span>
                <span className="text-[#1E7E34]">{"★".repeat(session.retroalimentaciones[0].calificacion)}{"☆".repeat(5 - session.retroalimentaciones[0].calificacion)}</span>
              </div>
            ) : (
              <button onClick={() => { onClose(); onEvaluar(session); }}
                className="w-full py-[11px] rounded-[9px] bg-[#FFC100] text-[13px] font-bold text-[#0F2547] hover:bg-[#e6ad00] flex items-center justify-center gap-2">
                <Star className="h-4 w-4" /> Evaluar esta tutoría
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function StudentSesionesPage() {
  const { user } = useAuth();
  const [sessions, setSessions]     = useState<TutoringSession[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState<TutoringSession | null>(null);
  const [detail, setDetail]         = useState<TutoringSession | null>(null);
  const [view, setView]             = useState<"calendar" | "list">("calendar");

  const fetch = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { items } = await getSessions({ student_id: String(user.id), limit: 200 });
      setSessions(items);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar las sesiones"));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetch(); }, [fetch]);

  const programadas = sessions.filter((s) => s.estado === "programada");
  const realizadas  = sessions.filter((s) => s.estado === "realizada");
  const horasTotales = realizadas.reduce((acc, s) => {
    const diff = new Date(s.fecha_hora_fin).getTime() - new Date(s.fecha_hora_inicio).getTime();
    return acc + diff / (1000 * 60 * 60);
  }, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Calendario de Tutorías</h1>
          <p className="mt-1 text-sm text-gray-500">Sesiones programadas y realizadas en el semestre.</p>
        </div>
        <div className="flex gap-1 bg-[#F4F5F7] rounded-[8px] p-1">
          <button onClick={() => setView("calendar")} className={cn("px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors", view === "calendar" ? "bg-white shadow-sm text-[#0F2547]" : "text-gray-500")}>
            <Calendar className="h-4 w-4" />
          </button>
          <button onClick={() => setView("list")} className={cn("px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors", view === "list" ? "bg-white shadow-sm text-[#0F2547]" : "text-gray-500")}>
            <LayoutList className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-[10px]">
        <StatCard title="Programadas"  value={String(programadas.length)} icon={Clock}       iconWrapperClassName="bg-[#FFF3CC] text-[#B8860B]" />
        <StatCard title="Realizadas"   value={String(realizadas.length)}  icon={CheckCircle} iconWrapperClassName="bg-[#E6F4EA] text-[#1E7E34]" />
        <StatCard title="Horas totales" value={`${Math.round(horasTotales * 10) / 10}h`} icon={Calendar} iconWrapperClassName="bg-[#E8F0FE] text-[#1A5EB8]" />
      </div>

      {loading ? (
        <p className="text-sm text-center text-gray-400 py-10">Cargando sesiones...</p>
      ) : error ? (
        <p className="text-sm text-center text-red-500 py-10">{error}</p>
      ) : view === "calendar" ? (
        <SigCalendar sessions={sessions} role="student" onEventClick={setDetail} />
      ) : (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-center text-gray-400 py-10">No tienes sesiones registradas.</p>
          ) : sessions.map((s) => {
            const yaEvaluo = s.retroalimentaciones.length > 0;
            return (
              <div key={s.id} className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-[#FFC100]/50" onClick={() => setDetail(s)}>
                <div>
                  <p className="text-[13px] font-semibold text-[#0F2547]">{s.materia.nombre}</p>
                  <p className="text-[12px] text-gray-500">{s.tutor.full_name} · {new Date(s.fecha_hora_inicio).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn("text-[11px] px-2 py-1 rounded-full font-medium", {
                    programada: "bg-[#FFF3CC] text-[#B8860B]",
                    realizada:  "bg-[#E6F4EA] text-[#1E7E34]",
                    cancelada:  "bg-red-50 text-red-600",
                  }[s.estado] ?? "bg-gray-100 text-gray-600")}>
                    {s.estado}
                  </span>
                  {s.estado === "realizada" && !yaEvaluo && (
                    <button onClick={(e) => { e.stopPropagation(); setEvaluating(s); }}
                      className="text-[11px] font-semibold text-[#FFC100] flex items-center gap-1">
                      <Star className="h-3 w-3" /> Evaluar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detail && (
        <SessionDetail
          session={detail}
          onClose={() => setDetail(null)}
          onEvaluar={(s) => { setDetail(null); setEvaluating(s); }}
        />
      )}

      {evaluating && (
        <FeedbackModal
          session={evaluating}
          onClose={() => setEvaluating(null)}
          onDone={() => { setEvaluating(null); fetch(); }}
        />
      )}
    </div>
  );
}
