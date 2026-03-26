"use client";

import { useState } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit2, 
  Shield,
  GraduationCap,
  BookOpen
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { register, RoleName } from "@/lib/api";

// Mock data for structure
const users = [
  { id: 1, name: "Juan Pérez", email: "juan.perez@uptc.edu.co", role: "student", status: "Activo" },
  { id: 2, name: "Maria Garcia", email: "maria.garcia@uptc.edu.co", role: "tutor", status: "Activo" },
  { id: 3, name: "Carlos Lopez", email: "carlos.lopez@uptc.edu.co", role: "coordinator", status: "Inactivo" },
];

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Register Form State
  const [regData, setRegData] = useState({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role_name: "student" as RoleName
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const handleRegister = async () => {
    setRegLoading(true);
    setRegError(null);
    try {
        await register(regData);
        setIsRegisterModalOpen(false);
        // Typically refresh list here
        alert("Usuario registrado exitosamente");
        setRegData({ email: "", password: "", first_name: "", last_name: "", role_name: "student" });
    } catch (err: any) {
        setRegError(err.message || "Error al registrar");
    } finally {
        setRegLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading">Dashboard Administrativo</h1>
          <p className="text-sm text-gray-500">Gestión de usuarios y roles del sistema.</p>
        </div>
        <Button onClick={() => setIsRegisterModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Registrar Usuario
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Usuarios" value="3" icon={Users} className="border-l-4 border-l-primary" />
        <StatCard title="Estudiantes" value="1" icon={GraduationCap} className="border-l-4 border-l-blue-500" />
        <StatCard title="Docentes" value="1" icon={BookOpen} className="border-l-4 border-l-green-500" />
        <StatCard title="Coordinadores" value="1" icon={Shield} className="border-l-4 border-l-purple-500" />
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Todos los roles</option>
            <option value="student">Estudiante</option>
            <option value="tutor">Docente Tutor</option>
            <option value="coordinator">Coordinador</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                      user.role === 'student' ? 'bg-blue-100 text-blue-800' : 
                      user.role === 'tutor' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {user.role === 'student' ? 'Estudiante' : user.role === 'tutor' ? 'Docente' : user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${user.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => { setSelectedUser(user); setIsEditModalOpen(true); }}
                    className="text-primary hover:text-primary/70 mr-4"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
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
                  {selectedUser?.name} ({selectedUser?.email})
                </div>
                <div className="mt-4 space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Nuevo Rol</label>
                    <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                        <option value="student">Estudiante</option>
                        <option value="tutor">Docente Tutor</option>
                        <option value="coordinator">Coordinador Académico</option>
                        <option value="admin">Administrador TI</option>
                    </select>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button onClick={() => setIsEditModalOpen(false)}>Guardar Cambios</Button>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="mr-3">Cancelar</Button>
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
