"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  User,
  RoleName,
  RegisterPayload,
  ApiError,
  clearApiAccessToken,
  getErrorMessage,
  getMe as apiGetMe,
  loginWithGoogleToken as apiLoginWithGoogleToken,
  logoutFromBackend,
  register as apiRegister,
  setApiAccessToken,
  setUnauthorizedHandler,
} from "@/lib/api";
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import {
  CalendarTokenState,
  isCalendarTokenValid,
  requestGoogleCalendarAccessToken,
} from "@/lib/googleCalendarOAuth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const CALENDAR_TOKEN_KEY = "sigta.auth.google.calToken";

type RegisterInput = Omit<RegisterPayload, "password"> & { password?: string };

interface AuthContextType {
  user: User | null;
  role: RoleName | null;
  firebaseUser: FirebaseUser | null;
  idToken: string | null;
  calendarAccessToken: string | null;
  hasCalendarAccess: boolean;
  loading: boolean;
  connectGoogleCalendar: () => Promise<string>;
  ensureGoogleCalendarAccessToken: (forcePrompt?: boolean) => Promise<string>;
  clearGoogleCalendarAccess: () => void;
  login: (email?: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  firebaseUser: null,
  idToken: null,
  calendarAccessToken: null,
  hasCalendarAccess: false,
  loading: false,
  connectGoogleCalendar: async () => "",
  ensureGoogleCalendarAccessToken: async () => "",
  clearGoogleCalendarAccess: () => { },
  login: async () => { },
  loginWithGoogle: async () => { },
  loginWithEmail: async () => { },
  register: async () => { },
  logout: async () => { },
  refreshToken: async () => null,
});

const SESSION_COOKIE_NAME = "firebase_session";
const ROLE_COOKIE_NAME    = "sigta_role";
const GOOGLE_AUTH_INTENT_KEY = "sigta.auth.google.intent";

function isNonBlockingBackendLoginError(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }

  // 400/415/422: login endpoint doesn't accept the Google token format (expected)
  // 404/405: endpoint not found or method not allowed (older backend versions)
  // 500: backend error on the email+password login endpoint — non-fatal for Google auth
  //      since the token is validated separately via /auth/me
  return [400, 404, 405, 415, 422, 500].includes(error.status);
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function setSessionCookie(active: boolean, role?: string) {
  if (active && role) {
    setCookie(SESSION_COOKIE_NAME, "1",   60 * 60 * 24 * 7);
    setCookie(ROLE_COOKIE_NAME,    role,  60 * 60 * 24 * 7);
    return;
  }

  clearCookie(SESSION_COOKIE_NAME);
  clearCookie(ROLE_COOKIE_NAME);
}

function setGoogleAuthIntent(active: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  if (active) {
    window.sessionStorage.setItem(GOOGLE_AUTH_INTENT_KEY, "1");
    return;
  }

  window.sessionStorage.removeItem(GOOGLE_AUTH_INTENT_KEY);
}

function readCalendarTokenState(): CalendarTokenState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.sessionStorage.getItem(CALENDAR_TOKEN_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<CalendarTokenState>;
    if (typeof parsed.accessToken === "string" && typeof parsed.expiresAt === "number") {
      return {
        accessToken: parsed.accessToken,
        expiresAt: parsed.expiresAt,
      };
    }
  } catch {
    return {
      accessToken: stored,
      expiresAt: 0,
    };
  }

  return null;
}

function persistCalendarTokenState(tokenState: CalendarTokenState | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!tokenState) {
    window.sessionStorage.removeItem(CALENDAR_TOKEN_KEY);
    return;
  }

  window.sessionStorage.setItem(CALENDAR_TOKEN_KEY, JSON.stringify(tokenState));
}

function mapFirebaseError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Sesion expirada. Inicia sesion con Google nuevamente.";
    }

    if (error.status === 403) {
      return "Sin permisos";
    }

    return error.message;
  }

  if (typeof error !== "object" || error === null || !("code" in error)) {
    return getErrorMessage(error, "No fue posible completar la operacion");
  }

  const code = String((error as { code?: string }).code);
  const messages: Record<string, string> = {
    "auth/popup-closed-by-user": "Se cerro la ventana de Google antes de completar el inicio de sesion",
    "auth/cancelled-popup-request": "Se cancelo la solicitud de inicio de sesion con Google",
    "auth/popup-blocked": "El navegador bloqueo la ventana emergente de Google",
    "auth/account-exists-with-different-credential": "Ya existe una cuenta con otro metodo de inicio de sesion",
    "auth/unauthorized-domain": "Dominio no autorizado en Firebase para Google Sign-In",
    "auth/operation-not-allowed": "Metodo de inicio de sesion no habilitado en Firebase",
    "auth/network-request-failed": "No hay conexion con Firebase. Verifica tu red",
    "auth/web-storage-unsupported": "El navegador no permite almacenamiento para continuar con Google Sign-In",
    "auth/user-not-found": "No existe una cuenta con este correo electronico",
    "auth/wrong-password": "Contrasena incorrecta",
    "auth/invalid-credential": "Correo o contrasena incorrectos",
    "auth/invalid-email": "El formato del correo electronico no es valido",
    "auth/user-disabled": "Esta cuenta ha sido deshabilitada",
    "auth/too-many-requests": "Demasiados intentos fallidos. Intenta de nuevo mas tarde",
    "auth/email-already-in-use": "Ya existe una cuenta registrada con este correo electronico",
    "auth/weak-password": "La contrasena debe tener al menos 6 caracteres",
  };

  return messages[code] || "No fue posible completar la operacion";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<RoleName | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [calendarTokenState, setCalendarTokenState] = useState<CalendarTokenState | null>(() => readCalendarTokenState());
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const loginFlowActiveRef = useRef(false);
  const hasCalendarAccess = isCalendarTokenValid(calendarTokenState);
  const calendarAccessToken = hasCalendarAccess ? calendarTokenState?.accessToken ?? null : null;

  const clearLocalSession = useCallback(() => {
    setUser(null);
    setRole(null);
    setFirebaseUser(null);
    setIdToken(null);
    setCalendarTokenState(null);
    clearApiAccessToken();
    setSessionCookie(false, undefined);
    persistCalendarTokenState(null);
  }, []);

  const syncProfile = useCallback(async (forceRefreshToken = false) => {
    const profileResponse = await apiGetMe(forceRefreshToken);
    const profile = profileResponse.user;

    setUser(profile);
    setRole(profile.role_name);
    setSessionCookie(true, profile.role_name);

    return profile;
  }, []);

  const ensureBackendGoogleSession = useCallback(async (token: string) => {
    try {
      await apiLoginWithGoogleToken(token);
    } catch (error) {
      // Some backend versions only require Bearer token in /auth/me and can reject /auth/login payloads.
      if (isNonBlockingBackendLoginError(error)) {
        return;
      }

      throw error;
    }
  }, []);

  const forceRelogin = useCallback(async () => {
    try {
      if (auth?.currentUser) {
        await signOut(auth);
      }
    } catch {
      // Local cleanup and redirect must happen even if Firebase signOut fails.
    } finally {
      clearLocalSession();
      router.replace("/login");
    }
  }, [clearLocalSession, router]);

  const handleProfileSyncFailure = useCallback(
    async (error: unknown) => {
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        setUser(null);
        setRole(null);
        setSessionCookie(false);
        router.replace("/register");
        return;
      }

      await forceRelogin();
    },
    [forceRelogin, router]
  );

  const ensureGoogleSession = useCallback(async (forceRefreshToken = true) => {
    if (!auth) {
      throw new Error("Firebase Auth no esta disponible en este entorno");
    }

    //await setPersistence(auth, browserSessionPersistence);

    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken(forceRefreshToken);
      setFirebaseUser(auth.currentUser);
      setIdToken(token);
      setApiAccessToken(token, true);
      return auth.currentUser;
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const result = await signInWithPopup(auth, provider);
      setGoogleAuthIntent(false);
      return result.user;
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: string }).code)
        : "";

      const shouldFallbackToRedirect = code === "auth/popup-blocked";
      if (!shouldFallbackToRedirect) {
        throw error;
      }

      setGoogleAuthIntent(true);
      await signInWithRedirect(auth, provider);
    }

    return null;
  }, []);

  const connectGoogleCalendar = useCallback(async () => {
    const tokenState = await requestGoogleCalendarAccessToken("consent");
    setCalendarTokenState(tokenState);
    persistCalendarTokenState(tokenState);
    return tokenState.accessToken;
  }, []);

  const ensureGoogleCalendarAccessToken = useCallback(
    async (forcePrompt = false) => {
      if (!forcePrompt && isCalendarTokenValid(calendarTokenState)) {
        return calendarTokenState.accessToken;
      }

      const prompt: "" | "consent" = forcePrompt || !calendarTokenState ? "consent" : "";
      const tokenState = await requestGoogleCalendarAccessToken(prompt);
      setCalendarTokenState(tokenState);
      persistCalendarTokenState(tokenState);
      return tokenState.accessToken;
    },
    [calendarTokenState]
  );

  const clearGoogleCalendarAccess = useCallback(() => {
    setCalendarTokenState(null);
    persistCalendarTokenState(null);
  }, []);

  useEffect(() => {
    setGoogleAuthIntent(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void forceRelogin();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [forceRelogin]);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (nextFirebaseUser) => {
      if (!isMounted) {
        return;
      }

      setFirebaseUser(nextFirebaseUser);

      if (!nextFirebaseUser) {
        clearLocalSession();
        setLoading(false);
        return;
      }

      // Si un flujo de login interactivo (loginWithGoogle / loginWithEmail / register)
      // ya está manejando el sync con el backend, no procesamos aquí para evitar
      // doble llamada y el forceRelogin() silencioso ante errores de servidor.
      if (loginFlowActiveRef.current) return;

      setLoading(true);
      try {
        const token = await nextFirebaseUser.getIdToken(true);

        if (!isMounted) {
          return;
        }

        setIdToken(token);
        setApiAccessToken(token, true);

        await ensureBackendGoogleSession(token);

        await syncProfile(true);
      } catch (error) {
        await handleProfileSyncFailure(error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [clearLocalSession, ensureBackendGoogleSession, handleProfileSyncFailure, syncProfile]);

  const loginWithGoogle = useCallback(async () => {
    loginFlowActiveRef.current = true;
    setLoading(true);

    try {
      const currentGoogleUser = await ensureGoogleSession(true);

      if (!currentGoogleUser) {
        return;
      }

      const token = await currentGoogleUser.getIdToken(true);
      setIdToken(token);
      setApiAccessToken(token, true);

      await ensureBackendGoogleSession(token);

      const profile = await syncProfile(true);
      router.push(`/dashboard/${profile.role_name}`);
    } catch (error) {
      // Usuario autenticado en Firebase pero sin registro en la DB → completar registro
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        clearLocalSession();
        router.replace("/register");
        return;
      }
      throw new Error(mapFirebaseError(error));
    } finally {
      loginFlowActiveRef.current = false;
      setLoading(false);
    }
  }, [clearLocalSession, ensureBackendGoogleSession, ensureGoogleSession, router, syncProfile]);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    if (!auth) {
      throw new Error("Firebase Auth no esta disponible en este entorno");
    }

    loginFlowActiveRef.current = true;
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken(true);
      setFirebaseUser(credential.user);
      setIdToken(token);
      setApiAccessToken(token, true);

      await ensureBackendGoogleSession(token);

      const profile = await syncProfile(true);
      router.push(`/dashboard/${profile.role_name}`);
    } catch (error) {
      // Usuario autenticado en Firebase pero sin registro en la DB → completar registro
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        clearLocalSession();
        router.replace("/register");
        return;
      }
      throw new Error(mapFirebaseError(error));
    } finally {
      loginFlowActiveRef.current = false;
      setLoading(false);
    }
  }, [clearLocalSession, ensureBackendGoogleSession, router, syncProfile]);

  const login = useCallback(async (email?: string, password?: string) => {
    if (email && password) {
      await loginWithEmail(email, password);
    } else {
      await loginWithGoogle();
    }
  }, [loginWithEmail, loginWithGoogle]);

  const register = useCallback(
    async (payload: RegisterInput) => {
      if (!auth) {
        throw new Error("Firebase Auth no esta disponible en este entorno");
      }

      const { email, password } = payload;

      if (!email || !password) {
        throw new Error("El correo y la contrasena son obligatorios para registrarse");
      }

      loginFlowActiveRef.current = true;
      setLoading(true);
      let createdFirebaseAccount = false;

      try {
        // 1. Crear cuenta en Firebase o usar la existente
        let firebaseUser: FirebaseUser;
        try {
          const credential = await createUserWithEmailAndPassword(auth, email, password);
          firebaseUser = credential.user;
          createdFirebaseAccount = true;
        } catch (firebaseError) {
          const code = (firebaseError as { code?: string }).code;
          if (code !== "auth/email-already-in-use") throw firebaseError;
          // La cuenta de Firebase ya existe → iniciar sesión con las credenciales dadas
          const credential = await signInWithEmailAndPassword(auth, email, password);
          firebaseUser = credential.user;
        }

        const token = await firebaseUser.getIdToken(true);
        setFirebaseUser(firebaseUser);
        setIdToken(token);
        setApiAccessToken(token, true);

        // 2. Crear registro en la DB (si ya existe, continuar de todas formas)
        try {
          await apiRegister(payload);
        } catch (backendError) {
          // Si el usuario ya existe en la DB redirigir al dashboard directamente
          if (backendError instanceof ApiError && backendError.status === 400) {
            const profile = await syncProfile(true);
            router.push(`/dashboard/${profile.role_name}`);
            return;
          }
          throw backendError;
        }

        // 3. Sincronizar perfil y redirigir
        const profile = await syncProfile(true);
        router.push(`/dashboard/${profile.role_name}`);
      } catch (error) {
        // Si creamos la cuenta de Firebase y el backend falló, eliminarla para evitar huérfanas
        if (createdFirebaseAccount && auth.currentUser) {
          try { await auth.currentUser.delete(); } catch { /* best-effort */ }
        }
        clearLocalSession();
        throw new Error(mapFirebaseError(error));
      } finally {
        loginFlowActiveRef.current = false;
        setLoading(false);
      }
    },
    [clearLocalSession, router, syncProfile]
  );

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      try {
        await logoutFromBackend();
      } catch {
        // Session must still be cleaned even if backend logout fails.
      }

      try {
        if (auth) {
          await signOut(auth);
        }
      } catch {
        // Cleanup continues regardless of Firebase signOut result.
      }
    } finally {
      clearLocalSession();
      router.push("/login");
      setLoading(false);
    }
  }, [clearLocalSession, router]);

  const refreshToken = useCallback(async (forceRefresh = true) => {
    if (!auth) {
      return null;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }

    const token = await currentUser.getIdToken(forceRefresh);
    setIdToken(token);
    setApiAccessToken(token, true);
    setSessionCookie(true);
    return token;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        firebaseUser,
        idToken,
        calendarAccessToken,
        hasCalendarAccess,
        loading,
        connectGoogleCalendar,
        ensureGoogleCalendarAccessToken,
        clearGoogleCalendarAccess,
        login,
        loginWithGoogle,
        loginWithEmail,
        register,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
