import type { Metadata } from "next";
import { Cinzel, IM_Fell_English, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

const medievalDisplay = Cinzel({
  variable: "--font-medieval-display",
  subsets: ["latin"],
});

const medievalBody = IM_Fell_English({
  variable: "--font-medieval-body",
  subsets: ["latin"],
  weight: ["400"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "D&D Sheets",
  description: "Fichas e mapas para campanhas de Dungeons & Dragons",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${medievalDisplay.variable} ${medievalBody.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--app-fg)]">
          <header className="border-b border-[var(--app-border)] bg-[var(--app-surface)]/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-3">
              <Link href="/" className="flex items-center gap-3 font-[var(--font-medieval-display)] text-lg font-semibold tracking-wide">
                <Image src="/logo.png" alt="D&D Sheets Logo" className="h-24 w-auto" width={96} height={96} unoptimized />
                <span>D&amp;D Sheets</span>
              </Link>
              <nav className="ml-auto flex items-center gap-4 text-sm text-[var(--app-muted)]">
                <Link className="hover:text-[var(--app-fg)]" href="/campaigns">
                  Campanhas
                </Link>
                <Link className="hover:text-[var(--app-fg)]" href="/characters">
                  Personagens
                </Link>
                <Link className="hover:text-[var(--app-fg)]" href="/map">
                  Mapa
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
