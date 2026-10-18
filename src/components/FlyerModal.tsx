import React from 'react';
import { X, ExternalLink, Sparkles, Shirt, Tag } from 'lucide-react';

interface FlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlyerModal: React.FC<FlyerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <Tag className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-base">Official First Love Merch Sale Flyer</h3>
            <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded font-mono">
              Campaign Visual
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Flyer Render */}
        <div className="p-6 overflow-y-auto flex flex-col items-center gap-6">
          {/* Recreated High-Resolution Graphic Flyer */}
          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-neutral-800 bg-[#E8E8E6] text-neutral-900 shadow-inner flex flex-col justify-between p-6 sm:p-8 select-none">
            {/* Background texture & brush splashes */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute top-0 left-0 w-72 h-36 bg-gradient-to-br from-amber-400/40 via-cyan-400/40 to-transparent blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-48 bg-gradient-to-tl from-blue-500/30 via-red-500/20 to-transparent blur-3xl pointer-events-none" />

            {/* Top Brand Title */}
            <div className="relative z-10 flex flex-col items-center">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-neutral-950 uppercase font-sans">
                FIRST LOVE MERCH
              </h1>
              <div className="text-cyan-600 font-serif italic text-2xl sm:text-4xl -mt-2 sm:-mt-4 font-semibold tracking-wide drop-shadow-sm">
                Sale
              </div>
            </div>

            {/* Center Showcase Content */}
            <div className="relative z-10 grid grid-cols-3 gap-4 items-center my-auto">
              {/* Left Column: Blue & Purple Garments */}
              <div className="flex flex-col gap-3 items-center">
                <div className="w-24 sm:w-32 p-2 rounded-lg bg-blue-600 text-white text-center shadow-lg border border-blue-400">
                  <div className="text-[8px] sm:text-[10px] font-bold tracking-widest uppercase">THE LORD IS THERE</div>
                  <div className="text-[7px] text-blue-200 mt-1">Royal Blue</div>
                  <div className="flex justify-center gap-1 mt-1 text-[8px]">
                    <span>♡</span><span>🔥</span><span>🌐</span>
                  </div>
                </div>

                <div className="w-24 sm:w-32 p-2 rounded-lg bg-purple-700 text-yellow-300 text-center shadow-lg border border-purple-500">
                  <div className="text-[10px] sm:text-xs font-black leading-none">FIRST<br/>LOVE</div>
                  <div className="text-[7px] text-yellow-200 tracking-wider">THE LORD IS THERE</div>
                  <div className="text-[7px] text-purple-200 mt-0.5">Royal Purple Back</div>
                </div>
              </div>

              {/* Center Column: Price Banners */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-full max-w-[140px] sm:max-w-[180px] py-1.5 sm:py-2 px-3 sm:px-6 bg-cyan-500 text-white font-black text-center text-lg sm:text-2xl rounded-sm shadow-md uppercase tracking-wider transform -rotate-1">
                  GHC.60
                </div>
                <div className="w-full max-w-[140px] sm:max-w-[180px] py-1.5 sm:py-2 px-3 sm:px-6 bg-red-600 text-white font-black text-center text-lg sm:text-2xl rounded-sm shadow-md uppercase tracking-wider transform rotate-1">
                  GHC.100
                </div>
                <span className="text-[10px] text-neutral-600 font-medium text-center">
                  Standard (GHC 60) · Heavyweight (GHC 100)
                </span>
              </div>

              {/* Right Column: Black Edition Wear */}
              <div className="flex flex-col gap-3 items-center">
                <div className="w-24 sm:w-32 p-2 rounded-lg bg-neutral-900 text-white text-center shadow-lg border border-neutral-700">
                  <div className="text-[8px] sm:text-[10px] font-bold tracking-widest uppercase">THE LORD IS THERE</div>
                  <div className="text-[7px] text-neutral-400 mt-1">Jet Black Front</div>
                  <div className="flex justify-center gap-1 mt-1 text-[8px] text-neutral-300">
                    <span>♡</span><span>🔥</span><span>🌐</span>
                  </div>
                </div>

                <div className="w-24 sm:w-32 p-2 rounded-lg bg-neutral-900 text-cyan-400 text-center shadow-lg border border-neutral-700">
                  <div className="text-[10px] sm:text-xs font-black leading-none">FIRST<br/>LOVE</div>
                  <div className="text-[7px] text-white tracking-wider">THE LORD IS THERE</div>
                  <div className="text-[7px] text-neutral-400 mt-0.5">Jet Black Back Graphic</div>
                </div>
              </div>
            </div>

            {/* Bottom Caption */}
            <div className="relative z-10 text-center text-xs text-neutral-600 font-medium">
              Official First Love Church Outreach & Fellowship Apparel
            </div>
          </div>

          {/* Details & Specs Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Standard Edition — GHC 60.00
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                Classic comfortable 180 GSM cotton shirt with crisp screenprint. Great for everyday campus wear, student outreach, and bacenta gatherings.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Premium Heavyweight — GHC 100.00
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                Luxurious 240+ GSM heavyweight drop-shoulder streetwear cut with durable ribbed collar and vibrant high-density typography.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Back to Pre-Order
          </button>
        </div>
      </div>
    </div>
  );
};
