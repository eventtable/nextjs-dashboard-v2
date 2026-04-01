'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, Users, Shield, CheckSquare, Activity, Zap, DollarSign, Wallet, Menu, X, LogOut, ShieldAlert, User } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sections = [
  { id: 'uebersicht', label: 'Übersicht', icon: Activity },
  { id: 'analyse', label: 'Matrix-Analyse', icon: BarChart3 },
  { id: 'dividenden', label: 'Dividenden', icon: DollarSign },
  { id: 'peers', label: 'Peer-Vergleich', icon: Users },
  { id: 'blackswan', label: 'Black-Swan', icon: Shield },
  { id: 'risiko', label: 'Risiko-Analyse', icon: ShieldAlert },
  { id: 'checkliste', label: 'Checkliste', icon: CheckSquare },
];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileOpen(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-[#f0b90b] text-black shadow-lg hover:bg-[#d4a017] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Menü öffnen"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Desktop: fixed left, Mobile: slide-in overlay */}
      <aside
        className={`
          fixed top-0 h-full bg-[#080c18] border-r border-[#1a1f37] flex flex-col z-50
          transition-transform duration-300 ease-in-out
          lg:left-0 lg:translate-x-0 lg:w-64
          ${isMobileOpen ? 'left-0 translate-x-0 w-[280px]' : 'left-0 -translate-x-full w-[280px] lg:w-64'}
        `}
      >
        {/* Mobile Close Button */}
        <button
          onClick={closeMobileMenu}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1f37] transition-colors lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Menü schließen"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 border-b border-[#1a1f37]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#f0b90b] rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Matrix 2.0</h2>
              <p className="text-[10px] text-gray-500">Börsenprofi</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Link
            href="/depot"
            onClick={closeMobileMenu}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all text-gray-400 hover:text-white hover:bg-[#1a1f37] min-h-[44px]"
          >
            <Wallet className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Mein Depot</span>
          </Link>
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => {
                  onSectionChange(section.id);
                  closeMobileMenu();
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all min-h-[44px] ${
                  isActive
                    ? 'bg-[#f0b90b]/10 text-[#f0b90b] border border-[#f0b90b]/20'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1f37]'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{section.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#1a1f37]">
          <div className="glass-card rounded-lg p-3">
            <p className="text-[10px] text-gray-500 mb-1">Depot-Struktur Ziel</p>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">Performance</span>
                <span className="text-[#60B5FF]">1/3</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">Dividenden</span>
                <span className="text-[#22c55e]">1/3</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">ETFs</span>
                <span className="text-[#f0b90b]">1/3</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#1a1f37]">
              <p className="text-[10px] text-gray-500">Sparplan: 200€/Monat</p>
            </div>
          </div>
          
          {/* Profile and Logout Buttons */}
          <div className="mt-3 space-y-2">
            <Link
              href="/profile"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#1a1f37] border border-transparent hover:border-gray-600 transition-all"
            >
              <User className="w-3.5 h-3.5" />
              Mein Profil
            </Link>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Abmelden
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}