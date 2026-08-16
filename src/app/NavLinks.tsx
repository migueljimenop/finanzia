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
    <div className="flex gap-4 text-sm">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={isActive(link.href) ? "page" : undefined}
          className={
            isActive(link.href)
              ? "font-semibold underline underline-offset-4"
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          }
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}