"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Landmark, Wallet, ArrowLeftRight, PieChart, SlidersHorizontal } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cuentas", label: "Cuentas", icon: Landmark },
  { href: "/ingresos", label: "Ingresos", icon: Wallet },
  { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/reportes", label: "Reportes", icon: PieChart },
  { href: "/regla", label: "Regla", icon: SlidersHorizontal },
];

export function NavLinks() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="flex gap-1">
      {NAV_LINKS.map((link) => {
        const Icon = link.icon;
        const active = isActive(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={active ? "nav-link nav-link-active" : "nav-link"}
          >
            <Icon size={16} strokeWidth={2} aria-hidden />
            <span className="hidden md:inline">{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
