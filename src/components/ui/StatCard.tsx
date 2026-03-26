import { LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/Button";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, className }: StatCardProps) {
  return (
    <div className={cn("bg-white overflow-hidden shadow rounded-xl p-5 border border-gray-100", className)}>
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-primary/10 rounded-md p-3">
          <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
