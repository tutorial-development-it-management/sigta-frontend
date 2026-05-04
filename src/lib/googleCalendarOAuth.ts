"use client";

const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
export const GOOGLE_CALENDAR_EVENTS_SCOPE = "https://www.googleapis.com/auth/calendar.events";

export interface CalendarTokenState {
  accessToken: string;
  expiresAt: number;
}

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: GoogleTokenResponse) => void;
  }) => GoogleTokenClient;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleOAuth2;
      };
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function getCalendarClientId() {
  return process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID
    ?? process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID
    ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    ?? "";
}

function loadGoogleIdentityScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Calendar solo puede autorizarse desde el navegador"));
  }

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("No se pudo cargar Google Identity Services")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Google Identity Services"));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export function isCalendarTokenValid(tokenState: CalendarTokenState | null) {
  if (!tokenState?.accessToken) {
    return false;
  }

  return tokenState.expiresAt > Date.now() + 60_000;
}

export async function requestGoogleCalendarAccessToken(prompt: "" | "consent" = "consent") {
  const clientId = getCalendarClientId();
  if (!clientId) {
    throw new Error("Falta configurar NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID para Google Calendar");
  }

  await loadGoogleIdentityScript();

  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error("Google Identity Services no esta disponible");
  }

  return new Promise<CalendarTokenState>((resolve, reject) => {
    const tokenClient = oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_CALENDAR_EVENTS_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }

        if (!response.access_token) {
          reject(new Error("Google no retorno un access token para Calendar"));
          return;
        }

        const expiresInSeconds = response.expires_in ?? 3600;
        resolve({
          accessToken: response.access_token,
          expiresAt: Date.now() + expiresInSeconds * 1000,
        });
      },
    });

    tokenClient.requestAccessToken({ prompt });
  });
}
