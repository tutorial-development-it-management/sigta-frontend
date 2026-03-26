"use client";

import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Inbox, CheckSquare, CalendarDays } from "lucide-react";

export default function TutorDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading text-gray-900">Hola, {user?.first_name}</h1>
        <p className="mt-2 text-gray-600">Docente Tutor • Departamento de Ingeniería</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
         <StatCard title="Solicitudes Pendientes" value="0" icon={Inbox} className="border-l-4 border-yellow-400" />
         <StatCard title="Tutorías Hoy" value="0" icon={CalendarDays} className="border-l-4 border-blue-400" />
         <StatCard title="Sesiones este Mes" value="0" icon={CheckSquare} className="border-l-4 border-green-400" />
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Solicitudes Recientes</h2>
        <div className="bg-white shadow rounded-lg p-6">
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
