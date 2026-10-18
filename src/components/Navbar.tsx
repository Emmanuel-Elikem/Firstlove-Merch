import React from 'react';
import { ShoppingBag, Camera } from 'lucide-react';

interface NavbarProps {
  currentView: 'store' | 'admin';
  onNavigate: (view: 'store' | 'admin') => void;
  onOpenFlyer: () => void;
  onOpenSizeGuide: () => void;
  cartCount: number;
  cartTotalGhc: number;
  onOpenCart: () => void;
  onOpenUploadManager?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenFlyer,
  onOpenSizeGuide,
  cartCount,
  cartTotalGhc,
  onOpenCart,
  onOpenUploadManager,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/85 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigate('store')}
          className="text-base sm:text-xl font-black tracking-tight text-white whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity flex items-center gap-2 text-left cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
          <span>FIRST LOVE CAPE COAST</span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-neutral-400">
          <button
            onClick={() => onNavigate('store')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'store' ? 'text-white' : ''
            }`}
          >
            Pre-Order Store
          </button>
          <button
            onClick={onOpenFlyer}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>Official Flyer</span>
          </button>
          <button
            onClick={onOpenSizeGuide}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Size Guide
          </button>
          <button
            onClick={() => onNavigate('admin')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
              currentView === 'admin' ? 'text-blue-400' : ''
            }`}
          >
            <span>Coordinator Admin</span>
          </button>
        </nav>

        {/* Zone 3: Actions (Bag Trigger) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          <button
            onClick={onOpenCart}
            className="group relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Bag</span>
            <span className="px-1.5 py-0.5 rounded-md bg-blue-900/80 text-[11px] font-mono tabular-nums">
              {cartCount}
            </span>
            {cartCount > 0 && (
              <span className="hidden sm:inline-block font-mono text-blue-100 font-semibold tabular-nums">
                · GHC {cartTotalGhc.toFixed(2)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
