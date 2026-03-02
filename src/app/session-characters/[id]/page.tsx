import SessionCharacterSheet from "@/components/SessionCharacterSheet";

export default async function SessionCharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SessionCharacterSheet id={id} />;
}
