export type RoleName = "student" | "tutor" | "coordinator" | "admin";

export interface User {
  id: string | number;
  email: string;
  first_name: string;
  last_name: string;
  role_name: RoleName;
  is_active?: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthError {
  message: string;
}

const API_BASE = "/api";

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

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al iniciar sesión");
  }

  const json = await res.json();
  let data = json;
  if (json.data) {
    data = json.data;
  }
  
  // Normalize role
  if (data.user && data.user.role_name) {
    data.user.role_name = normalizeRole(data.user.role_name);
  } else if (data.role_name) {
     // fallback if user structure is flat
     data.role_name = normalizeRole(data.role_name);
  }
  
  return data;
}

export async function register(data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role_name: RoleName;
}) {
  const payload = {
    ...data,
    role_name: mapRoleToBackend(data.role_name),
  };

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al registrar usuario");
  }

  return res.json();
}

export async function getMe(token: string): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Token inválido o expirado");
  }

  const json = await res.json();
  const data = json.data ?? json;

  // Normalize role regardless of wrapper shape
  if (data.user && data.user.role_name) {
    data.user.role_name = normalizeRole(data.user.role_name);
  } else if (data.role_name) {
    data.role_name = normalizeRole(data.role_name);
  }

  return data;
}

export async function getUsers(
  token: string,
  limit = 20,
  offset = 0
): Promise<{ items: User[]; total: number; limit: number; offset: number }> {
  const res = await fetch(`${API_BASE}/usuarios?limit=${limit}&offset=${offset}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al obtener usuarios");
  }

  const json = await res.json();
  const items = (json.data?.items ?? json.items ?? []).map((user: User) => ({
    ...user,
    role_name: normalizeRole(user.role_name),
  }));

  return {
    items,
    total: json.meta?.total ?? items.length,
    limit: json.meta?.limit ?? limit,
    offset: json.meta?.offset ?? offset,
  };
}

export async function getUserById(token: string, userId: string | number): Promise<User> {
  const res = await fetch(`${API_BASE}/usuarios/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al obtener usuario");
  }

  const json = await res.json();
  const user = (json.data ?? json) as User;

  return {
    ...user,
    role_name: normalizeRole(user.role_name),
  };
}

export async function updateUserRole(
  token: string,
  userId: string | number,
  roleName: RoleName
) {
  const endpoints = [`${API_BASE}/usuarios/${userId}`, `${API_BASE}/usuarios/${userId}/rol`];
  const roleCandidates = getRoleCandidatesForBackend(roleName);
  let lastError = "Error al actualizar rol";

  for (const endpoint of endpoints) {
    for (const candidate of roleCandidates) {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role_name: candidate }),
      });

      if (res.ok) {
        return res.json().catch(() => ({}));
      }

      const errorData = await res.json().catch(() => ({}));
      lastError = errorData.message || lastError;

      if (res.status === 400) {
        // Try another role alias with same endpoint.
        continue;
      }

      if (res.status === 404) {
        // Try next endpoint shape.
        break;
      }

      // For any other status, stop and surface error.
      throw new Error(lastError);
    }
  }

  throw new Error(lastError);
}
