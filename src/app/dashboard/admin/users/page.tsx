"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserById, getUsers, User } from "@/lib/api";
import { Users, Mail, Shield, CheckCircle2, XCircle } from "lucide-react";

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setLoadingUsers(false);
        return;
      }

      setLoadingUsers(true);
      setUsersError(null);

      try {
        const response = await getUsers(token, 50, 0);
        setUsers(response.items);
      } catch (err: any) {
        setUsersError(err.message || "Error al cargar usuarios");
      } finally {
        setLoadingUsers(false);
      }
    };

    load();
  }, [token]);

  const handleSelectUser = async (user: User) => {
    if (!token) return;

    setSelectedUser(user);
    setLoadingDetail(true);

    try {
      const detail = await getUserById(token, user.id);
      setSelectedUser(detail);
    } catch {
      // Keep basic list data visible if detail request fails.
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading">Usuarios</h1>
          <p className="text-sm text-gray-500">Selecciona un usuario para ver su información completa.</p>
        </div>
      </div>

      {usersError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
          {usersError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Listado</h2>
          </div>

          <div className="max-h-[520px] overflow-y-auto">
            {loadingUsers ? (
              <div className="p-4 text-sm text-gray-500">Cargando usuarios...</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No hay usuarios disponibles.</div>
            ) : (
              users.map((user) => {
                const isActive = selectedUser?.id === user.id;
                return (
                  <button
                    key={String(user.id)}
                    onClick={() => handleSelectUser(user)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="font-medium">{user.first_name} {user.last_name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          {!selectedUser ? (
            <div className="h-full min-h-[320px] flex items-center justify-center text-gray-500 text-sm">
              Haz clic sobre un usuario para ver sus datos.
            </div>
          ) : loadingDetail ? (
            <div className="h-full min-h-[320px] flex items-center justify-center text-gray-500 text-sm">
              Cargando detalle...
            </div>
          ) : (
            <div className="space-y-5">
              <div className="pb-4 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedUser.first_name} {selectedUser.last_name}
                </h3>
                <p className="text-sm text-gray-500">Información completa del usuario seleccionado</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-md border border-gray-200 p-4">
                  <p className="text-xs uppercase text-gray-500 mb-1">ID</p>
                  <p className="text-sm text-gray-900 break-all">{String(selectedUser.id)}</p>
                </div>

                <div className="rounded-md border border-gray-200 p-4">
                  <p className="text-xs uppercase text-gray-500 mb-1">Email</p>
                  <p className="text-sm text-gray-900 flex items-center gap-2 break-all">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {selectedUser.email}
                  </p>
                </div>

                <div className="rounded-md border border-gray-200 p-4">
                  <p className="text-xs uppercase text-gray-500 mb-1">Rol</p>
                  <p className="text-sm text-gray-900 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    {selectedUser.role_name}
                  </p>
                </div>

                <div className="rounded-md border border-gray-200 p-4">
                  <p className="text-xs uppercase text-gray-500 mb-1">Estado</p>
                  <p className="text-sm text-gray-900 flex items-center gap-2">
                    {selectedUser.is_active ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        Inactivo
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
