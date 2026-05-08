"use client";

import { useState } from "react";
import Link from "next/link";
import { Layers, AlertCircle, CheckCircle } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email":     "El formato del correo electrónico no es válido",
  "auth/too-many-requests": "Demasiadas solicitudes. Intenta de nuevo más tarde",
  "auth/network-request-failed": "Error de red. Verifica tu conexión",
};

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!auth) throw new Error("Firebase no está disponible");
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: unknown) {
      const code = typeof err === "object" && err !== null && "code" in err
        ? String((err as { code: string }).code)
        : "";
      setError(FIREBASE_ERROR_MESSAGES[code] ?? "No fue posible enviar el correo. Intenta de nuevo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Panel izquierdo */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-end p-9" style={{ backgroundColor: "#1a1a22" }}>
        <div className="absolute inset-0 z-0" style={{ background: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%231a1a22'/%3E%3Cline x1='0' y1='30' x2='60' y2='30' stroke='%23ffffff07' stroke-width='0.5'/%3E%3Cline x1='30' y1='0' x2='30' y2='60' stroke='%23ffffff07' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />
        <div className="absolute top-7 left-9 z-10 text-white flex items-center gap-3">
          <div className="h-[34px] w-[34px] rounded-[9px] bg-[#FFC100] flex items-center justify-center">
            <Layers className="h-[18px] w-[18px] text-[#0F2547]" />
          </div>
          <div>
            <h1 className="text-[14px] font-bold leading-none text-white">SIGTA</h1>
            <p className="mt-1 text-[10px] text-white/35">UPTC · Sistema de Tutorías</p>
          </div>
        </div>
        <div className="relative z-10 text-white">
          <p className="mt-5 text-[30px] font-bold leading-[1.2] tracking-[-0.5px] max-w-[380px]">
            Recupera el acceso a tu <span className="text-[#FFC100]">cuenta</span>
          </p>
          <p className="mt-[10px] max-w-[340px] text-[13px] leading-[1.75] text-[rgba(255,255,255,0.45)]">
            Te enviaremos un enlace a tu correo institucional para restablecer tu contraseña.
          </p>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="w-full lg:w-[400px] bg-white px-[44px] py-12 flex flex-col justify-center">
        <div className="w-full">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-[#E6F4EA] flex items-center justify-center mx-auto">
                <CheckCircle className="h-7 w-7 text-[#1E7E34]" />
              </div>
              <h2 className="text-[22px] font-bold text-[#0F2547]">Revisa tu correo</h2>
              <p className="text-[13px] text-[#6B7280]">
                Si el correo existe en el sistema, recibirás un enlace de recuperación válido por 30 minutos.
              </p>
              <Link href="/login" className="block mt-4 text-[13px] font-semibold text-[#1A5EB8] hover:underline">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.8px] text-[#FFC100]">RECUPERACIÓN DE CUENTA</p>
                <h2 className="text-[26px] font-bold tracking-[-0.4px] text-[#0F2547]">¿Olvidaste tu contraseña?</h2>
                <p className="mt-2 text-[13px] text-[#6B7280]">Ingresa tu correo institucional y te enviaremos un enlace.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-[6px] text-[13px] font-normal text-[#374151]">Correo institucional</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@uptc.edu.co"
                    className="block w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] outline-none focus:border-[#FFC100] focus:shadow-[0_0_0_3px_rgba(255,193,0,0.12)]"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-[1px] h-4 w-4 flex-shrink-0 text-[#DC2626]" />
                    <p className="text-[12px] text-[#DC2626]">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-[9px] bg-[#FFC100] p-[13px] text-[14px] font-bold text-[#0F2547] hover:bg-[#e6ad00] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                </button>

                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center rounded-[9px] border border-[#D1D5DB] bg-white p-[13px] text-[14px] font-semibold text-[#374151] hover:bg-gray-50"
                >
                  Volver al inicio de sesión
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
