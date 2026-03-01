import { RollLog } from "@/components/dice/RollLog";

export default function RollsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--app-fg)]">📜 Log de Rolagens</h1>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          Todas as rolagens de dados dos jogadores aparecem aqui em tempo real.
        </p>
      </div>
      
      <RollLog />
    </div>
  );
}
