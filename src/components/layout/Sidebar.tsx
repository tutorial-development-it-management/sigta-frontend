"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/components/ui/Button";
import {
  Home,
  Users,
  Calendar,
  Settings,
  FileText,
  BookOpen,
  ClipboardList,
  BarChart,
  LogOut,
  Menu,
  X,
  Layers
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

type MenuItem = {
  name: string;
  href: string;
  icon: any;
  current: boolean;
  disabled?: boolean;
};

export function Sidebar({ className }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  if (!user) return null;

  const role = user.role_name;

  let navigation: MenuItem[] = [];

  switch (role) {
    case "admin":
      navigation = [
        { name: "Dashboard", href: "/dashboard/admin", icon: Home, current: pathname === "/dashboard/admin" },
        { name: "Usuarios", href: "/dashboard/admin/users", icon: Users, current: pathname === "/dashboard/admin/users" },
        // Future
        { name: "Reportes", href: "#", icon: BarChart, current: false, disabled: true },
        { name: "Configuración", href: "#", icon: Settings, current: false, disabled: true },
      ];
      break;
    case "student":
      navigation = [
        { name: "Inicio", href: "/dashboard/student", icon: Home, current: pathname === "/dashboard/student" },
        { name: "Mis Tutorías", href: "/dashboard/student/tutorias", icon: BookOpen, current: pathname === "/dashboard/student/tutorias" },
        // Future
        { name: "Calendario", href: "#", icon: Calendar, current: false, disabled: true },
        { name: "Mi Perfil", href: "#", icon: Users, current: false, disabled: true },
      ];
      break;
    case "tutor":
      navigation = [
        { name: "Inicio", href: "/dashboard/tutor", icon: Home, current: pathname === "/dashboard/tutor" },
        // Future
        { name: "Solicitudes", href: "#", icon: ClipboardList, current: false, disabled: true },
        { name: "Disponibilidad", href: "#", icon: Calendar, current: false, disabled: true },
        { name: "Bitácora", href: "#", icon: FileText, current: false, disabled: true },
        { name: "Mi Perfil", href: "#", icon: Users, current: false, disabled: true },
      ];
      break;
    case "coordinator":
        navigation = [
            { name: "Inicio", href: "/dashboard/coordinator", icon: Home, current: pathname === "/dashboard/coordinator" },
            { name: "Tutorías", href: "#", icon: Calendar, current: false, disabled: true },
            { name: "Reportes", href: "#", icon: BarChart, current: false, disabled: true },
            { name: "Configuración", href: "#", icon: Settings, current: false, disabled: true },
        ];
        break;
  }

  const mainItems = navigation.filter((item) => !item.disabled);
  const upcomingItems = navigation.filter((item) => item.disabled);
  const initials = `${user.first_name?.[0] || "U"}${user.last_name?.[0] || "S"}`.toUpperCase();
  const roleLabel = user.role_name === "admin"
    ? "Administrador"
    : user.role_name === "tutor"
      ? "Docente Tutor"
      : user.role_name === "student"
        ? "Estudiante"
        : "Coordinador";

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden p-4 bg-[#1a1a22] text-white flex items-center justify-between border-b border-white/10">
        <div className="flex items-center space-x-2">
            <div className="h-[30px] w-[30px] rounded-[7px] bg-[#FFC100] flex items-center justify-center">
              <Layers className="h-4 w-4 text-[#0F2547]" />
            </div>
            <div>
              <span className="text-[14px] font-bold leading-none block">SIGTA</span>
              <span className="text-[10px] text-white/35">UPTC</span>
            </div>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md hover:bg-white/10">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        className={cn(
          "bg-[#1a1a22] border-r border-white/10 h-screen transition-all duration-300 flex flex-col fixed lg:relative z-20",
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0 lg:w-20",
          className
        )}
      >
        <div className="h-16 flex items-center justify-center border-b border-white/10 bg-[#1a1a22]">
          <div className="flex items-center space-x-2 text-white">
            <div className={cn("h-[30px] w-[30px] rounded-[7px] bg-[#FFC100] flex items-center justify-center", !isOpen && "lg:mx-auto")}>
              <Layers className="h-4 w-4 text-[#0F2547]" />
            </div>
            <div className={cn(!isOpen && "lg:hidden")}>
              <span className="text-[14px] font-bold leading-none block">SIGTA</span>
              <span className="text-[10px] text-white/35">UPTC</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <p className={cn("px-2 my-[10px] mb-1 text-[10px] font-semibold tracking-[0.8px] uppercase text-white/25", !isOpen && "lg:hidden")}>Principal</p>
          {mainItems.map((item) => (
            <div key={item.name} className="relative">
                <Link
                href={item.href}
                className={cn(
                    "flex items-center px-3 py-2.5 rounded-[7px] text-sm transition-colors mb-1",
                    item.current
                    ? "bg-[#FFC100] text-[#0F2547] font-semibold"
                    : "text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                )}
                >
                <item.icon
                    className={cn(
                    "flex-shrink-0 h-5 w-5",
                    item.current ? "text-[#0F2547]" : "text-white/50",
                    !isOpen && "lg:mx-auto"
                    )}
                />
                <span className={cn("ml-3 truncate", !isOpen && "lg:hidden")}>{item.name}</span>
                </Link>
            </div>
          ))}

          {upcomingItems.length > 0 && (
            <>
              <p className={cn("px-2 my-[10px] mb-1 text-[10px] font-semibold tracking-[0.8px] uppercase text-white/25", !isOpen && "lg:hidden")}>Próximamente</p>
              {upcomingItems.map((item) => (
                <div key={item.name} className="relative">
                  <Link
                    href="#"
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-[7px] text-sm transition-colors mb-1 opacity-30 cursor-not-allowed pointer-events-none text-white/50",
                      !isOpen && "lg:justify-center"
                    )}
                    onClick={(e) => e.preventDefault()}
                  >
                    <item.icon className={cn("flex-shrink-0 h-5 w-5 text-white/50", !isOpen && "lg:mx-auto")} />
                    <span className={cn("ml-3 truncate", !isOpen && "lg:hidden")}>{item.name}</span>
                    <span className={cn("ml-auto rounded-[10px] bg-white/[0.07] px-[6px] py-[2px] text-[9px] font-semibold text-white/25", !isOpen && "lg:hidden")}>
                      Pronto
                    </span>
                  </Link>
                </div>
              ))}
            </>
          )}
        </div>
        
        {/* Collapse button for Desktop */}
        <div className="hidden lg:flex p-4 border-t border-white/10 justify-end">
             <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 rounded-md text-white/50 hover:bg-white/10 hover:text-white/80">
                {isOpen ? <Menu size={20} className="rotate-180" /> : <Menu size={20} />}
             </button>
        </div>

        <div className="p-4 border-t border-[rgba(255,255,255,0.07)] bg-[#1a1a22]">
          <div className={cn("mb-3 flex items-center gap-2", !isOpen && "lg:justify-center")}> 
            <div className="h-7 w-7 rounded-[7px] bg-[#FFC100] text-[#0F2547] text-[11px] font-bold flex items-center justify-center">
              {initials}
            </div>
            <div className={cn(!isOpen && "lg:hidden")}>
              <p className="text-[12px] font-semibold text-white/80 leading-none">{user.first_name} {user.last_name}</p>
              <p className="mt-1 text-[10px] text-white/30">{roleLabel}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className={cn("flex items-center w-full px-2 py-2 text-sm font-medium text-[rgba(239,68,68,0.6)] rounded-[7px] hover:bg-[rgba(239,68,68,0.1)] transition-colors", !isOpen && "justify-center")}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className={cn("ml-3", !isOpen && "lg:hidden")}>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}
