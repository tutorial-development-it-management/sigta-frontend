// Estados de solicitudes y sesiones en un solo lugar: etiqueta legible, clase de
// badge (Tailwind) y color sólido para el calendario. Evita los ~6 mapas que antes
// estaban duplicados (y divergentes) en cada página.

export const ESTADO_LABEL: Record<string, string> = {
  pendiente:  "Pendiente",
  aceptada:   "Aceptada",
  agendada:   "Agendada",
  programada: "Programada",
  realizada:  "Realizada",
  cancelada:  "Cancelada",
  rechazada:  "Rechazada",
};

export const ESTADO_BADGE: Record<string, string> = {
  pendiente:  "bg-[#FFF3CC] text-[#B8860B]",
  aceptada:   "bg-[#E8F0FE] text-[#1A5EB8]",
  agendada:   "bg-[#E8F0FE] text-[#1A5EB8]",
  programada: "bg-[#E8F0FE] text-[#1A5EB8]",
  realizada:  "bg-[#E6F4EA] text-[#1E7E34]",
  cancelada:  "bg-red-50 text-red-600",
  rechazada:  "bg-orange-50 text-orange-700",
};

// Colores sólidos (hex) para los eventos del calendario (FullCalendar).
export const ESTADO_COLOR_HEX: Record<string, string> = {
  programada: "#1A5EB8",
  agendada:   "#1A5EB8",
  realizada:  "#1E7E34",
  cancelada:  "#B91C1C",
};

const FALLBACK_BADGE = "bg-gray-100 text-gray-600";

export function estadoBadge(estado: string): { label: string; className: string } {
  return {
    label: ESTADO_LABEL[estado] ?? estado,
    className: ESTADO_BADGE[estado] ?? FALLBACK_BADGE,
  };
}
