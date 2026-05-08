"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Target, Flame, BarChart3, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/today", label: "Hoy", Icon: Calendar },
  { href: "/goals", label: "Metas", Icon: Target },
  { href: "/habits", label: "Hábitos", Icon: Flame },
  { href: "/progress", label: "Progreso", Icon: BarChart3 },
  { href: "/integrations", label: "Conexiones", Icon: Plug },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
