"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBlankCharacter } from "@/lib/characterStore";

export default function NewCharacterPage() {
  const router = useRouter();

  useEffect(() => {
    const character = createBlankCharacter();
    try {
      window.sessionStorage.setItem(`dnd-sheets.character-draft.${character.id}`, JSON.stringify(character));
    } catch {
      // ignore sessionStorage errors
    }
    router.replace(`/characters/${character.id}?draft=1`);
  }, [router]);

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-sm text-[var(--app-muted)] shadow-sm">
      Criando personagem...
    </div>
  );
}
