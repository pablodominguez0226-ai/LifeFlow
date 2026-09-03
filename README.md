# 🚀 LifeFlow — Guía Completa de Arquitectura, Funcionamiento y Uso

> **LifeFlow** es un sistema integral de gestión de tiempo, rendimiento académico y salud biológica diseñado bajo el principio de **Cumplimiento Sostenible**: optimizar el progreso académico continuo sin comprometer el descanso sagrado, el entrenamiento físico ni el margen de maniobra personal.

---

## 📑 Tabla de Contenidos

1. [Estructura del Proyecto](#1-estructura-del-proyecto)
2. [Cómo Funciona la Aplicación (Flujo Completo)](#2-cómo-funciona-la-aplicación)
3. [Frontend](#3-frontend)
4. [Backend](#4-backend)
5. [Base de Datos](#5-base-de-datos)
6. [Planning Engine](#6-planning-engine)
7. [Sistema de Prioridades](#7-sistema-de-prioridades)
8. [Calendario Semanal](#8-calendario-semanal)
9. [Motor de Replanificación](#9-motor-de-replanificación)
10. [Datos Iniciales & Fuente de Verdad](#10-datos-iniciales--fuente-de-verdad)
11. [Cómo Usar la Aplicación (Guía Práctica)](#11-cómo-usar-la-aplicación)
12. [Cómo Agregar una Materia](#12-cómo-agregar-una-materia)
13. [Cómo Agregar un Examen](#13-cómo-agregar-un-examen)
14. [Cómo Agregar una Actividad](#14-cómo-agregar-una-actividad)
15. [Cómo Cambiar Mis Horarios](#15-cómo-cambiar-mis-horarios)
16. [Cómo Modificar las Reglas del Planificador](#16-cómo-modificar-las-reglas-del-planificador)
17. [Configuración y Variables de Entorno](#17-configuración-y-variables-de-entorno)
18. [Instalación y Despliegue Local](#18-instalación-y-despliegue-local)
19. [Comandos que Necesito Conocer](#19-comandos-que-necesito-conocer)
20. [Testing](#20-testing)
21. [Debugging: Qué Hacer Si Algo Falla](#21-debugging-qué-hacer-si-algo-falla)
22. [Archivos Más Importantes del Proyecto](#22-archivos-más-importantes)
23. [Mapa del Código (Trazabilidad End-to-End)](#23-mapa-del-código)
24. [Guía de Estudio del Proyecto por Niveles](#24-guía-de-estudio-del-proyecto)
25. [Ejercicios Prácticos de Aprendizaje](#25-ejercicios-prácticos)
26. [Decisiones Arquitectónicas & Trade-Offs](#26-decisiones-arquitectónicas)
27. [Limitaciones Actuales](#27-limitaciones-actuales)
28. [Roadmap de Evolución](#28-roadmap)
29. [Guía de Usuario Diario](#29-guía-de-usuario-diario)

---

## 1. Estructura del Proyecto

El repositorio está estructurado como un **monorepo con npm workspaces**, dividiendo limpiamente la capa de presentación (cliente web) de la capa de API y lógica de negocio (servidor):

```
Agenda-personal/
├── package.json                         # Configuración raíz de npm workspaces (server, client)
├── README.md                            # Guía de estudio y manual técnico del sistema
│
├── server/                              # BACKEND & PLANNING ENGINE
│   ├── package.json                     # Dependencias (Express, Prisma, Vitest, date-fns)
│   ├── tsconfig.json                    # Compilación de TypeScript para Node.js
│   ├── prisma/
│   │   ├── schema.prisma                # Definición del modelo relacional SQLite
│   │   ├── dev.db                       # Base de datos SQLite local
│   │   └── seed.ts                      # Semilla de datos con la fuente de verdad horaria
│   ├── src/
│   │   ├── app.ts                       # Entrypoint Express, middleware y montaje de rutas
│   │   ├── db.ts                        # Singleton de PrismaClient
│   │   ├── routes/
│   │   │   └── api.ts                   # Router centralizado con todos los endpoints REST
│   │   ├── controllers/                 # Controladores HTTP (reciben request, llaman servicio)
│   │   │   ├── dashboardController.ts   # Resumen de "Hoy", KPIs y próximos exámenes
│   │   │   ├── calendarController.ts    # CRUD de bloques del calendario
│   │   │   ├── subjectController.ts     # CRUD de materias y avance
│   │   │   ├── examController.ts        # CRUD de exámenes y fechas
│   │   │   ├── taskController.ts        # Tareas académicas y estados de temas
│   │   │   ├── planningController.ts    # Generación semanal, diario y replanificación
│   │   │   ├── checkinController.ts     # Check-in diario y seguimiento de hábitos
│   │   │   └── statsController.ts       # Estadísticas y recomendaciones
│   │   ├── services/                    # Lógica de aplicación y consultas Prisma
│   │   │   ├── academicService.ts       # Cálculo de prioridades y horas de materias
│   │   │   ├── scheduleService.ts       # Consulta y mutación de ScheduleBlocks
│   │   │   ├── planningService.ts       # Interfaz entre base de datos y Planning Engine
│   │   │   ├── habitService.ts          # Registro de Check-ins y rachas de hábitos
│   │   │   └── statsService.ts          # Cálculo del índice de Cumplimiento Sostenible
│   │   └── engine/                      # PLANNING ENGINE (TypeScript puro, desacoplado de DB)
│   │       ├── types.ts                 # Tipos, interfaces de restricciones y contratos
│   │       ├── priorityScorer.ts        # Algoritmo determinista de cálculo de PriorityScore
│   │       ├── capacityAnalyzer.ts      # Verificación de sueño, concentración y transiciones
│   │       ├── overloadDetector.ts      # Detección de sobrecarga semanal y jerarquía de sacrificio
│   │       ├── weeklyGenerator.ts       # Generador de semanas completas (7 días)
│   │       ├── dailyPlanner.ts          # Particionador por franjas (Mañana, Tarde, Noche)
│   │       ├── replanner.ts             # Estrategia anti-cascada (Mover, Dividir, Reducir)
│   │       └── index.ts                 # Barrel export de los módulos del motor
│   └── tests/                           # Tests unitarios con Vitest
│       ├── capacityAnalyzer.test.ts     # Tests de sueño, fatiga y descansos
│       ├── overloadDetector.test.ts     # Tests de balance de horas y sacrificios
│       ├── priorityScorer.test.ts       # Tests de ordenamiento y ponderación
│       ├── replanner.test.ts            # Tests de búsqueda de huecos sin efecto dominó
│       └── weeklyGenerator.test.ts      # Tests de generación respetando cursadas fijas
│
└── client/                              # FRONTEND SPA (React 18 + Vite + Tailwind)
    ├── package.json                     # Dependencias (React, Lucide, Tailwind, date-fns)
    ├── tsconfig.json / tsconfig.app.json# Configuración TypeScript para el cliente
    ├── vite.config.ts                   # Servidor de desarrollo con Proxy hacia http://localhost:4000
    ├── tailwind.config.js               # Paleta temática centralizada (Dark, Red, Orange, Green)
    ├── postcss.config.js                # Plugins de PostCSS (Tailwind, Autoprefixer)
    ├── index.html                       # Documento HTML raíz
    └── src/
        ├── index.css                    # Design Tokens CSS nativos (--bg-main, --red-intense, etc.)
        ├── main.tsx                     # Punto de montaje del árbol React en el DOM
        ├── App.tsx                      # Componente contenedor, navegación de tabs y modales globales
        ├── api/
        │   └── client.ts                # Cliente HTTP tipado con todas las funciones fetch
        └── components/
            ├── Sidebar.tsx              # Barra lateral con logo LIFEFLOW y perfil de usuario
            ├── Header.tsx               # Barra superior con contexto de vista y acciones rápidas
            ├── dashboard/
            │   └── DashboardView.tsx    # Pantalla principal: KPIs, pomodoro, agenda y exámenes
            ├── calendar/
            │   └── CalendarView.tsx     # Calendario semanal interactivo con detalle de bloques
            ├── academic/
            │   └── AcademicView.tsx     # Panel de materias, temas, exámenes y tareas de estudio
            ├── sports/
            │   └── SportsView.tsx       # Monitoreo de Gimnasio 4x, Deportes y Formulario de Check-in
            ├── habits/
            │   └── HabitsView.tsx       # Lectura de Filosofía/Psicología, Buffer del 15% y Hábitos
            ├── stats/
            │   └── StatsView.tsx        # Métricas de Cumplimiento Sostenible y distribución de horas
            └── planning/                # Modales interactivos vinculados al Planning Engine
                ├── WeeklyGeneratorModal.tsx # Generación y aplicación de propuesta semanal
                ├── DailyPlanModal.tsx       # Desglose de actividades del día por franjas
                ├── ReplanModal.tsx          # Asistente de replanificación anti-deuda
                └── NewActivityModal.tsx     # Formulario de creación de bloques manuales
```

---

## 2. Cómo Funciona la Aplicación

### Flujo de Ejecución de una Operación Típica

```
[Usuario interactúa con la UI]
           │  (Ejemplo: Hace click en "Generar semana")
           ▼
[Client: WeeklyGeneratorModal.tsx]
           │  Invoca api.generateWeek({ mondayDate, gymSessionsTarget, ... })
           ▼
[Client: src/api/client.ts]
           │  Ejecuta HTTP POST a /api/planning/generate-week
           ▼
[Vite Dev Server (Port 3000)]
           │  Redirige la petición vía proxy a http://localhost:4000/api/planning/generate-week
           ▼
[Express Server: src/app.ts & routes/api.ts]
           │  Enruta la llamada a PlanningController.generateWeek()
           ▼
[Controller: planningController.ts]
           │  Invoca PlanningService.generateWeeklyProposal()
           ▼
[Service: planningService.ts]
           │  1. Lee de SQLite vía Prisma: Materias, Tareas pendientes, Exámenes y Usuario.
           │  2. Mapea entidades de BD a tipos puros de dominio (TaskInput, SubjectInput).
           │  3. Llama al Planning Engine desacoplado.
           ▼
[Planning Engine: WeeklyGenerator.generateWeek()]
           │  1. Inyecta cursadas fijas y consultas (Paradigmas, Sistemas, Economía, Diseño, Fútbol).
           │  2. OverloadDetector evalúa el presupuesto de horas (12.5h cursada, gimnasio, sueño).
           │  3. PriorityScorer ordena tareas académicas según proximidad de exámenes y dominio.
           │  4. CapacityAnalyzer valida que ningún bloque viole el sueño (00:00-06:30) ni las 22:30.
           │  5. Asigna 4 sesiones de gimnasio respetando transiciones de traslado (10-15m).
           │  6. Genera justificaciones en lenguaje natural y calcula el Score de Sostenibilidad.
           ▼
[Respuesta JSON al Frontend]
           │  Retorna { blocks, sustainabilityScore, overloadReport, summary }
           ▼
[Client: WeeklyGeneratorModal.tsx]
           │  Renderiza la propuesta con previsualización de bloques y botón "Confirmar & Aplicar".
           ▼
[Usuario confirma] ──> Client llama /api/planning/apply-week ──> Prisma persiste los ScheduleBlocks
```

---

## 3. Frontend

El frontend está desarrollado con **React 18**, **TypeScript** y **Tailwind CSS**, empaquetado con **Vite**.

### Sistema de Estilos y Paleta Centralizada
La identidad visual se rige por una estética **Dark, Negra, Intensa y Moderna**, inspirada en software deportivo y dashboards de alto rendimiento:

- **Tokens CSS nativos** centralizados en [client/src/index.css](file:///c:/Users/pablo/OneDrive/Documentos/Agenda-personal/client/src/index.css):
  - Fondo primario: `--bg-main: #000000`
  - Paneles / Cards: `--card: #0A0A0A`
  - Cards secundarias: `--card-secondary: #111111`
  - Bordes discretos: `--border: #242424`
  - Tipografía principal: `--text-primary: #FFFFFF`
  - Tipografía secundaria: `--text-secondary: #A1A1AA`
  - Color de acción y acento principal: `--red-intense: #E50914`
  - Color de acento secundario: `--accent-orange: #FF5A00`
- **Mapeo Tailwind** en [client/tailwind.config.js](file:///c:/Users/pablo/OneDrive/Documentos/Agenda-personal/client/tailwind.config.js), exponiendo clases utilitarias como `bg-dark-card`, `border-dark-border`, `bg-red-intense`, `text-accent-orange`.

### Pantallas Principales

#### 1. Dashboard (`DashboardView.tsx`)
- **Propósito**: Vista de control del día actual (**Miércoles, 02 de Septiembre de 2026**).
- **Datos que muestra**:
  - Saludo contextual y selector rápido de sincronización.
  - 4 métricas clave: *Prioridad de hoy* (Diana roja), *Carga del día* (Velocímetro), *Estudio hoy* (Horas con barra roja), *Sueño anoche* (7.5h protegidas).
  - *Agenda de hoy*: Timeline vertical con puntos rojos y píldoras oscuras por actividad.
  - *Enfoque actual*: Widget de Pomodoro (50:00) con botón rojo interactivo y aviso del próximo descanso.
  - *Próximos exámenes*: Lista ordenada por fecha con badge rojo de días restantes ("23 días").
  - *Directivas del Engine*: Avisos estratégicos (avance en Diseño, transiciones del jueves y viernes).
  - *Progreso académico*: Barras de avance en rojo intenso (Paradigmas 65%, Economía 48%, Diseño 72%).
  - *Vista semanal*: Minicalendario de 7 columnas con el día activo resaltado en rojo.
- **Endpoints que consume**: `GET /api/dashboard?date=2026-09-02T12:00:00Z`.

#### 2. Calendario Semanal (`CalendarView.tsx`)
- **Propósito**: Visualización completa de la semana estilo Google Calendar / Notion.
- **Datos que muestra**:
  - Grilla de 7 columnas (Lunes a Domingo) navegable por semanas.
  - Código de color sobrio: Rojo oscuro con borde rojo intenso para Academia, naranja para Gimnasio, verde sobrio para Deporte, gris carbón para Descanso y Personal.
  - Indicador de actividad fija (candado rojo).
  - Banner permanente de la ventana de sueño protegida (00:00 a 06:30).
  - Modal al hacer click en cualquier bloque: muestra justificación cognitiva del motor, permite marcar como completado, eliminar o replanificar.
- **Endpoints que consume**: `GET /api/calendar`, `PATCH /api/calendar/block/:id`, `DELETE /api/calendar/block/:id`.

#### 3. Módulo Académico (`AcademicView.tsx`)
- **Propósito**: Gestión profunda de asignaturas universitarias y preparación de finales.
- **Datos que muestra**:
  - Selector lateral de materias con indicador de progreso.
  - Detalle de la materia seleccionada: Priority Score sobre 100, justificación del algoritmo.
  - Exámenes asociados con horas estudiadas vs. objetivo estimado.
  - Estructura de temas (Topics) con cambio de estado interactivo (*No iniciado, En progreso, Dominado, Repasar*).
  - Tareas académicas con nivel de energía requerida y score individual.
  - Formularios modales para agregar nuevas materias y tareas sin tocar código.
- **Endpoints que consume**: `GET /api/subjects`, `POST /api/subjects`, `POST /api/tasks`, `PATCH /api/tasks/:id`, `PATCH /api/topics/:id/status`.

#### 4. Entrenamiento & Rendimiento (`SportsView.tsx`)
- **Propósito**: Supervisión de los 3 pilares físicos (Gimnasio 4x, Deportes de equipo, Sueño sagrado).
- **Datos que muestra**:
  - Horarios y reglas de los 4 días de gimnasio.
  - Rugby (Martes 21:00, salida 19:30, flexible) y Fútbol (Sábado 09:30, fijo).
  - Reglas del descanso sagrado (límite 00:00, fin de estudio cognitivo 22:30).
  - Formulario interactivo de **Check-in Diario** (slider de sueño, selector de energía 1-5, estrés 1-5, horas de estudio, checkbox de entrenamiento).
  - Historial reciente de check-ins registrados.
- **Endpoints que consume**: `GET /api/checkin/history`, `POST /api/checkin`.

#### 5. Hábitos & Recuperación (`HabitsView.tsx`)
- **Propósito**: Seguimiento de desconexión sin pantallas y preservación del margen personal.
- **Datos que muestra**:
  - Lectura de Filosofía y Psicología como descanso cognitivo nocturno (22:30 a 23:30) y fines de semana.
  - Política de Buffer Personal (~15% del tiempo despierto) para mandados, almuerzos y vida personal.
  - Grid de hábitos con contador de rachas y botones para sumar/restar cumplimientos.
- **Endpoints que consume**: `GET /api/habits`, `PATCH /api/habits/:id/toggle`.

#### 6. Estadísticas & Cumplimiento Sostenible (`StatsView.tsx`)
- **Propósito**: Evaluación cualitativa y cuantitativa de la sustentabilidad semanal.
- **Datos que muestra**:
  - Índice maestro de **Cumplimiento Sostenible (0 a 100)** desglosado en: Salud del Sueño (30 pts), Entrenamiento (25 pts), Control del Estrés (25 pts) y Avance de Estudio (20 pts).
  - Gráfico de barras de horas semanales distribuidas por categoría.
  - Métricas de resumen operativo (promedio de sueño, sesiones de gimnasio completadas, horas estudiadas).
- **Endpoints que consume**: `GET /api/statistics`.

---

## 4. Backend

El backend está construido con **Express**, estructurado bajo el patrón **Controlador - Servicio - Repositorio/Prisma**, y orquestado mediante rutas fuertemente tipadas.

### Tabla de Endpoints Reales

| Método | Endpoint | Controlador & Función | Datos Recibidos | Respuesta Principal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Inline (`app.ts`) | Ninguno | `{ status: "ok", timestamp }` |
| `GET` | `/api/dashboard` | `DashboardController.getSummary` | Query: `?date=ISOString` | Resumen del día, próxima actividad, exámenes ordenados y directivas del motor |
| `GET` | `/api/calendar` | `CalendarController.getBlocks` | Query: `?start=ISO&end=ISO` | Array de `ScheduleBlock` ordenados cronológicamente |
| `GET` | `/api/calendar/feed.ics` | `CalendarController.getIcsFeed` | Query: `?futureDays=&pastDays=&download=true` | Feed iCalendar estándar RFC 5545 (`text/calendar`) compatible con Google & Apple Calendar |
| `POST` | `/api/calendar/block` | `CalendarController.createBlock` | Body: `{ title, startTime, endTime, category, flexibility, ... }` | `ScheduleBlock` creado en la base de datos |
| `PATCH` | `/api/calendar/block/:id` | `CalendarController.updateBlock` | Params: `id`, Body: Campos a modificar | `ScheduleBlock` actualizado |
| `DELETE` | `/api/calendar/block/:id` | `CalendarController.deleteBlock` | Params: `id` | `{ success: true }` |
| `GET` | `/api/recurring-rules` | `RecurringRuleController.getRules` | Ninguno | Array de `RecurringScheduleRule` ordenadas por día y hora |
| `POST` | `/api/recurring-rules` | `RecurringRuleController.createRule` | Body: `{ dayOfWeek, startTime, endTime, title, category, ... }` | `RecurringScheduleRule` creada |
| `PATCH` | `/api/recurring-rules/:id` | `RecurringRuleController.updateRule` | Params: `id`, Body: Campos parciales | `RecurringScheduleRule` actualizada |
| `DELETE` | `/api/recurring-rules/:id` | `RecurringRuleController.deleteRule` | Params: `id` | `{ success: true }` |
| `GET` | `/api/subjects` | `SubjectController.getSubjects` | Query: `?date=ISOString` | Array de materias con cálculo de `priorityScore`, `progress` y `nearestExamDays` |
| `GET` | `/api/subjects/:id` | `SubjectController.getSubjectById` | Params: `id` | Detalle completo de la materia con topics, tareas y exámenes |
| `POST` | `/api/subjects` | `SubjectController.createSubject` | Body: `{ name, code, type, color, masteryLevel, priorityWeight }` | `Subject` creado |
| `PATCH` | `/api/subjects/:id` | `SubjectController.updateSubject` | Params: `id`, Body: Campos parciales | `Subject` modificado |
| `DELETE` | `/api/subjects/:id` | `SubjectController.deleteSubject` | Params: `id` | `{ success: true }` |
| `GET` | `/api/exams` | `ExamController.getExams` | Query: `?subjectId=...` | Array de exámenes con cuenta regresiva en días |
| `POST` | `/api/exams` | `ExamController.createExam` | Body: `{ subjectId, title, type, date, weight, targetHoursEstimate }` | `Exam` creado |
| `PATCH` | `/api/exams/:id` | `ExamController.updateExam` | Params: `id`, Body: Campos parciales | `Exam` modificado |
| `DELETE` | `/api/exams/:id` | `ExamController.deleteExam` | Params: `id` | `{ success: true }` |
| `GET` | `/api/tasks` | `TaskController.getTasks` | Query: `?subjectId=...&status=...` | Array de `AcademicTask` con prioridad calculada |
| `POST` | `/api/tasks` | `TaskController.createTask` | Body: `{ subjectId, title, taskType, estimatedMinutes, energyLevel }` | `AcademicTask` creada |
| `PATCH` | `/api/tasks/:id` | `TaskController.updateTask` | Params: `id`, Body: Campos a actualizar | `AcademicTask` modificada |
| `DELETE` | `/api/tasks/:id` | `TaskController.deleteTask` | Params: `id` | `{ success: true }` |
| `PATCH` | `/api/topics/:id/status` | `TaskController.updateTopicStatus` | Params: `id`, Body: `{ status }` | `Topic` actualizado con recalculo de progreso en cascada |
| `POST` | `/api/planning/generate-week` | `PlanningController.generateWeek` | Body: `{ mondayDate, gymSessionsTarget, enableRugby, enableMarket }` | Propuesta semanal (`WeeklyPlanProposal`) generada por el Planning Engine |
| `POST` | `/api/planning/apply-week` | `PlanningController.applyWeek` | Body: `{ proposal: WeeklyPlanProposal }` | Transacción Prisma: persiste el `WeeklyPlan` y sus `ScheduleBlocks` |
| `POST` | `/api/planning/plan-day` | `PlanningController.planDay` | Body: `{ targetDate }` | Desglose del día en franjas Mañana/Tarde/Noche con justificaciones |
| `POST` | `/api/planning/replan` | `PlanningController.replan` | Body: `{ taskId, currentDate }` | Opciones de replanificación anti-deuda (`MOVER`, `DIVIDIR`, `REDUCIR`, `DESCARTAR`) |
| `GET` | `/api/habits` | `CheckinController.getHabits` | Ninguno | Array de hábitos con rachas actuales |
| `PATCH` | `/api/habits/:id/toggle` | `CheckinController.toggleHabit` | Params: `id`, Body: `{ increment: boolean }` | Racha del hábito incrementada o decrementada |
| `POST` | `/api/checkin` | `CheckinController.createCheckin` | Body: `{ date, sleepHours, energyLevel, stressLevel, studyHoursDone, ... }` | `DailyCheckIn` registrado |
| `GET` | `/api/checkin/history` | `CheckinController.getHistory` | Ninguno | Últimos check-ins ordenados por fecha descendente |
| `GET` | `/api/recommendations` | `RecommendationController.getRecommendations` | Ninguno | Directivas activas del motor (prioridades, avisos de sobrecarga) |
| `PATCH` | `/api/recommendations/:id/dismiss` | `RecommendationController.dismissRecommendation` | Params: `id` | Recomendación marcada como descartada |
| `GET` | `/api/statistics` | `StatsController.getStats` | Query: `?date=ISOString` | Métricas de sostenibilidad, horas por categoría y balance |

---

## 5. Base de Datos

La persistencia se implementa mediante **SQLite** gestionado a través de **Prisma ORM**. La base de datos local reside en `server/prisma/dev.db`.

### Esquema Conceptual de Relaciones

```
                      ┌───────────────┐
                      │     User      │
                      └───────┬───────┘
                              │ 1:N
        ┌─────────────────────┼──────────────────────┬────────────────────┐
        ▼                     ▼                      ▼                    ▼
 ┌─────────────┐       ┌─────────────┐        ┌─────────────┐      ┌─────────────┐
 │   Subject   │       │  Activity   │        │ Schedule-   │      │ DailyCheckIn│
 └──────┬──────┘       └─────────────┘        │    Block    │      └─────────────┘
        │ 1:N                                 └─────────────┘
   ┌────┴────────────┐                               ▲
   ▼                 ▼                               │ 1:N
┌─────────────┐ ┌─────────────┐                      │
│    Exam     │ │    Topic    │                      │
└──────┬──────┘ └─────────────┘                      │
       │ 1:N                                         │
       ▼                                             │
┌─────────────┐                                      │
│AcademicTask ├──────────────────────────────────────┘
└─────────────┘
```

### Modelos y Tablas del Sistema

| Modelo / Tabla | Propósito | Campos Clave | Relaciones |
| :--- | :--- | :--- | :--- |
| **`User`** | Configuración personal y restricciones biológicas del usuario. | `targetWakeTime` ("06:30"), `maxBedTime` ("00:00"), `targetSleepHours` (7.5), `maxFocusBlockMinutes` (120), `personalBufferRatio` (0.15). | 1:N con `Subject`, `Activity`, `ScheduleBlock`, `DailyCheckIn`, `Habit`, `Recommendation`. |
| **`Subject`** | Asignaturas universitarias o preparación de exámenes finales. | `name`, `code`, `type` (`CURSADA` \| `FINAL`), `color`, `masteryLevel` (`BAJO` \| `MEDIO` \| `ALTO`), `priorityWeight`, `progressManualOverride`. | Pertenece a `User`. 1:N con `Exam`, `Topic`, `AcademicTask`. |
| **`Exam`** | Hitos evaluativos de cada materia con fecha fija. | `title`, `type` (`PARCIAL_1`, `PARCIAL_2`, `FINAL`, `GLOBAL`), `date`, `weight` (1 a 5), `targetHoursEstimate`, `completedHours`. | Pertenece a `Subject`. 1:N con `AcademicTask`. |
| **`Topic`** | Contenidos o etapas del programa de una materia. | `title`, `orderIndex`, `status` (`NO_INICIADO`, `EN_PROGRESO`, `DOMINADO`, `REPASAR`), `masteryScore`. | Pertenece a `Subject`. |
| **`AcademicTask`** | Tareas concretas de estudio (ejercicios, lectura profunda). | `title`, `taskType` (`ESTUDIO_PROFUNDO`, `EJERCICIOS`, `SIMULACRO`, `REPASO`), `estimatedMinutes`, `energyLevel`, `priorityScore`, `status`. | Pertenece a `Subject` y opcionalmente a `Exam`. 1:N con `ScheduleBlock`. |
| **`ScheduleBlock`** | Eventos asignados en el calendario con franja horaria. | `title`, `startTime`, `endTime`, `durationMinutes`, `category` (`ACADEMIA`, `GIMNASIO`, `DEPORTE`, `LECTURA`, `PERSONAL`, `MERCADO`), `flexibility` (`FIJA`, `FLEXIBLE`, `OPCIONAL`), `isFixed`, `status`. | Pertenece a `User`. Enlaces opcionales a `WeeklyPlan`, `AcademicTask` y `Activity`. |
| **`WeeklyPlan`** | Registro histórico de planes semanales generados por el motor. | `startDate`, `endDate`, `macroPhase`, `sustainabilityScore`, `overloadLevel`, `summary`. | Pertenece a `User`. 1:N con `ScheduleBlock`. |
| **`DailyCheckIn`** | Registro nocturno o matutino de salud, descanso y fatiga. | `date`, `sleepHours`, `energyLevel` (1-5), `stressLevel` (1-5), `studyHoursDone`, `workoutDone`, `notes`. | Pertenece a `User`. |
| **`Habit`** | Hábitos a monitorear con contador de rachas. | `title`, `category`, `targetFrequency`, `frequencyUnit`, `streak`. | Pertenece a `User`. |
| **`Recommendation`** | Avisos y directivas producidas por el Planning Engine. | `type`, `severity` (`INFO`, `WARNING`, `CRITICAL`), `title`, `message`, `justification`, `dismissed`. | Pertenece a `User`. |
| **`RecurringScheduleRule`** | Horarios fijos, cursadas y compromisos semanales recurrentes dinámicos. | `dayOfWeek` (0 a 6), `startTime`, `endTime`, `durationMinutes`, `category`, `flexibility`, `isFixed`, `isActive`. | Pertenece a `User`. Inyectado dinámicamente al Planning Engine. |

---

## 6. Planning Engine

El **Planning Engine** es el núcleo algorítmico del sistema. Está implementado en TypeScript puro dentro de `server/src/engine/` y es **completamente desacoplado de la base de datos**, lo que permite testearlo de forma unitaria y determinista.

### Diagrama de Flujo del Motor

```
1. Datos de Entrada (Tareas, Cursadas fijas, Exámenes, Restricciones de Usuario)
       │
       ▼
2. Inyección de Bloques Fijos No Negociables
       ├─ Paradigmas: Lun 08:00-11:00 y Vie 08:00-11:00
       ├─ Consulta Diseño: Mar 17:30-18:30
       ├─ Administración de Sistemas: Jue 19:00-23:00
       ├─ Economía: Vie 14:30-17:00
       └─ Fútbol: Sáb 09:30-12:00
       │
       ▼
3. Análisis de Capacidad & Detección de Sobrecarga (OverloadDetector)
       ├─ Total semana = 168h. Sueño protegido = 52.5h (7.5h x 7). Horas despierto = 115.5h.
       ├─ Horas fijas de cursada = 12.5h.
       ├─ Margen personal no negociable = 15% (~18h).
       └─ Si buffer < 12% o exámenes inminentes ≥ 2 ──> Activa Jerarquía de Sacrificio.
       │
       ▼
4. Reglas de Sacrificio Deterministas
       ├─ 1º Sacrificio: Omitir Rugby martes (ahorra 3.5h de viaje y desgaste físico).
       ├─ 2º Sacrificio: Reducir gimnasio de 4 a 3 sesiones en semanas pico de parciales.
       ├─ 3º Sacrificio: Pausar sesiones accesorias de operación de mercado.
       └─ PROHIBIDO SACRIFICAR: Sueño (00:00 - 06:30) y cursadas obligatorias.
       │
       ▼
5. Ubicación de Gimnasio con Transiciones de Traslado Inteligentes
       ├─ Lunes 16:00 - 18:15 (Sesión 1 Fuerza).
       ├─ Martes 10:30 - 12:45 (Sesión 2 Temprano, deja libre la tarde antes de Diseño 17:30).
       ├─ Jueves 16:00 - 18:00 (Sesión 3, finaliza con 1h de margen antes de Sistemas a las 19:00).
       └─ Viernes 17:15 - 19:30 (Sesión 4, arranca 15 min después de Economía para contemplar viaje).
       │
       ▼
6. Ubicación de Estudio Profundo por Prioridades (PriorityScorer)
       ├─ Miércoles (Día flexible sin cursadas): Bloque Diseño (09:00) y Bloque Paradigmas (15:00).
       ├─ Jueves mañana (Sin cursada): Bloque Economía (10:00).
       └─ Máximo bloque continuo: 120 minutos (fraccionado en 50 min foco + 10 min pausa).
       │
       ▼
7. Cierre de Jornada y Protección de Sueño (CapacityAnalyzer)
       ├─ Bloqueo estricto de estudio de alta exigencia después de las 22:30.
       ├─ Jueves post-23:00 protegido: regreso a casa, cena y descanso para dormir a las 00:00.
       └─ Lectura nocturna (Filosofía & Psicología) de 22:30 a 23:30 sin pantallas.
       │
       ▼
8. Cálculo del Score de Sostenibilidad (0 a 100) y Emisión de Justificaciones
```

---

## 7. Sistema de Prioridades

El cálculo de prioridades está implementado en [server/src/engine/priorityScorer.ts](file:///c:/Users/pablo/OneDrive/Documentos/Agenda-personal/server/src/engine/priorityScorer.ts) mediante la función estática `calculateTaskPriority()` y `calculateSubjectPriority()`.

### Fórmula Matemática de la Tarea

La prioridad de cada tarea es una suma ponderada normalizada de 6 factores que arroja un valor exacto entre **0 y 100**:

$$\text{PriorityScore} = 10 \times \sum_{i=1}^{6} (w_i \times s_i)$$

Donde los pesos ($w_i$) y puntajes individuales ($s_i \in [1, 10]$) son:

| Factor | Peso ($w_i$) | Criterio de Cálculo ($s_i$) |
| :--- | :---: | :--- |
| **Proximidad de Examen** | `0.30` | Si faltan $\le 3$ días: `10.0`. Si faltan $\le 7$ días: `9.5`. Si faltan $\le 15$ días: `8.5`. Si faltan $\le 25$ días: `7.5`. Si faltan $\le 40$ días: `6.0`. Más de 40 días: escala decreciente hasta `1.0`. |
| **Urgencia de Entrega** | `0.20` | Si la tarea tiene fecha límite en $\le 24$h: `10.0`. En $\le 72$h: `9.0`. En $\le 7$ días: `7.5`. Si no tiene entrega explícita: hereda el 90% del factor de proximidad del examen. |
| **Trabajo Remanente** | `0.15` | $\min(10.0, \max(2.0, \frac{\text{minutosRestantes}}{60} \times 4.0))$. Tareas más largas reciben mayor urgencia de programación temprana. |
| **Nivel de Dominio Bajo** | `0.15` | Dominio `BAJO`: `10.0`. Dominio `MEDIO`: `6.5`. Dominio `ALTO`: `2.5`. Prioriza cerrar brechas conceptuales. |
| **Importancia de Materia** | `0.10` | $\min(10.0, \text{pesoMateria} \times 3.5)$. Asigna más peso a finales estratégicos (Diseño: peso 2.0). |
| **Dificultad de la Tarea** | `0.10` | `SIMULACRO` / `ESTUDIO_PROFUNDO`: `9.0`. `EJERCICIOS`: `7.0`. `REPASO`: `5.0`. `ESTUDIO_LIVIANO`: `3.0`. |

### Ejemplo Real con Datos del 02/09/2026

- **Paradigmas (1.º Parcial el 25/09 — 23 días)**:
  - Proximidad: 23 días $\rightarrow s = 7.5$.
  - Dominio: `MEDIO` $\rightarrow s = 6.5$.
  - Tipo: `ESTUDIO_PROFUNDO` (Prolog) $\rightarrow s = 9.0$.
  - **Score resultante: ~85.0 / 100** (Máxima prioridad de ejecución inmediata).
- **Diseño de Sistemas (Final el 08/10 — 36 días)**:
  - Proximidad: 36 días $\rightarrow s = 6.0$.
  - Peso estratégico: Final universitario $\rightarrow s = 10.0$.
  - Dominio: `MEDIO` (72% de avance) $\rightarrow s = 6.5$.
  - **Score resultante: ~80.0 / 100** (Asignación sostenida de 2 bloques semanales sin saturación).

---

## 8. Calendario Semanal

### Almacenamiento y Ciclo de Vida
- Los eventos se persisten en la tabla `ScheduleBlock` de SQLite mediante Prisma.
- Cada bloque cuenta con `startTime` y `endTime` almacenados como fechas UTC completas.
- Posee un flag booleano `isFixed` y una enumeración `flexibility`:
  - **`FIJA`**: Compromisos externos inamovibles (cursadas presenciales, consulta con docentes, partido de fútbol del sábado). El motor jamás intentará moverlos ni borrarlos.
  - **`FLEXIBLE`**: Sesiones de estudio profundo, gimnasio o buffer. El motor puede moverlas de día u hora respetando la compatibilidad energética.
  - **`OPCIONAL`**: Actividades prescindibles ante sobrecarga (Rugby los martes, operación de mercado con amigos). Son las primeras candidatas a sacrificio si se detecta déficit de tiempo o sueño.

### Diferenciación Frontend vs. Backend
- **Backend (`scheduleService.ts` & `capacityAnalyzer.ts`)**: Valida que no existan solapamientos con la ventana de sueño (00:00 - 06:30) ni bloques profundos después de las 22:30.
- **Frontend (`CalendarView.tsx`)**: Renderiza los bloques en una grilla CSS adaptativa, pinta los acentos temáticos según categoría, coloca el icono de candado en bloques fijos y abre el modal de detalles para alternar el estado a `COMPLETADO`.

---

## 9. Motor de Replanificación

Cuando una sesión de estudio planificada no se realiza (por imprevistos, cansancio o retrasos), **LifeFlow no empuja todas las actividades en cascada**. La replanificación en cascada tradicional satura los días siguientes y destruye el descanso (efecto dominó).

En [server/src/engine/replanner.ts](file:///c:/Users/pablo/OneDrive/Documentos/Agenda-personal/server/src/engine/replanner.ts), la función `evaluateMissedTask()` evalúa la tarea y ofrece **4 alternativas estratégicas anti-deuda**:

1. **`MOVER` (Reubicar en hueco compatible)**:
   - El motor explora los siguientes 3 días hábiles entre las 09:00 y las 21:00 en pasos de 30 minutos.
   - Si encuentra un hueco que no colisione con bloques existentes ni con el buffer personal, sugiere la fecha y hora exacta.
2. **`DIVIDIR` (Split en 2 bloques)**:
   - Si la tarea duraba 90 minutos o más, sugiere dividirla en dos bloques de 45 minutos en días separados para facilitar el encaje en agendas comprimidas.
3. **`REDUCIR` (Disminuir alcance al 60%)**:
   - Ajusta la duración a lo esencial (conceptos clave y dudas críticas) para salvar la sesión sin acumular deuda horaria.
4. **`DESCARTAR` (Posponer de la semana)**:
   - Si la tarea no corresponde a un examen de los próximos 7 días, sugiere descartarla temporalmente para aliviar la carga cognitiva.

---

## 10. Datos Iniciales & Fuente de Verdad

Los datos iniciales del sistema están programados en [server/prisma/seed.ts](file:///c:/Users/pablo/OneDrive/Documentos/Agenda-personal/server/prisma/seed.ts) tomando como referencia la fecha de simulación del **02/09/2026**:

### Horarios Fijos Oficiales
- **Lunes**:
  - `08:00 — 11:00`: Cursada Paradigmas de Programación.
  - `16:00 — 18:15`: Gimnasio (Sesión 1 Fuerza).
- **Martes**:
  - `10:30 — 12:45`: Gimnasio temprano (libera la tarde).
  - `17:30 — 18:30`: Consulta de Diseño de Sistemas (Final 08/10).
  - `19:30 salida / 21:00`: Rugby (Flexible, primera actividad sacrificable ante sobrecarga).
- **Miércoles**:
  - *Sin cursada universitaria fija*: Día de alta flexibilidad para estudio profundo y mandados.
- **Jueves**:
  - `16:00 — 18:00`: Gimnasio (Sesión 3, finaliza con 1 hora de margen antes de Sistemas).
  - `19:00 — 23:00`: Cursada Administración de Sistemas.
  - `23:00+`: Fin de jornada. Cena ligera, descanso y sueño antes de las 00:00 (prohibido estudio pesado).
- **Viernes**:
  - `08:00 — 11:00`: Cursada Paradigmas de Programación.
  - `11:00 — 14:30`: Regreso, almuerzo, descanso y buffer de preparación.
  - `14:30 — 17:00`: Cursada Economía.
  - `17:15 — 19:30`: Gimnasio (Sesión 4, arranca a las 17:15 con 15 min de margen post-Economía).
- **Sábado**:
  - `09:30 — 12:00`: Partido de Fútbol (Actividad deportiva fija).
  - `14:00 — 19:00`: Tiempo libre, amigos, mates y desconexión.
- **Domingo**:
  - Descanso y vida personal.
  - `19:30 — 20:15`: Planificación de la Semana Siguiente (45 min).

### Fechas Oficiales de Exámenes
- **Paradigmas**: 1.º Parcial (25/09/2026), 2.º Parcial (06/10/2026), Global (20/11/2026).
- **Economía**: 1.º Parcial (27/09/2026), 2.º Parcial Práctico (23/10/2026), 2.º Parcial Teórico (12/11/2026), Global (26/11/2026).
- **Diseño de Sistemas**: Examen Final (08/10/2026 — a 36 días), 72% completado, preparación en 6 etapas.

Para reiniciar la base de datos a este estado en cualquier momento:
```bash
cd server
npm run prisma:seed
```

---

## 11. Cómo Usar la Aplicación (Guía Práctica)

### Rutina del Primer Día
1. **Abrir el Dashboard** en `http://localhost:3000`.
2. **Revisar los Exámenes Próximos**: Observar la cuenta regresiva en días de Paradigmas (23d), Economía (26d) y Final de Diseño (36d).
3. **Comprobar la Agenda de Hoy**: Revisar los bloques asignados para la jornada actual.
4. **Verificar el Calendario**: Navegar a la pestaña **Calendario** para constatar que los compromisos fijos coinciden con tus horarios.
5. **Generar la Semana**: En el encabezado, hacer click en **Generar semana** $\rightarrow$ Configurar meta de gimnasio (4 sesiones) y hacer click en **Ejecutar Motor de Planificación**. Revisar la propuesta y pulsar **Confirmar & Aplicar al Calendario**.

---

## 12. Cómo Agregar una Materia

### Desde la Interfaz (Recomendado)
1. Ir a la pestaña **Académico** en la barra lateral.
2. Hacer click en el botón rojo superior **"+ Nueva Materia / Final"**.
3. Completar el formulario:
   - **Nombre**: Ej. *Redes de Información*.
   - **Tipo**: `CURSADA` o `FINAL`.
   - **Dominio Actual**: `BAJO`, `MEDIO` o `ALTO`.
   - **Peso de Importancia**: Valor entre 1.0 y 3.0 (ej. 2.0 para un final exigente).
4. Pulsar **Guardar Materia**.

### Vía API (HTTP POST)
```bash
curl -X POST http://localhost:4000/api/subjects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Redes de Información",
    "code": "REDES",
    "type": "CURSADA",
    "color": "#E50914",
    "masteryLevel": "MEDIO",
    "priorityWeight": 1.4
  }'
```

---

## 13. Cómo Agregar un Examen

### Desde la Interfaz
1. Ir a la pestaña **Académico** y seleccionar la materia en la lista izquierda.
2. Hacer click en **Nueva Tarea / Examen**.
3. Asignar título (ej. *1.º Parcial Redes*), fecha exacta y horas estimadas de preparación.
4. Al crearlo, el Planning Engine recalcula dinámicamente el `PriorityScore` de la materia en base a la proximidad en días calendario.

### Vía API (HTTP POST)
```bash
curl -X POST http://localhost:4000/api/exams \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": "ID_DE_LA_MATERIA",
    "title": "1.º Parcial Redes",
    "type": "PARCIAL_1",
    "date": "2026-10-15T09:00:00Z",
    "weight": 4.0,
    "targetHoursEstimate": 20
  }'
```

---

## 14. Cómo Agregar una Actividad

1. En el encabezado superior de cualquier pantalla, pulsar el botón **"+ Actividad"**.
2. Definir:
   - **Nombre**: Ej. *Kinesiología o Trámite*.
   - **Categoría**: `ACADEMIA`, `GIMNASIO`, `DEPORTE`, `LECTURA`, `MERCADO`, `PERSONAL`, `DESCANSO`.
   - **Flexibilidad**:
     - `FIJA`: Compromiso inamovible (médico, clase).
     - `FLEXIBLE`: Actividad reubicable por el motor si hay colisión.
     - `OPCIONAL`: Actividad prescindible ante sobrecarga.
   - **Fecha, Hora de inicio y Duración en minutos**.
3. Pulsar **Crear Actividad**. Se insertará directamente en `ScheduleBlock`.

---

## 15. Cómo Cambiar Mis Horarios

Si cambian tus horarios habituales de cursada o gimnasio, modifícalos en los siguientes lugares para mantener sincronizada la aplicación y el motor:

1. **Compromisos Fijos de la Semana en el Planning Engine**:
   - Abrir [server/src/engine/weeklyGenerator.ts](file:///c:/Users/pablo/OneDrive/Documentos/Agenda-personal/server/src/engine/weeklyGenerator.ts).
   - En la sección `1. SCHEDULE FIXED UNIVERSITY CLASSES` y `3. GIMNASIO`, ajustar las llamadas a `setHours()` y `setMinutes()`.
2. **Semilla de la Base de Datos**:
   - Abrir [server/prisma/seed.ts](file:///c:/Users/pablo/OneDrive/Documentos/Agenda-personal/server/prisma/seed.ts).
   - Modificar las fechas en el array de `prisma.scheduleBlock.createMany()` y ejecutar `npm run prisma:seed`.
3. **Restricciones Biológicas del Usuario**:
   - Abrir `seed.ts` o la tabla `User` para cambiar `targetWakeTime` (ej. "07:00") o `maxBedTime` (ej. "23:30").

---

## 16. Cómo Modificar las Reglas del Planificador

| Regla a Modificar | Archivo Responsable | Función / Bloque | Consideraciones Técnicas |
| :--- | :--- | :--- | :--- |
| **Pesos de Prioridad** | `server/src/engine/priorityScorer.ts` | `WEIGHTS` (líneas 8-15) | La suma de los pesos (`proximity`, `urgency`, `remainingWork`, `lowMastery`, `importance`, `difficulty`) debe dar exactamente `1.0`. |
| **Límite de Sueño & Wind-Down** | `server/src/engine/capacityAnalyzer.ts` | `canScheduleTaskAt()` | Modifica la condición de `windDownStartTime` (22:30) o el horario de protección del jueves (`startHours >= 23`). |
| **Duración Máxima de Concentración** | `server/src/engine/capacityAnalyzer.ts` | `chunkStudyDuration()` | Si prefieres técnica Pomodoro de 25m + 5m en lugar de 50m + 10m, modifica `chunkWorkMinutes: 25` y `chunkBreakMinutes: 5` en `DEFAULT_CONSTRAINTS`. |
| **Umbrales de Sobrecarga** | `server/src/engine/overloadDetector.ts` | `analyzeWeeklyLoad()` | Modifica las condiciones de `bufferRatioRemaining` (< 0.12 para ALTA, < 0.05 para EXCESIVA). |
| **Jerarquía de Sacrificios** | `server/src/engine/overloadDetector.ts` | Bloque condicional `if (level === 'ALTA')` | Define qué actividad deportiva o secundaria se sugiere omitir antes de tocar el estudio prioritario o el descanso. |

---

## 17. Configuración y Variables de Entorno

### Puertos de Red
- **Backend (Express)**: Puerto `4000` (definido en `server/src/app.ts`).
- **Frontend (Vite)**: Puerto `3000` (configurado en `client/vite.config.ts`).
- **Proxy Inverso**: Vite redirige automáticamente cualquier petición a `/api/*` hacia `http://localhost:4000/api/*` para evitar problemas de CORS en desarrollo.

### Archivo `.env` (en `server/.env`)
```env
# URL de conexión SQLite para Prisma
DATABASE_URL="file:./dev.db"

# Puerto de escucha del servidor
PORT=4000

# Entorno de ejecución
NODE_ENV=development
```

---

## 18. Instalación y Despliegue Local

### Requisitos Previos
- **Node.js**: Versión 18.x o superior (recomendado Node 20 LTS).
- **npm**: Versión 9.x o superior.

### Paso a Paso desde la Raíz del Proyecto

1. **Instalar dependencias en todos los workspaces**:
   ```bash
   npm install
   ```

2. **Inicializar y poblar la Base de Datos SQLite**:
   ```bash
   cd server
   npx prisma db push
   npm run prisma:seed
   cd ..
   ```

3. **Ejecutar la suite de pruebas unitarias**:
   ```bash
   npm run test:engine
   # Verifica que los 12 tests del Planning Engine pasen al 100%
   ```

4. **Compilar el Frontend (Build Check)**:
   ```bash
   npm run build
   ```

5. **Iniciar los Servidores en Desarrollo**:
   - **Terminal 1 (Backend)**:
     ```bash
     cd server
     npm run dev
     # Corre en http://localhost:4000
     ```
   - **Terminal 2 (Frontend)**:
     ```bash
     cd client
     npm run dev
     # Corre en http://localhost:3000
     ```

---

## 19. Comandos que Necesito Conocer

| Comando | Dónde Ejecutarlo | Descripción |
| :--- | :--- | :--- |
| `npm run dev` | Raíz | Inicia el backend en modo desarrollo |
| `npm run dev:client` | Raíz | Inicia el frontend Vite en el puerto 3000 |
| `npm run dev:server` | Raíz | Inicia el backend Express con `ts-node` |
| `npm run test:engine` | Raíz | Ejecuta los 12 tests unitarios del Planning Engine con Vitest |
| `npm run build` | Raíz | Compila tanto el servidor TypeScript como el cliente Vite |
| `npm test` | `server/` | Corre la suite de pruebas unitarias con Vitest |
| `npm run prisma:push` | `server/` | Sincroniza los cambios del `schema.prisma` a la base `dev.db` |
| `npm run prisma:seed` | `server/` | Limpia y re-siembra la base de datos con los horarios definitivos |
| `npm run build` | `client/` | Verifica TypeScript y compila el bundle estático de producción |

---

## 20. Testing

El proyecto cuenta con una suite completa de **12 pruebas unitarias** implementadas en **Vitest** en el directorio `server/tests/`.

### Ejecutar Tests
```bash
cd server
npm test
```

### Cobertura de las Pruebas Actuales
1. **`capacityAnalyzer.test.ts`**:
   - Bloquea cualquier asignación en ventana sagrada de sueño (00:00 a 06:30).
   - Bloquea estudio profundo durante el período de descompresión (después de las 22:30).
   - Permite lectura ligera de Filosofía/Psicología después de las 22:30.
   - Protege la noche del jueves post-cursada de Administración (23:00).
   - Fracciona bloques largos en intervalos de 50m foco + 10m pausa.
2. **`overloadDetector.test.ts`**:
   - Detecta semanas sobrecargadas cuando el buffer personal cae por debajo de los umbrales de seguridad.
   - Activa la regla de sacrificio determinista que sugiere omitir Rugby antes de comprometer el sueño.
3. **`priorityScorer.test.ts`**:
   - Pondera materias con exámenes inminentes por encima de asignaturas con parciales lejanos.
   - Asigna prioridad a tareas con bajo dominio conceptual (`masteryLevel: 'BAJO'`).
4. **`weeklyGenerator.test.ts`**:
   - Valida que la propuesta generada preserve intactas las cursadas fijas, la consulta de Diseño y el fútbol del sábado.
5. **`replanner.test.ts`**:
   - Valida la búsqueda de huecos disponibles libres de colisiones sin generar efecto dominó.

---

## 21. Debugging: Qué Hacer Si Algo Falla

| Problema Común | Causa Frecuente | Solución Inmediata |
| :--- | :--- | :--- |
| **Frontend muestra pantalla en blanco o error de red** | El backend en el puerto 4000 no está iniciado. | Iniciar el backend con `cd server && npm run dev` y verificar que responda en `http://localhost:4000/health`. |
| **Error `P2002` o `P2025` de Prisma** | Registro duplicado o clave foránea inexistente en SQLite. | Ejecutar `cd server && npm run prisma:seed` para restaurar la coherencia de datos. |
| **El calendario no muestra bloques** | Los bloques solicitados están fuera del rango de fechas consultado. | En `CalendarView.tsx`, hacer click en el botón rojo central **"Semana Actual (02 Sep)"**. |
| **El Planning Engine no genera propuesta** | Formato de fecha inválido enviado en el body. | Verificar que `mondayDate` sea un string ISO (ej. `2026-08-31T00:00:00Z`). |
| **Error de TypeScript al hacer build en el cliente** | Variable importada y no utilizada con lint estricto. | Revisar `client/tsconfig.app.json` asegurando que `noUnusedLocals: false` o limpiar los imports no usados. |

---

## 22. Archivos Más Importantes

1. **[server/src/engine/weeklyGenerator.ts](file:///c:/Users/pablo/OneDrive/Documentos/Agenda-personal/server/src/engine/weeklyGenerator.ts)**:
   - *Responsabilidad*: Ensambla la propuesta semanal completa aplicando la fuente de verdad horaria y resolviendo colisiones.
2. **[server/src/engine/capacityAnalyzer.ts](file:///c:/Users/pablo/OneDrive/Documentos/Agenda-personal/server/src/engine/capacityAnalyzer.ts)**:
   - *Responsabilidad*: Guardián biológico. Impide que cualquier tarea viole las 7.5h de sueño o la ventana post-22:30.
3. **[server/src/engine/priorityScorer.ts](file:///c:/Users/pablo/OneDrive/Documentos/Agenda-personal/server/src/engine/priorityScorer.ts)**:
   - *Responsabilidad*: Calcula matemáticamente el `PriorityScore` de cada materia y tarea.
4. **[server/prisma/schema.prisma](file:///c:/Users/pablo/OneDrive/Documentos/Agenda-personal/server/prisma/schema.prisma)**:
   - *Responsabilidad*: Define las 11 entidades de la base de datos relacional.
5. **[client/src/components/dashboard/DashboardView.tsx](file:///c:/Users/pablo/OneDrive/Documentos/Agenda-personal/client/src/components/dashboard/DashboardView.tsx)**:
   - *Responsabilidad*: Centro de control operativo diario con diseño oscuro/rojo de alto contraste.
6. **[client/src/components/calendar/CalendarView.tsx](file:///c:/Users/pablo/OneDrive/Documentos/Agenda-personal/client/src/components/calendar/CalendarView.tsx)**:
   - *Responsabilidad*: Calendario semanal interactivo con visualización de franjas y detalle de justificaciones.

---

## 23. Mapa del Código (Trazabilidad End-to-End)

### Recorrido 1: Creación de una Tarea Académica
1. **UI**: `AcademicView.tsx` $\rightarrow$ Formulario modal dispara `handleCreateTask()`.
2. **Cliente API**: `api/client.ts` $\rightarrow$ `api.createTask(payload)` realiza `POST /api/tasks`.
3. **Ruta**: `server/src/routes/api.ts` $\rightarrow$ Mapea a `TaskController.createTask`.
4. **Controlador**: `taskController.ts` $\rightarrow$ Llama a `AcademicService.createTask()`.
5. **Servicio & Motor**: `academicService.ts` calcula el `priorityScore` usando `PriorityScorer.calculateTaskPriority()`.
6. **Persistencia**: `prisma.academicTask.create()` almacena la tarea en SQLite (`dev.db`).
7. **Retorno**: El cliente recibe la tarea creada y refresca la lista automáticamente.

### Recorrido 2: Generación y Aplicación de Plan Semanal
1. **UI**: `WeeklyGeneratorModal.tsx` $\rightarrow$ Click en "Ejecutar Motor".
2. **Cliente API**: `api.generateWeek()` realiza `POST /api/planning/generate-week`.
3. **Servicio**: `planningService.ts` reúne materias y tareas de Prisma y se las entrega a `WeeklyGenerator.generateWeek()`.
4. **Motor**: Se ejecutan `OverloadDetector`, `CapacityAnalyzer` y `PriorityScorer`. Retorna la propuesta en memoria.
5. **Aprobación**: El usuario revisa en el modal y pulsa "Confirmar & Aplicar".
6. **Persistencia en Lote**: `POST /api/planning/apply-week` ejecuta `prisma.$transaction()` guardando el `WeeklyPlan` y generando todos los `ScheduleBlock` del calendario.

---

## 24. Guía de Estudio del Proyecto por Niveles

Recomendamos estudiar el código siguiendo esta progresión lógica:

- **Nivel 1: Entender el Modelo de Dominio**:
  - *Archivos*: `server/prisma/schema.prisma` y `server/src/engine/types.ts`.
  - *Concepto*: Comprender la diferencia entre `Exam`, `Topic`, `AcademicTask` y `ScheduleBlock`.
- **Nivel 2: Explorar el Planning Engine puro**:
  - *Archivos*: `server/src/engine/capacityAnalyzer.ts` y `server/src/engine/priorityScorer.ts`.
  - *Concepto*: Ver cómo se calculan las restricciones temporales sin tocar base de datos.
- **Nivel 3: Algoritmos de Balance Semanal**:
  - *Archivos*: `server/src/engine/overloadDetector.ts` y `server/src/engine/weeklyGenerator.ts`.
  - *Concepto*: Analizar la distribución de horas de cursada (12.5h) y la jerarquía de sacrificio.
- **Nivel 4: Capa de Servicios y API Express**:
  - *Archivos*: `server/src/routes/api.ts`, `services/planningService.ts` y `controllers/planningController.ts`.
  - *Concepto*: Cómo se orquestan las consultas de base de datos con los algoritmos puros del motor.
- **Nivel 5: Frontend y Tokens de Diseño**:
  - *Archivos*: `client/src/index.css`, `client/tailwind.config.js` y `client/src/api/client.ts`.
  - *Concepto*: Cómo se centraliza la paleta visual negra/roja y cómo se consumen los endpoints.
- **Nivel 6: Vistas y Modales de Usuario**:
  - *Archivos*: `DashboardView.tsx`, `CalendarView.tsx` y `WeeklyGeneratorModal.tsx`.
  - *Concepto*: Gestión de estado y renderizado de agendas interactivas.

---

## 25. Ejercicios Prácticos de Aprendizaje

Para familiarizarte modificando el código real:

1. **Ejercicio 1 (Prioridades)**: En `server/src/engine/priorityScorer.ts`, modifica el peso de `lowMastery` de 0.15 a 0.25 (ajustando otro peso para que sumen 1.0). Corre `npm test` en `server` y observa cómo cambian los scores.
2. **Ejercicio 2 (Restricción de Sueño)**: En `server/src/engine/capacityAnalyzer.ts`, cambia temporalmente `targetWakeTime` de "06:30" a "07:00" y corre los tests para verificar que el validador rechace tareas a las 06:45.
3. **Ejercicio 3 (Nuevo Hábito)**: En `server/prisma/seed.ts`, agrega un nuevo hábito (ej. *"Hidratación matutina: 2L de agua"*) y ejecuta `npm run prisma:seed`. Luego abre `HabitsView.tsx` en el navegador para verlo reflejado.
4. **Ejercicio 4 (Crear Endpoint de Consulta)**: En `server/src/routes/api.ts`, crea una ruta `GET /api/ping` que retorne `{ message: "pong", version: "1.0.0" }`.

---

## 26. Decisiones Arquitectónicas & Trade-Offs

1. **Planning Engine en TypeScript Puro vs. Integrado a Prisma**:
   - *Decisión*: Separar la lógica matemática en funciones puras sin dependencias de base de datos.
   - *Ventaja*: Se puede testear en milisegundos con Vitest y es 100% determinista y predecible.
   - *Trade-off*: Exige una capa de mapeo de tipos (`TaskInput`, `SubjectInput`) en los servicios.
2. **SQLite con Prisma vs. PostgreSQL**:
   - *Decisión*: SQLite local en archivo de desarrollo (`dev.db`).
   - *Ventaja*: Portabilidad absoluta, cero configuración de servidores externos o credenciales en local.
   - *Trade-off*: No apto para escalabilidad multiusuario concurrente en producción (fácilmente migrable cambiando el provider de Prisma).
3. **Paleta Centralizada por Tokens CSS vs. Colores Tailwind Dispersos**:
   - *Decisión*: Tokens semánticos en `index.css` mapeados a `tailwind.config.js`.
   - *Ventaja*: Permite cambiar la intensidad del rojo o el fondo de toda la aplicación desde un único archivo sin buscar y reemplazar valores hexadecimales en cientos de líneas de JSX.

---

## 27. Limitaciones Actuales

- **Autenticación simplificada**: Actualmente el sistema opera con un usuario local predeterminado (`pablo@lifeflow.local`). No cuenta con JWT ni pantalla de inicio de sesión con contraseña.
- **Persistencia de Check-ins aislada**: Los check-ins diarios se registran en la base de datos y alimentan las estadísticas, pero aún no recalculan retrospectivamente los bloques de días pasados.
- **Sincronización de Calendario Externo**: Aún no cuenta con exportación bidireccional en formato `.ics` para Google Calendar o Apple Calendar.

---

## 28. Roadmap de Evolución

- [x] **Fase 1**: Arquitectura relacional, modelo de datos y Planning Engine determinista.
- [x] **Fase 2**: API REST Express completa y persistencia SQLite.
- [x] **Fase 3**: Dashboard interactivo y Calendario semanal con candados de actividades fijas.
- [x] **Fase 4**: Módulo de materias, temas de examen y seguimiento porcentual de avances.
- [x] **Fase 5**: Modales interactivos de generación semanal, planificación diaria y replanificación.
- [x] **Fase 6**: Monitoreo de entrenamiento (Gym 4x, Deportes), sueño y racha de hábitos.
- [x] **Fase 7**: Métrica maestra de *Cumplimiento Sostenible*.
- [x] **Fase 8**: Rediseño visual definitivo en estética Dark / Red de alto contraste y calibración de la fuente de verdad horaria.
- [ ] **Fase 9 (Futura)**: Exportador/Sincronizador `.ics` para Google Calendar.
- [ ] **Fase 10 (Futura)**: Modo Offline PWA (Progressive Web App) para acceso móvil directo.

---

## 29. Guía de Usuario Diario

```
🌅 MAÑANA (07:00 — 08:30)
• Abrir Dashboard en http://localhost:3000.
• Revisar "Agenda de hoy" y constatar el primer bloque de la jornada.
• Comprobar que no existan alertas rojas de sobrecarga.

☀️ DURANTE EL DÍA
• Al completar una tarea o cursada, abrir el Calendario y hacer click en "Marcar como Completado".
• Si una sesión se retrasa o cancela, pulsar "Replanificar" para ver alternativas anti-deuda.
• Usar el widget de "Enfoque actual" (Pomodoro de 50:00) para sesiones de estudio profundo.

🌙 NOCHE (22:00 — 22:30)
• Completar el formulario de Check-in Diario en la pestaña "Entrenamiento" (sueño, energía, estrés).
• Registrar avances en la racha de hábitos en la pestaña "Hábitos".
• A las 22:30: Cesar todo estudio cognitivo universitario.
• 22:30 a 23:30: Lectura ligera de Filosofía o Psicología sin pantallas.
• 00:00: Dormir (inviolable).

🗓️ DOMINGO POR LA TARDE/NOCHE (19:30 — 20:15)
• Sesión breve de Planificación Semanal (45 min).
• Abrir "Generar semana", verificar balance de horas y confirmar los bloques para el lunes.
```
