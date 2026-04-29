"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getSessions,
  submitFeedback,
  TutoringSession,
  getErrorMessage,
} from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { Calendar, CheckCircle, Clock, Star, X, BookOpen } from "lucide-react";
import { cn } from "@/components/ui/Button";

const fmt = (d: string) =>
  new Date(d).toLocaleString("es-CO", {
    weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit",
  });

const fmtShort = (d: string) =>
  new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

// ─── Modal evaluación ─────────────────────────────────────────────────────────

function FeedbackModal({
  session,
  onClose,
  onDone,
}: {
  session: TutoringSession;
  onClose: () => void;
  onDone: () => void;
}) {
  const [rating, setRating]     = useState(0);
  const [hover, setHover]       = useState(0);
  const [comentario, setComent] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("Selecciona una calificación"); return; }
    setLoading(true);
    setError(null);
    try {
      await submitFeedback(session.id, { calificacion: rating, comentario: comentario.trim() || undefined });
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, "Error al enviar la evaluación"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-md rounded-[12px] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div>
            <h2 className="text-[15px] font-bold text-[#0F2547]">Evaluar tutoría</h2>
            <p className="text-[12px] text-gray-500">{session.materia.nombre} · {session.tutor.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <p className="text-[13px] text-[#374151] mb-3 text-center">¿Qué tan satisfecho quedaste con la tutoría?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="text-3xl transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      (hover || rating) >= star ? "fill-[#FFC100] text-[#FFC100]" : "text-gray-300"
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-[12px] text-gray-500 mt-2">
                {["", "Muy insatisfecho", "Insatisfecho", "Regular", "Satisfecho", "Muy satisfecho"][rating]}
              </p>
            )}
          </div>
          <div>
            <label className="block mb-[6px] text-[13px] font-normal text-[#374151]">
              Comentario <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              rows={3}
              value={comentario}
              onChange={(e) => setComent(e.target.value)}
              placeholder="¿Qué mejorarías de la sesión?"
              className="w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] outline-none focus:border-[#FFC100] focus:shadow-[0_0_0_3px_rgba(255,193,0,0.12)] resize-none"
            />
          </div>
          {error && <p className="text-[12px] text-red-600 bg-red-50 rounded-[8px] px-3 py-2">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-[11px] rounded-[9px] border border-[#D1D5DB] text-[13px] font-semibold text-[#374151] hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading || rating === 0}
              className="flex-1 py-[11px] rounded-[9px] bg-[#FFC100] text-[13px] font-bold text-[#0F2547] hover:bg-[#e6ad00] disabled:opacity-60">
              {loading ? "Enviando..." : "Enviar evaluación"}
            </button>
          </div>
        </form>
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
  const [tab, setTab]               = useState<"programada" | "realizada">("programada");

  const fetch = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { items } = await getSessions({ student_id: String(user.id), limit: 100 });
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
  const filtered    = tab === "programada" ? programadas : realizadas;

  // Horas totales acumuladas (US-09 criterio)
  const horasTotales = realizadas.reduce((acc, s) => {
    const diff = new Date(s.fecha_hora_fin).getTime() - new Date(s.fecha_hora_inicio).getTime();
    return acc + diff / (1000 * 60 * 60);
  }, 0);

  const yaEvaluo = (s: TutoringSession) => s.retroalimentaciones.length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Mi Calendario de Tutorías</h1>
        <p className="mt-1 text-sm text-gray-500">Sesiones programadas y realizadas a lo largo del semestre.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-[10px]">
        <StatCard title="Programadas"  value={String(programadas.length)} icon={Clock}         iconWrapperClassName="bg-[#FFF3CC] text-[#B8860B]" />
        <StatCard title="Realizadas"   value={String(realizadas.length)}  icon={CheckCircle}   iconWrapperClassName="bg-[#E6F4EA] text-[#1E7E34]" />
        <StatCard title="Horas totales" value={`${Math.round(horasTotales * 10) / 10}h`} icon={Calendar} iconWrapperClassName="bg-[#E8F0FE] text-[#1A5EB8]" />
      </div>

      <div className="flex gap-1">
        {(["programada", "realizada"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              "px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-colors",
              tab === t ? "bg-[#0F2547] text-white" : "text-gray-500 hover:bg-gray-100"
            )}>
            {t === "programada" ? "Próximas" : "Realizadas"}
            {(t === "programada" ? programadas : realizadas).length > 0 && (
              <span className="ml-1.5 bg-[#FFC100] text-[#0F2547] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {(t === "programada" ? programadas : realizadas).length}
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
          description={tab === "programada" ? "Aquí verás tus tutorías confirmadas por los tutores." : "Las sesiones completadas aparecerán aquí."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const evaluado = yaEvaluo(s);
            return (
              <div key={s.id} className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-9 w-9 flex-shrink-0 rounded-[9px] flex items-center justify-center",
                      s.estado === "programada" ? "bg-[#FFF3CC] text-[#B8860B]" : "bg-[#E6F4EA] text-[#1E7E34]"
                    )}>
                      {s.estado === "programada" ? <Clock className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#0F2547]">{s.materia.nombre}</p>
                      <p className="text-[12px] text-gray-500">Tutor: {s.tutor.full_name}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" /> {fmt(s.fecha_hora_inicio)}
                      </p>
                    </div>
                  </div>
                  {s.estado === "realizada" && (
                    evaluado ? (
                      <span className="text-[11px] text-[#1E7E34] bg-[#E6F4EA] px-2 py-1 rounded-full font-medium flex-shrink-0">
                        {"★".repeat(s.retroalimentaciones[0].calificacion)} Evaluada
                      </span>
                    ) : (
                      <button
                        onClick={() => setEvaluating(s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#FFC100] text-[#0F2547] text-[12px] font-bold hover:bg-[#e6ad00] flex-shrink-0"
                      >
                        <Star className="h-3.5 w-3.5" /> Evaluar
                      </button>
                    )
                  )}
                </div>
                {s.bitacoras.length > 0 && (
                  <div className="bg-[#F8FAFC] rounded-[8px] p-3 text-[12px] space-y-1">
                    <p className="text-gray-400 uppercase text-[10px] font-semibold flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> Bitácora de la sesión
                    </p>
                    <p className="text-gray-700">{s.bitacoras[0].temas_tratados}</p>
                    {s.bitacoras[0].logros && (
                      <p className="text-gray-500"><span className="font-medium">Logros:</span> {s.bitacoras[0].logros}</p>
                    )}
                    {s.bitacoras[0].compromisos && (
                      <p className="text-gray-500"><span className="font-medium">Compromisos:</span> {s.bitacoras[0].compromisos}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
