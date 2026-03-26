"use client";

import { useAuth } from "@/context/AuthContext";
import { Bell, Search } from "lucide-react";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
  
  if (!user) return null;

  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 sticky top-0">
        <h1 className="text-xl font-bold text-gray-900 font-heading truncate">
            {title || "Dashboard"}
        </h1>
        
        <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <Bell className="h-6 w-6" />
                <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                        {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                        {user.role_name === 'admin' ? 'Administrador' : user.role_name === 'tutor' ? 'Docente Tutor' : user.role_name}
                    </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg cursor-pointer hover:bg-primary/90 transition">
                    {initials}
                </div>
                {/* Logout logic is in sidebar but good to have dropdown here too */}
            </div>
        </div>
    </header>
  );
}
