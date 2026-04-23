"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Shield,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getUsers, register, RoleName, updateUserRole, User } from "@/lib/api";

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | RoleName>("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<RoleName>("student");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Register Form State
  const [regData, setRegData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role_name: "student" as RoleName,
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await getUsers();
      setUsers(response.items);
    } catch (err: any) {
      setUsersError(err.message || "Error al cargar usuarios");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const matchesSearch =
        !query || user.email.toLowerCase().includes(query) || fullName.includes(query);
      const matchesRole = roleFilter === "all" || user.role_name === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      students: users.filter((u) => u.role_name === "student").length,
      tutors: users.filter((u) => u.role_name === "tutor").length,
      coordinators: users.filter((u) => u.role_name === "coordinator").length,
    };
  }, [users]);

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role_name);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;

    setEditLoading(true);
    setEditError(null);
    try {
      await updateUserRole(selectedUser.id, editRole);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                role_name: editRole,
              }
            : u
        )
      );
      setIsEditModalOpen(false);
      setSelectedUser(null);
      alert("Rol actualizado correctamente");
    } catch (err: any) {
      setEditError(err.message || "Error al actualizar rol");
    } finally {
      setEditLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegLoading(true);
    setRegError(null);
    try {
      await register(regData);
      setIsRegisterModalOpen(false);
      alert("Usuario registrado exitosamente");
      setRegData({ email: "", password: "", first_name: "", last_name: "", role_name: "student" });
      await loadUsers();
    } catch (err: any) {
      setRegError(err.message || "Error al registrar");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2547] font-heading">Dashboard Administrativo</h1>
          <p className="text-sm text-gray-500">Gestión de usuarios y roles del sistema.</p>
        </div>
        <Button onClick={() => setIsRegisterModalOpen(true)} className="bg-[#FFC100] text-[#0F2547] border-none rounded-[8px] px-[14px] py-2 text-[12px] font-bold hover:bg-[#e6ad00]">
          <UserPlus className="mr-1.5 h-[13px] w-[13px]" />
          Registrar Usuario
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[10px] mb-[14px]">
        <StatCard title="Total Usuarios" value={String(stats.total)} icon={Users} iconWrapperClassName="bg-[#FFF3CC] text-[#B8860B]" />
        <StatCard title="Estudiantes" value={String(stats.students)} icon={GraduationCap} iconWrapperClassName="bg-[#E8F0FE] text-[#1A5EB8]" />
        <StatCard title="Docentes" value={String(stats.tutors)} icon={BookOpen} iconWrapperClassName="bg-[#E6F4EA] text-[#1E7E34]" />
        <StatCard title="Coordinadores" value={String(stats.coordinators)} icon={Shield} iconWrapperClassName="bg-[#F3E8FF] text-[#7C3AED]" />
      </div>

      {usersError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{usersError}</div>}

      {/* Filters & Search */}
      <div className="bg-white p-3 rounded-[10px] border border-[#E5E7EB] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            className="block w-full pl-[30px] pr-[10px] py-[7px] border border-[#E5E7EB] rounded-[7px] bg-[#F8FAFC] text-[12px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#FFC100]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            className="block w-full pl-[10px] pr-[26px] py-[7px] border border-[#E5E7EB] rounded-[7px] text-[12px] bg-[#F8FAFC] appearance-none focus:outline-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236B7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
              backgroundSize: "12px 12px",
            }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "all" | RoleName)}
          >
            <option value="all">Todos los roles</option>
            <option value="student">Estudiante</option>
            <option value="tutor">Docente Tutor</option>
            <option value="coordinator">Coordinador</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white overflow-hidden rounded-[10px] border border-[#E5E7EB]">
        <table className="min-w-full">
          <thead className="bg-[#FAFBFC]">
            <tr>
              <th scope="col" className="px-4 py-2 text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.5px] border-b border-[#E5E7EB]">
                Nombre
              </th>
              <th scope="col" className="px-4 py-2 text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.5px] border-b border-[#E5E7EB]">
                Rol
              </th>
              <th scope="col" className="px-4 py-2 text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.5px] border-b border-[#E5E7EB]">
                Estado
              </th>
              <th scope="col" className="relative px-4 py-2 border-b border-[#E5E7EB]">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-[#FAFBFC] border-b border-[#E5E7EB]">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`h-[30px] w-[30px] rounded-[7px] flex items-center justify-center text-[11px] font-bold ${
                      user.role_name === "tutor"
                        ? "bg-[#FFF3CC] text-[#B8860B]"
                        : user.role_name === "student"
                          ? "bg-[#E8F0FE] text-[#1A5EB8]"
                          : user.role_name === "coordinator"
                            ? "bg-[#F3E8FF] text-[#7C3AED]"
                            : "bg-[#FFF0E6] text-[#C05621]"
                    }`}>
                        {user.first_name?.charAt(0) || "U"}
                    </div>
                    <div className="ml-4">
                      <div className="text-[13px] font-semibold text-[#0F2547]">{user.first_name} {user.last_name}</div>
                      <div className="text-[11px] text-[#6B7280]">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex px-[8px] py-[3px] rounded-[20px] text-[11px] font-semibold ${
                    user.role_name === "tutor"
                      ? "bg-[#E8F5E9] text-[#1B5E20]"
                      : user.role_name === "student"
                        ? "bg-[#E8F0FE] text-[#0D47A1]"
                        : user.role_name === "coordinator"
                          ? "bg-[#F3E8FF] text-[#4A148C]"
                          : "bg-[#FFF3CC] text-[#7B4F00]"
                  }`}>
                    {user.role_name === 'student' ? 'Estudiante' : user.role_name === 'tutor' ? 'Docente' : user.role_name === 'coordinator' ? 'Coordinador' : 'Admin'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${user.is_active ? 'text-[#1E7E34]' : 'text-red-600'}`}>
                    <span className={`h-[5px] w-[5px] rounded-full ${user.is_active ? 'bg-[#1E7E34]' : 'bg-red-500'}`} />
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => openEditModal(user)}
                    className="h-[26px] w-[26px] inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-transparent text-[#6B7280] hover:bg-[#FFF3CC] hover:border-[#FFC100] hover:text-[#B8860B]"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!usersLoading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                  No hay usuarios para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal Placeholder */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="edit-modal" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsEditModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Editar Rol de Usuario</h3>
                <div className="mt-2 text-sm text-gray-500">
                  {selectedUser?.first_name} {selectedUser?.last_name} ({selectedUser?.email})
                </div>
                {editError && <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">{editError}</div>}
                <div className="mt-4 space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Nuevo Rol</label>
                    <select
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as RoleName)}
                    >
                        <option value="student">Estudiante</option>
                        <option value="tutor">Docente Tutor</option>
                        <option value="coordinator">Coordinador Académico</option>
                        <option value="admin">Administrador TI</option>
                    </select>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button onClick={handleSaveRole} disabled={editLoading} isLoading={editLoading}>
                  {editLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="mr-3" disabled={editLoading}>Cancelar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
       {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="register-modal" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsRegisterModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
               <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="register-modal">Registrar Nuevo Usuario</h3>
                
                {regError && <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">{regError}</div>}

                <div className="mt-4 space-y-4">
                   <Input 
                        label="Correo electrónico" 
                        placeholder="usuario@uptc.edu.co"
                        value={regData.email}
                        onChange={(e) => setRegData({...regData, email: e.target.value})}
                   />
                   <Input 
                        label="Contraseña" 
                        type="password"
                        value={regData.password}
                        onChange={(e) => setRegData({...regData, password: e.target.value})}
                   />
                   <div className="grid grid-cols-2 gap-4">
                       <Input 
                            label="Nombres"
                            value={regData.first_name}
                            onChange={(e) => setRegData({...regData, first_name: e.target.value})}
                       />
                       <Input 
                            label="Apellidos"
                            value={regData.last_name}
                            onChange={(e) => setRegData({...regData, last_name: e.target.value})}
                       />
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-gray-700">Rol Inicial</label>
                       <select 
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                            value={regData.role_name}
                            onChange={(e) => setRegData({...regData, role_name: e.target.value as RoleName})}
                       >
                           <option value="student">Estudiante</option>
                           <option value="tutor">Docente Tutor</option>
                           <option value="coordinator">Coordinador</option>
                           <option value="admin">Administrador</option>
                       </select>
                   </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button onClick={handleRegister} disabled={regLoading} isLoading={regLoading}>
                    {regLoading ? "Registrando..." : "Registrar"}
                </Button>
                <Button variant="outline" onClick={() => setIsRegisterModalOpen(false)} className="mr-3">Cancelar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
