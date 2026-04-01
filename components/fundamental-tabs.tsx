'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Scale, 
  Shield, 
  Info, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  MinusCircle,
  XCircle,
  Award,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFundamentalData, getKennzahlBewertung, berechneTabBewertung, berechneGesamtBewertung } from '@/data/fundamentalData';
import { KennzahlBewertung, TabBewertung, GesamtBewertung } from '@/lib/fundamental-types';
import { Skeleton } from '@/components/ui/skeleton';

interface FundamentalTabsProps {
  ticker: string;
}

// Status-Farben und Icons
const statusConfig = {
  gut: { 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10', 
    border: 'border-emerald-500/30', 
    icon: CheckCircle2,
    label: 'Gut'
  },
  mittel: { 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-500/10', 
    border: 'border-yellow-500/30', 
    icon: MinusCircle,
    label: 'Mittel'
  },
  schlecht: { 
    color: 'text-red-400', 
    bg: 'bg-red-500/10', 
    border: 'border-red-500/30', 
    icon: XCircle,
    label: 'Schlecht'
  },
  neutral: { 
    color: 'text-gray-400', 
    bg: 'bg-gray-500/10', 
    border: 'border-gray-500/20', 
    icon: MinusCircle,
    label: 'Neutral'
  }
};

// Kennzahl-Karte Komponente
function KennzahlCard({ kennzahl }: { kennzahl: KennzahlBewertung }) {
  const config = statusConfig[kennzahl.status];
  const Icon = config.icon;
  
  return (
    <div className={`
      relative p-4 rounded-xl border ${config.border} ${config.bg}
      backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
      group cursor-default
    `}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">{kennzahl.label}</span>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`text-xl font-bold ${config.color}`}>
          {kennzahl.formatted}
        </span>
        {kennzahl.einheit && kennzahl.status !== 'neutral' && (
          <span className="text-xs text-gray-500">{kennzahl.einheit}</span>
        )}
      </div>
      
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${
          kennzahl.status === 'gut' ? 'bg-emerald-400' :
          kennzahl.status === 'mittel' ? 'bg-yellow-400' :
          kennzahl.status === 'schlecht' ? 'bg-red-400' : 'bg-gray-400'
        }`} />
        <span className={`text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
      </div>
      
      {/* Hilfetext Tooltip */}
      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200
                      bottom-full left-0 right-0 mb-2 bg-[#1a1f37] text-xs text-gray-300 
                      p-3 rounded-lg shadow-xl z-10 pointer-events-none border border-[#2a2f47]">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#f0b90b] flex-shrink-0 mt-0.5" />
          <span>{kennzahl.hilfetext}</span>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 
                        w-2 h-2 bg-[#1a1f37] rotate-45 border-r border-b border-[#2a2f47]" />
      </div>
    </div>
  );
}

// Lade-Skeleton
function KennzahlSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-[#1a1f37] bg-[#0f1629]/50">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-6 w-24 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

// Tab-Bewertungs-Karte
function TabBewertungCard({ 
  bewertung, 
  title, 
  icon: Icon 
}: { 
  bewertung: TabBewertung; 
  title: string;
  icon: React.ElementType;
}) {
  return (
    <div className="p-4 rounded-xl border border-[#1a1f37] bg-[#0f1629]/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#f0b90b]" />
          <span className="text-sm font-medium text-white">{title}</span>
        </div>
        <div 
          className="px-2 py-1 rounded text-xs font-bold"
          style={{ 
            backgroundColor: `${bewertung.farbe}20`,
            color: bewertung.farbe 
          }}
        >
          {bewertung.rating}
        </div>
      </div>
      
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">Score</span>
          <span className="text-white font-medium">{bewertung.gesamtScore}/{bewertung.totalKennzahlen}</span>
        </div>
        <div className="h-2 bg-[#1a1f37] rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${(bewertung.gesamtScore / bewertung.totalKennzahlen) * 100}%`,
              backgroundColor: bewertung.farbe
            }}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-gray-400">{bewertung.gut}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="text-gray-400">{bewertung.mittel}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-gray-400">{bewertung.schlecht}</span>
        </div>
      </div>
    </div>
  );
}

// Gesamtbewertungs-Komponente
function GesamtBewertungCard({ bewertung }: { bewertung: GesamtBewertung }) {
  const empfehlungConfig = {
    'KAUFEN': { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', icon: TrendingUp, color: 'text-emerald-400' },
    'HALTEN': { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', icon: MinusCircle, color: 'text-yellow-400' },
    'VERKAUFEN': { bg: 'bg-red-500/20', border: 'border-red-500/30', icon: TrendingDown, color: 'text-red-400' }
  };
  
  const config = empfehlungConfig[bewertung.empfehlung];
  const Icon = config.icon;
  
  return (
    <div className={`
      p-6 rounded-xl border ${config.border} ${config.bg}
      backdrop-blur-sm
    `}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#f0b90b]/10">
            <Award className="w-6 h-6 text-[#f0b90b]" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">Gesamtbewertung</h4>
            <p className="text-sm text-gray-400">Basierend auf {bewertung.totalKennzahlen} Kennzahlen</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-lg
            font-bold text-lg ${config.color}
          `}
          style={{ backgroundColor: `${bewertung.farbe}20` }}>
            <Icon className="w-5 h-5" />
            {bewertung.empfehlung}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-lg bg-emerald-500/10">
          <div className="text-2xl font-bold text-emerald-400">{bewertung.gut}</div>
          <div className="text-xs text-gray-400">Stark 🟢</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-yellow-500/10">
          <div className="text-2xl font-bold text-yellow-400">{bewertung.mittel}</div>
          <div className="text-xs text-gray-400">Mittel 🟡</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-red-500/10">
          <div className="text-2xl font-bold text-red-400">{bewertung.schlecht}</div>
          <div className="text-xs text-gray-400">Schwach 🔴</div>
        </div>
      </div>
      
      {/* Erklärung der Bewertung */}
      <div className="mt-3 text-xs text-gray-500 bg-[#0d1220] p-3 rounded-lg">
        <Info className="w-3 h-3 inline mr-1" />
        <strong>Bewertungssystem:</strong> 🟢 Gut = 2 Punkte | 🟡 Mittel = 1 Punkt | 🔴 Schlecht = 0 Punkte | 
        <strong>Beispiel:</strong> 4×2 + 5×1 + 6×0 = 13 von {bewertung.gut + bewertung.mittel + bewertung.schlecht}×2 = {bewertung.maxPunkte} Punkten möglich
      </div>
      
      <div className="mt-4 pt-4 border-t border-[#1a1f37]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Gesamtpunkte</span>
          <span className="font-medium text-white" title="Tatsächliche Punkte / Maximale Punkte">
            {bewertung.gesamtScore} von {bewertung.maxPunkte} Punkten
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-400">Durchschnitt</span>
          <span className="font-medium text-white">{bewertung.durchschnittsPunkte.toFixed(2)} / 2.0 pro Kennzahl</span>
        </div>
        <div className="mt-2 h-3 bg-[#1a1f37] rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-700"
            style={{ 
              width: `${(bewertung.gesamtScore / bewertung.maxPunkte) * 100}%`,
              background: `linear-gradient(90deg, #ef4444 0%, #eab308 50%, #22c55e 100%)`,
              backgroundSize: '200% 100%',
              backgroundPosition: `${100 - (bewertung.gesamtScore / bewertung.maxPunkte) * 100}% 0%`
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function FundamentalTabs({ ticker }: FundamentalTabsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bewertung');
  
  // Daten laden
  const fundamentalData = getFundamentalData(ticker);
  
  // Kennzahlen für jeden Tab vorbereiten
  const bewertungKennzahlen: KennzahlBewertung[] = [
    getKennzahlBewertung('pegRatio', fundamentalData.bewertung.pegRatio, 'bewertung'),
    getKennzahlBewertung('evEbitda', fundamentalData.bewertung.evEbitda, 'bewertung'),
    getKennzahlBewertung('priceToBook', fundamentalData.bewertung.priceToBook, 'bewertung'),
    getKennzahlBewertung('priceToSales', fundamentalData.bewertung.priceToSales, 'bewertung'),
    getKennzahlBewertung('evToSales', fundamentalData.bewertung.evToSales, 'bewertung'),
    getKennzahlBewertung('epsTrailing', fundamentalData.bewertung.epsTrailing, 'bewertung'),
    getKennzahlBewertung('epsForward', fundamentalData.bewertung.epsForward, 'bewertung'),
  ];
  
  const profitabilitaetKennzahlen: KennzahlBewertung[] = [
    getKennzahlBewertung('ebitdaMargin', fundamentalData.profitabilitaet.ebitdaMargin, 'profitabilitaet'),
    getKennzahlBewertung('grossMargin', fundamentalData.profitabilitaet.grossMargin, 'profitabilitaet'),
    getKennzahlBewertung('operatingMargin', fundamentalData.profitabilitaet.operatingMargin, 'profitabilitaet'),
    getKennzahlBewertung('earningsGrowth', fundamentalData.profitabilitaet.earningsGrowth, 'profitabilitaet'),
  ];
  
  const bilanzKennzahlen: KennzahlBewertung[] = [
    getKennzahlBewertung('currentRatio', fundamentalData.bilanz.currentRatio, 'bilanz'),
    getKennzahlBewertung('quickRatio', fundamentalData.bilanz.quickRatio, 'bilanz'),
    getKennzahlBewertung('netCash', fundamentalData.bilanz.netCash, 'bilanz'),
    getKennzahlBewertung('shortRatio', fundamentalData.bilanz.shortRatio, 'bilanz'),
    getKennzahlBewertung('perf52W', fundamentalData.bilanz.perf52W, 'bilanz'),
  ];
  
  // Tab-Bewertungen berechnen
  const bewertungTab = berechneTabBewertung(bewertungKennzahlen);
  const profitabilitaetTab = berechneTabBewertung(profitabilitaetKennzahlen);
  const bilanzTab = berechneTabBewertung(bilanzKennzahlen);
  
  // Gesamtbewertung berechnen
  const gesamtBewertung = berechneGesamtBewertung(bewertungTab, profitabilitaetTab, bilanzTab);
  
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
  };

  return (
    <div className="space-y-6">
      {/* Gesamtbewertung - Immer sichtbar */}
      <GesamtBewertungCard bewertung={gesamtBewertung} />
      
      {/* Tabs */}
      <div className="glass-card rounded-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#f0b90b]" />
              Detailanalyse
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {ticker} • 16 Kennzahlen analysiert
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-[#1a1f37] hover:bg-[#2a2f47] 
                       transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-[#f0b90b] ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Tab-Bewertungen Übersicht */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <TabBewertungCard 
            bewertung={bewertungTab} 
            title="Bewertung"
            icon={Scale}
          />
          <TabBewertungCard 
            bewertung={profitabilitaetTab} 
            title="Profitabilität"
            icon={TrendingUp}
          />
          <TabBewertungCard 
            bewertung={bilanzTab} 
            title="Bilanzstärke"
            icon={Shield}
          />
        </div>
        
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-[#0f1629] mb-6">
            <TabsTrigger 
              value="bewertung"
              className="data-[state=active]:bg-[#f0b90b] data-[state=active]:text-black
                         flex items-center gap-2"
            >
              <Scale className="w-4 h-4" />
              <span className="hidden sm:inline">Bewertung</span>
              <span className="sm:hidden">Bewert.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profitabilitaet"
              className="data-[state=active]:bg-[#f0b90b] data-[state=active]:text-black
                         flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Profitabilität</span>
              <span className="sm:hidden">Profit.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="bilanz"
              className="data-[state=active]:bg-[#f0b90b] data-[state=active]:text-black
                         flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Bilanzstärke</span>
              <span className="sm:hidden">Bilanz</span>
            </TabsTrigger>
          </TabsList>
          
          <AnimatePresence mode="wait">
            <TabsContent value="bewertung" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-gray-400 mb-4 flex items-center gap-2"
                >
                  <Info className="w-4 h-4" />
                  Bewertungskennzahlen zeigen, ob die Aktie fair bewertet ist
                  <span className="ml-auto text-xs">
                    {bewertungTab.gesamtScore}/{bewertungTab.totalKennzahlen} positiv
                  </span>
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {isLoading ? (
                    Array(7).fill(0).map((_, i) => <KennzahlSkeleton key={i} />)
                  ) : (
                    bewertungKennzahlen.map((k, i) => (
                      <KennzahlCard key={i} kennzahl={k} />
                    ))
                  )}
                </div>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="profitabilitaet" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-gray-400 mb-4 flex items-center gap-2"
                >
                  <Info className="w-4 h-4" />
                  Profitabilitätskennzahlen zeigen die operative Effizienz
                  <span className="ml-auto text-xs">
                    {profitabilitaetTab.gesamtScore}/{profitabilitaetTab.totalKennzahlen} positiv
                  </span>
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {isLoading ? (
                    Array(4).fill(0).map((_, i) => <KennzahlSkeleton key={i} />)
                  ) : (
                    profitabilitaetKennzahlen.map((k, i) => (
                      <KennzahlCard key={i} kennzahl={k} />
                    ))
                  )}
                </div>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="bilanz" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-gray-400 mb-4 flex items-center gap-2"
                >
                  <Info className="w-4 h-4" />
                  Bilanzkennzahlen zeigen die finanzielle Stabilität
                  <span className="ml-auto text-xs">
                    {bilanzTab.gesamtScore}/{bilanzTab.totalKennzahlen} positiv
                  </span>
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => <KennzahlSkeleton key={i} />)
                  ) : (
                    bilanzKennzahlen.map((k, i) => (
                      <KennzahlCard key={i} kennzahl={k} />
                    ))
                  )}
                </div>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
        
        {/* Footer Hinweis */}
        <div className="mt-6 pt-4 border-t border-[#1a1f37]">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Daten zeitverzögert. Keine Anlageberatung. Eigene Recherche erforderlich.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
