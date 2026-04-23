"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading: authLoading, user, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [codigoUptc, setCodigoUptc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && role) {
      router.replace(`/dashboard/${role}`);
    }
  }, [authLoading, user, role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        codigo_uptc: codigoUptc,
        role_name: "student",
      });

      setSuccess("Registro exitoso. Redirigiendo al panel...");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No fue posible registrar el usuario"));
    } finally {
      setSubmitting(false);
    }
  };

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

      <div className="w-full lg:w-[400px] bg-white px-[44px] py-8 flex flex-col justify-center">
        <div className="w-full max-w-[320px] mx-auto">
          <div className="mb-6 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.8px] text-[#FFC100]">REGISTRO INSTITUCIONAL</p>
            <h2 className="text-[26px] font-bold tracking-[-0.4px] text-[#0F2547]">Crear cuenta</h2>
            <p className="mt-2 text-[13px] text-[#6B7280]">Completa tus datos para registrarte como estudiante.</p>
          </div>

          <form className="mt-0" onSubmit={handleSubmit}>
            <div className="mb-[14px]">
              <label className="mb-[6px] block text-[13px] font-normal text-[#374151]">Correo Institucional</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] text-[#111827] outline-none transition-[border,box-shadow] duration-150 placeholder:text-[13px] placeholder:text-[#9CA3AF] focus:border-[#FFC100] focus:shadow-[0_0_0_3px_rgba(255,193,0,0.12)]"
              />
            </div>

            <div className="mb-[14px]">
              <label className="mb-[6px] block text-[13px] font-normal text-[#374151]">Nombres</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="block w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] text-[#111827] outline-none transition-[border,box-shadow] duration-150 placeholder:text-[13px] placeholder:text-[#9CA3AF] focus:border-[#FFC100] focus:shadow-[0_0_0_3px_rgba(255,193,0,0.12)]"
              />
            </div>

            <div className="mb-[14px]">
              <label className="mb-[6px] block text-[13px] font-normal text-[#374151]">Apellidos</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="block w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] text-[#111827] outline-none transition-[border,box-shadow] duration-150 placeholder:text-[13px] placeholder:text-[#9CA3AF] focus:border-[#FFC100] focus:shadow-[0_0_0_3px_rgba(255,193,0,0.12)]"
              />
            </div>

            <div className="mb-[14px]">
              <label className="mb-[6px] block text-[13px] font-normal text-[#374151]">Código UPTC</label>
              <input
                type="text"
                required
                value={codigoUptc}
                onChange={(e) => setCodigoUptc(e.target.value)}
                className="block w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] text-[#111827] outline-none transition-[border,box-shadow] duration-150 placeholder:text-[13px] placeholder:text-[#9CA3AF] focus:border-[#FFC100] focus:shadow-[0_0_0_3px_rgba(255,193,0,0.12)]"
              />
            </div>

            <div className="mb-[14px]">
              <label className="mb-[6px] block text-[13px] font-normal text-[#374151]">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] text-[#111827] outline-none transition-[border,box-shadow] duration-150 placeholder:text-[13px] placeholder:text-[#9CA3AF] focus:border-[#FFC100] focus:shadow-[0_0_0_3px_rgba(255,193,0,0.12)]"
              />
            </div>

            {error && (
              <div className="mb-[14px] flex items-start gap-2">
                <AlertCircle className="mt-[1px] h-4 w-4 flex-shrink-0 text-[#DC2626]" />
                <p className="block text-[12px] text-[#DC2626]">{error}</p>
              </div>
            )}

            {success && <p className="mb-[14px] block text-[12px] text-green-600">{success}</p>}

            <div>
              <button
                type="submit"
                disabled={submitting || authLoading}
                className="w-full cursor-pointer rounded-[9px] border-none bg-[#FFC100] p-[13px] text-[14px] font-bold tracking-[0.3px] text-[#0F2547] transition-colors hover:bg-[#e6ad00] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting || authLoading ? "Registrando..." : "Registrarse"}
              </button>
            </div>

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
