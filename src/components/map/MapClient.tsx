"use client";

import Image from "next/image";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getCharacter, listCharacters } from "@/lib/characterStore";
import type { Character } from "@/lib/types";
import { MapDiceRoller } from "@/components/dice/MapDiceRoller";
import { InlineRollLog } from "@/components/dice/InlineRollLog";

type TokenKind = "elf" | "dwarf" | "orc" | "dragon" | "goblin" | "skeleton";

type Enemy = {
  id: string;
  name: string;
  imageSrc: string;
};

type Token = {
  id: string;
  kind: TokenKind | "character" | "enemy";
  characterId?: string;
  enemyId?: string;
  imageSrc?: string;
  x: number;
  y: number;
};

type MapBackground =
  | { kind: "none" }
  | { kind: "preset"; src: string; label: string }
  | { kind: "upload"; dataUrl: string; label: string };

type MapState = {
  gridSize: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  background: MapBackground;
  tokens: Token[];
};

const STORAGE_KEY = "dnd-sheets.map.v1";
const ENEMIES_KEY = "dnd-sheets.enemies.v1";

const DEFAULT_ENEMIES: Enemy[] = [
  { id: "dragon", name: "Dragão", imageSrc: "/tokens/dragon.png" },
  { id: "goblin", name: "Goblin", imageSrc: "/tokens/goblin.png" },
  { id: "skeleton", name: "Esqueleto", imageSrc: "/tokens/skeleton.png" },
  { id: "orc", name: "Orc", imageSrc: "/tokens/orc.png" },
  { id: "elf", name: "Elfo", imageSrc: "/tokens/elf.png" },
  { id: "dwarf", name: "Anão", imageSrc: "/tokens/dwarf.png" },
];

function snap(value: number, grid: number) {
  return Math.round(value / grid) * grid;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function loadState(): MapState {
  if (typeof window === "undefined") {
    return { gridSize: 50, scale: 1, offsetX: 0, offsetY: 0, background: { kind: "none" }, tokens: [] };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { gridSize: 50, scale: 1, offsetX: 0, offsetY: 0, background: { kind: "none" }, tokens: [] };
    const parsed = JSON.parse(raw) as MapState;

    if (!parsed || typeof parsed !== "object") return { gridSize: 50, scale: 1, offsetX: 0, offsetY: 0, background: { kind: "none" }, tokens: [] };
    if (!Array.isArray(parsed.tokens)) return { gridSize: 50, scale: 1, offsetX: 0, offsetY: 0, background: { kind: "none" }, tokens: [] };

    const bg = (parsed as unknown as { background?: unknown }).background;
    let background: MapBackground = { kind: "none" };
    if (bg && typeof bg === "object" && "kind" in bg) {
      const kind = (bg as { kind: unknown }).kind;
      const rec = bg as Record<string, unknown>;
      if (kind === "preset" && typeof rec.src === "string" && typeof rec.label === "string") {
        if (rec.src === "/maps/stone-floor.svg") {
          background = { kind: "none" };
        } else {
          background = { kind: "preset", src: rec.src, label: rec.label };
        }
      } else if (kind === "upload" && typeof rec.dataUrl === "string" && typeof rec.label === "string") {
        background = { kind: "upload", dataUrl: rec.dataUrl, label: rec.label };
      }
    }

    return {
      gridSize: parsed.gridSize || 50,
      scale: parsed.scale || 1,
      offsetX: parsed.offsetX || 0,
      offsetY: parsed.offsetY || 0,
      background,
      tokens: parsed.tokens
        .filter((t) => t && typeof t === "object")
        .map((t) => ({
          id: String((t as Token).id),
          kind: (t as Token).kind,
          characterId: (t as Token).characterId ? String((t as Token).characterId) : undefined,
          enemyId: (t as Token).enemyId ? String((t as Token).enemyId) : undefined,
          imageSrc: typeof (t as Token).imageSrc === "string" ? (t as Token).imageSrc : "",
          x: Number((t as Token).x) || 0,
          y: Number((t as Token).y) || 0,
        }))
        .filter(
          (t) =>
            t.kind === "dragon" ||
            t.kind === "goblin" ||
            t.kind === "skeleton" ||
            t.kind === "orc" ||
            t.kind === "elf" ||
            t.kind === "dwarf" ||
            t.kind === "character" ||
            t.kind === "enemy",
        ),
    };
  } catch {
    return { gridSize: 50, scale: 1, offsetX: 0, offsetY: 0, background: { kind: "none" }, tokens: [] };
  }
}

function loadEnemies(): Enemy[] {
  if (typeof window === "undefined") return DEFAULT_ENEMIES;

  try {
    const raw = window.localStorage.getItem(ENEMIES_KEY);
    if (!raw) return DEFAULT_ENEMIES;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_ENEMIES;

    const custom = parsed
      .filter((e) => e && typeof e === "object")
      .map((e) => {
        const rec = e as Record<string, unknown>;
        return {
          id: typeof rec.id === "string" ? rec.id : "",
          name: typeof rec.name === "string" ? rec.name : "",
          imageSrc: typeof rec.imageSrc === "string" ? rec.imageSrc : "",
        } satisfies Enemy;
      })
      .filter((e) => Boolean(e.id) && Boolean(e.name) && Boolean(e.imageSrc));

    const byId = new Map<string, Enemy>();
    for (const d of DEFAULT_ENEMIES) byId.set(d.id, d);
    for (const c of custom) byId.set(c.id, c);
    return Array.from(byId.values());
  } catch {
    return DEFAULT_ENEMIES;
  }
}

function saveEnemies(enemies: Enemy[]) {
  window.localStorage.setItem(ENEMIES_KEY, JSON.stringify(enemies));
}

function saveState(state: MapState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function tokenSrc(kind: TokenKind) {
  switch (kind) {
    case "dragon":
      return "/tokens/dragon.png";
    case "goblin":
      return "/tokens/goblin.png";
    case "skeleton":
      return "/tokens/skeleton.png";
    case "elf":
      return "/tokens/elf.png";
    case "dwarf":
      return "/tokens/dwarf.png";
    case "orc":
      return "/tokens/orc.png";
  }
}

function safeTokenImage(token: Token) {
  if (token.kind === "character") {
    if (token.imageSrc) return token.imageSrc;
    if (token.characterId) {
      const c = getCharacter(token.characterId);
      if (c?.avatarDataUrl) return c.avatarDataUrl;
    }
    return "/tokens/elf.png";
  }
  if (token.kind === "enemy") {
    return token.imageSrc ?? "/tokens/orc.png";
  }
  if (token.kind === "dragon" || token.kind === "goblin" || token.kind === "skeleton") {
    return tokenSrc(token.kind);
  }
  return tokenSrc(token.kind);
}

export default function MapClient() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const initial = useMemo(() => loadState(), []);
  const [gridSize, setGridSize] = useState(50);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);
  const [tokens, setTokens] = useState<Token[]>(initial.tokens);
  const [background, setBackground] = useState<MapBackground>(initial.background);
  const [characters, setCharacters] = useState<Character[]>(() => (typeof window === "undefined" ? [] : listCharacters()));
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");

  const [enemies, setEnemies] = useState<Enemy[]>(() => (typeof window === "undefined" ? DEFAULT_ENEMIES : loadEnemies()));
  const [selectedEnemyId, setSelectedEnemyId] = useState<string>("");
  const [newEnemyName, setNewEnemyName] = useState<string>("");
  const [newEnemyImageDataUrl, setNewEnemyImageDataUrl] = useState<string>("");
  const [isDiceRollerOpen, setIsDiceRollerOpen] = useState<boolean>(false);

  const isCreatingEnemy = selectedEnemyId === "__new__";

  const [dragging, setDragging] = useState<{
    id: string;
    pointerOffsetX: number;
    pointerOffsetY: number;
  } | null>(null);

  useEffect(() => {
    saveState({ gridSize, scale, offsetX, offsetY, background, tokens });
  }, [gridSize, scale, offsetX, offsetY, background, tokens]);

  useEffect(() => {
    setCharacters(listCharacters());
  }, []);

  useEffect(() => {
    saveEnemies(enemies);
  }, [enemies]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== 0) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const addCharacterToken = () => {
    if (!selectedCharacterId) return;
    const character = getCharacter(selectedCharacterId);
    if (!character) return;

    const id = `character-${selectedCharacterId}-${crypto.randomUUID()}`;
    const imageSrc = character.avatarDataUrl ?? undefined;

    setTokens((prev) => [
      ...prev,
      {
        id,
        kind: "character",
        characterId: selectedCharacterId,
        imageSrc,
        x: snap(100, gridSize),
        y: snap(100, gridSize),
      },
    ]);
  };

  const addEnemyToken = () => {
    if (!selectedEnemyId || selectedEnemyId === "__new__") return;
    const enemy = enemies.find((e) => e.id === selectedEnemyId);
    if (!enemy) return;

    const id = `enemy-${selectedEnemyId}-${crypto.randomUUID()}`;
    setTokens((prev) => [
      ...prev,
      {
        id,
        kind: "enemy",
        enemyId: selectedEnemyId,
        imageSrc: enemy.imageSrc,
        x: snap(100, gridSize),
        y: snap(100, gridSize),
      },
    ]);
  };

  const addCustomEnemy = () => {
    const name = newEnemyName.trim();
    const imageSrc = newEnemyImageDataUrl;
    if (!name || !imageSrc) return;

    const id = `custom-${crypto.randomUUID()}`;
    setEnemies((prev) => [...prev, { id, name, imageSrc }]);
    setSelectedEnemyId(id);
    setNewEnemyName("");
    setNewEnemyImageDataUrl("");
  };

  const removeToken = (id: string) => {
    setTokens((prev) => prev.filter((t) => t.id !== id));
  };

  const reset = () => {
    setTokens([]);
    setGridSize(50);
    setBackground({ kind: "none" });
  };

  const PRESET_MAPS: Array<{ label: string; src: string }> = [
    { label: "Forest", src: "/maps/forest.jpg" },
    { label: "Swamp", src: "/maps/swamp.jpg" },
    { label: "Grid (sem imagem)", src: "" },
  ];

  const backgroundCss =
    background.kind === "preset"
      ? background.src
      : background.kind === "upload"
        ? background.dataUrl
        : "";

  async function fileToDataUrl(file: File) {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    return `data:${file.type};base64,${base64}`;
  }

  const onPointerDownToken = (e: React.PointerEvent, token: Token) => {
    const el = e.currentTarget as HTMLDivElement;
    el.setPointerCapture(e.pointerId);

    const rect = el.getBoundingClientRect();
    setDragging({
      id: token.id,
      pointerOffsetX: e.clientX - rect.left,
      pointerOffsetY: e.clientY - rect.top,
    });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      
      // Cancel previous animation frame
      if (animationFrameRef.current !== 0) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Use requestAnimationFrame for smoother panning
      animationFrameRef.current = requestAnimationFrame(() => {
        setOffsetX(prev => prev + deltaX);
        setOffsetY(prev => prev + deltaY);
        setPanStart({ x: e.clientX, y: e.clientY });
      });
      return;
    }
    
    if (!dragging) return;
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    const rawX = (e.clientX - containerRect.left - offsetX - dragging.pointerOffsetX) / scale;
    const rawY = (e.clientY - containerRect.top - offsetY - dragging.pointerOffsetY) / scale;

    const maxX = (containerRect.width / scale) - 40;
    const maxY = (containerRect.height / scale) - 40;

    const x = snap(clamp(rawX, 0, maxX), gridSize);
    const y = snap(clamp(rawY, 0, maxY), gridSize);

    setTokens((prev) => prev.map((t) => (t.id === dragging.id ? { ...t, x, y } : t)));
  };

  const onPointerUp = () => {
    setDragging(null);
    setIsPanning(false);
  };

  // Add wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wheelHandler = (e: WheelEvent) => {
      if (e.shiftKey || e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(prev => clamp(prev * delta, 0.5, 3));
      }
    };

    container.addEventListener('wheel', wheelHandler, { passive: false });

    return () => {
      container.removeEventListener('wheel', wheelHandler);
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    // Disable context menu when panning
    if (isPanning) {
      e.preventDefault();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.shiftKey && e.button === 0) { // Left click + Shift
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] [color-scheme:dark]"
              value={selectedEnemyId}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedEnemyId(v);
                if (v !== "__new__") {
                  setNewEnemyName("");
                  setNewEnemyImageDataUrl("");
                }
              }}
            >
              <option value="">Adicionar inimigo...</option>
              <option value="__new__">+ Criar inimigo...</option>
              {enemies.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <button
              className="rounded-lg border border-[var(--app-border)] bg-amber-500/15 px-3 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={addEnemyToken}
              type="button"
              disabled={!selectedEnemyId || selectedEnemyId === "__new__"}
            >
              Adicionar Inimigo
            </button>
            {isCreatingEnemy ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="w-44 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                  value={newEnemyName}
                  onChange={(e) => setNewEnemyName(e.target.value)}
                  placeholder="Nome"
                />
                <label className="w-fit cursor-pointer rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]">
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const dataUrl = await fileToDataUrl(file);
                      setNewEnemyImageDataUrl(dataUrl);
                    }}
                  />
                  Escolher arquivo
                </label>
                <button
                  className="rounded-lg border border-[var(--app-border)] bg-amber-500/15 px-3 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  onClick={addCustomEnemy}
                  disabled={!newEnemyName.trim() || !newEnemyImageDataUrl}
                >
                  Salvar
                </button>
              </div>
            ) : null}
          </div>

          <div className="h-6 w-px bg-[var(--app-border)]" />

          <select
            className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] [color-scheme:dark]"
            value={selectedCharacterId}
            onChange={(e) => setSelectedCharacterId(e.target.value)}
          >
            <option value="">Adicionar personagem...</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || "(Sem nome)"}
              </option>
            ))}
          </select>
          <button
            className="rounded-lg border border-[var(--app-border)] bg-amber-500/15 px-3 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={addCharacterToken}
            type="button"
            disabled={!selectedCharacterId}
          >
            Adicionar Personagem
          </button>
          <Link
            href="/characters"
            className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
          >
            Ver fichas
          </Link>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
            onClick={reset}
            type="button"
          >
            Reset
          </button>
        </div>
        </div>

        <div className="text-xs text-[var(--app-muted)]">
          Dica: clique com o botão direito em um token para remover.
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-medium">Background do mapa</div>
            <button
              type="button"
              className="w-fit rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]"
              onClick={() => setBackground({ kind: "none" })}
            >
              Remover background
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)] [color-scheme:dark]"
              value={background.kind === "preset" ? background.src : ""}
              onChange={(e) => {
                const src = e.target.value;
                if (!src) {
                  setBackground({ kind: "none" });
                  return;
                }
                const match = PRESET_MAPS.find((m) => m.src === src);
                setBackground({ kind: "preset", src, label: match?.label ?? "Mapa" });
              }}
            >
              <option value="">Selecionar mapa padrão...</option>
              {PRESET_MAPS.filter((m) => m.src).map((m) => (
                <option key={m.src} value={m.src}>
                  {m.label}
                </option>
              ))}
            </select>

            <label className="w-fit cursor-pointer rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-medium text-[var(--app-fg)] hover:bg-[var(--app-border)]">
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const dataUrl = await fileToDataUrl(file);
                  setBackground({ kind: "upload", dataUrl, label: file.name });
                }}
              />
              Escolher arquivo
            </label>
          </div>

          <div className="text-xs text-[var(--app-muted)]">
            Mapas padrão ficam em <span className="font-mono">public/maps</span>. Uploads são salvos no seu navegador.
          </div>
        </div>
      </div>

      {/* Dice Roller */}
      <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
        <button
          className="rounded-xl border border-[var(--app-border)] bg-purple-500/20 px-4 py-3 text-sm font-medium text-[var(--app-fg)] hover:bg-purple-500/30"
          onClick={() => setIsDiceRollerOpen(true)}
          type="button"
        >
          🎲 Rolagem de Dados
        </button>
        <InlineRollLog />
      </div>

      <div className="relative">
        {/* Zoom Controls - Outside map container */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
          <button
            className="w-10 h-10 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-fg)] hover:bg-[var(--app-border)] flex items-center justify-center text-sm font-medium shadow-sm"
            onClick={() => setScale(prev => clamp(prev * 1.2, 0.5, 3))}
            title="Zoom In (Ctrl + Scroll ou Shift + Scroll)"
          >
            +
          </button>
          <button
            className="w-10 h-10 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-fg)] hover:bg-[var(--app-border)] flex items-center justify-center text-sm font-medium shadow-sm"
            onClick={() => setScale(prev => clamp(prev * 0.8, 0.5, 3))}
            title="Zoom Out (Ctrl + Scroll ou Shift + Scroll)"
          >
            −
          </button>
          <button
            className="w-10 h-10 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-fg)] hover:bg-[var(--app-border)] flex items-center justify-center text-xs font-medium shadow-sm"
            onClick={() => {
              setScale(1);
              setOffsetX(0);
              setOffsetY(0);
            }}
            title="Reset View (Voltar ao padrão)"
          >
            ⟲
          </button>
        </div>

        <div
          ref={containerRef}
          className="relative h-[70vh] w-full overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg)] shadow-sm"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onContextMenu={handleContextMenu}
          onMouseDown={handleMouseDown}
        >
          {/* Map content with zoom/pan transformations */}
          <div
            className="absolute inset-0"
            style={{
              transform: `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`,
              transformOrigin: '0 0',
              backgroundImage: backgroundCss
                ? `url(${backgroundCss}), linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)`
                : `linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)`,
              backgroundSize: backgroundCss
                ? `cover, ${gridSize * scale}px ${gridSize * scale}px, ${gridSize * scale}px ${gridSize * scale}px`
                : `${gridSize * scale}px ${gridSize * scale}px, ${gridSize * scale}px ${gridSize * scale}px`,
              backgroundPosition: backgroundCss ? "center, 0 0, 0 0" : "0 0, 0 0",
              backgroundRepeat: backgroundCss ? "no-repeat, repeat, repeat" : "repeat, repeat",
            }}
          >
        {tokens.map((t) => {
          const isCharacter = t.kind === "character";
          const tokenSize = isCharacter ? "h-20 w-20" : "h-24 w-24";
          const imageSize = isCharacter ? 80 : 96;
          
          return (
            <div
              key={t.id}
              className={`absolute ${tokenSize} touch-none select-none`}
              style={{ 
                left: t.x * scale, 
                top: t.y * scale,
                transform: `scale(${scale})`
              }}
              onPointerDown={(e) => onPointerDownToken(e, t)}
              onContextMenu={(e) => {
                e.preventDefault();
                removeToken(t.id);
              }}
              role="button"
              tabIndex={0}
              title={
                t.kind === "character"
                  ? getCharacter(t.characterId ?? "")?.name || "Personagem"
                  : t.kind === "enemy"
                    ? enemies.find((e) => e.id === t.enemyId)?.name || "Inimigo"
                  : t.kind === "dragon"
                    ? "Dragão"
                    : t.kind === "goblin"
                      ? "Goblin"
                      : t.kind === "skeleton"
                        ? "Esqueleto"
                        : t.kind === "elf"
                          ? "Elfo"
                          : t.kind === "dwarf"
                            ? "Anão"
                            : "Orc"
              }
            >
              {safeTokenImage(t).startsWith("data:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={safeTokenImage(t)} alt={t.kind} className={`${tokenSize}`} draggable={false} />
              ) : (
                <Image src={safeTokenImage(t)} alt={t.kind} width={imageSize} height={imageSize} draggable={false} />
              )}
            </div>
          );
        })}
      </div>
          </div>
      </div>
      
      {/* Dice Roller Popup */}
      <MapDiceRoller isOpen={isDiceRollerOpen} onClose={() => setIsDiceRollerOpen(false)} />
    </div>
  );
}
