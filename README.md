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
- **Autenticación**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Estado Global**: React Context API (sesión sincronizada con Firebase + backend)

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

2.  **Configurar variables de entorno:**

    Crea tu archivo `.env.local` a partir de `.env.example` y verifica que tenga los valores de Firebase y backend:

    ```bash
    NEXT_PUBLIC_API_URL=http://localhost:3000

    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
    ```

3.  **Configuración del Backend:**
    
    El frontend está configurado para ejecutarse en el puerto **3050** y redirigir las peticiones de API al backend en el puerto **3000** mediante un proxy en `next.config.mjs`.

    Asegúrate de que tu servidor backend esté corriendo en: `http://localhost:3000`

    *Nota: Las peticiones a `/api/*` serán redirigidas automáticamente.*

4.  **Iniciar el servidor de desarrollo:**

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
├── lib/                  # Firebase client + utilidades API (api.ts, firebase.ts)
└── middleware.ts         # Protección básica por sesión (cookie firebase_session)
```

## Flujo de Autenticación (Firebase + Backend)

1. **Login (`/login`)**
    - Se autentica con `signInWithEmailAndPassword` en Firebase.
    - Se obtiene Firebase ID Token y se llama `GET /api/auth/me` con `Authorization: Bearer <id_token>`.
    - El backend responde perfil local y rol, y el frontend redirige a `/dashboard/{role}`.

2. **Registro (`/register`)**
    - Se crea cuenta en Firebase con `createUserWithEmailAndPassword`.
    - Luego se persiste perfil/rol en backend con `POST /api/auth/register`.
    - El frontend sincroniza perfil con `GET /api/auth/me` y redirige al dashboard por rol.

3. **Rutas protegidas**
    - `middleware.ts` valida presencia de sesión básica (`firebase_session`).
    - La autorización por rol se hace en cliente con `AuthContext` + perfil backend.

4. **Requests autenticadas al backend**
    - `src/lib/api.ts` adjunta automáticamente `Authorization: Bearer <firebase_id_token>` en cada request protegida.

5. **Logout**
    - Se ejecuta `signOut` de Firebase.
    - Se limpia estado local y se redirige a `/login`.

## Roles y Accesos

El sistema maneja 4 roles principales, normalizando los nombres recibidos del backend (español) a rutas internas (inglés):

| Rol Backend  | Rol Frontend (Ruta) | Funcionalidades Principales |
| :--- | :--- | :--- |
| `estudiante` | `student` | Ver tutorías, solicitar sesiones, ver historial. |
| `docente`/`tutor` | `tutor` | Gestionar horarios, aceptar solicitudes, reportes. |
| `coordinador` | `coordinator` | Supervisar tutorías, gestionar docentes y estudiantes. |
| `admin` | `admin` | Gestión total de usuarios, roles y configuración del sistema. |


