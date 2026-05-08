export type AreaSlug =
  | "health"
  | "work"
  | "venture"
  | "social"
  | "relationships"
  | "finance"
  | "study"
  | "spiritual"
  | "reading";

export interface AreaSeed {
  slug: AreaSlug;
  nameEs: string;
  emoji: string;
  sortOrder: number;
}

export const AREAS: AreaSeed[] = [
  { slug: "health", nameEs: "Salud", emoji: "🏃", sortOrder: 1 },
  { slug: "work", nameEs: "Trabajo", emoji: "💼", sortOrder: 2 },
  { slug: "venture", nameEs: "Emprendimiento/Proyectos", emoji: "🚀", sortOrder: 3 },
  { slug: "social", nameEs: "Redes Sociales", emoji: "📱", sortOrder: 4 },
  { slug: "relationships", nameEs: "Relaciones", emoji: "❤️", sortOrder: 5 },
  { slug: "finance", nameEs: "Finanzas", emoji: "💰", sortOrder: 6 },
  { slug: "study", nameEs: "Estudio", emoji: "📚", sortOrder: 7 },
  { slug: "spiritual", nameEs: "Espiritual", emoji: "🕊️", sortOrder: 8 },
  { slug: "reading", nameEs: "Lectura", emoji: "📖", sortOrder: 9 },
];
