"use client";

import UniversalCharacterSheet from "@/components/characters/UniversalCharacterSheet";

export default function SessionCharacterSheet({ id }: { id: string }) {
  return <UniversalCharacterSheet id={id} isSession={true} />;
}
