import React from 'react';
import { X, Ruler, CheckCircle2 } from 'lucide-react';
import { AVAILABLE_SIZES } from '../data/merchData';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-white text-base">First Love Shirt Sizing & Fit Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 font-semibold border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Chest (Inches)</th>
                  <th className="py-3 px-4">Body Length</th>
                  <th className="py-3 px-4">Recommended Body Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono tabular-nums">
                {AVAILABLE_SIZES.map((row) => (
                  <tr key={row.size} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white text-sm font-sans">{row.size}</td>
                    <td className="py-3 px-4">{row.chestInches}</td>
                    <td className="py-3 px-4">{row.lengthInches}</td>
                    <td className="py-3 px-4 text-neutral-400 font-sans">{row.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fit Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800">
              <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                Standard Edition (GHC 60)
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Fits true to size with a classic regular cut. If you prefer a loose casual look, order one size up.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800">
              <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                Heavyweight Oversized (GHC 100)
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Naturally tailored with wider shoulders and drop sleeves. Stick to your true size for the intended streetwear drape.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
