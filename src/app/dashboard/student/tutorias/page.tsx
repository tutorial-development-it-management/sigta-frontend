"use client";

import { useAuth } from "@/context/AuthContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { BookOpen, Clock, CheckCircle, XCircle, Calendar, Search, Plus } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/components/ui/Button";
import Link from "next/link";
import { getRequests, cancelRequest, TutoringRequest, getErrorMessage } from "@/lib/api";

type TabKey = "todas" | "pendiente" | "aceptada" | "realizada" | "cancelada";

const TABS: { key: TabKey; label: string }[] = [
  { key: "todas",     label: "Todas" },
  { key: "pendiente", label: "Pendientes" },
  { key: "aceptada",  label: "Confirmadas" },
  { key: "realizada", label: "Realizadas" },
  { key: "cancelada", label: "Canceladas" },
];

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  aceptada:  "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

const STATUS_STYLE: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  aceptada:  "bg-blue-100 text-blue-800",
  realizada: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-700",
};

export default function MisTutoriasPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]     = useState<TabKey>("todas");
  const [search, setSearch]           = useState("");
  const [tutorias, setTutorias]       = useState<TutoringRequest[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [cancelling, setCancelling]   = useState<string | null>(null);

  const fetchTutorias = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { items } = await getRequests({ student_id: String(user.id) });
      setTutorias(items);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar las tutorías"));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchTutorias(); }, [fetchTutorias]);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await cancelRequest(id);
      await fetchTutorias();
    } catch (err) {
      alert(getErrorMessage(err, "No se pudo cancelar la solicitud"));
    } finally {
      setCancelling(null);
    }
  };

  const filtered = tutorias.filter((t) => {
    const matchTab    = activeTab === "todas" || t.status === activeTab;
    const matchSearch = search === "" ||
      t.subject.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tutor?.full_name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const count = (status: string) => tutorias.filter((t) => t.status === status).length;

  const tabIconMap: Record<TabKey, typeof BookOpen> = {
    todas:     BookOpen,
    pendiente: Clock,
    aceptada:  Calendar,
    realizada: CheckCircle,
    cancelada: XCircle,
  };

  const emptyMessages: Record<TabKey, { title: string; description: string }> = {
    todas:     { title: "No tienes tutorías registradas",   description: "Aún no has solicitado ninguna tutoría." },
    pendiente: { title: "Sin tutorías pendientes",          description: "No tienes solicitudes pendientes de aprobación." },
    aceptada:  { title: "Sin tutorías confirmadas",         description: "No tienes tutorías confirmadas próximas." },
    realizada: { title: "Sin tutorías realizadas",          description: "Aún no has completado ninguna tutoría." },
    cancelada: { title: "Sin tutorías canceladas",          description: "No tienes tutorías canceladas." },
  };

  const EmptyIcon = tabIconMap[activeTab];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Mis Tutorías</h1>
          <p className="mt-1 text-sm text-gray-500">Consulta y gestiona todas tus sesiones de tutoría académica.</p>
        </div>
        <Link
          href="/dashboard/student/tutorias/nueva"
          className="flex items-center gap-2 px-4 py-2 rounded-[9px] bg-[#FFC100] text-[#0F2547] text-[13px] font-bold hover:bg-[#e6ad00] transition-colors flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nueva solicitud
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-4">
        <StatCard title="Pendientes"  value={String(count("pendiente"))} icon={Clock}         iconWrapperClassName="bg-[#FFF3CC] text-[#B8860B]" />
        <StatCard title="Confirmadas" value={String(count("aceptada"))}  icon={Calendar}      iconWrapperClassName="bg-[#E8F0FE] text-[#1A5EB8]" />
        <StatCard title="Realizadas"  value={String(count("realizada"))} icon={CheckCircle}   iconWrapperClassName="bg-[#E6F4EA] text-[#1E7E34]" />
        <StatCard title="Canceladas"  value={String(count("cancelada"))} icon={XCircle}       iconWrapperClassName="bg-[#FEE2E2] text-[#B91C1C]" />
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden">
        <div className="px-4 pt-4 pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-3 py-1.5 rounded-[7px] text-[12px] font-medium whitespace-nowrap transition-colors",
                  activeTab === tab.key
                    ? "bg-[#0F2547] text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative flex-shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por materia o tutor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-[12px] border border-[#E5E7EB] rounded-[7px] focus:outline-none focus:ring-1 focus:ring-[#0F2547]/30 w-full sm:w-56"
            />
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <p className="text-sm text-center text-gray-400 py-8">Cargando tutorías...</p>
          ) : error ? (
            <p className="text-sm text-center text-red-500 py-8">{error}</p>
          ) : filtered.length === 0 ? (
            <EmptyState icon={EmptyIcon} title={emptyMessages[activeTab].title} description={emptyMessages[activeTab].description} />
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {filtered.map((t) => {
                const fecha = new Date(t.preferred_date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
                return (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0F2547] truncate">{t.subject.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {t.tutor ? t.tutor.full_name : "Sin tutor asignado"} · {fecha}
                        {t.topic && ` · ${t.topic}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn("text-xs px-2 py-1 rounded-full font-medium", STATUS_STYLE[t.status] ?? "bg-gray-100 text-gray-600")}>
                        {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                      {t.status === "pendiente" && (
                        <button
                          onClick={() => handleCancel(t.id)}
                          disabled={cancelling === t.id}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          {cancelling === t.id ? "Cancelando..." : "Cancelar"}
                        </button>
                      )}
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
