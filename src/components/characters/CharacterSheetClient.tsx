"use client";

import UniversalCharacterSheet from "@/components/characters/UniversalCharacterSheet";

export default function CharacterSheetClient({ id }: { id: string }) {
  return <UniversalCharacterSheet id={id} isSession={false} />;
}
