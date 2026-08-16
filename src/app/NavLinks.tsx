"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/cuentas", label: "Cuentas" },
  { href: "/ingresos", label: "Ingresos" },
  { href: "/movimientos", label: "Movimientos" },
  { href: "/reportes", label: "Reportes" },
];

export function NavLinks() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="flex gap-6 text-sm">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={isActive(link.href) ? "page" : undefined}
          className={
            isActive(link.href)
              ? "border-b-2 border-accent pb-1 font-medium text-foreground"
              : "border-b-2 border-transparent pb-1 text-foreground-muted transition-colors hover:text-foreground"
          }
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
