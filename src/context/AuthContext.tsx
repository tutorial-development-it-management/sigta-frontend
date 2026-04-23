"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  RoleName,
  RegisterPayload,
  getMe as apiGetMe,
  register as apiRegister,
} from "@/lib/api";
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

type RegisterInput = RegisterPayload & { password: string };

interface AuthContextType {
  user: User | null;
  role: RoleName | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  firebaseUser: null,
  loading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshToken: async () => null,
});

const SESSION_COOKIE_NAME = "firebase_session";

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function setSessionCookie(active: boolean) {
  if (active) {
    setCookie(SESSION_COOKIE_NAME, "1", 60 * 60 * 24 * 7);
    return;
  }

  clearCookie(SESSION_COOKIE_NAME);
}

function mapFirebaseError(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return error instanceof Error ? error.message : "No fue posible completar la operación";
  }

  const code = String((error as { code?: string }).code);
  const messages: Record<string, string> = {
    "auth/invalid-credential": "Credenciales inválidas",
    "auth/user-not-found": "No existe una cuenta con ese correo",
    "auth/wrong-password": "Credenciales inválidas",
    "auth/too-many-requests": "Demasiados intentos. Intenta nuevamente en unos minutos",
    "auth/email-already-in-use": "El correo ya está registrado",
    "auth/weak-password": "La contraseña es demasiado débil",
    "auth/invalid-email": "El correo electrónico no es válido",
  };

  return messages[code] || "No fue posible completar la operación";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<RoleName | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const syncProfile = async (forceRefreshToken = false) => {
    const profileResponse = await apiGetMe(forceRefreshToken);
    const profile = profileResponse.user;

    setUser(profile);
    setRole(profile.role_name);
    setSessionCookie(true);

    return profile;
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextFirebaseUser) => {
      setFirebaseUser(nextFirebaseUser);

      if (!nextFirebaseUser) {
        setUser(null);
        setRole(null);
        setSessionCookie(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await syncProfile();
      } catch {
        await signOut(auth);
        setUser(null);
        setRole(null);
        setSessionCookie(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    if (!auth) {
      throw new Error("Firebase Auth no está disponible en este entorno");
    }

    setLoading(true);
    try {
      const credentials = await signInWithEmailAndPassword(auth, email, pass);
      setFirebaseUser(credentials.user);
      const profile = await syncProfile(true);
      router.push(`/dashboard/${profile.role_name}`);
    } catch (error) {
      throw new Error(mapFirebaseError(error));
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: RegisterInput) => {
    if (!auth) {
      throw new Error("Firebase Auth no está disponible en este entorno");
    }

    setLoading(true);
    let createdFirebaseUser: FirebaseUser | null = null;

    try {
      const credentials = await createUserWithEmailAndPassword(
        auth,
        payload.email,
        payload.password
      );
      createdFirebaseUser = credentials.user;
      setFirebaseUser(credentials.user);

      await apiRegister(payload);
      const profile = await syncProfile(true);

      router.push(`/dashboard/${profile.role_name}`);
    } catch (error) {
      if (createdFirebaseUser) {
        try {
          await createdFirebaseUser.delete();
        } catch {
          // If cleanup fails, the user can still be handled from Firebase Console.
        }
      }

      throw new Error(mapFirebaseError(error));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!auth) {
      setUser(null);
      setRole(null);
      setFirebaseUser(null);
      setSessionCookie(false);
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setRole(null);
      setFirebaseUser(null);
      setSessionCookie(false);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async (forceRefresh = true) => {
    if (!auth) {
      return null;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }

    const idToken = await currentUser.getIdToken(forceRefresh);
    setSessionCookie(true);
    return idToken;
  };

  return (
    <AuthContext.Provider
      value={{ user, role, firebaseUser, loading, login, register, logout, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
