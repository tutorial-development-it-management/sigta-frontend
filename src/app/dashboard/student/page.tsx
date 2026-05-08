"use client";

import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Calendar, CheckCircle, Clock, Plus, Star } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getRequests, getSessions, TutoringRequest, TutoringSession } from "@/lib/api";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [dateStr, setDateStr]       = useState("");
  const [tutorias, setTutorias]     = useState<TutoringRequest[]>([]);
  const [sinEvaluar, setSinEvaluar] = useState<TutoringSession[]>([]);

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
  }, []);

  const fetchTutorias = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { items } = await getRequests({ student_id: String(user.id), limit: 5 });
      setTutorias(items);
    } catch {
      // silencioso en dashboard
    }
  }, [user?.id]);

  const fetchSinEvaluar = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { items } = await getSessions({ student_id: String(user.id), estado: "realizada", limit: 50 });
      setSinEvaluar(items.filter((s) => s.retroalimentaciones.length === 0));
    } catch {
      // silencioso en dashboard
    }
  }, [user?.id]);

  useEffect(() => { fetchTutorias(); }, [fetchTutorias]);
  useEffect(() => { fetchSinEvaluar(); }, [fetchSinEvaluar]);

  const count = (status: string) => tutorias.filter((t) => t.status === status).length;

  const proximas = tutorias
    .filter((t) => t.status === "aceptada")
    .sort((a, b) => new Date(a.preferred_date).getTime() - new Date(b.preferred_date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Bienvenido/a, {user?.first_name}</h1>
          <p className="mt-1 text-gray-500 capitalize text-sm">{dateStr || "Cargando..."} · Estudiante</p>
        </div>
        <Link
          href="/dashboard/student/tutorias/nueva"
          className="flex items-center gap-2 px-4 py-2 rounded-[9px] bg-[#FFC100] text-[#0F2547] text-[13px] font-bold hover:bg-[#e6ad00] transition-colors flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          Solicitar tutoría
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-3">
        <StatCard title="Pendientes"  value={String(count("pendiente"))} icon={Clock}        iconWrapperClassName="bg-[#FFF3CC] text-[#B8860B]" />
        <StatCard title="Confirmadas" value={String(count("aceptada"))}  icon={Calendar}     iconWrapperClassName="bg-[#E8F0FE] text-[#1A5EB8]" />
        <StatCard title="Realizadas"  value={String(count("realizada"))} icon={CheckCircle}  iconWrapperClassName="bg-[#E6F4EA] text-[#1E7E34]" />
      </div>

      {sinEvaluar.length > 0 && (
        <Link href="/dashboard/student/sesiones" className="block">
          <div className="flex items-center gap-3 bg-[#FFFBF0] border border-[#FFC100]/50 rounded-[10px] p-4 hover:border-[#FFC100] transition-colors">
            <div className="h-9 w-9 rounded-[9px] bg-[#FFF3CC] text-[#B8860B] flex items-center justify-center flex-shrink-0">
              <Star className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-[#B8860B]">
                {sinEvaluar.length === 1 ? "Tienes 1 tutoría por evaluar" : `Tienes ${sinEvaluar.length} tutorías por evaluar`}
              </p>
              <p className="text-[12px] text-[#B8860B]/70">Tu retroalimentación ayuda a mejorar el programa.</p>
            </div>
            <span className="text-[12px] text-[#B8860B] font-semibold flex-shrink-0">Ir a evaluar →</span>
          </div>
        </Link>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-[#0F2547]">Próximas Tutorías</h2>
          <Link href="/dashboard/student/tutorias" className="text-[12px] text-[#1A5EB8] hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden">
          {proximas.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Calendar}
                title="No tienes tutorías confirmadas"
                description="Solicita una tutoría para que aparezca aquí cuando sea aceptada."
              />
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {proximas.map((t) => {
                const fecha = new Date(t.preferred_date).toLocaleDateString("es-CO", {
                  day: "2-digit", month: "short", year: "numeric",
                });
                return (
                  <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-[#0F2547]">{t.subject.name}</p>
                      <p className="text-[12px] text-gray-500">
                        {t.tutor?.full_name ?? "Tutor por asignar"} · {fecha}
                      </p>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                      Confirmada
                    </span>
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
