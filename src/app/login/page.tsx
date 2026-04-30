"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";
import { GraduationCap, AlertCircle, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const { loginWithGoogle, loading, user, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && role) {
      router.replace(`/dashboard/${role}`);
    }
  }, [loading, user, role, router]);

  const handleGoogleLogin = async () => {
    setError(null);

    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No fue posible iniciar sesion con Google"));
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
      <div className="w-full lg:w-[400px] bg-white px-[44px] py-12 flex flex-col justify-center">
        <div className="w-full">
          <div className="mb-8 text-left">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.8px] text-[#FFC100]">ACCESO INSTITUCIONAL</p>
            <h2 className="text-[26px] font-bold tracking-[-0.4px] text-[#0F2547]">
              Bienvenido de nuevo
            </h2>
            <p className="mt-2 text-[13px] text-[#6B7280]">
              Ingresa tus credenciales institucionales para continuar.
            </p>
          </div>

          <div className="mt-0">

            {error && (
              <div className="mb-[18px] flex items-start gap-2">
                <AlertCircle className="mt-[1px] h-4 w-4 flex-shrink-0 text-[#DC2626]" />
                <p className="block text-[12px] text-[#DC2626]">{error}</p>
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full cursor-pointer rounded-[9px] border-none bg-[#FFC100] p-[13px] text-[14px] font-bold tracking-[0.3px] text-[#0F2547] transition-colors hover:bg-[#e6ad00] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <svg className="h-5 w-5 animate-spin text-[#0F2547]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Iniciar sesión con Google"
                )}
              </button>
            </div>

            <div className="mt-3">
              <Link
                href="/register"
                className="w-full inline-flex items-center justify-center rounded-[9px] border border-[#D1D5DB] bg-white p-[13px] text-[14px] font-semibold tracking-[0.2px] text-[#0F2547] transition-colors hover:bg-[#FFF8DC]"
              >
                Registrarse
              </Link>
            </div>

            <div className="mt-3">
              <Link
                href="/forgot-password"
                className="w-full inline-flex items-center justify-center rounded-[9px] border border-[#D1D5DB] bg-white p-[13px] text-[14px] font-semibold tracking-[0.2px] text-[#1A5EB8] transition-colors hover:bg-[#F5F9FF]"
              >
                Recuperar contraseña
              </Link>
            </div>

            <p className="mt-7 text-center text-[11px] leading-[1.6] text-[#9CA3AF]">
              Sistema desarrollado por estudiantes de <span className="font-bold text-[#374151]">Ingenieria de Sistemas - UPTC</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
