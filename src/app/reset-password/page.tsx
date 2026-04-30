"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Layers, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

function ResetForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    if (password.length < 8)  { setError("La contraseña debe tener al menos 8 caracteres"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? "Error al restablecer la contraseña");
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al restablecer");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <p className="text-[14px] font-semibold text-[#0F2547]">Enlace inválido</p>
        <p className="text-[13px] text-gray-500">El enlace de recuperación es inválido o ha expirado.</p>
        <Link href="/forgot-password" className="block text-[13px] font-semibold text-[#1A5EB8] hover:underline">
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-[#E6F4EA] flex items-center justify-center mx-auto">
          <CheckCircle className="h-7 w-7 text-[#1E7E34]" />
        </div>
        <h2 className="text-[20px] font-bold text-[#0F2547]">¡Contraseña actualizada!</h2>
        <p className="text-[13px] text-[#6B7280]">Redirigiendo al inicio de sesión...</p>
      </div>
    );
  }

  const inputClass = "block w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] outline-none focus:border-[#FFC100] focus:shadow-[0_0_0_3px_rgba(255,193,0,0.12)]";

  return (
    <>
      <div className="mb-8">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.8px] text-[#FFC100]">NUEVA CONTRASEÑA</p>
        <h2 className="text-[26px] font-bold tracking-[-0.4px] text-[#0F2547]">Restablecer contraseña</h2>
        <p className="mt-2 text-[13px] text-[#6B7280]">Elige una contraseña segura de al menos 8 caracteres.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-[6px] text-[13px] font-normal text-[#374151]">Nueva contraseña</label>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              required minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-10`}
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block mb-[6px] text-[13px] font-normal text-[#374151]">Confirmar contraseña</label>
          <input
            type={showPwd ? "text" : "password"}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-[1px] h-4 w-4 flex-shrink-0 text-[#DC2626]" />
            <p className="text-[12px] text-[#DC2626]">{error}</p>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full rounded-[9px] bg-[#FFC100] p-[13px] text-[14px] font-bold text-[#0F2547] hover:bg-[#e6ad00] disabled:opacity-60">
          {loading ? "Actualizando..." : "Actualizar contraseña"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-end p-9" style={{ backgroundColor: "#1a1a22" }}>
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
          <p className="text-[30px] font-bold leading-[1.2] tracking-[-0.5px] max-w-[380px]">
            Crea una <span className="text-[#FFC100]">contraseña segura</span> para tu cuenta
          </p>
        </div>
      </div>
      <div className="w-full lg:w-[400px] bg-white px-[44px] py-12 flex flex-col justify-center">
        <Suspense fallback={<p className="text-[13px] text-gray-400">Cargando...</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
