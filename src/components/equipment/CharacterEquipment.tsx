"use client";

import { useState } from "react";
import { EquipmentManager } from "./EquipmentManager";
import type { Weapon, Armor, Equipment } from "@/lib/equipment";

interface CharacterEquipmentProps {
  character: any;
  onUpdate: (equipment: any) => void;
}

export function CharacterEquipment({ character, onUpdate }: CharacterEquipmentProps) {
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  
  // Get current equipment or initialize empty
  const currentEquipment = character.characterEquipment || {
    weapons: [],
    armor: null,
    shield: null,
    equipment: []
  };

  const handleAddWeapon = (weapon: Weapon) => {
    const updated = {
      ...currentEquipment,
      weapons: [...currentEquipment.weapons, weapon]
    };
    onUpdate(updated);
  };

  const handleAddArmor = (armor: Armor) => {
    if (armor.type === 'shield') {
      // Add as shield
      const updated = {
        ...currentEquipment,
        shield: armor
      };
      onUpdate(updated);
    } else {
      // Add as armor (replace existing)
      const updated = {
        ...currentEquipment,
        armor: armor
      };
      onUpdate(updated);
    }
  };

  const handleAddEquipment = (equipment: Equipment) => {
    const updated = {
      ...currentEquipment,
      equipment: [...currentEquipment.equipment, equipment]
    };
    onUpdate(updated);
  };

  const handleRemoveWeapon = (weaponId: string) => {
    const updated = {
      ...currentEquipment,
      weapons: currentEquipment.weapons.filter((w: Weapon) => w.id !== weaponId)
    };
    onUpdate(updated);
  };

  const handleRemoveArmor = () => {
    const updated = {
      ...currentEquipment,
      armor: null
    };
    onUpdate(updated);
  };

  const handleRemoveShield = () => {
    const updated = {
      ...currentEquipment,
      shield: null
    };
    onUpdate(updated);
  };

  const handleRemoveEquipment = (equipmentId: string) => {
    const updated = {
      ...currentEquipment,
      equipment: currentEquipment.equipment.filter((e: Equipment) => e.id !== equipmentId)
    };
    onUpdate(updated);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Armor Slots */}
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
          <h3 className="text-sm font-medium text-[var(--app-fg)] mb-3 flex items-center justify-between">
            <span>🛡️ Armadura</span>
            <button
              className="text-xs px-2 py-1 rounded border border-[var(--app-border)] bg-[var(--app-bg)] text-[var(--app-muted)] hover:text-[var(--app-fg)]"
              onClick={() => setIsManagerOpen(true)}
            >
              + Adicionar
            </button>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Armor Slot */}
            <div className="border-2 border-dashed border-[var(--app-border)] rounded-lg p-3 min-h-[80px] flex flex-col items-center justify-center">
              {currentEquipment.armor ? (
                <div className="text-center">
                  <div className="text-lg mb-1">🛡️</div>
                  <div className="text-sm font-medium text-[var(--app-fg)]">{currentEquipment.armor.name}</div>
                  <div className="text-xs text-[var(--app-muted)]">CA {currentEquipment.armor.baseAC}</div>
                  <button
                    className="mt-2 text-xs text-red-500 hover:text-red-600"
                    onClick={() => handleRemoveArmor()}
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className="text-center text-[var(--app-muted)]">
                  <div className="text-2xl mb-1">🛡️</div>
                  <div className="text-xs">Nenhuma armadura equipada</div>
                </div>
              )}
            </div>

            {/* Shield Slot */}
            <div className="border-2 border-dashed border-[var(--app-border)] rounded-lg p-3 min-h-[80px] flex flex-col items-center justify-center">
              {currentEquipment.shield ? (
                <div className="text-center">
                  <div className="text-lg mb-1">🛡️</div>
                  <div className="text-sm font-medium text-[var(--app-fg)]">{currentEquipment.shield.name}</div>
                  <div className="text-xs text-[var(--app-muted)]">+{currentEquipment.shield.baseAC} CA</div>
                  <button
                    className="mt-2 text-xs text-red-500 hover:text-red-600"
                    onClick={() => handleRemoveShield()}
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className="text-center text-[var(--app-muted)]">
                  <div className="text-2xl mb-1">🛡️</div>
                  <div className="text-xs">Nenhum escudo equipado</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Weapon Slots */}
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
          <h3 className="text-sm font-medium text-[var(--app-fg)] mb-3 flex items-center justify-between">
            <span>⚔️ Armas</span>
            <button
              className="text-xs px-2 py-1 rounded border border-[var(--app-border)] bg-[var(--app-bg)] text-[var(--app-muted)] hover:text-[var(--app-fg)]"
              onClick={() => setIsManagerOpen(true)}
            >
              + Adicionar
            </button>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentEquipment.weapons.length === 0 ? (
              <div className="col-span-3 border-2 border-dashed border-[var(--app-border)] rounded-lg p-6 text-center text-[var(--app-muted)]">
                <div className="text-3xl mb-2">⚔️</div>
                <div className="text-sm">Nenhuma arma equipada</div>
                <div className="text-xs mt-1">Adicione armas para usar em combate</div>
              </div>
            ) : (
              currentEquipment.weapons.map((weapon: Weapon) => (
                <div key={weapon.id} className="border-2 border-dashed border-[var(--app-border)] rounded-lg p-3 min-h-[100px]">
                  <div className="text-center">
                    <div className="text-lg mb-1">⚔️</div>
                    <div className="text-sm font-medium text-[var(--app-fg)]">{weapon.name}</div>
                    <div className="text-xs text-[var(--app-muted)]">{weapon.damage}</div>
                    <div className="text-xs text-[var(--app-muted)]">{weapon.damageType}</div>
                    {weapon.magicalBonus > 0 && (
                      <div className="text-xs text-blue-500">+{weapon.magicalBonus} mágico</div>
                    )}
                    <button
                      className="mt-2 text-xs text-red-500 hover:text-red-600"
                      onClick={() => handleRemoveWeapon(weapon.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Equipment Slots */}
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
          <h3 className="text-sm font-medium text-[var(--app-fg)] mb-3 flex items-center justify-between">
            <span>🎒 Equipamentos</span>
            <button
              className="text-xs px-2 py-1 rounded border border-[var(--app-border)] bg-[var(--app-bg)] text-[var(--app-muted)] hover:text-[var(--app-fg)]"
              onClick={() => setIsManagerOpen(true)}
            >
              + Adicionar
            </button>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {currentEquipment.equipment.length === 0 ? (
              <div className="col-span-4 border-2 border-dashed border-[var(--app-border)] rounded-lg p-6 text-center text-[var(--app-muted)]">
                <div className="text-3xl mb-2">🎒</div>
                <div className="text-sm">Nenhum equipamento</div>
                <div className="text-xs mt-1">Adicione itens como mochila, corda, etc.</div>
              </div>
            ) : (
              currentEquipment.equipment.map((item: Equipment) => (
                <div key={item.id} className="border-2 border-dashed border-[var(--app-border)] rounded-lg p-3 min-h-[80px]">
                  <div className="text-center">
                    <div className="text-lg mb-1">🎒</div>
                    <div className="text-xs font-medium text-[var(--app-fg)]">{item.name}</div>
                    <div className="text-xs text-[var(--app-muted)]">{item.weight} lbs</div>
                    <button
                      className="mt-2 text-xs text-red-500 hover:text-red-600"
                      onClick={() => handleRemoveEquipment(item.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Equipment Manager Modal */}
      <EquipmentManager
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        onAddWeapon={handleAddWeapon}
        onAddArmor={handleAddArmor}
        onAddEquipment={handleAddEquipment}
      />
    </>
  );
}
