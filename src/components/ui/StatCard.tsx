import { LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/Button";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  iconWrapperClassName?: string;
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  className,
  iconWrapperClassName,
  iconClassName,
}: StatCardProps) {
  return (
    <div className={cn("bg-white rounded-[10px] border border-[#E5E7EB]/90 p-[14px]", className)}>
      <div className="flex items-center gap-3">
        <div className={cn("h-9 w-9 flex-shrink-0 rounded-[9px] bg-[#FFF3CC] text-[#B8860B] flex items-center justify-center", iconWrapperClassName)}>
          <Icon className={cn("h-5 w-5", iconClassName)} aria-hidden="true" />
        </div>
        <div className="w-0 flex-1">
          <dl>
            <dt className="text-[11px] font-medium text-[#6B7280] truncate mt-[1px]">{title}</dt>
            <dd>
              <div className="text-[20px] font-bold text-[#0F2547] leading-none">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
