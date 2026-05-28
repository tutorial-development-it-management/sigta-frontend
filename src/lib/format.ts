// Helpers de formato de fecha/hora centralizados.
//
// Dos casos con reglas distintas:
//  - SESIÓN: fecha_hora_inicio/fin son instantes reales → se muestran en la zona
//    local del usuario (un usuario en Brasil ve su hora; es el mismo instante).
//  - PREFERIDA (solicitud): preferred_date/preferred_time se guardan como "hora de
//    pared en UTC", así que se muestran en UTC para que coincidan con lo que eligió
//    el estudiante, sin importar la zona del dispositivo.

const LOCALE = "es-CO";

export function formatSesion(
  iso: string,
  opts: Intl.DateTimeFormatOptions = {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  }
): string {
  try {
    return new Date(iso).toLocaleString(LOCALE, opts);
  } catch {
    return iso;
  }
}

export function formatPreferidaFecha(
  iso: string,
  opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }
): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(LOCALE, { ...opts, timeZone: "UTC" });
  } catch {
    return "";
  }
}

export function formatPreferidaHora(iso: string): string {
  if (!iso) return "";
  try {
    const d = iso.includes("T") ? new Date(iso) : new Date(`1970-01-01T${iso}`);
    return d.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  } catch {
    return "";
  }
}
