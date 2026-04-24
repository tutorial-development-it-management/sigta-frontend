"use client";

import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Inbox, CheckSquare, CalendarDays } from "lucide-react";

export default function TutorDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Hola, {user?.first_name}</h1>
        <p className="mt-2 text-gray-600">Docente Tutor • Facultad de Ingeniería</p>
      </div>

      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-3">
         <StatCard title="Solicitudes Pendientes" value="0" icon={Inbox} iconWrapperClassName="bg-[#FFF3CC] text-[#B8860B]" />
         <StatCard title="Tutorías Hoy" value="0" icon={CalendarDays} iconWrapperClassName="bg-[#E8F0FE] text-[#1A5EB8]" />
         <StatCard title="Sesiones este Mes" value="0" icon={CheckSquare} iconWrapperClassName="bg-[#E6F4EA] text-[#1E7E34]" />
      </div>

      <div>
        <h2 className="text-lg font-medium text-[#0F2547] mb-3">Solicitudes Recientes</h2>
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-6">
            <EmptyState 
              icon={Inbox} 
              title="No hay solicitudes pendientes" 
              description="No tienes solicitudes de tutoría en espera de aprobación por ahora."
            />
        </div>
      </div>
    </div>
  );
}
