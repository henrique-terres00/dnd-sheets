"use client";

import { useState } from "react";
import { DEFAULT_WEAPONS, DEFAULT_ARMOR, DEFAULT_EQUIPMENT } from "@/lib/defaultEquipment";
import { createCustomWeapon, createCustomArmor, createCustomEquipment } from "@/lib/equipmentUtils";
import type { Weapon, Armor, Equipment, WeaponType, ArmorType, EquipmentType } from "@/lib/equipment";

interface EquipmentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWeapon: (weapon: Weapon) => void;
  onAddArmor: (armor: Armor) => void;
  onAddEquipment: (equipment: Equipment) => void;
}

export function EquipmentManager({ isOpen, onClose, onAddWeapon, onAddArmor, onAddEquipment }: EquipmentManagerProps) {
  const [activeTab, setActiveTab] = useState<'weapons' | 'armor' | 'equipment' | 'custom'>('weapons');
  const [customTab, setCustomTab] = useState<'weapon' | 'armor' | 'equipment'>('weapon');
  const [searchTerm, setSearchTerm] = useState('');
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  
  const [customWeapon, setCustomWeapon] = useState({
    name: "",
    type: "simpleMelee" as const,
    damage: "1d6",
    damageType: "corte",
    ability: "str" as const,
    properties: [] as string[],
    magicalBonus: 0,
    description: ""
  });

  const [customArmor, setCustomArmor] = useState({
    name: "",
    type: "light" as const,
    baseAC: 10,
    dexBonus: true,
    maxDexBonus: undefined as number | undefined,
    strengthRequirement: undefined as number | undefined,
    stealthDisadvantage: false,
    magicalBonus: 0,
    description: ""
  });

  const [customEquipment, setCustomEquipment] = useState({
    name: "",
    type: "misc" as const,
    description: "",
    weight: 1,
    value: "1 po",
    magical: false
  });

  // Filter functions
  const filterItems = <T extends Record<string, any>>(items: T[], searchField: keyof T) => {
    if (!searchTerm) return items;
    return items.filter(item => 
      item[searchField]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Functions to add items with visual feedback
  const handleAddWeapon = (weapon: Weapon) => {
    onAddWeapon(weapon);
    setAddedItems(prev => new Set(prev).add(`weapon-${weapon.id}`));
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(`weapon-${weapon.id}`);
        return newSet;
      });
    }, 2000);
  };

  const handleAddArmor = (armor: Armor) => {
    onAddArmor(armor);
    setAddedItems(prev => new Set(prev).add(`armor-${armor.id}`));
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(`armor-${armor.id}`);
        return newSet;
      });
    }, 2000);
  };

  const handleAddEquipment = (equipment: Equipment) => {
    onAddEquipment(equipment);
    setAddedItems(prev => new Set(prev).add(`equipment-${equipment.id}`));
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(`equipment-${equipment.id}`);
        return newSet;
      });
    }, 2000);
  };

  const filteredWeapons = filterItems(DEFAULT_WEAPONS, 'name');

  // Group weapons by category for better organization
  const groupedWeapons = filteredWeapons.reduce((groups: Record<string, Weapon[]>, weapon: Weapon) => {
    const category = weapon.type;
    if (!groups[category]) groups[category] = [];
    groups[category].push(weapon);
    return groups;
  }, {} as Record<string, Weapon[]>);

  const categoryIcons = {
    'simpleMelee': '🗡️',
    'simpleRanged': '🏹', 
    'martialMelee': '⚔️',
    'martialRanged': '🎯'
  };

  const categoryColors = {
    'simpleMelee': 'text-blue-400 border-blue-400/30',
    'simpleRanged': 'text-green-400 border-green-400/30', 
    'martialMelee': 'text-red-400 border-red-400/30',
    'martialRanged': 'text-purple-400 border-purple-400/30'
  };

  const categoryNames = {
    'simpleMelee': 'Armas Simples Corpo-a-Corpo',
    'simpleRanged': 'Armas Simples à Distância', 
    'martialMelee': 'Armas Marciais Corpo-a-Corpo',
    'martialRanged': 'Armas Marciais à Distância'
  };

  const armorCategoryNames = {
    'light': 'Armaduras Leves',
    'medium': 'Armaduras Médias',
    'heavy': 'Armaduras Pesadas'
  };

  const armorCategoryIcons = {
    'light': '👘',
    'medium': '🔰',
    'heavy': '⚜️'
  };

  const armorCategoryColors = {
    'light': 'text-green-400 border-green-400/30',
    'medium': 'text-yellow-400 border-yellow-400/30',
    'heavy': 'text-red-400 border-red-400/30'
  };
  const filteredArmor = filterItems(DEFAULT_ARMOR, 'name');

  // Group armor by category for better organization
  const groupedArmor = filteredArmor.reduce((groups: Record<string, Armor[]>, armor: Armor) => {
    const category = armor.type;
    if (!groups[category]) groups[category] = [];
    groups[category].push(armor);
    return groups;
  }, {} as Record<string, Armor[]>);

  const filteredEquipment = filterItems(DEFAULT_EQUIPMENT, 'name');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Gerenciar Equipamentos</h3>
          <button
            className="rounded-lg border border-[var(--app-border)] bg-gray-500/20 px-3 py-1 text-sm text-[var(--app-fg)] hover:bg-gray-500/30"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-[var(--app-border)]">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'weapons' 
                ? 'text-[var(--app-fg)] border-[var(--app-fg)]' 
                : 'text-[var(--app-muted)] border-transparent hover:text-[var(--app-fg)]'
            }`}
            onClick={() => setActiveTab('weapons')}
          >
            Armas
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'armor' 
                ? 'text-[var(--app-fg)] border-[var(--app-fg)]' 
                : 'text-[var(--app-muted)] border-transparent hover:text-[var(--app-fg)]'
            }`}
            onClick={() => setActiveTab('armor')}
          >
            Armaduras
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'equipment' 
                ? 'text-[var(--app-fg)] border-[var(--app-fg)]' 
                : 'text-[var(--app-muted)] border-transparent hover:text-[var(--app-fg)]'
            }`}
            onClick={() => setActiveTab('equipment')}
          >
            Equipamentos
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'custom' 
                ? 'text-[var(--app-fg)] border-[var(--app-fg)]' 
                : 'text-[var(--app-muted)] border-transparent hover:text-[var(--app-fg)]'
            }`}
            onClick={() => setActiveTab('custom')}
          >
            Criar Personalizado
          </button>
        </div>

        {/* Search Bar */}
        {(activeTab === 'weapons' || activeTab === 'armor' || activeTab === 'equipment') && (
          <div className="mb-4">
            <input
              type="text"
              className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
              placeholder="Buscar itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {/* Content */}
        <div className="min-h-[400px]">
          {activeTab === 'weapons' && (
            <div className="space-y-6">
              {Object.entries(groupedWeapons)
                .sort(([a], [b]) => {
                  // Sort categories by priority: simpleMelee -> simpleRanged -> martialMelee -> martialRanged
                  const priorityOrder = ['simpleMelee', 'simpleRanged', 'martialMelee', 'martialRanged'];
                  const aIndex = priorityOrder.indexOf(a);
                  const bIndex = priorityOrder.indexOf(b);
                  return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
                })
                .map(([category, weapons]) => (
                  <div key={category} className="mb-8">
                    <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg border ${categoryColors[category as keyof typeof categoryColors] || 'border-[var(--app-border)]'} bg-[var(--app-surface)]`}>
                      <span className="text-2xl">{categoryIcons[category as keyof typeof categoryIcons] || '🗡️'}</span>
                      <h3 className="text-base font-bold text-[var(--app-fg)]">
                        {categoryNames[category as keyof typeof categoryNames] || category}
                      </h3>
                      <span className="text-xs text-[var(--app-muted)] ml-auto">
                        {weapons.length} itens
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {weapons
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((weapon) => {
                          const isAdded = addedItems.has(`weapon-${weapon.id}`);
                          return (
                            <div key={weapon.id} className={`p-3 border rounded-lg bg-[var(--app-bg)] transition-all duration-300 ${
                              isAdded ? 'border-green-500 bg-green-500/10' : 'border-[var(--app-border)]'
                            }`}>
                              <h4 className="font-medium text-[var(--app-fg)] mb-1">{weapon.name}</h4>
                              <p className="text-xs text-[var(--app-muted)] mb-2">
                                {weapon.damage} {weapon.damageType} • {weapon.ability === 'str' ? 'Força' : weapon.ability === 'dex' ? 'Destreza' : 'Inteligência'}
                              </p>
                              <p className="text-xs text-[var(--app-muted)] mb-3">
                                {weapon.properties.join(', ') || 'Sem propriedades'}
                              </p>
                              <button
                                className={`w-full rounded-lg border px-3 py-1 text-sm transition-all duration-300 ${
                                  isAdded 
                                    ? 'border-green-500 bg-green-500 text-white' 
                                    : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-fg)] hover:bg-[var(--app-border)]'
                                }`}
                                onClick={() => handleAddWeapon(weapon)}
                              >
                                {isAdded ? '✓ Adicionado' : 'Adicionar'}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {activeTab === 'armor' && (
            <div className="space-y-6">
              {Object.entries(groupedArmor)
                .sort(([a], [b]) => {
                  // Sort categories by priority: light -> medium -> heavy
                  const priorityOrder = ['light', 'medium', 'heavy'];
                  const aIndex = priorityOrder.indexOf(a);
                  const bIndex = priorityOrder.indexOf(b);
                  return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
                })
                .map(([category, armors]) => (
                  <div key={category} className="mb-8">
                    <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg border ${armorCategoryColors[category as keyof typeof armorCategoryColors] || 'border-[var(--app-border)]'} bg-[var(--app-surface)]`}>
                      <span className="text-2xl">{armorCategoryIcons[category as keyof typeof armorCategoryIcons] || '🛡️'}</span>
                      <h3 className="text-base font-bold text-[var(--app-fg)]">
                        {armorCategoryNames[category as keyof typeof armorCategoryNames] || category}
                      </h3>
                      <span className="text-xs text-[var(--app-muted)] ml-auto">
                        {armors.length} itens
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {armors
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((armor) => {
                          const isAdded = addedItems.has(`armor-${armor.id}`);
                          return (
                            <div key={armor.id} className={`p-3 border rounded-lg bg-[var(--app-bg)] transition-all duration-300 ${
                              isAdded ? 'border-green-500 bg-green-500/10' : 'border-[var(--app-border)]'
                            }`}>
                              <h4 className="font-medium text-[var(--app-fg)] mb-1">{armor.name}</h4>
                              <p className="text-xs text-[var(--app-muted)] mb-2">
                                CA {armor.baseAC} {armor.dexBonus ? '+ Destreza' : ''} {armor.maxDexBonus ? `(máx ${armor.maxDexBonus})` : ''}
                              </p>
                              <p className="text-xs text-[var(--app-muted)] mb-3">
                                {armor.strengthRequirement ? `Força ${armor.strengthRequirement} necessária` : ''}
                                {armor.strengthRequirement && armor.stealthDisadvantage ? ' • ' : ''}
                                {armor.stealthDisadvantage ? 'Desvantagem em Furtividade' : armor.strengthRequirement ? '' : 'Sem penalidade'}
                              </p>
                              <button
                                className={`w-full rounded-lg border px-3 py-1 text-sm transition-all duration-300 ${
                                  isAdded 
                                    ? 'border-green-500 bg-green-500 text-white' 
                                    : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-fg)] hover:bg-[var(--app-border)]'
                                }`}
                                onClick={() => handleAddArmor(armor)}
                              >
                                {isAdded ? '✓ Adicionado' : 'Adicionar'}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {activeTab === 'equipment' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredEquipment.map((equipment) => {
                const isAdded = addedItems.has(`equipment-${equipment.id}`);
                return (
                  <div key={equipment.id} className={`p-3 border rounded-lg bg-[var(--app-bg)] transition-all duration-300 ${
                    isAdded ? 'border-green-500 bg-green-500/10' : 'border-[var(--app-border)]'
                  }`}>
                    <h4 className="font-medium text-[var(--app-fg)] mb-1">{equipment.name}</h4>
                    <p className="text-xs text-[var(--app-muted)] mb-2">{equipment.description}</p>
                    <p className="text-xs text-[var(--app-muted)] mb-3">
                      {equipment.weight} lbs • {equipment.value}
                    </p>
                    <button
                      className={`w-full rounded-lg border px-3 py-1 text-sm transition-all duration-300 ${
                        isAdded 
                          ? 'border-green-500 bg-green-500 text-white' 
                          : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-fg)] hover:bg-[var(--app-border)]'
                      }`}
                      onClick={() => handleAddEquipment(equipment)}
                    >
                      {isAdded ? '✓ Adicionado' : 'Adicionar'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-6">
              {/* Custom Creation Tabs */}
              <div className="flex gap-2 mb-4 border-b border-[var(--app-border)]">
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    customTab === 'weapon' 
                      ? 'text-[var(--app-fg)] border-[var(--app-fg)]' 
                      : 'text-[var(--app-muted)] border-transparent hover:text-[var(--app-fg)]'
                  }`}
                  onClick={() => setCustomTab('weapon')}
                >
                  Arma
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    customTab === 'armor' 
                      ? 'text-[var(--app-fg)] border-[var(--app-fg)]' 
                      : 'text-[var(--app-muted)] border-transparent hover:text-[var(--app-fg)]'
                  }`}
                  onClick={() => setCustomTab('armor')}
                >
                  Armadura
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    customTab === 'equipment' 
                      ? 'text-[var(--app-fg)] border-[var(--app-fg)]' 
                      : 'text-[var(--app-muted)] border-transparent hover:text-[var(--app-fg)]'
                  }`}
                  onClick={() => setCustomTab('equipment')}
                >
                  Equipamento
                </button>
              </div>

              {/* Custom Weapon */}
              {customTab === 'weapon' && (
                <div className="p-4 border border-[var(--app-border)] rounded-lg bg-[var(--app-bg)]">
                  <h4 className="font-medium text-[var(--app-fg)] mb-3">Criar Arma Personalizada</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                      placeholder="Nome da arma"
                      value={customWeapon.name}
                      onChange={(e) => setCustomWeapon({...customWeapon, name: e.target.value})}
                    />
                    <select
                      className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                      value={customWeapon.type}
                      onChange={(e) => setCustomWeapon({...customWeapon, type: e.target.value as typeof customWeapon.type})}
                    >
                      <option value="simpleMelee">Simples Corpo a Corpo</option>
                      <option value="simpleRanged">Simples à Distância</option>
                      <option value="martialMelee">Marcial Corpo a Corpo</option>
                      <option value="martialRanged">Marcial à Distância</option>
                    </select>
                    <input
                      type="text"
                      className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                      placeholder="Dano (ex: 1d6)"
                      value={customWeapon.damage}
                      onChange={(e) => setCustomWeapon({...customWeapon, damage: e.target.value})}
                    />
                    <input
                      type="text"
                      className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                      placeholder="Tipo de dano"
                      value={customWeapon.damageType}
                      onChange={(e) => setCustomWeapon({...customWeapon, damageType: e.target.value})}
                    />
                    <input
                      type="number"
                      className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                      placeholder="Bônus mágico"
                      value={customWeapon.magicalBonus}
                      onChange={(e) => setCustomWeapon({...customWeapon, magicalBonus: parseInt(e.target.value) || 0})}
                    />
                    <textarea
                      className="md:col-span-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                      placeholder="Descrição"
                      value={customWeapon.description}
                      onChange={(e) => setCustomWeapon({...customWeapon, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <button
                    className="mt-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                    onClick={() => {
                      const weapon = createCustomWeapon(customWeapon);
                      onAddWeapon(weapon);
                      setCustomWeapon({
                        name: "",
                        type: "simpleMelee",
                        damage: "1d6",
                        damageType: "corte",
                        ability: "str",
                        properties: [],
                        magicalBonus: 0,
                        description: ""
                      });
                    }}
                  >
                    Criar Arma
                  </button>
                </div>
              )}

              {/* Custom Armor */}
              {customTab === 'armor' && (
                <div className="p-4 border border-[var(--app-border)] rounded-lg bg-[var(--app-bg)]">
                  <h4 className="font-medium text-[var(--app-fg)] mb-3">Criar Armadura Personalizada</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                      placeholder="Nome da armadura"
                      value={customArmor.name}
                      onChange={(e) => setCustomArmor({...customArmor, name: e.target.value})}
                    />
                    <select
                      className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                      value={customArmor.type}
                      onChange={(e) => setCustomArmor({...customArmor, type: e.target.value as typeof customArmor.type})}
                    >
                      <option value="light">Leve</option>
                      <option value="medium">Média</option>
                      <option value="heavy">Pesada</option>
                    </select>
                    <input
                      type="number"
                      className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                      placeholder="CA Base"
                      value={customArmor.baseAC}
                      onChange={(e) => setCustomArmor({...customArmor, baseAC: parseInt(e.target.value) || 10})}
                    />
                    <input
                      type="number"
                      className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                      placeholder="Bônus mágico"
                      value={customArmor.magicalBonus}
                      onChange={(e) => setCustomArmor({...customArmor, magicalBonus: parseInt(e.target.value) || 0})}
                    />
                    <textarea
                      className="md:col-span-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                      placeholder="Descrição"
                      value={customArmor.description}
                      onChange={(e) => setCustomArmor({...customArmor, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <button
                    className="mt-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                    onClick={() => {
                      const armor = createCustomArmor(customArmor);
                      onAddArmor(armor);
                      setCustomArmor({
                        name: "",
                        type: "light",
                        baseAC: 10,
                        dexBonus: true,
                        maxDexBonus: undefined,
                        strengthRequirement: undefined,
                        stealthDisadvantage: false,
                        magicalBonus: 0,
                        description: ""
                      });
                    }}
                  >
                    Criar Armadura
                  </button>
                </div>
              )}

              {/* Custom Equipment */}
              {customTab === 'equipment' && (
                <div className="p-4 border border-[var(--app-border)] rounded-lg bg-[var(--app-bg)]">
                  <h4 className="font-medium text-[var(--app-fg)] mb-3">Criar Equipamento Personalizado</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                      placeholder="Nome do equipamento"
                      value={customEquipment.name}
                      onChange={(e) => setCustomEquipment({...customEquipment, name: e.target.value})}
                    />
                    <select
                      className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                      value={customEquipment.type}
                      onChange={(e) => setCustomEquipment({...customEquipment, type: e.target.value as typeof customEquipment.type})}
                    >
                      <option value="misc">Diverso</option>
                      <option value="tool">Ferramenta</option>
                      <option value="consumable">Consumível</option>
                    </select>
                    <textarea
                      className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                      placeholder="Descrição"
                      value={customEquipment.description}
                      onChange={(e) => setCustomEquipment({...customEquipment, description: e.target.value})}
                      rows={3}
                    />
                    <input
                      type="number"
                      className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                      placeholder="Peso (lbs)"
                      value={customEquipment.weight}
                      onChange={(e) => setCustomEquipment({...customEquipment, weight: parseInt(e.target.value) || 1})}
                    />
                    <input
                      type="text"
                      className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-fg)]"
                      placeholder="Valor (ex: 10 po)"
                      value={customEquipment.value}
                      onChange={(e) => setCustomEquipment({...customEquipment, value: e.target.value})}
                    />
                    <label className="flex items-center gap-2 text-sm text-[var(--app-fg)]">
                      <input
                        type="checkbox"
                        checked={customEquipment.magical}
                        onChange={(e) => setCustomEquipment({...customEquipment, magical: e.target.checked})}
                      />
                      Mágico
                    </label>
                  </div>
                  <button
                    className="mt-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm text-[var(--app-fg)] hover:bg-[var(--app-border)]"
                    onClick={() => {
                      const equipment = createCustomEquipment(customEquipment);
                      onAddEquipment(equipment);
                      setCustomEquipment({
                        name: "",
                        type: "misc",
                        description: "",
                        weight: 1,
                        value: "1 po",
                        magical: false
                      });
                    }}
                  >
                    Criar Equipamento
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
