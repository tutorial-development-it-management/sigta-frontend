"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardList, CheckCircle, XCircle, Clock, BookOpen, Calendar, ChevronDown, ChevronUp, CalendarPlus, ExternalLink } from "lucide-react";
import { cn } from "@/components/ui/Button";
import { getRequests, acceptRequest, rejectRequest, TutoringRequest, getErrorMessage } from "@/lib/api";
import { addToGoogleCalendar, buildColombiaIso } from "@/lib/googleCalendar";

type TabKey = "todas" | "pendiente" | "aceptada" | "cancelada";

const TABS: { key: TabKey; label: string }[] = [
  { key: "todas",     label: "Todas" },
  { key: "pendiente", label: "Pendientes" },
  { key: "aceptada",  label: "Aceptadas" },
  { key: "cancelada", label: "Canceladas" },
];

const estadoConfig: Record<string, { label: string; className: string }> = {
  pendiente:  { label: "Pendiente",  className: "bg-[#FFF3CC] text-[#B8860B]" },
  aceptada:   { label: "Aceptada",   className: "bg-[#E6F4EA] text-[#1E7E34]" },
  cancelada:  { label: "Cancelada",  className: "bg-red-50 text-red-600" },
  rechazada:  { label: "Rechazada",  className: "bg-orange-50 text-orange-700" },
  realizada:  { label: "Realizada",  className: "bg-gray-100 text-gray-600" },
};

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  try {
    const d = timeStr.includes("T") ? new Date(timeStr) : new Date(`1970-01-01T${timeStr}`);
    return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

// ── Banner de calendario ───────────────────────────────────────────────────────

function CalendarBanner({
  solicitud,
  onDismiss,
}: {
  solicitud: TutoringRequest;
  onDismiss: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [link, setLink]       = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const handleAdd = async () => {
    setLoading(true);
    setError(null);
    try {
      const startIso = buildColombiaIso(solicitud.preferred_date, solicitud.preferred_time);
      const endIso   = buildColombiaIso(solicitud.preferred_date, solicitud.preferred_time, 60);
      const url = await addToGoogleCalendar({
        title:       `Tutoría: ${solicitud.subject.name} — ${solicitud.student.full_name}`,
        description: `Tutoría SIGTA\nMateria: ${solicitud.subject.name}\nEstudiante: ${solicitud.student.full_name}\nModalidad: ${solicitud.modality}${solicitud.topic ? `\nTema: ${solicitud.topic}` : ""}`,
        startIso,
        endIso,
        location:
          solicitud.modality === "virtual"
            ? "Virtual — enlace por definir"
            : "UPTC — Facultad de Ingeniería",
      });
      setLink(url);
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible agregar al calendario"));
    } finally {
      setLoading(false);
    }
  };

  if (link) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[#1E7E34]/30 bg-[#E6F4EA] px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] text-[#1E7E34] font-medium">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          Evento agregado a Google Calendar
        </div>
        <div className="flex items-center gap-2">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[12px] text-[#1A5EB8] hover:underline"
          >
            Abrir <ExternalLink className="h-3 w-3" />
          </a>
          <button onClick={onDismiss} className="text-[11px] text-gray-400 hover:text-gray-600">Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[#FFC100]/50 bg-[#FFF9E6] px-4 py-3">
      <p className="text-[13px] text-[#0F2547]">
        Tutoría aceptada. ¿Deseas agregarla a tu Google Calendar?
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        {error && <span className="text-[11px] text-red-500">{error}</span>}
        <button
          onClick={handleAdd}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#0F2547] text-white text-[12px] font-semibold hover:bg-[#1a3a6b] disabled:opacity-50 transition-colors"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          {loading ? "Agregando..." : "Agregar"}
        </button>
        <button onClick={onDismiss} className="text-[11px] text-gray-400 hover:text-gray-600">Omitir</button>
      </div>
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────

function SolicitudCard({
  solicitud,
  onAceptar,
  onCancelar,
  loadingId,
}: {
  solicitud: TutoringRequest;
  onAceptar: (id: string) => void;
  onCancelar: (id: string) => void;
  loadingId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPendiente = solicitud.status === "pendiente";
  const isLoading   = loadingId === solicitud.id;

  const fecha = new Date(solicitud.preferred_date).toLocaleDateString("es-CO", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
  const hora     = formatTime(solicitud.preferred_time);
  const iniciales = solicitud.student.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  const cfg       = estadoConfig[solicitud.status] ?? { label: solicitud.status, className: "bg-gray-100 text-gray-600" };

  return (
    <div className={cn(
      "bg-white border rounded-[10px] overflow-hidden transition-shadow",
      isPendiente ? "border-[#FFC100]/60 shadow-sm" : "border-[#E5E7EB]"
    )}>
      {/* Fila principal */}
      <div className="p-4 flex items-start gap-3">
        {/* Avatar */}
        <div className="h-9 w-9 flex-shrink-0 rounded-[9px] bg-[#E8F0FE] text-[#1A5EB8] flex items-center justify-center text-[11px] font-bold">
          {iniciales}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#0F2547]">{solicitud.student.full_name}</span>
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold", cfg.className)}>
              {cfg.label}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{solicitud.subject.name}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />{fecha}{hora && ` · ${hora}`}
            </span>
          </div>

          {/* Botones de acción */}
          {isPendiente && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onAceptar(solicitud.id)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] bg-[#0F2547] text-white text-[12px] font-semibold hover:bg-[#1a3a6b] disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {isLoading ? "Procesando..." : "Aceptar"}
              </button>
              <button
                onClick={() => onCancelar(solicitud.id)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] border border-[#E5E7EB] text-red-600 text-[12px] font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                {isLoading ? "Procesando..." : "Rechazar"}
              </button>
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-[#F3F4F6] grid grid-cols-2 gap-3 text-[12px]">
          <div>
            <p className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold mb-0.5">Estudiante</p>
            <p className="text-gray-700">{solicitud.student.full_name}</p>
            <p className="text-gray-400">{solicitud.student.email}</p>
          </div>
          <div>
            <p className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold mb-0.5">Materia</p>
            <p className="text-gray-700">{solicitud.subject.name}</p>
            <p className="text-gray-400">{solicitud.subject.code}</p>
          </div>
          {solicitud.topic && (
            <div className="col-span-2">
              <p className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold mb-0.5">Tema</p>
              <p className="text-gray-700">{solicitud.topic}</p>
            </div>
          )}
          <div>
            <p className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold mb-0.5">Modalidad</p>
            <p className="text-gray-700 capitalize">{solicitud.modality}</p>
          </div>
          <div>
            <p className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold mb-0.5">Fecha preferida</p>
            <p className="text-gray-700">{fecha}{hora && ` · ${hora}`}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function SolicitudesPage() {
<<<<<<< HEAD
  const {
    user,
    hasCalendarAccess,
    connectGoogleCalendar,
    ensureGoogleCalendarAccessToken,
    clearGoogleCalendarAccess,
  } = useAuth();
  const [activeTab, setActiveTab]     = useState<TabKey>("pendiente");
  const [solicitudes, setSolicitudes] = useState<TutoringRequest[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingId, setLoadingId]     = useState<string | null>(null);
  const [calendarConnecting, setCalendarConnecting] = useState(false);
  const [error, setError]             = useState<string | null>(null);
=======
  const { user }  = useAuth();
  const [activeTab, setActiveTab]           = useState<TabKey>("pendiente");
  const [solicitudes, setSolicitudes]       = useState<TutoringRequest[]>([]);
  const [loading, setLoading]               = useState(true);
  const [loadingId, setLoadingId]           = useState<string | null>(null);
  const [error, setError]                   = useState<string | null>(null);
  const [calendarBanner, setCalendarBanner] = useState<TutoringRequest | null>(null);
>>>>>>> cec17aa (feat: integracion Google Calendar y fix tutores por materia)

  const fetchSolicitudes = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { items } = await getRequests({ tutor_id: String(user.id) });
      setSolicitudes(items);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar las solicitudes"));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchSolicitudes(); }, [fetchSolicitudes]);

  const handleConnectCalendar = async () => {
    setCalendarConnecting(true);
    try {
      await connectGoogleCalendar();
    } catch (err) {
      alert(getErrorMessage(err, "No se pudo conectar Google Calendar"));
    } finally {
      setCalendarConnecting(false);
    }
  };

  const acceptWithCalendarToken = async (id: string, forcePrompt = false) => {
    const accessToken = await ensureGoogleCalendarAccessToken(forcePrompt);
    await acceptRequest(id, accessToken, 60);
  };

  const handleAceptar = async (id: string) => {
    setLoadingId(id);
    try {
<<<<<<< HEAD
      await acceptWithCalendarToken(id);
=======
      const solicitud = solicitudes.find((s) => s.id === id);
      await acceptRequest(id);
>>>>>>> cec17aa (feat: integracion Google Calendar y fix tutores por materia)
      await fetchSolicitudes();
      // Mostrar banner para agregar al calendario con la solicitud original
      if (solicitud) setCalendarBanner(solicitud);
    } catch (err) {
      if (isGoogleCalendarAuthError(err)) {
        clearGoogleCalendarAccess();
        try {
          await acceptWithCalendarToken(id, true);
          await fetchSolicitudes();
          return;
        } catch (retryError) {
          alert(getErrorMessage(retryError, "Autoriza Google Calendar nuevamente para aceptar la solicitud"));
          return;
        }
      }

      alert(getErrorMessage(err, "No se pudo aceptar la solicitud"));
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancelar = async (id: string) => {
    setLoadingId(id);
    try {
      await rejectRequest(id);
      await fetchSolicitudes();
    } catch (err) {
      alert(getErrorMessage(err, "No se pudo rechazar la solicitud"));
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = solicitudes.filter((s) => activeTab === "todas" || s.status === activeTab);
  const count    = (status: string) => solicitudes.filter((s) => s.status === status).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Solicitudes de Tutoría</h1>
        <p className="mt-1 text-sm text-gray-500">Revisa y gestiona las solicitudes de tus estudiantes.</p>
      </div>

<<<<<<< HEAD
      {!hasCalendarAccess && (
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#0F2547]">Google Calendar no esta conectado</p>
            <p className="mt-0.5 text-xs text-gray-500">Conecta Calendar para crear el evento cuando aceptes una tutoria.</p>
          </div>
          <button
            onClick={handleConnectCalendar}
            disabled={calendarConnecting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[8px] bg-[#0F2547] text-white text-[12px] font-semibold hover:bg-[#1a3a6b] disabled:opacity-50 transition-colors"
          >
            <Calendar className="h-4 w-4" />
            {calendarConnecting ? "Conectando..." : "Conectar Google Calendar"}
          </button>
        </div>
=======
      {/* Banner de Google Calendar */}
      {calendarBanner && (
        <CalendarBanner
          solicitud={calendarBanner}
          onDismiss={() => setCalendarBanner(null)}
        />
>>>>>>> cec17aa (feat: integracion Google Calendar y fix tutores por materia)
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-[10px]">
        {[
          { label: "Pendientes", status: "pendiente", icon: Clock,       style: "bg-[#FFF3CC] text-[#B8860B]" },
          { label: "Aceptadas",  status: "aceptada",  icon: CheckCircle, style: "bg-[#E6F4EA] text-[#1E7E34]" },
          { label: "Canceladas", status: "cancelada", icon: XCircle,     style: "bg-red-50 text-red-600" },
        ].map(({ label, status, icon: Icon, style }) => (
          <div key={status} className="bg-white border border-[#E5E7EB] rounded-[10px] p-3 flex items-center gap-3">
            <div className={cn("h-8 w-8 rounded-[8px] flex items-center justify-center flex-shrink-0", style)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">{label}</p>
              <p className="text-lg font-bold text-[#0F2547]">{count(status)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-3 py-1.5 rounded-[7px] text-[12px] font-medium whitespace-nowrap transition-colors",
              activeTab === tab.key ? "bg-[#0F2547] text-white" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            {tab.label}
            {tab.key !== "todas" && count(tab.key) > 0 && (
              <span className="ml-1.5 bg-[#FFC100] text-[#0F2547] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {count(tab.key)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-center text-gray-400 py-10">Cargando solicitudes...</p>
      ) : error ? (
        <p className="text-sm text-center text-red-500 py-10">{error}</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={activeTab === "pendiente" ? "Sin solicitudes pendientes" : "Sin solicitudes"}
          description="No hay solicitudes en esta categoría por ahora."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <SolicitudCard
              key={s.id}
              solicitud={s}
              onAceptar={handleAceptar}
              onCancelar={handleCancelar}
              loadingId={loadingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
