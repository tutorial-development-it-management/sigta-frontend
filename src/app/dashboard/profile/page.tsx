"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, Shield, Hash, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

const ROLE_LABEL: Record<string, string> = {
  admin:       "Administrador TI",
  tutor:       "Docente Tutor",
  student:     "Estudiante",
  coordinator: "Coordinador Académico",
};

const inputClass =
  "block w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[11px] text-[13px] text-[#111827] outline-none transition-[border,box-shadow] focus:border-[#FFC100] focus:shadow-[0_0_0_3px_rgba(255,193,0,0.12)]";

export default function ProfilePage() {
  const { user, idToken } = useAuth();

  const [newPwd, setNewPwd]       = useState("");
  const [confirmPwd, setConfirm]  = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [pwdLoading, setPwdLoad]  = useState(false);
  const [pwdError, setPwdError]   = useState<string | null>(null);
  const [pwdSuccess, setPwdOk]    = useState(false);

  if (!user) return null;

  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
  const roleLabel = ROLE_LABEL[user.role_name] ?? user.role_name;

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdOk(false);

    if (newPwd.length < 8) {
      setPwdError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("Las contraseñas no coinciden");
      return;
    }

    setPwdLoad(true);
    try {
      // Usamos el endpoint de reset con el token de sesión actual (flujo interno)
      const res = await fetch(`${API_BASE}/auth/update-password`, {
        method:  "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${idToken ?? ""}`,
        },
        body: JSON.stringify({ password: newPwd }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message ?? "Error al actualizar la contraseña");
      }

      setPwdOk(true);
      setNewPwd("");
      setConfirm("");
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setPwdLoad(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Mi Perfil</h1>
        <p className="mt-1 text-sm text-gray-500">Información de tu cuenta en SIGTA.</p>
      </div>

      {/* Datos del usuario */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden">
        {/* Cabecera con avatar */}
        <div className="bg-[#0F2547] px-6 py-8 flex items-center gap-4">
          <div className="h-16 w-16 rounded-[14px] bg-[#FFC100] flex items-center justify-center text-[#0F2547] text-[22px] font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-white text-[18px] font-bold">{user.first_name} {user.last_name}</h2>
            <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-[#FFC100] text-[#0F2547] text-[11px] font-bold">
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Campos */}
        <div className="p-6 space-y-4">
          {[
            { icon: User,   label: "Nombres",  value: `${user.first_name} ${user.last_name}` },
            { icon: Mail,   label: "Correo",   value: user.email },
            { icon: Shield, label: "Rol",      value: roleLabel },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 py-3 border-b border-[#F3F4F6] last:border-0">
              <div className="h-9 w-9 rounded-[9px] bg-[#F4F5F7] flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-gray-400" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
                <p className="text-[13px] font-medium text-[#0F2547] mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6">
        <h3 className="text-[14px] font-bold text-[#0F2547] mb-1">Cambiar contraseña</h3>
        <p className="text-[12px] text-gray-400 mb-5">Mínimo 8 caracteres. Tu sesión actual no se verá afectada.</p>

        <form onSubmit={handleChangePwd} className="space-y-4">
          <div>
            <label className="block mb-[6px] text-[13px] text-[#374151]">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className={`${inputClass} pr-10`}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-[6px] text-[13px] text-[#374151]">Confirmar contraseña</label>
            <input
              type={showPwd ? "text" : "password"}
              value={confirmPwd}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              className={inputClass}
              required
            />
          </div>

          {pwdError && (
            <div className="flex items-center gap-2 text-[12px] text-red-600 bg-red-50 rounded-[8px] px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {pwdError}
            </div>
          )}

          {pwdSuccess && (
            <div className="flex items-center gap-2 text-[12px] text-[#1E7E34] bg-[#E6F4EA] rounded-[8px] px-3 py-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Contraseña actualizada correctamente
            </div>
          )}

          <button
            type="submit"
            disabled={pwdLoading || !newPwd || !confirmPwd}
            className="w-full py-[11px] rounded-[9px] bg-[#0F2547] text-white text-[13px] font-bold hover:bg-[#1a3a6b] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {pwdLoading ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
