"use client";

import { auth } from "@/lib/firebase";

export type RoleName = "student" | "tutor" | "coordinator" | "admin";

export interface User {
  id: string | number;
  email: string;
  first_name: string;
  last_name: string;
  role_name: RoleName;
  is_active?: boolean;
}

export interface RegisterPayload {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  role_name: RoleName;
  codigo_uptc?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "/api";

type ApiRequestOptions = RequestInit & {
  authRequired?: boolean;
  forceRefreshToken?: boolean;
  defaultErrorMessage?: string;
};

function normalizeRole(role: string): RoleName {
  const map: Record<string, RoleName> = {
    estudiante: "student",
    alumno: "student",
    docente: "tutor",
    tutor: "tutor",
    profesor: "tutor",
    coordinador: "coordinator",
    admin: "admin",
    administrativo: "admin",
  };
  return map[role.toLowerCase()] || (role as RoleName);
}

function mapRoleToBackend(role: RoleName): string {
  const map: Record<RoleName, string> = {
    student: "estudiante",
    tutor: "tutor",
    coordinator: "coordinador",
    admin: "admin",
  };
  return map[role] || role;
}

function getRoleCandidatesForBackend(role: RoleName): string[] {
  const candidates = [mapRoleToBackend(role)];

  // Some backends use 'docente' while others use 'tutor'.
  if (role === "tutor") {
    candidates.push("docente");
  }

  return Array.from(new Set(candidates));
}

function extractErrorMessage(payload: any, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  return payload.message || payload.error || payload.data?.message || fallback;
}

async function parseJsonSafe(response: Response): Promise<any> {
  return response.json().catch(() => ({}));
}

function normalizeUser(user: User): User {
  return {
    ...user,
    role_name: normalizeRole(user.role_name),
  };
}

async function buildHeaders(
  baseHeaders?: HeadersInit,
  authRequired = false,
  forceRefreshToken = false
) {
  const headers = new Headers(baseHeaders);

  if (authRequired) {
    if (!auth) {
      throw new Error("Firebase Auth no está disponible en este entorno");
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No hay una sesión activa en Firebase");
    }

    const idToken = await currentUser.getIdToken(forceRefreshToken);
    headers.set("Authorization", `Bearer ${idToken}`);
  }

  return headers;
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    authRequired = false,
    forceRefreshToken = false,
    defaultErrorMessage = "Error en la solicitud",
    headers,
    ...init
  } = options;

  const requestHeaders = await buildHeaders(headers, authRequired, forceRefreshToken);
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: requestHeaders,
  });
  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, defaultErrorMessage));
  }

  return payload as T;
}

export async function register(data: RegisterPayload) {
  const payload = {
    ...data,
    role_name: mapRoleToBackend(data.role_name),
  };

  return apiRequest("/auth/register", {
    method: "POST",
    authRequired: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    defaultErrorMessage: "Error al registrar usuario",
  });
}

export async function getMe(forceRefreshToken = false): Promise<{ user: User }> {
  const payload = await apiRequest<any>("/auth/me", {
    authRequired: true,
    forceRefreshToken,
    defaultErrorMessage: "No fue posible obtener el perfil",
  });

  const data = payload.data ?? payload;
  const profile = data.user ?? data;

  if (!profile?.role_name) {
    throw new Error("El perfil de usuario no tiene rol asignado");
  }

  return {
    user: normalizeUser(profile as User),
  };
}

export async function getUsers(
  limit = 20,
  offset = 0
): Promise<{ items: User[]; total: number; limit: number; offset: number }> {
  const payload = await apiRequest<any>(`/usuarios?limit=${limit}&offset=${offset}`, {
    authRequired: true,
    defaultErrorMessage: "Error al obtener usuarios",
  });

  const items = (payload.data?.items ?? payload.items ?? []).map((user: User) =>
    normalizeUser(user)
  );

  return {
    items,
    total: payload.meta?.total ?? items.length,
    limit: payload.meta?.limit ?? limit,
    offset: payload.meta?.offset ?? offset,
  };
}

export async function getUserById(userId: string | number): Promise<User> {
  const payload = await apiRequest<any>(`/usuarios/${userId}`, {
    authRequired: true,
    defaultErrorMessage: "Error al obtener usuario",
  });

  const user = (payload.data ?? payload) as User;
  return normalizeUser(user);
}

export async function updateUserRole(userId: string | number, roleName: RoleName) {
  const endpoints = [`${API_BASE}/usuarios/${userId}`, `${API_BASE}/usuarios/${userId}/rol`];
  const roleCandidates = getRoleCandidatesForBackend(roleName);
  let lastError = "Error al actualizar rol";

  for (const endpoint of endpoints) {
    for (const candidate of roleCandidates) {
      const headers = await buildHeaders({ "Content-Type": "application/json" }, true);
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ role_name: candidate }),
      });

      if (response.ok) {
        return parseJsonSafe(response);
      }

      const errorPayload = await parseJsonSafe(response);
      lastError = extractErrorMessage(errorPayload, lastError);

      if (response.status === 400) {
        // Retry with another role alias for the same endpoint.
        continue;
      }

      if (response.status === 404) {
        // Try the next endpoint shape.
        break;
      }

      throw new Error(lastError);
    }
  }
  throw new Error(lastError);
}
