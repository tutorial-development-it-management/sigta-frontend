"use client";

// La declaración global de `Window.google` vive en `googleCalendarOAuth.ts`
// para evitar conflictos de declaration merging.
type GoogleAccountsOAuth2 = NonNullable<
  NonNullable<NonNullable<Window["google"]>["accounts"]>["oauth2"]
>;

// ── Wait for GIS script to load ────────────────────────────────────────────────

function waitForGIS(timeoutMs = 10_000): Promise<GoogleAccountsOAuth2> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const oauth2 = window.google?.accounts?.oauth2;
      if (oauth2) { resolve(oauth2); return; }
      if (Date.now() - start > timeoutMs) {
        reject(new Error("Google Identity Services no cargó. Verifica tu conexión e intenta de nuevo."));
        return;
      }
      setTimeout(check, 150);
    };
    check();
  });
}

// ── Request OAuth token with Calendar scope ────────────────────────────────────

export async function getCalendarAccessToken(): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Solo disponible en el navegador");
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID;
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID no está configurado");
  }

  const oauth2 = await waitForGIS();

  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/calendar.events",
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description ?? response.error));
          return;
        }
        resolve(response.access_token);
      },
    });
    // prompt: '' reusa el token si ya fue autorizado en esta sesión
    client.requestAccessToken({ prompt: "" });
  });
}

// ── Date/time helpers ─────────────────────────────────────────────────────────

/**
 * Combina una fecha (ISO string de @db.Date) y una hora (ISO string de @db.Time)
 * en un datetime ISO con offset de Colombia (UTC-5).
 */
export function buildColombiaIso(dateIso: string, timeIso: string, addMinutes = 0): string {
  const d = new Date(dateIso);
  const t = new Date(timeIso.includes("T") ? timeIso : `1970-01-01T${timeIso}Z`);

  const year  = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day   = String(d.getUTCDate()).padStart(2, "0");

  const totalMinutes = t.getUTCHours() * 60 + t.getUTCMinutes() + addMinutes;
  const h = String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0");
  const m = String(totalMinutes % 60).padStart(2, "0");

  return `${year}-${month}-${day}T${h}:${m}:00-05:00`;
}

// ── Create calendar event ─────────────────────────────────────────────────────

export interface CalendarEventInput {
  title: string;
  description?: string;
  startIso: string;
  endIso: string;
  location?: string;
}

export async function addToGoogleCalendar(event: CalendarEventInput): Promise<string> {
  const token = await getCalendarAccessToken();

  const body = {
    summary:     event.title,
    description: event.description ?? "",
    location:    event.location ?? "",
    start: { dateTime: event.startIso, timeZone: "America/Bogota" },
    end:   { dateTime: event.endIso,   timeZone: "America/Bogota" },
  };

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? "Error al crear el evento en Google Calendar");
  }

  const data = await res.json() as { htmlLink?: string };
  return data.htmlLink ?? "https://calendar.google.com";
}
