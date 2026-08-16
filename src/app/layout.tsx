import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Wallet } from "lucide-react";
import "./globals.css";
import { NavLinks } from "./NavLinks";
import { LogoutButton } from "./LogoutButton";
import { getSession } from "@/lib/session";

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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-[var(--border)] sticky top-0 z-10 bg-[var(--background)]/90 backdrop-blur-sm">
          <nav className="max-w-5xl mx-auto px-6 py-3.5 flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span
                className="icon-badge"
                style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
              >
                <Wallet size={18} strokeWidth={2.25} aria-hidden />
              </span>
              <span className="font-semibold tracking-tight hidden sm:inline">Finanzia</span>
            </Link>
            {session?.user ? (
              <>
                <NavLinks />
                <div className="ml-auto flex items-center gap-4 text-sm text-foreground-muted">
                  <span className="hidden sm:inline">{session.user.name ?? session.user.email}</span>
                  <LogoutButton />
                </div>
              </>
            ) : (
              <Link href="/login" className="ml-auto btn btn-secondary">
                Iniciar sesión
              </Link>
            )}
          </nav>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
