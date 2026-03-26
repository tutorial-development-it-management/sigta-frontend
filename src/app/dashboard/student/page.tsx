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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading text-gray-900">Bienvenido/a, {user?.first_name}</h1>
        <p className="mt-2 text-gray-600 capitalize">{dateStr || "Cargando fecha..."} • Estudiante</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
         <StatCard title="Tutorías Pendientes" value="0" icon={Clock} className="border-l-4 border-yellow-400" />
         <StatCard title="Tutorías Confirmadas" value="0" icon={Calendar} className="border-l-4 border-blue-400" />
         <StatCard title="Tutorías Realizadas" value="0" icon={CheckCircle} className="border-l-4 border-green-400" />
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Próximas Tutorías</h2>
        <div className="bg-white shadow rounded-lg p-6">
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
