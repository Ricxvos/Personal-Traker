import type { AreaSlug } from "./areas";

export interface MetricSuggestion {
  name: string;
  unit: string;
  defaultSource:
    | "manual"
    | "google_fit"
    | "google_calendar"
    | "ms_graph"
    | "ms_ics"
    | "coupler"
    | "csv"
    | "sheets";
  higherIsBetter: boolean;
  description: string;
}

export const METRICS_BY_AREA: Record<AreaSlug, MetricSuggestion[]> = {
  health: [
    {
      name: "Pasos diarios",
      unit: "pasos",
      defaultSource: "google_fit",
      higherIsBetter: true,
      description: "Pasos detectados por el Galaxy Watch o el celular vía Health Connect.",
    },
    {
      name: "Sueño",
      unit: "horas",
      defaultSource: "google_fit",
      higherIsBetter: true,
      description: "Horas de sueño según Samsung Health.",
    },
    {
      name: "Frecuencia cardiaca en reposo",
      unit: "lpm",
      defaultSource: "google_fit",
      higherIsBetter: false,
      description: "FC en reposo medida por el Galaxy Watch.",
    },
    {
      name: "Peso",
      unit: "kg",
      defaultSource: "manual",
      higherIsBetter: false,
      description: "Peso corporal capturado manualmente o desde báscula inteligente.",
    },
    {
      name: "Calorías quemadas",
      unit: "kcal",
      defaultSource: "google_fit",
      higherIsBetter: true,
      description: "Calorías activas según Health Connect.",
    },
    {
      name: "Kilómetros corridos",
      unit: "km",
      defaultSource: "google_fit",
      higherIsBetter: true,
      description: "Distancia corrida en sesiones de ejercicio.",
    },
  ],
  work: [
    {
      name: "Horas en juntas",
      unit: "horas",
      defaultSource: "ms_graph",
      higherIsBetter: false,
      description: "Calculado a partir de los eventos de Outlook.",
    },
    {
      name: "Bloques de focus time",
      unit: "bloques",
      defaultSource: "ms_graph",
      higherIsBetter: true,
      description: "Bloques sin juntas mayores a 90 minutos.",
    },
    {
      name: "Tareas completadas",
      unit: "tareas",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Tareas marcadas como done en el día.",
    },
  ],
  venture: [
    {
      name: "Horas de deep work",
      unit: "horas",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Tiempo enfocado en el proyecto/emprendimiento.",
    },
    {
      name: "Ingresos del proyecto",
      unit: "MXN",
      defaultSource: "csv",
      higherIsBetter: true,
      description: "Ingresos del side project capturados manualmente o por CSV.",
    },
    {
      name: "Hitos completados",
      unit: "hitos",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Entregables del roadmap del proyecto.",
    },
    {
      name: "Conversaciones con clientes",
      unit: "conversaciones",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Calls/leads/clientes contactados en el periodo.",
    },
  ],
  social: [
    {
      name: "Seguidores Instagram",
      unit: "seguidores",
      defaultSource: "coupler",
      higherIsBetter: true,
      description: "Sincronizado vía Coupler.io.",
    },
    {
      name: "Vistas TikTok",
      unit: "vistas",
      defaultSource: "coupler",
      higherIsBetter: true,
      description: "Vistas semanales agregadas.",
    },
    {
      name: "Engagement rate",
      unit: "%",
      defaultSource: "coupler",
      higherIsBetter: true,
      description: "(likes + comentarios) / alcance.",
    },
    {
      name: "Publicaciones publicadas",
      unit: "posts",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Cantidad de posts publicados.",
    },
  ],
  relationships: [
    {
      name: "Citas / encuentros con pareja",
      unit: "encuentros",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Tiempo de calidad agendado.",
    },
    {
      name: "Llamadas a familia",
      unit: "llamadas",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Llamadas/visitas a padres y hermanos.",
    },
    {
      name: "Reuniones con amigos",
      unit: "reuniones",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Eventos sociales semanales.",
    },
  ],
  finance: [
    {
      name: "Ingresos del mes",
      unit: "MXN",
      defaultSource: "csv",
      higherIsBetter: true,
      description: "Suma de ingresos importados por CSV bancario o Sheets.",
    },
    {
      name: "Gastos del mes",
      unit: "MXN",
      defaultSource: "csv",
      higherIsBetter: false,
      description: "Suma de gastos importados.",
    },
    {
      name: "Ahorro neto",
      unit: "MXN",
      defaultSource: "csv",
      higherIsBetter: true,
      description: "Ingresos − Gastos del mes.",
    },
    {
      name: "% ahorro",
      unit: "%",
      defaultSource: "csv",
      higherIsBetter: true,
      description: "Ahorro neto sobre ingresos.",
    },
  ],
  study: [
    {
      name: "Horas de estudio",
      unit: "horas",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Tiempo dedicado al curso o tema.",
    },
    {
      name: "Lecciones completadas",
      unit: "lecciones",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Avance dentro del curso/programa.",
    },
    {
      name: "Certificaciones obtenidas",
      unit: "certificaciones",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Certificados completados en el periodo.",
    },
  ],
  spiritual: [
    {
      name: "Minutos de oración",
      unit: "minutos",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Tiempo diario en oración.",
    },
    {
      name: "Minutos de meditación",
      unit: "minutos",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Práctica meditativa.",
    },
    {
      name: "Lectura espiritual",
      unit: "minutos",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Lectura bíblica o de textos espirituales.",
    },
    {
      name: "Asistencia a comunidad",
      unit: "asistencias",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Misas, retiros, grupo de fe.",
    },
  ],
  reading: [
    {
      name: "Páginas leídas",
      unit: "páginas",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Páginas leídas en el día.",
    },
    {
      name: "Libros terminados",
      unit: "libros",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Libros completados en el periodo.",
    },
    {
      name: "Minutos leyendo",
      unit: "minutos",
      defaultSource: "manual",
      higherIsBetter: true,
      description: "Tiempo de lectura.",
    },
  ],
};
