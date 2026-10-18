import React from 'react';
import { ShirtEdition, ShirtSize } from '../types/merch';
import { AVAILABLE_SIZES, BASONTA_PRICE_GHC } from '../data/merchData';
import { Check, HelpCircle, Sparkles } from 'lucide-react';

interface EditionSelectorProps {
  selectedEdition: ShirtEdition;
  onEditionChange: (edition: ShirtEdition) => void;
  selectedSize: ShirtSize;
  onSizeChange: (size: ShirtSize) => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onOpenSizeGuide: () => void;
  /** When true, hide Standard/Premium (60/100) tiers — basonta is flat GHC 35. */
  isBasonta?: boolean;
}

export const EditionSelector: React.FC<EditionSelectorProps> = ({
  selectedEdition,
  onEditionChange,
  selectedSize,
  onSizeChange,
  quantity,
  onQuantityChange,
  onOpenSizeGuide,
  isBasonta = false,
}) => {
  const sizeStepLabel = isBasonta ? '1. Select Size' : '2. Select Size';
  const qtyStepLabel = isBasonta ? '2. Quantity' : '3. Quantity';

  return (
    <div className="flex flex-col gap-6 w-full">
      {isBasonta ? (
        /* Basonta: flat GHC 35 — no edition / fabric-grade picker */
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Basonta Workforce
              </span>
              <h4 className="text-base font-bold text-white mt-2">Ministry Shirt</h4>
              <p className="text-xs text-neutral-400 mt-1">
                Flat pre-order price for every basonta wing — no Standard or Premium tiers.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-mono font-black text-amber-300 tabular-nums">
                GHC {BASONTA_PRICE_GHC.toFixed(2)}
              </span>
              <span className="block text-[10px] text-neutral-500 mt-0.5">per shirt</span>
            </div>
          </div>
        </div>
      ) : (
        /* Merch only: Standard (60) vs Premium (100) */
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs uppercase font-bold tracking-wider text-neutral-400">
              1. Select Shirt Type
            </label>
            <span className="text-xs text-neutral-500">Pick fabric grade</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => onEditionChange('standard')}
              className={`cursor-pointer relative p-4 rounded-xl border transition-all text-left flex flex-col justify-between ${
                selectedEdition === 'standard'
                  ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-950/40 ring-1 ring-blue-500/50'
                  : 'border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                    Standard
                  </span>
                  <span className="text-lg font-mono font-bold text-white tabular-nums">
                    GHC 60.00
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mt-2">Standard T-Shirt</h4>
                <p className="text-xs text-neutral-400 mt-1">100% Breathable Ringspun Cotton (180 GSM) with classic comfort cut.</p>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Regular Cut</span>
                {selectedEdition === 'standard' ? (
                  <span className="flex items-center gap-1 text-blue-400 font-semibold">
                    <Check className="w-3.5 h-3.5" /> Selected
                  </span>
                ) : (
                  <span className="text-neutral-400">Select</span>
                )}
              </div>
            </div>

            <div
              onClick={() => onEditionChange('premium')}
              className={`cursor-pointer relative p-4 rounded-xl border transition-all text-left flex flex-col justify-between ${
                selectedEdition === 'premium'
                  ? 'border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/50'
                  : 'border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 hover:border-neutral-700'
              }`}
            >
              <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Sparkles className="w-2.5 h-2.5" /> Popular
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Luxury Streetwear
                  </span>
                  <span className="text-lg font-mono font-bold text-amber-300 tabular-nums">
                    GHC 100.00
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mt-2">Heavyweight Oversized</h4>
                <p className="text-xs text-neutral-400 mt-1">Heavyweight Combed Cotton (240+ GSM), boxy drop-shoulder modern drape.</p>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                <span className="text-amber-400/80">Thick Ribbed Collar</span>
                {selectedEdition === 'premium' ? (
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Check className="w-3.5 h-3.5" /> Selected
                  </span>
                ) : (
                  <span className="text-neutral-400">Select</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Size Selection Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs uppercase font-bold tracking-wider text-neutral-400">
            {sizeStepLabel}
          </label>
          <button
            type="button"
            onClick={onOpenSizeGuide}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Size Chart & Fit Guide</span>
          </button>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {AVAILABLE_SIZES.map((item) => {
            const isSelected = selectedSize === item.size;
            return (
              <button
                key={item.size}
                type="button"
                onClick={() => onSizeChange(item.size)}
                className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl border text-sm font-bold transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700 hover:text-white'
                }`}
              >
                <span>{item.size}</span>
                <span className={`text-[10px] font-normal mt-0.5 ${isSelected ? 'text-blue-100' : 'text-neutral-500'}`}>
                  {item.chestInches.split('-')[0]}"
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity Stepper */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-neutral-400 block">
            {qtyStepLabel}
          </span>
          <span className="text-xs text-neutral-500">Pre-order for yourself or friends</span>
        </div>

        <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="w-8 h-8 rounded flex items-center justify-center text-neutral-300 hover:bg-neutral-800 active:scale-90 font-bold transition-colors cursor-pointer disabled:opacity-40"
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="w-8 text-center font-mono font-bold text-white text-base tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(quantity + 1)}
            className="w-8 h-8 rounded flex items-center justify-center text-neutral-300 hover:bg-neutral-800 active:scale-90 font-bold transition-colors cursor-pointer"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};
