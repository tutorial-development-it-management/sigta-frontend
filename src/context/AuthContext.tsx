"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { User, RoleName, login as apiLogin, getMe as apiGetMe } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: false,
  login: async () => {},
  logout: () => {},
});

function getCookieValue(name: string): string | null {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  if (!cookie) return null;
  return cookie.slice(name.length + 1);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for cookie on load
    const storedToken = getCookieValue("token");

    if (storedToken) {
      setToken(storedToken);
      apiGetMe(storedToken)
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const data = await apiLogin(email, pass);
      setToken(data.token);
      setUser(data.user);
      document.cookie = `token=${data.token}; path=/; max-age=1800; SameSite=Lax`; // 30 minutes
      const role = data.user.role_name;
      document.cookie = `user_role=${role}; path=/; max-age=1800; SameSite=Lax`;
      
      router.push(`/dashboard/${role}`);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    document.cookie = "token=; path=/; max-age=0";
    document.cookie = "user_role=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
