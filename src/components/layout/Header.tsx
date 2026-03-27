"use client";

import { useAuth } from "@/context/AuthContext";
import { Bell } from "lucide-react";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <header className="bg-white h-[52px] flex items-center justify-between px-5 z-10 sticky top-0 border-b border-[#E5E7EB]/90">
        <h1 className="text-[15px] font-bold text-[#0F2547] font-heading truncate">
            {title || "Dashboard"}
        </h1>
        
        <div className="flex items-center">
            <button className="relative flex h-8 w-8 items-center justify-center rounded-[7px] border border-[#E5E7EB] bg-transparent text-gray-500 hover:bg-gray-50">
                <Bell className="h-4 w-4" />
                <span className="absolute top-[7px] right-[8px] block h-[5px] w-[5px] rounded-full bg-[#E5383B]" />
            </button>
        </div>
    </header>
  );
}
