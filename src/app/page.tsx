import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Image src="/treasure.png" alt="D&D Sheets Logo" className="h-20 w-auto" width={80} height={80} unoptimized />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">D&amp;D Sheets</h1>
            <p className="mt-2 text-sm text-[var(--app-muted)]">
              Crie fichas de Dungeons &amp; Dragons (5e) e gerencie sua campanha com mapas e tokens.
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/campaigns"
            className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
          >
            Campanhas
          </Link>
          <Link
            href="/characters"
            className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
          >
            Personagens
          </Link>
          <Link
            href="/map"
            className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
          >
            Mapa
          </Link>
          <Link
            href="/rolls"
            className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
          >
            🎲 Rolagens
          </Link>
        </div>
      </div>
    </div>
  );
}
