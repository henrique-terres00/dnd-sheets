"use client";

import { useState, useEffect } from "react";

interface DiceAnimationProps {
  isRolling: boolean;
  onComplete?: () => void;
  diceCount?: number;
  diceType?: number;
  formula?: string;
}

// Função para gerar padrão de pontos de dado (como dados reais)
const getDiceDots = (value: number, sides: number): string[] => {
  if (sides === 4) {
    // Padrão de dados de 4 lados (d4) - triângulo
    const patterns: { [key: number]: string[] } = {
      1: ['center'],
      2: ['top', 'bottom'],
      3: ['top', 'center', 'bottom'],
      4: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
    };
    return patterns[value] || ['center'];
  } else if (sides === 6) {
    // Padrão de dados de 6 lados (d6)
    const patterns: { [key: number]: string[] } = {
      1: ['center'],
      2: ['top-left', 'bottom-right'],
      3: ['top-left', 'center', 'bottom-right'],
      4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
      6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
    };
    return patterns[value] || ['center'];
  } else if (sides === 8) {
    // Padrão de dados de 8 lados (d8) - octogonal
    const patterns: { [key: number]: string[] } = {
      1: ['center'],
      2: ['top', 'bottom'],
      3: ['top', 'center', 'bottom'],
      4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
      6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
      7: ['top-left', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-right'],
      8: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center']
    };
    return patterns[value] || ['center'];
  } else if (sides === 12) {
    // Padrão de dados de 12 lados (d12) - dodecaedro
    const patterns: { [key: number]: string[] } = {
      1: ['center'],
      2: ['top', 'bottom'],
      3: ['top', 'center', 'bottom'],
      4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
      6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
      7: ['top-left', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-right'],
      8: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center'],
      9: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right', 'top-center', 'center', 'bottom-center'],
      10: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right', 'top-center', 'center', 'bottom-center', 'middle-center'],
      11: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right', 'top-center', 'center', 'bottom-center', 'middle-center', 'inner-center'],
      12: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right', 'top-center', 'center', 'bottom-center', 'middle-center', 'inner-left', 'inner-right']
    };
    return patterns[Math.min(value, 12)] || ['center'];
  } else if (sides === 20) {
    // Para d20, mostra o número
    return [value.toString()];
  } else {
    // Para outros dados, mostra o número
    return [value.toString()];
  }
};

// Componente de dado individual
const Die = ({ value, sides, isAnimating }: { value: number; sides: number; isAnimating: boolean }) => {
  const dots = getDiceDots(value, sides);
  
  if (sides === 4) {
    // d4 - estilo triangular com pontos
    return (
      <div 
        className={`w-16 h-16 bg-red-100 border-2 border-red-600 rounded-lg shadow-lg flex items-center justify-center p-2 ${
          isAnimating ? 'animate-spin' : ''
        }`}
        style={{
          animationDuration: isAnimating ? '0.2s' : '0s', // Mais lento: 200ms
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div className="relative w-full h-full">
          {dots.includes('top') && <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rounded-full"></div>}
          {dots.includes('bottom') && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rounded-full"></div>}
          {dots.includes('center') && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full"></div>}
          {dots.includes('top-left') && <div className="absolute top-1 left-1 w-2 h-2 bg-black rounded-full"></div>}
          {dots.includes('top-right') && <div className="absolute top-1 right-1 w-2 h-2 bg-black rounded-full"></div>}
          {dots.includes('bottom-left') && <div className="absolute bottom-1 left-1 w-2 h-2 bg-black rounded-full"></div>}
          {dots.includes('bottom-right') && <div className="absolute bottom-1 right-1 w-2 h-2 bg-black rounded-full"></div>}
        </div>
      </div>
    );
  } else if (sides === 6) {
    // d6 - estilo clássico com pontos
    return (
      <div 
        className={`w-16 h-16 bg-white border-2 border-gray-800 rounded-lg shadow-lg flex flex-col justify-between p-2 ${
          isAnimating ? 'animate-spin' : ''
        }`}
        style={{
          animationDuration: isAnimating ? '0.2s' : '0s', // Mais lento: 200ms
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div className="flex justify-between">
          {dots.includes('top-left') && <div className="w-2 h-2 bg-black rounded-full"></div>}
          {dots.includes('top-right') && <div className="w-2 h-2 bg-black rounded-full"></div>}
        </div>
        <div className="flex justify-between">
          {dots.includes('middle-left') && <div className="w-2 h-2 bg-black rounded-full"></div>}
          {dots.includes('center') && <div className="w-2 h-2 bg-black rounded-full"></div>}
          {dots.includes('middle-right') && <div className="w-2 h-2 bg-black rounded-full"></div>}
        </div>
        <div className="flex justify-between">
          {dots.includes('bottom-left') && <div className="w-2 h-2 bg-black rounded-full"></div>}
          {dots.includes('bottom-right') && <div className="w-2 h-2 bg-black rounded-full"></div>}
        </div>
      </div>
    );
  } else if (sides === 8 || sides === 12) {
    // d8 e d12 - estilo com pontos
    const bgColor = sides === 8 ? 'bg-green-100 border-green-600' : 'bg-orange-100 border-orange-600';
    return (
      <div 
        className={`w-16 h-16 ${bgColor} border-2 rounded-lg shadow-lg flex items-center justify-center p-2 ${
          isAnimating ? 'animate-spin' : ''
        }`}
        style={{
          animationDuration: isAnimating ? '0.2s' : '0s', // Mais lento: 200ms
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div className="relative w-full h-full">
          {dots.includes('top') && <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-black rounded-full"></div>}
          {dots.includes('bottom') && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-black rounded-full"></div>}
          {dots.includes('center') && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-black rounded-full"></div>}
          {dots.includes('top-left') && <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-black rounded-full"></div>}
          {dots.includes('top-right') && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-black rounded-full"></div>}
          {dots.includes('bottom-left') && <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-black rounded-full"></div>}
          {dots.includes('bottom-right') && <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-black rounded-full"></div>}
          {dots.includes('middle-left') && <div className="absolute top-1/2 left-1 transform -translate-y-1/2 w-1.5 h-1.5 bg-black rounded-full"></div>}
          {dots.includes('middle-right') && <div className="absolute top-1/2 right-1 transform -translate-y-1/2 w-1.5 h-1.5 bg-black rounded-full"></div>}
          {dots.includes('top-center') && <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-black rounded-full"></div>}
          {dots.includes('bottom-center') && <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-black rounded-full"></div>}
          {dots.includes('middle-center') && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-black rounded-full"></div>}
          {dots.includes('inner-left') && <div className="absolute top-1/2 left-3 transform -translate-y-1/2 w-1.5 h-1.5 bg-black rounded-full"></div>}
          {dots.includes('inner-right') && <div className="absolute top-1/2 right-3 transform -translate-y-1/2 w-1.5 h-1.5 bg-black rounded-full"></div>}
          {dots.includes('inner-center') && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-black rounded-full"></div>}
        </div>
      </div>
    );
  }
  
  // Para outros tipos de dados (d20, etc.)
  return (
    <div 
      className={`w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-purple-600 ${
        isAnimating ? 'animate-bounce' : ''
      }`}
      style={{
        animationDuration: isAnimating ? '0.2s' : '0s', // Mais lento: 200ms
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
      }}
    >
      {value}
    </div>
  );
};

export function DiceAnimation({ isRolling, onComplete, diceCount = 1, diceType = 20, formula }: DiceAnimationProps) {
  const [currentValues, setCurrentValues] = useState<number[]>(() => 
    Array(diceCount).fill(1).map(() => Math.floor(Math.random() * diceType) + 1)
  );
  const [animationKey, setAnimationKey] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Extract dice info from formula if provided
  useEffect(() => {
    if (formula && isRolling) {
      const match = formula.match(/(\d+)d(\d+)/);
      if (match) {
        const [, count, sides] = match;
        diceCount = parseInt(count) || 1;
        diceType = parseInt(sides) || 20;
      }
    }
  }, [formula, isRolling]);

  useEffect(() => {
    if (isRolling) {
      setAnimationKey(prev => prev + 1);
      setIsFadingOut(false);
      
      // Animate dice rolling - mais lento (200ms em vez de 100ms)
      const interval = setInterval(() => {
        setCurrentValues(Array(diceCount).fill(1).map(() => Math.floor(Math.random() * diceType) + 1));
      }, 200); // Reduzido de 100ms para 200ms

      // Stop animation after 2 segundos (aumentado de 1.5s)
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setIsFadingOut(true);
        
        // Fade out duration - 800ms depois começa a sair
        setTimeout(() => {
          onComplete?.();
        }, 800);
      }, 2000); // Aumentado de 1500ms para 2000ms

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isRolling, diceCount, diceType, onComplete]);

  if (!isRolling) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div 
        className={`bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-8 shadow-2xl transition-all duration-700 transform ${
          isFadingOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={`text-[var(--app-fg)] font-semibold text-lg transition-opacity duration-700 ${
            isFadingOut ? 'opacity-0' : 'opacity-100'
          }`}>
            🎲 Rolando dados...
          </div>
          <div className="flex gap-3" key={animationKey}>
            {currentValues.map((value, index) => (
              <div
                key={index}
                className={`transition-all duration-700 transform ${
                  isFadingOut ? 'scale-90 opacity-0 rotate-12' : 'scale-100 opacity-100 rotate-0'
                }`}
                style={{
                  transitionDelay: `${index * 50}ms`
                }}
              >
                <Die 
                  value={value} 
                  sides={diceType} 
                  isAnimating={!isFadingOut}
                />
              </div>
            ))}
          </div>
          <div className={`text-[var(--app-muted)] text-sm font-medium transition-opacity duration-700 ${
            isFadingOut ? 'opacity-0' : 'opacity-100'
          }`}>
            {formula || `${diceCount}d${diceType}`}
          </div>
        </div>
      </div>
    </div>
  );
}
