"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading: authLoading, user, role } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [codigoUptc, setCodigoUptc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && role) {
      router.replace(`/dashboard/${role}`);
    }
  }, [authLoading, user, role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        codigo_uptc: codigoUptc.trim(),
        role_name: "student",
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No fue posible registrar el usuario"));
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = submitting || authLoading;

  return (
    <div className="flex h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
            Crea tu cuenta de <span className="text-[#FFC100]">Estudiante</span>
          </p>
          <p className="mt-[10px] max-w-[340px] text-[13px] leading-[1.75] text-[rgba(255,255,255,0.45)]">
            Regístrate con tu información institucional para comenzar a usar la plataforma de tutorías.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-[400px] bg-white px-[44px] py-8 flex flex-col justify-center overflow-y-auto">
        <div className="w-full max-w-[320px] mx-auto">
          <div className="mb-6 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.8px] text-[#FFC100]">REGISTRO INSTITUCIONAL</p>
            <h2 className="text-[26px] font-bold tracking-[-0.4px] text-[#0F2547]">Crear cuenta</h2>
            <p className="mt-2 text-[13px] text-[#6B7280]">Completa tus datos para registrarte como estudiante.</p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-[8px] bg-[#FEF2F2] px-3 py-[10px]">
              <AlertCircle className="mt-[1px] h-4 w-4 flex-shrink-0 text-[#DC2626]" />
              <p className="text-[12px] text-[#DC2626]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-[14px]">
              <label className="mb-[6px] block text-[12px] font-semibold text-[#374151]">
                Correo institucional
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="correo@uptc.edu.co"
                className="block w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] text-[#111827] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#0F2547] focus:ring-2 focus:ring-[#0F2547]/10 disabled:opacity-60"
              />
            </div>

            <div className="mb-[14px]">
              <label className="mb-[6px] block text-[12px] font-semibold text-[#374151]">
                Nombres
              </label>
              <input
                type="text"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
                className="block w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] text-[#111827] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#0F2547] focus:ring-2 focus:ring-[#0F2547]/10 disabled:opacity-60"
              />
            </div>

            <div className="mb-[14px]">
              <label className="mb-[6px] block text-[12px] font-semibold text-[#374151]">
                Apellidos
              </label>
              <input
                type="text"
                required
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
                className="block w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] text-[#111827] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#0F2547] focus:ring-2 focus:ring-[#0F2547]/10 disabled:opacity-60"
              />
            </div>

            <div className="mb-[14px]">
              <label className="mb-[6px] block text-[12px] font-semibold text-[#374151]">
                Código UPTC
              </label>
              <input
                type="text"
                required
                value={codigoUptc}
                onChange={(e) => setCodigoUptc(e.target.value)}
                disabled={isLoading}
                placeholder="ej. 201912345"
                className="block w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] text-[#111827] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#0F2547] focus:ring-2 focus:ring-[#0F2547]/10 disabled:opacity-60"
              />
            </div>

            <div className="mb-5">
              <label className="mb-[6px] block text-[12px] font-semibold text-[#374151]">
                Contraseña <span className="font-normal text-[#9CA3AF]">(mín. 6 caracteres)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="block w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] pr-[42px] text-[13px] text-[#111827] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#0F2547] focus:ring-2 focus:ring-[#0F2547]/10 disabled:opacity-60"
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
              disabled={isLoading || !email || !password || !firstName || !lastName || !codigoUptc}
              className="w-full cursor-pointer rounded-[9px] border-none bg-[#FFC100] p-[13px] text-[14px] font-bold tracking-[0.3px] text-[#0F2547] transition-colors hover:bg-[#e6ad00] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center"
            >
              {isLoading ? (
                <svg className="h-5 w-5 animate-spin text-[#0F2547]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "Registrarse"
              )}
            </button>

            <div className="mt-3">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center rounded-[9px] border border-[#D1D5DB] bg-white p-[13px] text-[14px] font-semibold tracking-[0.2px] text-[#0F2547] transition-colors hover:bg-[#FFF8DC]"
              >
                Volver a iniciar sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
