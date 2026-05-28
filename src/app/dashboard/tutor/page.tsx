"use client";

import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Inbox, CheckSquare, CalendarDays, Clock, CheckCircle, Star } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getRequests, getTutorRating, TutoringRequest } from "@/lib/api";

export default function TutorDashboard() {
  const { user } = useAuth();
  const [requests, setRequests]   = useState<TutoringRequest[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [dateStr, setDateStr]     = useState("");

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
  }, []);

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [{ items }, rating] = await Promise.all([
        getRequests({ tutor_id: String(user.id), limit: 20 }),
        getTutorRating().catch(() => null),
      ]);
      setRequests(items);
      setAvgRating(rating);
    } catch {
      // silencioso en dashboard
    }
  }, [user?.id]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const count = (status: string) => requests.filter((r) => r.status === status).length;

  const recientes = requests
    .filter((r) => r.status === "pendiente")
    .slice(0, 4);

  const STATUS_STYLE: Record<string, string> = {
    pendiente: "bg-yellow-100 text-yellow-800",
    aceptada:  "bg-blue-100 text-blue-800",
    cancelada: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Hola, {user?.first_name}</h1>
        <p className="mt-1 text-gray-500 capitalize text-sm">{dateStr || "Cargando..."} • Docente Tutor · Facultad de Ingeniería</p>
      </div>

      <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-4">
        <StatCard title="Solicitudes Pendientes" value={String(count("pendiente"))} icon={Inbox}        iconWrapperClassName="bg-[#FFF3CC] text-[#B8860B]" />
        <StatCard title="Aceptadas"              value={String(count("aceptada"))}  icon={CalendarDays} iconWrapperClassName="bg-[#E8F0FE] text-[#1A5EB8]" />
        <StatCard title="Sesiones Completadas"   value={String(count("realizada"))} icon={CheckSquare}  iconWrapperClassName="bg-[#E6F4EA] text-[#1E7E34]" />
        <StatCard
          title="Mi calificación"
          value={avgRating != null ? `${avgRating}/5` : "—"}
          icon={Star}
          iconWrapperClassName="bg-[#FFF3CC] text-[#B8860B]"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-[#0F2547]">Solicitudes Pendientes</h2>
          <Link href="/dashboard/tutor/solicitudes" className="text-[12px] text-[#1A5EB8] hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden">
          {recientes.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Inbox}
                title="No hay solicitudes pendientes"
                description="No tienes solicitudes de tutoría en espera de aprobación por ahora."
              />
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {recientes.map((r) => {
                const fecha = new Date(r.preferred_date).toLocaleDateString("es-CO", {
                  day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
                });
                return (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#0F2547] truncate">{r.student.full_name}</p>
                      <p className="text-[12px] text-gray-500 truncate">{r.subject.name} · {fecha}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                        Pendiente
                      </span>
                      <Link
                        href="/dashboard/tutor/solicitudes"
                        className="text-[11px] text-[#1A5EB8] hover:underline"
                      >
                        Revisar
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
