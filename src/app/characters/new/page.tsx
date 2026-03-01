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
      // ignore
    }
    router.replace(`/characters/${character.id}?draft=1`);
  }, [router]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
      Criando personagem...
    </div>
  );
}
