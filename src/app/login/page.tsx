"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";
import { GraduationCap, AlertCircle, Layers, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ActiveLogin = "google" | "email" | null;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeLogin, setActiveLogin] = useState<ActiveLogin>(null);
  const [error, setError] = useState<string | null>(null);

  const { loginWithGoogle, loginWithEmail, loading, user, role } = useAuth();
  const router = useRouter();

  const isLoading = activeLogin !== null || loading;

  useEffect(() => {
    if (!loading && user && role) {
      router.replace(`/dashboard/${role}`);
    }
  }, [loading, user, role, router]);

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setError(null);
    setActiveLogin("google");
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No fue posible iniciar sesión con Google"));
    } finally {
      setActiveLogin(null);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!email.trim() || !password) return;
    setError(null);
    setActiveLogin("email");
    try {
      await loginWithEmail(email.trim(), password);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No fue posible iniciar sesión"));
    } finally {
      setActiveLogin(null);
    }
  };

  return (
    <div className="flex h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Left Panel */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-end p-9"
        style={{ backgroundColor: "#1a1a22" }}
      >
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%231a1a22'/%3E%3Cline x1='0' y1='30' x2='60' y2='30' stroke='%23ffffff07' stroke-width='0.5'/%3E%3Cline x1='30' y1='0' x2='30' y2='60' stroke='%23ffffff07' stroke-width='0.5'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(180deg, transparent 40%, #1a1a22dd 100%)" }} />

        <div className="absolute top-7 left-9 z-10 text-white">
          <div className="flex items-center gap-3">
            <div className="h-[34px] w-[34px] rounded-[9px] bg-[#FFC100] flex items-center justify-center">
              <Layers className="h-[18px] w-[18px] text-[#0F2547]" />
              <GraduationCap className="hidden" />
            </div>
            <div>
              <h1 className="text-[14px] font-bold leading-none text-white">SIGTA</h1>
              <p className="mt-1 text-[10px] text-white/35">UPTC · Sistema de Tutorías</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white">
          <div className="inline-flex items-center gap-2 rounded-[20px] border border-[rgba(255,193,0,0.25)] bg-[rgba(255,193,0,0.12)] px-3 py-[5px]">
            <span className="h-[6px] w-[6px] rounded-full bg-[#FFC100]" />
            <span className="text-[11px] font-bold tracking-[0.5px] uppercase text-[#FFC100]">PLATAFORMA ACADÉMICA</span>
          </div>
          <p className="mt-5 text-[30px] font-bold leading-[1.2] tracking-[-0.5px] text-white max-w-[380px]">
            Sistema Inteligente de Gestión de <span className="text-[#FFC100]">Tutorías</span> Académicas
          </p>
          <p className="mt-[10px] max-w-[340px] text-[13px] leading-[1.75] text-[rgba(255,255,255,0.45)]">
            Conecta estudiantes con tutores de la UPTC. Agenda sesiones, lleva el seguimiento y mejora tu rendimiento académico.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-[420px] bg-white px-[44px] py-10 flex flex-col justify-center overflow-y-auto">
        <div className="w-full">
          <div className="mb-6 text-left">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.8px] text-[#FFC100]">ACCESO INSTITUCIONAL</p>
            <h2 className="text-[26px] font-bold tracking-[-0.4px] text-[#0F2547]">
              Bienvenido de nuevo
            </h2>
            <p className="mt-2 text-[13px] text-[#6B7280]">
              Ingresa tus credenciales institucionales para continuar.
            </p>
          </div>

          <div>
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-[8px] bg-[#FEF2F2] px-3 py-[10px]">
                <AlertCircle className="mt-[1px] h-4 w-4 flex-shrink-0 text-[#DC2626]" />
                <p className="text-[12px] text-[#DC2626]">{error}</p>
              </div>
            )}

            {/* Email / Password form */}
            <form onSubmit={handleEmailLogin} noValidate>
              <div className="mb-3">
                <label htmlFor="email" className="mb-[6px] block text-[12px] font-semibold text-[#374151]">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="correo@uptc.edu.co"
                  className="w-full rounded-[9px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#0F2547] focus:ring-2 focus:ring-[#0F2547]/10 disabled:opacity-60"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="mb-[6px] block text-[12px] font-semibold text-[#374151]">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="••••••••"
                    className="w-full rounded-[9px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] pr-[42px] text-[13px] text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#0F2547] focus:ring-2 focus:ring-[#0F2547]/10 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim() || !password}
                className="w-full cursor-pointer rounded-[9px] border-none bg-[#0F2547] p-[13px] text-[14px] font-bold tracking-[0.3px] text-white transition-colors hover:bg-[#1a3a6b] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center"
              >
                {activeLogin === "email" ? (
                  <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Iniciar sesión"
                )}
              </button>
            </form>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="mt-4 w-full cursor-pointer rounded-[9px] border-none bg-[#FFC100] p-[13px] text-[14px] font-bold tracking-[0.3px] text-[#0F2547] transition-colors hover:bg-[#e6ad00] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {activeLogin === "google" ? (
                <svg className="h-5 w-5 animate-spin text-[#0F2547]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Iniciar sesión con Google
                </>
              )}
            </button>

            {/* Secondary links */}
            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/register"
                className="w-full inline-flex items-center justify-center rounded-[9px] border border-[#D1D5DB] bg-white p-[11px] text-[13px] font-semibold tracking-[0.2px] text-[#0F2547] transition-colors hover:bg-[#FFF8DC]"
              >
                Registrarse
              </Link>
              <Link
                href="/forgot-password"
                className="w-full inline-flex items-center justify-center rounded-[9px] border border-[#D1D5DB] bg-white p-[11px] text-[13px] font-semibold tracking-[0.2px] text-[#1A5EB8] transition-colors hover:bg-[#F5F9FF]"
              >
                Recuperar contraseña
              </Link>
            </div>

            <p className="mt-6 text-center text-[11px] leading-[1.6] text-[#9CA3AF]">
              Sistema desarrollado por estudiantes de <span className="font-bold text-[#374151]">Ingenieria de Sistemas - UPTC</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
