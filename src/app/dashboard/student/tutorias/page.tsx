"use client";

import { useAuth } from "@/context/AuthContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { BookOpen, Clock, CheckCircle, XCircle, Calendar, Filter, Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/components/ui/Button";

type TabKey = "todas" | "pendientes" | "confirmadas" | "realizadas" | "canceladas";

const TABS: { key: TabKey; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "pendientes", label: "Pendientes" },
  { key: "confirmadas", label: "Confirmadas" },
  { key: "realizadas", label: "Realizadas" },
  { key: "canceladas", label: "Canceladas" },
];

export default function MisTutoriasPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("todas");
  const [search, setSearch] = useState("");

  // Placeholder: en producción vendrían del backend
  const tutorias: any[] = [];

  const filtered = tutorias.filter((t) => {
    const matchTab = activeTab === "todas" || t.estado === activeTab;
    const matchSearch =
      search === "" ||
      t.materia?.toLowerCase().includes(search.toLowerCase()) ||
      t.tutor?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const emptyMessages: Record<TabKey, { title: string; description: string }> = {
    todas: {
      title: "No tienes tutorías registradas",
      description: "Aún no has solicitado ninguna tutoría. El módulo de solicitud estará disponible próximamente.",
    },
    pendientes: {
      title: "Sin tutorías pendientes",
      description: "No tienes solicitudes pendientes de aprobación en este momento.",
    },
    confirmadas: {
      title: "Sin tutorías confirmadas",
      description: "No tienes tutorías confirmadas próximas.",
    },
    realizadas: {
      title: "Sin tutorías realizadas",
      description: "Aún no has completado ninguna tutoría.",
    },
    canceladas: {
      title: "Sin tutorías canceladas",
      description: "No tienes tutorías canceladas.",
    },
  };

  const tabIconMap: Record<TabKey, typeof BookOpen> = {
    todas: BookOpen,
    pendientes: Clock,
    confirmadas: Calendar,
    realizadas: CheckCircle,
    canceladas: XCircle,
  };

  const EmptyIcon = tabIconMap[activeTab];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Mis Tutorías</h1>
        <p className="mt-1 text-sm text-gray-500">
          Consulta y gestiona todas tus sesiones de tutoría académica.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-4">
        <StatCard
          title="Pendientes"
          value="0"
          icon={Clock}
          iconWrapperClassName="bg-[#FFF3CC] text-[#B8860B]"
        />
        <StatCard
          title="Confirmadas"
          value="0"
          icon={Calendar}
          iconWrapperClassName="bg-[#E8F0FE] text-[#1A5EB8]"
        />
        <StatCard
          title="Realizadas"
          value="0"
          icon={CheckCircle}
          iconWrapperClassName="bg-[#E6F4EA] text-[#1E7E34]"
        />
        <StatCard
          title="Canceladas"
          value="0"
          icon={XCircle}
          iconWrapperClassName="bg-[#FEE2E2] text-[#B91C1C]"
        />
      </div>

      {/* Table Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 pt-4 pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Tabs */}
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

          {/* Search */}
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
          {filtered.length === 0 ? (
            <EmptyState
              icon={EmptyIcon}
              title={emptyMessages[activeTab].title}
              description={emptyMessages[activeTab].description}
            />
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {filtered.map((t, i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#0F2547]">{t.materia}</p>
                    <p className="text-xs text-gray-500">{t.tutor} · {t.fecha}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{t.estado}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}