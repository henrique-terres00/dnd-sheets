"use client";

import { useParams, useSearchParams } from "next/navigation";
import UniversalCharacterSheet from "@/components/characters/UniversalCharacterSheet";

export default function SessionCharacterSheet({ id }: { id: string }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const characterId = params.id as string;
  const sessionCode = searchParams.get('session') || '';
  
  return <UniversalCharacterSheet id={characterId} isSession={true} sessionCode={sessionCode} />;
}
