import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finanzia",
  description: "Centraliza tus cuentas y controla tu margen de gasto disponible.",
};

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/cuentas", label: "Cuentas" },
  { href: "/ingresos", label: "Ingresos" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b">
          <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-6">
            <span className="font-semibold">Finanzia</span>
            <div className="flex gap-4 text-sm">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:underline">
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
