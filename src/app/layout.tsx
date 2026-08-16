import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavLinks } from "./NavLinks";

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
            <NavLinks />
          </nav>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
