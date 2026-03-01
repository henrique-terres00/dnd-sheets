import MapClient from "@/components/map/MapClient";

export default function MapPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Mapa</h1>
        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Arraste os tokens. Eles fazem snap no grid e salvam no seu navegador.
        </div>
      </div>

      <MapClient />
    </div>
  );
}
