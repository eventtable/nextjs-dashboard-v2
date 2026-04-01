'use client';

import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';

interface FibonacciLevelsProps {
  high52w: number;
  low52w: number;
  currentPrice: number;
  currency?: string;
}

// Fibonacci Retracement Levels
const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

export function calculateFibonacciLevels(high: number, low: number): {
  level: number;
  price: number;
  label: string;
}[] {
  const range = high - low;
  return FIB_LEVELS.map(level => ({
    level,
    price: high - (range * level),
    label: level === 0 ? 'Hoch (0%)' : 
           level === 1 ? 'Tief (100%)' : 
           `${(level * 100).toFixed(1)}%`
  }));
}

export function getCurrentFibPosition(currentPrice: number, high: number, low: number): {
  betweenLevels: string;
  nextSupport: number;
  nextResistance: number;
} {
  const levels = calculateFibonacciLevels(high, low);
  
  // Find which levels the current price is between
  for (let i = 0; i < levels.length - 1; i++) {
    if (currentPrice <= levels[i].price && currentPrice >= levels[i + 1].price) {
      return {
        betweenLevels: `${levels[i].label} - ${levels[i + 1].label}`,
        nextSupport: levels[i + 1].price,
        nextResistance: levels[i].price
      };
    }
  }
  
  return {
    betweenLevels: 'Außerhalb Range',
    nextSupport: levels[levels.length - 1].price,
    nextResistance: levels[0].price
  };
}

export default function FibonacciLevels({ high52w, low52w, currentPrice, currency = 'EUR' }: FibonacciLevelsProps) {
  const fibLevels = calculateFibonacciLevels(high52w, low52w);
  const currentPosition = getCurrentFibPosition(currentPrice, high52w, low52w);
  
  // Calculate progress within the 52W range
  const progress = ((high52w - currentPrice) / (high52w - low52w)) * 100;
  const isNearSupport = progress > 60;
  const isNearResistance = progress < 20;

  return (
    <div className="glass-card rounded-xl p-5 border border-[#1a1f37]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#f0b90b]" />
          <h3 className="text-lg font-semibold text-white">Fibonacci-Retracement</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Aktuelle Position</p>
          <p className={`text-sm font-medium ${
            isNearSupport ? 'text-green-400' : 
            isNearResistance ? 'text-orange-400' : 
            'text-yellow-400'
          }`}>
            {currentPosition.betweenLevels}
          </p>
        </div>
      </div>

      {/* 52W Range Bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>52W Tief: {low52w.toFixed(2)} {currency}</span>
          <span>52W Hoch: {high52w.toFixed(2)} {currency}</span>
        </div>
        <div className="h-3 bg-[#1a1f37] rounded-full overflow-hidden relative">
          {/* Fibonacci level markers */}
          {fibLevels.slice(1, -1).map((fib) => (
            <div
              key={fib.level}
              className="absolute top-0 w-0.5 h-full bg-[#f0b90b]/30"
              style={{ left: `${fib.level * 100}%` }}
            />
          ))}
          
          {/* Current price marker */}
          <div
            className="absolute top-0 w-2 h-full bg-[#f0b90b] rounded-full shadow-lg"
            style={{ left: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>100%</span>
          <span>78.6%</span>
          <span>61.8%</span>
          <span>50%</span>
          <span>38.2%</span>
          <span>23.6%</span>
          <span>0%</span>
        </div>
      </div>

      {/* Fibonacci Levels Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {fibLevels.map((fib) => {
          const isCurrentLevel = 
            Math.abs(currentPrice - fib.price) < (high52w - low52w) * 0.02;
          const isSupport = fib.level > 0.5 && fib.level < 0.8;
          const isResistance = fib.level > 0.2 && fib.level < 0.5;
          
          return (
            <div
              key={fib.level}
              className={`p-2.5 rounded-lg border transition-all ${
                isCurrentLevel 
                  ? 'bg-[#f0b90b]/20 border-[#f0b90b] shadow-lg shadow-[#f0b90b]/10' 
                  : isSupport
                    ? 'bg-green-500/5 border-green-500/20'
                    : isResistance
                      ? 'bg-orange-500/5 border-orange-500/20'
                      : 'bg-[#0f1629] border-[#1a1f37]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs ${isCurrentLevel ? 'text-[#f0b90b] font-semibold' : 'text-gray-500'}`}>
                  {fib.label}
                </span>
                {isCurrentLevel && (
                  <span className="text-[10px] text-[#f0b90b] bg-[#f0b90b]/20 px-1.5 py-0.5 rounded">AKTUELL</span>
                )}
                {isSupport && !isCurrentLevel && (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                )}
                {isResistance && !isCurrentLevel && (
                  <TrendingDown className="w-3 h-3 text-orange-400" />
                )}
              </div>
              <p className={`text-sm font-mono ${isCurrentLevel ? 'text-white font-bold' : 'text-gray-400'}`}>
                {fib.price.toFixed(2)} {currency}
              </p>
            </div>
          );
        })}
      </div>

      {/* Interpretation */}
      <div className="mt-4 p-3 bg-[#0f1629] rounded-lg border border-[#1a1f37]">
        <p className="text-xs text-gray-400 mb-2">
          <strong>Analyse:</strong>
        </p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f0b90b]"></span>
            <span className="text-gray-300">Aktueller Kurs: <strong>{currentPrice.toFixed(2)} {currency}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            <span className="text-gray-300">Nächste Support: <strong>{currentPosition.nextSupport.toFixed(2)} {currency}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
            <span className="text-gray-300">Nächste Resistance: <strong>{currentPosition.nextResistance.toFixed(2)} {currency}</strong></span>
          </div>
        </div>
        
        {isNearSupport && (
          <p className="text-xs text-green-400 mt-2">
            🟢 Kurs nahe Support-Zone (61.8%-78.6%). Mögliche Bodenbildung.
          </p>
        )}
        {isNearResistance && (
          <p className="text-xs text-orange-400 mt-2">
            🟠 Kurs nahe Resistance-Zone (23.6%-38.2%). Vorsicht bei Breakout.
          </p>
        )}
      </div>
    </div>
  );
}