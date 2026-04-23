"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { RoleName } from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user || !role) {
      router.replace("/login");
      return;
    }

    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      router.replace(`/dashboard/${role}`);
      return;
    }

    const requestedRole = pathname.split("/")[2] as RoleName | undefined;
    const rolePaths: RoleName[] = ["admin", "coordinator", "student", "tutor"];

    if (requestedRole && rolePaths.includes(requestedRole) && requestedRole !== role) {
      router.replace(`/dashboard/${role}`);
    }
  }, [user, role, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#F4F5F7] overflow-hidden">
      {/* Sidebar */}
      <Sidebar className="flex flex-col" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 bg-[#F4F5F7]">
            {children}
        </main>
      </div>
    </div>
  );
}
