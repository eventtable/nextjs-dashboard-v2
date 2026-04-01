'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  Wallet, 
  TrendingUp, 
  Grid3X3, 
  BellRing,
  Activity,
  Menu,
  X,
  LayoutGrid,
  Shield,
  LogOut,
  User
} from 'lucide-react';
import { usePortfolio } from '@/hooks/use-portfolio';

interface SharedHeaderProps {
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
  title?: string;
  icon?: React.ReactNode;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: Zap },
  { href: '/depot', label: 'Depot', icon: Wallet },
  { href: '/matrix', label: 'Matrix', icon: LayoutGrid },
  { href: '/charts', label: 'Charts', icon: TrendingUp },
  { href: '/smartmoney', label: 'Profis', icon: Grid3X3 },
  { href: '/risiko', label: 'Risiko', icon: BellRing },
];

export default function SharedHeader({ 
  showBack = false, 
  backHref = '/depot',
  backLabel = 'Zurück',
  title = 'Matrix 2.0',
  icon = <Zap className="w-6 h-6 text-[#f0b90b]" />
}: SharedHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { totalValue, isLoading } = usePortfolio();

  // Click outside to close user menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#080c18] border-b border-[#1a1f37] z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center">
          {/* Logo - Smaller on mobile */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 w-auto sm:w-48 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#f0b90b] rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-white text-sm">Matrix 2.0</h1>
              <p className="text-[10px] text-gray-500">Börsenprofi</p>
            </div>
          </Link>

          {/* Center Navigation - Hidden on mobile, shown on sm+ */}
          <nav className="hidden sm:flex flex-1 items-center justify-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-sm transition-all min-h-[40px] ${
                    isActive
                      ? 'bg-[#f0b90b]/10 text-[#f0b90b] border border-[#f0b90b]/20'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a1f37]'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                  <span className="lg:hidden text-xs">{item.label.slice(0, 4)}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Navigation Button */}
          <div className="flex sm:hidden flex-1 justify-end">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1f37] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={mobileMenuOpen ? "Menü schließen" : "Menü öffnen"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Right Section - User Menu with F Logo Dropdown */}
          <div className="hidden sm:flex w-48 items-center justify-end gap-3" ref={userMenuRef}>
            <div className="text-right">
              <p className="text-[10px] text-gray-500">Portfolio</p>
              <p className="text-xs font-semibold text-white">
                {isLoading ? '...' : `€${totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            </div>
            
            {/* F Logo with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-8 h-8 bg-[#1a1f37] hover:bg-[#2a2f47] rounded-full flex items-center justify-center border border-[#2a2f47] transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold text-[#f0b90b]">F</span>
              </button>
              
              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 top-10 w-48 bg-[#0d1220] border border-[#1a1f37] rounded-lg shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#1a1f37]">
                    <p className="text-xs text-gray-500">Angemeldet als</p>
                    <p className="text-sm font-semibold text-white truncate">Frank Müller</p>
                  </div>
                  
                  <Link
                    href="/admin"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#1a1f37] transition-colors"
                  >
                    <Shield className="w-4 h-4 text-[#f0b90b]" />
                    Admin Dashboard
                  </Link>
                  
                  <div className="border-t border-[#1a1f37] mt-1 pt-1">
                    <Link
                      href="/logout"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-[#1a1f37] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Abmelden
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden absolute top-16 left-0 right-0 bg-[#080c18] border-b border-[#1a1f37] shadow-xl">
            <nav className="flex flex-col p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all min-h-[48px] ${
                      isActive
                        ? 'bg-[#f0b90b]/10 text-[#f0b90b] border border-[#f0b90b]/20'
                        : 'text-gray-400 hover:text-white hover:bg-[#1a1f37]'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Mobile Portfolio Info */}
              <div className="pt-3 mt-3 border-t border-[#1a1f37]">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-gray-400">Portfolio</span>
                  <span className="text-sm font-semibold text-white">
                    {isLoading ? '...' : `€${totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                </div>
              </div>
              
              {/* Mobile Admin Link */}
              <div className="pt-2 mt-2 border-t border-[#1a1f37]">
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#f0b90b] hover:bg-[#1a1f37] transition-all"
                >
                  <Shield className="w-5 h-5" />
                  Admin Dashboard
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Sub-header for page-specific actions */}
      {showBack && (
        <div className="fixed top-16 left-0 right-0 h-12 bg-[#0a0e1a] border-b border-[#1a1f37] z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
            <Link 
              href={backHref} 
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {backLabel}
            </Link>
            
            {title && (
              <div className="flex items-center gap-2">
                {icon}
                <span className="font-semibold text-sm sm:text-base">{title}</span>
              </div>
            )}
            
            <div className="w-16 sm:w-24" />
          </div>
        </div>
      )}
    </>
  );
}