import { LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/Button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50", className)}>
      <div className="mx-auto h-12 w-12 text-gray-400 bg-white shadow-sm rounded-full flex items-center justify-center mb-4">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-2 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
