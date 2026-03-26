# SIGTA - Sistema de Gestión de Tutorías Académicas

Este repositorio contiene el frontend de la plataforma SIGTA (Sistema de Gestión de Tutorías Académicas) de la Universidad Pedagógica y Tecnológica de Colombia (UPTC).

## Descripción

SIGTA es una aplicación web desarrollada para gestionar y facilitar el proceso de tutorías académicas entre estudiantes, docentes tutores y coordinadores. La interfaz sigue los lineamientos de identidad visual institucional de la UPTC (Amarillo Oro, Negro y Blanco).

## Tecnologías

El proyecto está construido utilizando las siguientes tecnologías principales:

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Iconos**: [Lucide React](https://lucide.dev/)
- **Estado Global**: React Context API & Cookies (para persistencia de sesión)

## Requisitos Previos

Asegúrate de tener instalado lo siguiente:

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [npm](https://www.npmjs.com/) (generalmente incluido con Node.js)
- Un backend compatible corriendo en el puerto `3000`.

## Instalación y Ejecución

1.  **Instalar dependencias:**

    ```bash
    npm install
    # o
    npm i
    ```

2.  **Configuración del Backend:**
    
    El frontend está configurado para ejecutarse en el puerto **3050** y redirigir las peticiones de API al backend en el puerto **3000** mediante un proxy en `next.config.mjs`.

    Asegúrate de que tu servidor backend esté corriendo en: `http://localhost:3000`

    *Nota: Las peticiones a `/api/*` serán redirigidas automáticamente.*

3.  **Iniciar el servidor de desarrollo:**

    ```bash
    npm run dev
    ```

    La aplicación estará disponible en: [http://localhost:3050](http://localhost:3050)

## Estructura del Proyecto

```
src/
├── app/                  # Rutas y páginas de la aplicación (App Router)
│   ├── dashboard/        # Vistas protegidas por rol
│   │   ├── admin/        # Panel de Administrador
│   │   ├── student/      # Panel de Estudiante
│   │   ├── tutor/        # Panel de Tutor
│   │   └── coordinator/  # Panel de Coordinador
│   └── login/            # Página de inicio de sesión
├── components/           # Componentes reutilizables
│   ├── layout/           # Sidebar, Header, etc.
│   └── ui/               # Botones, Cards, Inputs, etc.
├── context/              # Estados globales (AuthContext)
├── lib/                  # Utilidades y funciones API (api.ts)
└── middleware.ts         # Middleware para protección de rutas y redirección por rol
```

## Roles y Accesos

El sistema maneja 4 roles principales, normalizando los nombres recibidos del backend (español) a rutas internas (inglés):

| Rol Backend  | Rol Frontend (Ruta) | Funcionalidades Principales |
| :--- | :--- | :--- |
| `estudiante` | `student` | Ver tutorías, solicitar sesiones, ver historial. |
| `docente`/`tutor` | `tutor` | Gestionar horarios, aceptar solicitudes, reportes. |
| `coordinador` | `coordinator` | Supervisar tutorías, gestionar docentes y estudiantes. |
| `admin` | `admin` | Gestión total de usuarios, roles y configuración del sistema. |


