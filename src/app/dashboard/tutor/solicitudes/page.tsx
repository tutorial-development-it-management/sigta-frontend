"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardList, CheckCircle, XCircle, Clock, BookOpen, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/components/ui/Button";
import { getRequests, acceptRequest, cancelRequest, TutoringRequest, getErrorMessage } from "@/lib/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TabKey = "todas" | "pendiente" | "aceptada" | "cancelada";

const TABS: { key: TabKey; label: string }[] = [
  { key: "todas",     label: "Todas" },
  { key: "pendiente", label: "Pendientes" },
  { key: "aceptada",  label: "Aceptadas" },
  { key: "cancelada", label: "Canceladas" },
];

const estadoConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pendiente: { label: "Pendiente", className: "bg-[#FFF3CC] text-[#B8860B]",   icon: <Clock        className="h-3 w-3" /> },
  aceptada:  { label: "Aceptada",  className: "bg-[#E6F4EA] text-[#1E7E34]",   icon: <CheckCircle  className="h-3 w-3" /> },
  cancelada: { label: "Cancelada", className: "bg-red-50 text-red-600",         icon: <XCircle      className="h-3 w-3" /> },
  realizada: { label: "Realizada", className: "bg-gray-100 text-gray-600",      icon: <CheckCircle  className="h-3 w-3" /> },
};

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = estadoConfig[estado] ?? { label: estado, className: "bg-gray-100 text-gray-600", icon: null };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold", cfg.className)}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ─── Card de solicitud ────────────────────────────────────────────────────────

function SolicitudCard({
  solicitud,
  onAceptar,
  onCancelar,
  loading,
}: {
  solicitud: TutoringRequest;
  onAceptar: (id: string) => void;
  onCancelar: (id: string) => void;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPendiente = solicitud.status === "pendiente";

  const fecha = new Date(solicitud.preferred_date).toLocaleDateString("es-CO", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  const hora = (() => {
    if (!solicitud.preferred_time) return "";
    try {
      const d = solicitud.preferred_time.includes("T")
        ? new Date(solicitud.preferred_time)
        : new Date(`1970-01-01T${solicitud.preferred_time}`);
      return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  })();

  const iniciales = solicitud.student.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className="h-9 w-9 flex-shrink-0 rounded-[9px] bg-[#E8F0FE] text-[#1A5EB8] flex items-center justify-center text-[11px] font-bold">
          {iniciales}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#0F2547]">{solicitud.student.full_name}</span>
            <EstadoBadge estado={solicitud.status} />
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{solicitud.subject.name}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fecha}{hora && ` · ${hora}`}</span>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-[#F3F4F6] space-y-3">
          <div className="grid grid-cols-2 gap-3 text-[12px]">
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

          {isPendiente && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onAceptar(solicitud.id)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] bg-[#0F2547] text-white text-[12px] font-semibold hover:bg-[#1a3a6b] disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {loading ? "Procesando..." : "Aceptar"}
              </button>
              <button
                onClick={() => onCancelar(solicitud.id)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] border border-[#E5E7EB] text-red-600 text-[12px] font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                {loading ? "Procesando..." : "Cancelar"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function SolicitudesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]   = useState<TabKey>("todas");
  const [solicitudes, setSolicitudes] = useState<TutoringRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [actionId, setActionId]     = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);

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

  const handleAceptar = async (id: string) => {
    setActionId(id);
    try {
      await acceptRequest(id);
      await fetchSolicitudes();
    } catch (err) {
      alert(getErrorMessage(err, "No se pudo aceptar la solicitud"));
    } finally {
      setActionId(null);
    }
  };

  const handleCancelar = async (id: string) => {
    setActionId(id);
    try {
      await cancelRequest(id);
      await fetchSolicitudes();
    } catch (err) {
      alert(getErrorMessage(err, "No se pudo cancelar la solicitud"));
    } finally {
      setActionId(null);
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-[10px]">
        {[
          { label: "Pendientes",  status: "pendiente", icon: Clock,        style: "bg-[#FFF3CC] text-[#B8860B]" },
          { label: "Aceptadas",   status: "aceptada",  icon: CheckCircle,  style: "bg-[#E6F4EA] text-[#1E7E34]" },
          { label: "Canceladas",  status: "cancelada", icon: XCircle,      style: "bg-red-50 text-red-600" },
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
          title={activeTab === "todas" ? "Sin solicitudes" : `Sin solicitudes ${activeTab}s`}
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
              loading={actionId === s.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
