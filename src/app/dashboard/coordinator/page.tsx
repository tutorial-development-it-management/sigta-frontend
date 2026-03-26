import { EmptyState } from "@/components/ui/EmptyState";
import { PenTool } from "lucide-react";

export default function CoordinatorDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <EmptyState 
            icon={PenTool} 
            title="Panel de Coordinador" 
            description="Este módulo se encuentra en construcción para futuras entregas del sistema SIGTA."
        />
    </div>
  );
}
