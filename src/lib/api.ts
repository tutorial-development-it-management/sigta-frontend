export type RoleName = "student" | "tutor" | "coordinator" | "admin";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role_name: RoleName;
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
    tutor: "docente", // Assuming 'docente' based on typical Spanish systems, or could be 'tutor'
    coordinator: "coordinador",
    admin: "admin",
  };
  // If backend accepts "tutor", we might want to check. But "estudiante" is confirmed.
  // The user's JSON had "tutor@uptc.edu.co" with role "estudiante". 
  // Let's stick to safe mapping.
  return map[role] || role;
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
  // Normalize role
  if (json.user && json.user.role_name) {
    json.user.role_name = normalizeRole(json.user.role_name);
  }
  return json;
}
