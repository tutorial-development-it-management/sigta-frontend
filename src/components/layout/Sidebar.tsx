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
  Shield,
  FileText,
  BookOpen,
  ClipboardList,
  BarChart,
  LogOut,
  Menu,
  X,
  GraduationCap
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
        { name: "Roles", href: "/dashboard/admin/roles", icon: Shield, current: pathname === "/dashboard/admin/roles" },
        // Future
        { name: "Reportes", href: "#", icon: BarChart, current: false, disabled: true },
        { name: "Configuración", href: "#", icon: Settings, current: false, disabled: true },
      ];
      break;
    case "student":
      navigation = [
        { name: "Inicio", href: "/dashboard/student", icon: Home, current: pathname === "/dashboard/student" },
        // Future
        { name: "Mis Tutorías", href: "#", icon: BookOpen, current: false, disabled: true },
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
        ];
        break;
  }

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden p-4 bg-primary text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6" />
            <span className="font-bold">SIGTA</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md hover:bg-white/10">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        className={cn(
          "bg-white border-r border-gray-200 h-screen transition-all duration-300 flex flex-col fixed lg:relative z-20",
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0 lg:w-20",
          className
        )}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100 bg-primary">
          <div className="flex items-center space-x-2 text-white">
            <GraduationCap className={cn("h-8 w-8", !isOpen && "lg:mx-auto")} />
            <span className={cn("text-xl font-heading font-bold", !isOpen && "lg:hidden")}>SIGTA</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navigation.map((item) => (
            <div key={item.name} className="relative group">
                <Link
                href={item.disabled ? "#" : item.href}
                className={cn(
                    "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1",
                    item.current
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                )}
                onClick={(e) => item.disabled && e.preventDefault()}
                >
                <item.icon
                    className={cn(
                    "flex-shrink-0 h-5 w-5",
                    item.current ? "text-primary" : "text-gray-400 group-hover:text-gray-500",
                    !isOpen && "lg:mx-auto"
                    )}
                />
                <span className={cn("ml-3 truncate", !isOpen && "lg:hidden")}>{item.name}</span>
                </Link>
                {item.disabled && (
                    <div className={cn("absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none", !isOpen && "lg:block hidden")}>
                        Próximamente
                    </div>
                )}
            </div>
          ))}
        </div>
        
        {/* Collapse button for Desktop */}
        <div className="hidden lg:flex p-4 border-t border-gray-100 justify-end">
             <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100">
                {isOpen ? <Menu size={20} className="rotate-180" /> : <Menu size={20} />}
             </button>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
           <button
             onClick={logout}
             className={cn("flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors", !isOpen && "justify-center")}
           >
             <LogOut className="h-5 w-5 flex-shrink-0" />
             <span className={cn("ml-3", !isOpen && "lg:hidden")}>Cerrar Sesión</span>
           </button>
        </div>
      </div>
    </>
  );
}
