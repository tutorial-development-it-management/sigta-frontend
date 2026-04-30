"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef } from "react";
import { TutoringSession } from "@/lib/api";
import "@fullcalendar/core";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });
const dayGridPlugin  = () => import("@fullcalendar/daygrid");
const timeGridPlugin = () => import("@fullcalendar/timegrid");
const listPlugin     = () => import("@fullcalendar/list");
const interactPlugin = () => import("@fullcalendar/interaction");

const STATUS_COLOR: Record<string, string> = {
  programada: "#1A5EB8",
  realizada:  "#1E7E34",
  cancelada:  "#B91C1C",
};

interface Props {
  sessions: TutoringSession[];
  role: "tutor" | "student";
  onEventClick?: (session: TutoringSession) => void;
}

export function SigCalendar({ sessions, role, onEventClick }: Props) {
  const calRef = useRef<any>(null);

  const events = useMemo(
    () =>
      sessions.map((s) => ({
        id:              s.id,
        title:           role === "tutor"
          ? `${s.estudiante.full_name} — ${s.materia.nombre}`
          : `${s.materia.nombre} (${s.tutor.full_name})`,
        start:           s.fecha_hora_inicio,
        end:             s.fecha_hora_fin,
        backgroundColor: STATUS_COLOR[s.estado] ?? "#6B7280",
        borderColor:     STATUS_COLOR[s.estado] ?? "#6B7280",
        extendedProps:   { session: s },
      })),
    [sessions, role]
  );

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 [&_.fc-toolbar-title]:text-[15px] [&_.fc-toolbar-title]:font-bold [&_.fc-toolbar-title]:text-[#0F2547] [&_.fc-button]:!bg-[#0F2547] [&_.fc-button]:!border-[#0F2547] [&_.fc-button-active]:!bg-[#FFC100] [&_.fc-button-active]:!border-[#FFC100] [&_.fc-button-active]:!text-[#0F2547] [&_.fc-daygrid-event]:cursor-pointer">
      <FullCalendar
        ref={calRef}
        plugins={[dayGridPlugin(), timeGridPlugin(), listPlugin(), interactPlugin()]}
        initialView="dayGridMonth"
        locale="es"
        headerToolbar={{
          left:   "prev,next today",
          center: "title",
          right:  "dayGridMonth,timeGridWeek,listWeek",
        }}
        buttonText={{
          today:        "Hoy",
          month:        "Mes",
          week:         "Semana",
          list:         "Lista",
        }}
        events={events}
        height="auto"
        eventClick={(info) => {
          const session = info.event.extendedProps.session as TutoringSession;
          onEventClick?.(session);
        }}
        eventContent={(arg) => (
          <div className="text-[11px] font-medium px-1 py-0.5 truncate">
            {arg.event.title}
          </div>
        )}
        noEventsText="No hay sesiones en este periodo"
      />
    </div>
  );
}
