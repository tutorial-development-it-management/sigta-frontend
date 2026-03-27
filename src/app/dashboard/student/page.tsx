"use client";

import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Calendar, CheckCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString("es-ES", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Bienvenido/a, {user?.first_name}</h1>
        <p className="mt-2 text-gray-600 capitalize">{dateStr || "Cargando fecha..."} • Estudiante</p>
      </div>

      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-3">
         <StatCard title="Tutorías Pendientes" value="0" icon={Clock} iconWrapperClassName="bg-[#FFF3CC] text-[#B8860B]" />
         <StatCard title="Tutorías Confirmadas" value="0" icon={Calendar} iconWrapperClassName="bg-[#E8F0FE] text-[#1A5EB8]" />
         <StatCard title="Tutorías Realizadas" value="0" icon={CheckCircle} iconWrapperClassName="bg-[#E6F4EA] text-[#1E7E34]" />
      </div>

      <div>
        <h2 className="text-lg font-medium text-[#0F2547] mb-3">Próximas Tutorías</h2>
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-6">
            <EmptyState 
              icon={Calendar} 
              title="No tienes tutorías programadas" 
              description="Aún no tienes tutorías en tu agenda. ¡Solicita una cuando el módulo esté disponible!"
            />
        </div>
      </div>
    </div>
  );
}
