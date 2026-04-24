"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardList, CheckCircle, XCircle, Clock, BookOpen, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/components/ui/Button";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type SolicitudEstado = "pendiente" | "aceptada" | "rechazada";

interface Solicitud {
  id: string;
  estudiante: string;
  asignatura: string;
  tema: string;
  fecha: string;
  hora: string;
  estado: SolicitudEstado;
  fechaSolicitud: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// TODO: reemplazar con llamada real a la API cuando el endpoint esté disponible

const MOCK_SOLICITUDES: Solicitud[] = [
  {
    id: "1",
    estudiante: "Ana Rodríguez",
    asignatura: "Cálculo Diferencial",
    tema: "Derivadas de funciones implícitas",
    fecha: "2026-04-28",
    hora: "10:00",
    estado: "pendiente",
    fechaSolicitud: "2026-04-23",
  },
  {
    id: "2",
    estudiante: "Carlos Gómez",
    asignatura: "Álgebra Lineal",
    tema: "Transformaciones lineales",
    fecha: "2026-04-29",
    hora: "14:00",
    estado: "pendiente",
    fechaSolicitud: "2026-04-22",
  },
  {
    id: "3",
    estudiante: "María Torres",
    asignatura: "Cálculo Diferencial",
    tema: "Regla de la cadena",
    fecha: "2026-04-25",
    hora: "09:00",
    estado: "aceptada",
    fechaSolicitud: "2026-04-20",
  },
  {
    id: "4",
    estudiante: "Juan Pérez",
    asignatura: "Álgebra Lineal",
    tema: "Determinantes",
    fecha: "2026-04-24",
    hora: "11:00",
    estado: "rechazada",
    fechaSolicitud: "2026-04-19",
  },
];

// ─── Badge de estado ──────────────────────────────────────────────────────────

const estadoConfig: Record<SolicitudEstado, { label: string; className: string; icon: React.ReactNode }> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-[#FFF3CC] text-[#B8860B]",
    icon: <Clock className="h-3 w-3" />,
  },
  aceptada: {
    label: "Aceptada",
    className: "bg-[#E6F4EA] text-[#1E7E34]",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  rechazada: {
    label: "Rechazada",
    className: "bg-red-50 text-red-600",
    icon: <XCircle className="h-3 w-3" />,
  },
};

function EstadoBadge({ estado }: { estado: SolicitudEstado }) {
  const cfg = estadoConfig[estado];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold", cfg.className)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Card de solicitud ────────────────────────────────────────────────────────

function SolicitudCard({
  solicitud,
  onAceptar,
  onRechazar,
}: {
  solicitud: Solicitud;
  onAceptar: (id: string) => void;
  onRechazar: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPendiente = solicitud.estado === "pendiente";

  const fechaFormateada = new Date(solicitud.fecha + "T00:00:00").toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden">
      {/* Fila principal */}
      <div className="p-4 flex items-start gap-3">
        {/* Avatar iniciales */}
        <div className="h-9 w-9 flex-shrink-0 rounded-[9px] bg-[#E8F0FE] text-[#1A5EB8] flex items-center justify-center text-[11px] font-bold">
          {solicitud.estudiante.split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#0F2547]">{solicitud.estudiante}</span>
            <EstadoBadge estado={solicitud.estado} />
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {solicitud.asignatura}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {fechaFormateada} · {solicitud.hora}
            </span>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-[#F3F4F6] space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Tema solicitado</p>
            <p className="text-[13px] text-gray-700">{solicitud.tema}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Fecha de solicitud</p>
            <p className="text-[13px] text-gray-700">
              {new Date(solicitud.fechaSolicitud + "T00:00:00").toLocaleDateString("es-CO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Acciones — US-06: solo si está pendiente */}
          {isPendiente && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onAceptar(solicitud.id)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[7px] bg-[#1E7E34] text-white text-[12px] font-semibold hover:bg-[#176a2b] transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Aceptar
              </button>
              <button
                onClick={() => onRechazar(solicitud.id)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[7px] border border-red-200 text-red-600 text-[12px] font-semibold hover:bg-red-50 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Rechazar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

type FiltroEstado = "todas" | SolicitudEstado;

const FILTROS: { value: FiltroEstado; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aceptada", label: "Aceptadas" },
  { value: "rechazada", label: "Rechazadas" },
];

// ─── Página ───────────────────────────────────────────────────────────────────

export default function SolicitudesPage() {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(MOCK_SOLICITUDES);
  const [filtro, setFiltro] = useState<FiltroEstado>("pendiente");

  const pendientesCount = solicitudes.filter((s) => s.estado === "pendiente").length;

  const solicitudesFiltradas = filtro === "todas"
    ? solicitudes
    : solicitudes.filter((s) => s.estado === filtro);

  const handleAceptar = (id: string) => {
    // TODO: PATCH /tutorias/:id/estado { estado: "aceptada" }
    setSolicitudes((prev) => prev.map((s) => s.id === id ? { ...s, estado: "aceptada" } : s));
  };

  const handleRechazar = (id: string) => {
    // TODO: PATCH /tutorias/:id/estado { estado: "rechazada" }
    setSolicitudes((prev) => prev.map((s) => s.id === id ? { ...s, estado: "rechazada" } : s));
  };

  return (
    <div className="space-y-4">
      {/* Encabezado — mismo patrón que TutorDashboard */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Solicitudes de Tutoría</h1>
        <p className="mt-2 text-gray-600">
          {pendientesCount > 0
            ? `${pendientesCount} solicitud${pendientesCount > 1 ? "es" : ""} pendiente${pendientesCount > 1 ? "s" : ""} por revisar`
            : "Sin solicitudes pendientes · todo al día"}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTROS.map((f) => {
          const count = f.value === "todas"
            ? solicitudes.length
            : solicitudes.filter((s) => s.estado === f.value).length;

          return (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-colors flex items-center gap-1.5",
                filtro === f.value
                  ? "bg-[#0F2547] text-white"
                  : "bg-white border border-[#E5E7EB] text-gray-500 hover:text-gray-700"
              )}
            >
              {f.label}
              <span className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                filtro === f.value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lista */}
      <div>
        {solicitudesFiltradas.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-6">
            <EmptyState
              icon={ClipboardList}
              title="Sin solicitudes"
              description={
                filtro === "pendiente"
                  ? "No tienes solicitudes pendientes por revisar."
                  : `No hay solicitudes con estado "${FILTROS.find((f) => f.value === filtro)?.label.toLowerCase()}".`
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            {solicitudesFiltradas.map((s) => (
              <SolicitudCard
                key={s.id}
                solicitud={s}
                onAceptar={handleAceptar}
                onRechazar={handleRechazar}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}