"use client";

import { useAuth } from "@/context/AuthContext";
import { getNotifications, markNotificationsRead, AppNotification } from "@/lib/api";
import { Bell, X, CheckCheck } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";

const TIPO_LABEL: Record<string, string> = {
  SOLICITUD_NUEVA:     "Nueva solicitud",
  SOLICITUD_ACEPTADA:  "Tutoría confirmada",
  SOLICITUD_CANCELADA: "Solicitud cancelada",
  SOLICITUD_RECHAZADA: "Solicitud rechazada",
};

const TIPO_COLOR: Record<string, string> = {
  SOLICITUD_NUEVA:     "bg-[#E8F0FE] text-[#1A5EB8]",
  SOLICITUD_ACEPTADA:  "bg-[#E6F4EA] text-[#1E7E34]",
  SOLICITUD_CANCELADA: "bg-red-50 text-red-600",
  SOLICITUD_RECHAZADA: "bg-orange-50 text-orange-700",
};

const fmtRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return "Ahora mismo";
  if (mins  < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${days}d`;
};

export function Header() {
  const { user } = useAuth();
  const [open, setOpen]           = useState(false);
  const [notifs, setNotifs]       = useState<AppNotification[]>([]);
  const [unread, setUnread]       = useState(0);
  const dropRef                   = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { items, unread: u } = await getNotifications();
      setNotifs(items);
      setUnread(u);
    } catch {
      // silencioso
    }
  }, [user]);

  // Carga inicial + polling cada 60s
  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    setOpen((o) => !o);
    if (!open && unread > 0) {
      try {
        await markNotificationsRead();
        setUnread(0);
        setNotifs((prev) => prev.map((n) => ({ ...n, leida: true })));
      } catch { /* silencioso */ }
    }
  };

  if (!user) return null;

  return (
    <header className="bg-white h-[52px] flex items-center justify-between px-5 z-10 sticky top-0 border-b border-[#E5E7EB]/90">
      <h1 className="text-[15px] font-bold text-[#0F2547] font-heading truncate">
        Dashboard
      </h1>

      <div className="relative" ref={dropRef}>
        {/* Botón campana */}
        <button
          onClick={handleOpen}
          className="relative flex h-8 w-8 items-center justify-center rounded-[7px] border border-[#E5E7EB] bg-transparent text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#E5383B] text-white text-[9px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E7EB] rounded-[12px] shadow-xl z-50 overflow-hidden">
            {/* Cabecera */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]">
              <h3 className="text-[13px] font-bold text-[#0F2547]">Notificaciones</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Lista */}
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-[12px] text-gray-400">No tienes notificaciones</p>
                </div>
              ) : (
                notifs.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-[#F9FAFB] last:border-0 ${!n.leida ? "bg-[#F8FAFF]" : ""}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`mt-0.5 flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${TIPO_COLOR[n.tipo] ?? "bg-gray-100 text-gray-600"}`}>
                        {TIPO_LABEL[n.tipo] ?? n.tipo}
                      </span>
                      {!n.leida && (
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-[#1A5EB8] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[12px] text-gray-700 mt-1.5 leading-[1.5]">{n.asunto}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{fmtRelative(n.creado_en)}</p>
                  </div>
                ))
              )}
            </div>

            {/* Pie */}
            {notifs.length > 0 && (
              <div className="px-4 py-2.5 border-t border-[#F3F4F6] flex items-center justify-center">
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <CheckCheck className="h-3 w-3" /> Todas las notificaciones mostradas
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
