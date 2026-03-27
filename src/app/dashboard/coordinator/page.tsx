import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { PenTool, Users, Calendar, BarChart } from "lucide-react";

export default function CoordinatorDashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Panel de Coordinación</h1>
        <p className="mt-2 text-gray-600">Seguimiento general de tutorías y actividad académica.</p>
      </div>

      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-3">
        <StatCard title="Tutorías Activas" value="0" icon={Calendar} iconWrapperClassName="bg-[#FFF3CC] text-[#B8860B]" />
        <StatCard title="Tutores Vinculados" value="0" icon={Users} iconWrapperClassName="bg-[#E8F0FE] text-[#1A5EB8]" />
        <StatCard title="Reportes Pendientes" value="0" icon={BarChart} iconWrapperClassName="bg-[#F3E8FF] text-[#7C3AED]" />
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-6">
        <EmptyState 
          icon={PenTool} 
          title="Panel de Coordinador" 
          description="Este módulo se encuentra en construcción para futuras entregas del sistema SIGTA."
        />
      </div>
    </div>
  );
}
