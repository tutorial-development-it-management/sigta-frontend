"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  User,
  RoleName,
  RegisterPayload,
  ApiError,
  clearApiAccessToken,
  getErrorMessage,
  getMe as apiGetMe,
  logoutFromBackend,
  register as apiRegister,
  setApiAccessToken,
  setUnauthorizedHandler,
} from "@/lib/api";
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  //signInWithRedirect,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

type RegisterInput = Omit<RegisterPayload, "password"> & { password?: string };

interface AuthContextType {
  user: User | null;
  role: RoleName | null;
  firebaseUser: FirebaseUser | null;
  idToken: string | null;
  loading: boolean;
  login: (email?: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (payload: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  firebaseUser: null,
  idToken: null,
  loading: false,
  login: async () => { },
  loginWithGoogle: async () => { },
  register: async () => { },
  logout: async () => { },
  refreshToken: async () => null,
});

const SESSION_COOKIE_NAME = "firebase_session";
const ROLE_COOKIE_NAME    = "sigta_role";
const GOOGLE_AUTH_INTENT_KEY = "sigta.auth.google.intent";

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
    "auth/operation-not-allowed": "Google Sign-In no esta habilitado en Firebase",
    "auth/network-request-failed": "No hay conexion con Firebase. Verifica tu red",
    "auth/web-storage-unsupported": "El navegador no permite almacenamiento para continuar con Google Sign-In",
  };

  return messages[code] || "No fue posible completar la operacion";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<RoleName | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const clearLocalSession = useCallback(() => {
    setUser(null);
    setRole(null);
    setFirebaseUser(null);
    setIdToken(null);
    clearApiAccessToken();
    setSessionCookie(false, undefined);
  }, []);

  const syncProfile = useCallback(async (forceRefreshToken = false) => {
    const profileResponse = await apiGetMe(forceRefreshToken);
    const profile = profileResponse.user;

    setUser(profile);
    setRole(profile.role_name);
    setSessionCookie(true, profile.role_name);

    return profile;
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

    setGoogleAuthIntent(true);
    //await signInWithRedirect(auth, provider);
    await signInWithPopup(auth, provider);
    return null;
  }, []);

  useEffect(() => {
    if (!auth) {
      return;
    }

    let isMounted = true;

    const resolveRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        
        if (!result?.user || !isMounted) {
          return;
        }

        const token = await result.user.getIdToken(true);

        if (!isMounted) {
          return;
        }

        setFirebaseUser(result.user);
        setIdToken(token);
        setApiAccessToken(token, true);
      } catch (error){
      } finally {
        setGoogleAuthIntent(false);
      }
    };

    void resolveRedirect();

    return () => {
      isMounted = false;
    };
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

      setLoading(true);
      try {
        const token = await nextFirebaseUser.getIdToken(true);

        if (!isMounted) {
          return;
        }

        setIdToken(token);
        setApiAccessToken(token, true);

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
  }, [clearLocalSession, handleProfileSyncFailure, syncProfile]);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);

    try {
      const currentGoogleUser = await ensureGoogleSession(true);

      if (!currentGoogleUser) {
        return;
      }

      const profile = await syncProfile(true);
      router.push(`/dashboard/${profile.role_name}`);
    } catch (error) {
      throw new Error(mapFirebaseError(error));
    } finally {
      setLoading(false);
    }
  }, [ensureGoogleSession, router, syncProfile]);

  const login = useCallback(async () => {
    await loginWithGoogle();
  }, [loginWithGoogle]);

  const register = useCallback(
    async (payload: RegisterInput) => {
      setLoading(true);

      try {
        const currentGoogleUser = await ensureGoogleSession(true);

        if (!currentGoogleUser) {
          return;
        }

        const effectiveEmail = payload.email || currentGoogleUser.email;

        if (!effectiveEmail) {
          throw new Error("No fue posible obtener el correo para registrar el usuario");
        }

        await apiRegister({
          ...payload,
          email: effectiveEmail,
        });

        const profile = await syncProfile(true);
        router.push(`/dashboard/${profile.role_name}`);
      } catch (error) {
        throw new Error(mapFirebaseError(error));
      } finally {
        setLoading(false);
      }
    },
    [ensureGoogleSession, router, syncProfile]
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
        loading,
        login,
        loginWithGoogle,
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
