"use client";

import { auth } from "@/lib/firebase";

export type RoleName = "student" | "tutor" | "coordinator" | "admin";
export type CanonicalRole = "admin" | "coordinador" | "tutor" | "estudiante";

export const ACCESS_DENIED_ROUTE = "/acceso-denegado";

const ROLE_REDIRECT_MAP: Record<CanonicalRole, string> = {
  admin: "/dashboard/admin",
  coordinador: "/dashboard/coordinator",
  tutor: "/dashboard/tutor",
  estudiante: "/dashboard/student",
};

export interface User {
  id: string | number;
  email: string;
  first_name: string;
  last_name: string;
  role_name: RoleName;
  role_id?: string | number;
  is_active?: boolean;
}

export interface RegisterUserInput {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  role_name: RoleName;
  codigo_uptc?: string;
}

export interface RoleChangeInput {
  role_name?: RoleName;
  role_id?: string | number;
}

export interface PaginatedUsersResponse {
  items: User[];
  total: number;
  limit: number;
  offset: number;
}

export interface RegisterUserResponse {
  message?: string;
  user?: User;
}

export interface RoleChangeResponse {
  message?: string;
  user?: User;
}

export interface LoginBackendResponse {
  message?: string;
  user: User;
  role_name: string;
}

interface ApiRequestOptions extends RequestInit {
  authRequired?: boolean;
  forceRefreshToken?: boolean;
  defaultErrorMessage?: string;
  skipGlobalUnauthorizedHandler?: boolean;
}

interface BackendEnvelope<T> {
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
  };
}

interface BackendUserDto {
  id: string | number;
  email: string;
  first_name: string;
  last_name: string;
  role_name: string;
  role_id?: string | number;
  is_active?: boolean;
}

interface AuthMeDataDto {
  user?: BackendUserDto;
}

interface UsersCollectionDto {
  items?: BackendUserDto[];
}

interface RegisterUserRequestDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role_name: string;
  codigo_uptc?: string;
}

interface RoleChangeRequestDto {
  role_name?: string;
  role_id?: string | number;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

const TOKEN_STORAGE_KEY = "sigta.auth.firebase.idToken";

let memoryAccessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

function isBrowserEnvironment() {
  return typeof window !== "undefined";
}

function normalizeRole(role: string): RoleName {
  const map: Record<string, RoleName> = {
    estudiante: "student",
    alumno: "student",
    tutor: "tutor",
    docente: "tutor",
    profesor: "tutor",
    coordinador: "coordinator",
    admin: "admin",
    administrativo: "admin",
  };

  const normalized = map[role.toLowerCase()];
  return normalized ?? "student";
}

function mapRoleToBackend(role: RoleName): string {
  const map: Record<RoleName, string> = {
    student: "estudiante",
    tutor: "tutor",
    coordinator: "coordinador",
    admin: "admin",
  };

  return map[role];
}

function mapUserDto(user: BackendUserDto): User {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role_name: normalizeRole(user.role_name),
    role_id: user.role_id,
    is_active: user.is_active,
  };
}

function extractMessageFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as {
    message?: unknown;
    error?: unknown;
    data?: { message?: unknown };
  };

  if (typeof data.message === "string" && data.message.trim().length > 0) {
    return data.message;
  }

  if (typeof data.error === "string" && data.error.trim().length > 0) {
    return data.error;
  }

  if (typeof data.data?.message === "string" && data.data.message.trim().length > 0) {
    return data.data.message;
  }

  return null;
}

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const envelope = payload as BackendEnvelope<T>;
  if (envelope.data !== undefined) {
    return envelope.data;
  }

  return payload as T;
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getStatusFallback(status: number, fallback: string): string {
  if (status === 401) {
    return "Sesion expirada. Inicia sesion con Google nuevamente.";
  }

  if (status === 403) {
    return "Sin permisos";
  }

  return fallback;
}

function toApiError(status: number, payload: unknown, fallback: string): ApiError {
  const message = extractMessageFromPayload(payload) ?? getStatusFallback(status, fallback);

  let code: string | undefined;
  if (payload && typeof payload === "object") {
    const rawCode = (payload as { code?: unknown }).code;
    if (typeof rawCode === "string") {
      code = rawCode;
    }
  }

  return new ApiError(message, status, code);
}

function generateTechnicalPassword(length = 32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=[]{}";
  const values = new Uint32Array(length);

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(values);
  } else {
    for (let index = 0; index < length; index += 1) {
      values[index] = Math.floor(Math.random() * alphabet.length);
    }
  }

  let password = "";
  for (let index = 0; index < length; index += 1) {
    const selectedIndex = Number(values[index] % alphabet.length);
    password += alphabet[selectedIndex];
  }

  return password;
}

function dispatchUnauthorized() {
  unauthorizedHandler?.();

  if (isBrowserEnvironment()) {
    window.dispatchEvent(new CustomEvent("sigta:auth:unauthorized"));
  }
}

async function resolveAccessToken(forceRefreshToken = false): Promise<string | null> {
  if (auth?.currentUser) {
    const freshToken = await auth.currentUser.getIdToken(forceRefreshToken);
    setApiAccessToken(freshToken, true);
    return freshToken;
  }

  return getApiAccessToken();
}

async function withAuthHeader(
  headersInput: HeadersInit | undefined,
  authRequired: boolean,
  forceRefreshToken: boolean
): Promise<Headers> {
  const headers = new Headers(headersInput);

  if (!authRequired) {
    return headers;
  }

  const idToken = await resolveAccessToken(forceRefreshToken);
  if (!idToken) {
    throw new ApiError("Sesion expirada. Inicia sesion con Google nuevamente.", 401);
  }

  headers.set("Authorization", `Bearer ${idToken}`);
  return headers;
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    authRequired = false,
    forceRefreshToken = false,
    defaultErrorMessage = "Error en la solicitud",
    skipGlobalUnauthorizedHandler = false,
    headers,
    ...requestConfig
  } = options;

  const requestHeaders = await withAuthHeader(headers, authRequired, forceRefreshToken);
  const response = await fetch(`${API_BASE}${path}`, {
    ...requestConfig,
    headers: requestHeaders,
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const error = toApiError(response.status, payload, defaultErrorMessage);

    if (response.status === 401 && authRequired && !skipGlobalUnauthorizedHandler) {
      clearApiAccessToken();
      dispatchUnauthorized();
    }

    throw error;
  }

  return payload as T;
}

export function setApiAccessToken(token: string | null, persist = true) {
  memoryAccessToken = token;

  if (!isBrowserEnvironment()) {
    return;
  }

  if (!token) {
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    return;
  }

  if (persist) {
    window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
}

export function getApiAccessToken() {
  if (memoryAccessToken) {
    return memoryAccessToken;
  }

  if (!isBrowserEnvironment()) {
    return null;
  }

  const stored = window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
  if (stored) {
    memoryAccessToken = stored;
    return stored;
  }

  return null;
}

export function clearApiAccessToken() {
  setApiAccessToken(null);
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export function toCanonicalRole(roleName?: string | null): CanonicalRole | null {
  if (!roleName) {
    return null;
  }

  const normalized = roleName.trim().toLowerCase();

  if (normalized === "admin" || normalized === "administrativo") {
    return "admin";
  }

  if (normalized === "coordinador" || normalized === "coordinator") {
    return "coordinador";
  }

  if (normalized === "tutor" || normalized === "docente" || normalized === "profesor") {
    return "tutor";
  }

  if (normalized === "estudiante" || normalized === "student" || normalized === "alumno") {
    return "estudiante";
  }

  return null;
}

export function resolveRouteByRole(roleName?: string | null): string {
  const canonicalRole = toCanonicalRole(roleName);
  if (!canonicalRole) {
    return ACCESS_DENIED_ROUTE;
  }

  return ROLE_REDIRECT_MAP[canonicalRole];
}

export async function loginWithGoogleToken(idToken: string): Promise<LoginBackendResponse> {
  const attempts: Array<{ body?: Record<string, string> }> = [
    { body: { id_token: idToken } },
    { body: { idToken } },
    {},
  ];

  for (let index = 0; index < attempts.length; index += 1) {
    const attempt = attempts[index];
    const headers: HeadersInit = {
      Authorization: `Bearer ${idToken}`,
    };

    if (attempt.body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers,
      body: attempt.body ? JSON.stringify(attempt.body) : undefined,
    });

    const payload = await parseJsonSafe(response);
    if (!response.ok) {
      const shouldRetry =
        (response.status === 400 || response.status === 415 || response.status === 422)
        && index < attempts.length - 1;

      if (shouldRetry) {
        continue;
      }

      throw toApiError(response.status, payload, "No fue posible validar la sesion con el backend");
    }

    const responseData = unwrapData<{ user?: BackendUserDto } | BackendUserDto>(payload);
    const userDto = responseData && typeof responseData === "object" && "user" in responseData
      ? responseData.user
      : (responseData as BackendUserDto | null);

    if (!userDto || typeof userDto !== "object" || !("role_name" in userDto)) {
      throw new ApiError("El backend no retorno datos de usuario en /auth/login", 500);
    }

    const mappedUser = mapUserDto(userDto);

    return {
      message: extractMessageFromPayload(payload) ?? undefined,
      user: mappedUser,
      role_name: userDto.role_name,
    };
  }

  throw new ApiError("No fue posible validar la sesion con el backend", 500);
}

export async function registerUser(data: RegisterUserInput): Promise<RegisterUserResponse> {
  const payload: RegisterUserRequestDto = {
    email: data.email,
    password: data.password?.trim() || generateTechnicalPassword(),
    first_name: data.first_name,
    last_name: data.last_name,
    role_name: mapRoleToBackend(data.role_name),
    codigo_uptc: data.codigo_uptc,
  };

  const response = await apiRequest<unknown>("/auth/register", {
    method: "POST",
    authRequired: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    defaultErrorMessage: "Error al registrar usuario",
  });

  const userData = unwrapData<BackendUserDto>(response);
  const responseMessage = extractMessageFromPayload(response) ?? undefined;

  if (userData && typeof userData === "object" && "role_name" in userData) {
    return {
      message: responseMessage,
      user: mapUserDto(userData),
    };
  }

  return {
    message: responseMessage,
  };
}

export async function getMe(forceRefreshToken = false): Promise<{ user: User }> {
  const response = await apiRequest<unknown>("/auth/me", {
    authRequired: true,
    forceRefreshToken,
    defaultErrorMessage: "No fue posible obtener el perfil",
    skipGlobalUnauthorizedHandler: true,
  });

  const data = unwrapData<AuthMeDataDto | BackendUserDto>(response);

  let profile: BackendUserDto | null = null;
  if (data && typeof data === "object") {
    if ("user" in data && data.user) {
      profile = data.user;
    } else if ("role_name" in data) {
      profile = data as BackendUserDto;
    }
  }

  if (!profile) {
    throw new ApiError("El perfil de usuario no fue retornado por el backend", 500);
  }

  return { user: mapUserDto(profile) };
}

export async function logoutFromBackend() {
  await apiRequest<unknown>("/auth/logout", {
    method: "POST",
    authRequired: true,
    headers: { "Content-Type": "application/json" },
    body: "{}",
    defaultErrorMessage: "No fue posible cerrar sesion en el backend",
  });
}

// ─── Subjects ────────────────────────────────────────────────────────────────

export interface Subject {
  id: number;
  code: string;
  name: string;
  program: string | null;
}

export interface TutorBasic {
  id: string;
  full_name: string;
  email: string;
}

export async function getTutorsBySubject(subjectId: number): Promise<TutorBasic[]> {
  const response = await apiRequest<unknown>(`/subjects/${subjectId}/tutors`, {
    authRequired: true,
    defaultErrorMessage: "Error al obtener tutores",
  });
  const data = unwrapData<{ items?: TutorBasic[] } | TutorBasic[]>(response);
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

export interface CreateTutoringRequestInput {
  student_id: string;
  subject_id: number;
  tutor_id?: string;
  preferred_date: string;
  preferred_time: string;
  modality: string;
  topic?: string;
}

export async function createTutoringRequest(input: CreateTutoringRequestInput): Promise<TutoringRequest> {
  const response = await apiRequest<unknown>("/tutorias", {
    method: "POST",
    authRequired: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    defaultErrorMessage: "Error al crear la solicitud",
  });
  const data = unwrapData<TutoringRequest>(response);
  if (!data) throw new ApiError("No se recibió la solicitud creada", 500);
  return data;
}

export async function getSubjects(): Promise<Subject[]> {
  const response = await apiRequest<unknown>("/subjects", {
    authRequired: true,
    defaultErrorMessage: "Error al obtener materias",
  });

  const data = unwrapData<{ items?: Subject[] } | Subject[]>(response);
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

// ─── Tutoring Requests ────────────────────────────────────────────────────────

export interface TutoringRequestParty {
  id: string;
  full_name: string;
  email: string;
}

export interface TutoringRequestSubject {
  id: number;
  code: string;
  name: string;
}

export interface TutoringRequest {
  id: string;
  status: string;
  modality: string;
  topic: string | null;
  preferred_date: string;
  preferred_time: string;
  created_at: string;
  student: TutoringRequestParty;
  tutor: TutoringRequestParty | null;
  subject: TutoringRequestSubject;
}

export interface TutoringRequestsResponse {
  items: TutoringRequest[];
  total: number;
}

export async function getRequests(params?: {
  status?: string;
  tutor_id?: string;
  student_id?: string;
  limit?: number;
  offset?: number;
}): Promise<TutoringRequestsResponse> {
  const qs = new URLSearchParams();
  if (params?.status)     qs.set("status",     params.status);
  if (params?.tutor_id)   qs.set("tutor_id",   params.tutor_id);
  if (params?.student_id) qs.set("student_id", params.student_id);
  if (params?.limit)      qs.set("limit",      String(params.limit));
  if (params?.offset)     qs.set("offset",     String(params.offset));

  const path = `/tutorias${qs.toString() ? `?${qs}` : ""}`;
  const response = await apiRequest<unknown>(path, {
    authRequired: true,
    defaultErrorMessage: "Error al obtener solicitudes",
  });

  const envelope = response as BackendEnvelope<{ items?: TutoringRequest[] }>;
  const data = unwrapData<{ items?: TutoringRequest[] }>(response);
  const items = data?.items ?? [];
  return { items, total: envelope.meta?.total ?? items.length };
}

export function isGoogleCalendarAuthError(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }

  const code = error.code?.toLowerCase() ?? "";
  const message = error.message.toLowerCase();

  return (
    code.includes("calendar")
    || code.includes("google")
    || code.includes("token")
    || message.includes("calendar")
    || message.includes("google")
    || message.includes("access token")
    || message.includes("token expir")
    || message.includes("invalid_grant")
  );
}

export async function acceptRequest(
  id: string,
  calendarAccessToken: string,
  durationMinutes = 60
): Promise<void> {
  await apiRequest<unknown>(`/tutoria/aceptar/${id}`, {
    method: "POST",
    authRequired: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accessToken: calendarAccessToken,
      duracion_minutos: durationMinutes,
    }),
    defaultErrorMessage: "Error al aceptar solicitud",
    skipGlobalUnauthorizedHandler: true,
  });
}

export async function cancelRequest(id: string, calendarAccessToken?: string): Promise<void> {
  await apiRequest<unknown>(`/tutoria/${id}`, {
    method: "DELETE",
    authRequired: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(calendarAccessToken ? { accessToken: calendarAccessToken } : {}),
    defaultErrorMessage: "Error al cancelar solicitud",
    skipGlobalUnauthorizedHandler: true,
  });
}

export async function rejectRequest(id: string): Promise<void> {
  await apiRequest<unknown>(`/tutorias/${id}/reject`, {
    method: "PATCH",
    authRequired: true,
    headers: { "Content-Type": "application/json" },
    body: "{}",
    defaultErrorMessage: "Error al rechazar solicitud",
  });
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export interface SessionBitacora {
  id: number;
  temas_tratados: string | null;
  logros: string | null;
  compromisos: string | null;
  registrado_en: string;
}

export interface SessionFeedback {
  id: number;
  calificacion: number;
  comentario: string | null;
  registrado_en: string;
}

export interface TutoringSession {
  id: string;
  estado: string;
  modalidad: string;
  lugar_o_enlace: string | null;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  tutor: { id: string; full_name: string; email: string };
  estudiante: { id: string; full_name: string; email: string };
  materia: { id: number; codigo: string; nombre: string };
  bitacoras: SessionBitacora[];
  retroalimentaciones: SessionFeedback[];
}

export interface SessionsResponse {
  items: TutoringSession[];
  total: number;
}

export async function getSessions(params?: {
  tutor_id?: string;
  student_id?: string;
  estado?: string;
  limit?: number;
  offset?: number;
}): Promise<SessionsResponse> {
  const qs = new URLSearchParams();
  if (params?.tutor_id)   qs.set("tutor_id",   params.tutor_id);
  if (params?.student_id) qs.set("student_id", params.student_id);
  if (params?.estado)     qs.set("estado",     params.estado);
  if (params?.limit)      qs.set("limit",      String(params.limit));
  if (params?.offset)     qs.set("offset",     String(params.offset));

  const path = `/sesiones${qs.toString() ? `?${qs}` : ""}`;
  const response = await apiRequest<unknown>(path, {
    authRequired: true,
    defaultErrorMessage: "Error al obtener sesiones",
  });

  const envelope = response as BackendEnvelope<{ items?: TutoringSession[] }>;
  const data = unwrapData<{ items?: TutoringSession[] }>(response);
  const items = data?.items ?? [];
  return { items, total: envelope.meta?.total ?? items.length };
}

export interface CompletarSessionInput {
  temas_tratados: string;
  logros?: string;
  compromisos?: string;
}

export async function reprogramarSession(
  id: string,
  input: { fecha_hora_inicio: string; fecha_hora_fin: string }
): Promise<TutoringSession> {
  const response = await apiRequest<unknown>(`/sesiones/${id}/reprogramar`, {
    method: "PATCH",
    authRequired: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    defaultErrorMessage: "Error al reprogramar la sesión",
  });
  const data = unwrapData<TutoringSession>(response);
  if (!data) throw new ApiError("No se recibió la sesión actualizada", 500);
  return data;
}

export async function completarSession(id: string, input: CompletarSessionInput): Promise<TutoringSession> {
  const response = await apiRequest<unknown>(`/sesiones/${id}/completar`, {
    method: "PATCH",
    authRequired: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    defaultErrorMessage: "Error al registrar la sesión",
  });
  const data = unwrapData<TutoringSession>(response);
  if (!data) throw new ApiError("No se recibió la sesión actualizada", 500);
  return data;
}

export interface FeedbackInput {
  calificacion: number;
  comentario?: string;
}

export async function submitFeedback(sessionId: string, input: FeedbackInput): Promise<void> {
  await apiRequest<unknown>(`/sesiones/${sessionId}/feedback`, {
    method: "POST",
    authRequired: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    defaultErrorMessage: "Error al enviar la evaluación",
  });
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export interface MetricsResponse {
  solicitudes: {
    total: number;
    pendientes: number;
    aceptadas: number;
    canceladas: number;
    rechazadas: number;
  };
  sesiones_realizadas: number;
  promedio_evaluacion: number | null;
  top_tutores: { id: string; nombre: string; sesiones: number }[];
  top_materias: { id: number; nombre: string; codigo: string; solicitudes: number }[];
}

export async function getMetrics(params?: {
  tutor_id?: string;
  subject_id?: number;
  from?: string;
  to?: string;
}): Promise<MetricsResponse> {
  const qs = new URLSearchParams();
  if (params?.tutor_id)   qs.set("tutor_id",   params.tutor_id);
  if (params?.subject_id) qs.set("subject_id", String(params.subject_id));
  if (params?.from)       qs.set("from",       params.from);
  if (params?.to)         qs.set("to",         params.to);

  const path = `/metricas${qs.toString() ? `?${qs}` : ""}`;
  const response = await apiRequest<unknown>(path, {
    authRequired: true,
    defaultErrorMessage: "Error al obtener métricas",
  });
  const data = unwrapData<MetricsResponse>(response);
  if (!data) throw new ApiError("No se recibieron métricas", 500);
  return data;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function userList(limit = 20, offset = 0): Promise<PaginatedUsersResponse> {
  const response = await apiRequest<unknown>(`/usuarios?limit=${limit}&offset=${offset}`, {
    authRequired: true,
    defaultErrorMessage: "Error al obtener usuarios",
  });

  const data = unwrapData<UsersCollectionDto | BackendUserDto[]>(response);
  const envelope = response as BackendEnvelope<UsersCollectionDto>;

  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];

  const items = rawItems.map(mapUserDto);

  return {
    items,
    total: envelope.meta?.total ?? items.length,
    limit: envelope.meta?.limit ?? limit,
    offset: envelope.meta?.offset ?? offset,
  };
}

export async function roleChange(
  userId: string | number,
  roleInput: RoleChangeInput
): Promise<RoleChangeResponse> {
  const body: RoleChangeRequestDto = {};

  if (roleInput.role_name) {
    body.role_name = mapRoleToBackend(roleInput.role_name);
  }

  if (roleInput.role_id !== undefined) {
    body.role_id = roleInput.role_id;
  }

  if (!body.role_name && body.role_id === undefined) {
    throw new ApiError("Debe enviar role_name o role_id para cambiar el rol", 400);
  }

  const response = await apiRequest<unknown>(`/usuarios/${userId}/rol`, {
    method: "PATCH",
    authRequired: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    defaultErrorMessage: "Error al actualizar rol",
  });

  const userData = unwrapData<BackendUserDto>(response);
  const responseMessage = extractMessageFromPayload(response) ?? undefined;

  if (userData && typeof userData === "object" && "role_name" in userData) {
    return {
      message: responseMessage,
      user: mapUserDto(userData),
    };
  }

  return {
    message: responseMessage,
  };
}

// ─── Availability ────────────────────────────────────────────────────────────

export interface AvailabilitySlot {
  id: number;
  dia_semana: number;
  dia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  modalidad: string;
}

export async function getMyAvailability(): Promise<AvailabilitySlot[]> {
  const response = await apiRequest<unknown>("/disponibilidad", {
    authRequired: true,
    defaultErrorMessage: "Error al obtener disponibilidad",
  });
  const data = unwrapData<{ items?: AvailabilitySlot[] }>(response);
  return data?.items ?? [];
}

export async function getTutorAvailability(tutorId: string): Promise<AvailabilitySlot[]> {
  const response = await apiRequest<unknown>(`/disponibilidad/tutor/${tutorId}`, {
    authRequired: true,
    defaultErrorMessage: "Error al obtener disponibilidad",
  });
  const data = unwrapData<{ items?: AvailabilitySlot[] }>(response);
  return data?.items ?? [];
}

export async function addAvailabilitySlot(input: {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  modalidad: string;
}): Promise<AvailabilitySlot> {
  const response = await apiRequest<unknown>("/disponibilidad", {
    method: "POST",
    authRequired: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    defaultErrorMessage: "Error al agregar franja horaria",
  });
  const data = unwrapData<AvailabilitySlot>(response);
  if (!data) throw new ApiError("No se recibió la franja creada", 500);
  return data;
}

export async function removeAvailabilitySlot(id: number): Promise<void> {
  await apiRequest<unknown>(`/disponibilidad/${id}`, {
    method: "DELETE",
    authRequired: true,
    defaultErrorMessage: "Error al eliminar franja horaria",
  });
}

export async function getTutorRating(): Promise<number | null> {
  const response = await apiRequest<unknown>("/metricas/tutor-rating", {
    authRequired: true,
    defaultErrorMessage: "Error al obtener calificación",
  });
  const data = unwrapData<{ promedio: number | null }>(response);
  return data?.promedio ?? null;
}

export async function assignTutorToRequest(requestId: string, tutorId: string): Promise<void> {
  await apiRequest<unknown>(`/tutorias/${requestId}/assign-tutor`, {
    method: "PATCH",
    authRequired: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tutor_id: tutorId }),
    defaultErrorMessage: "Error al asignar tutor",
  });
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  tipo: string;
  asunto: string;
  leida: boolean;
  creado_en: string;
}

export async function getNotifications(): Promise<{ items: AppNotification[]; unread: number }> {
  const response = await apiRequest<unknown>("/notificaciones", {
    authRequired: true,
    defaultErrorMessage: "Error al obtener notificaciones",
  });
  const data = unwrapData<{ items?: AppNotification[]; unread?: number }>(response);
  return { items: data?.items ?? [], unread: data?.unread ?? 0 };
}

export async function markNotificationsRead(): Promise<void> {
  await apiRequest<unknown>("/notificaciones/mark-read", {
    method: "PATCH",
    authRequired: true,
    defaultErrorMessage: "Error al marcar notificaciones",
  });
}

// Backward-compatible exports for existing UI wiring.
export type RegisterPayload = RegisterUserInput;
export const register = registerUser;
export const getUsers = userList;

export async function updateUserRole(userId: string | number, roleName: RoleName) {
  return roleChange(userId, { role_name: roleName });
}
