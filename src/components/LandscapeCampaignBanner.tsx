import React, { useState } from 'react';
import { LANDSCAPE_HERO_IMAGE } from '../data/merchData';
import { Sparkles, ArrowDown } from 'lucide-react';

interface LandscapeCampaignBannerProps {
  onScrollToCustomizer: () => void;
  customBannerPhoto?: string;
}

export const LandscapeCampaignBanner: React.FC<LandscapeCampaignBannerProps> = ({
  onScrollToCustomizer,
  customBannerPhoto,
}) => {
  const [imageError, setImageError] = useState(false);

  const activePhoto = customBannerPhoto || (!imageError && LANDSCAPE_HERO_IMAGE ? LANDSCAPE_HERO_IMAGE : null);

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-6 animate-in fade-in duration-300">
      {/* Container holding the official landscape flyer */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl group">
        {/* Landscape Image with fallback */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[2.4/1] overflow-hidden bg-neutral-950 flex items-center justify-center">
          {activePhoto && !imageError ? (
            <img
              src={activePhoto}
              alt="First Love Cape Coast Merch Sale Official Campaign"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover sm:object-contain object-center transition-transform duration-700 group-hover:scale-[1.01]"
            />
          ) : (
            /* Photorealistic High-Impact Campaign Banner Graphic Fallback */
            <div className="w-full h-full bg-gradient-to-br from-neutral-950 via-blue-950/80 to-neutral-950 flex flex-col items-center justify-center p-6 text-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />

              <span className="text-xs uppercase font-extrabold tracking-widest text-cyan-400 mb-2 z-10 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>First Love Cape Coast Official Merch Sale</span>
              </span>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tight z-10">
                THE LORD IS THERE
              </h1>

              <p className="text-xs sm:text-sm text-neutral-300 mt-2 max-w-lg z-10 leading-relaxed">
                Campus Outreach & Fellowship Apparel · 6 Authentic Streetwear Colorways
              </p>

              <div className="flex items-center gap-3 sm:gap-4 mt-5 z-10">
                <div className="px-4 py-2 rounded-xl bg-cyan-500 text-neutral-950 font-black text-base sm:text-xl shadow-lg shadow-cyan-500/20">
                  Standard GHC 60
                </div>
                <div className="px-4 py-2 rounded-xl bg-red-600 text-white font-black text-base sm:text-xl shadow-lg shadow-red-600/20">
                  Heavyweight GHC 100
                </div>
              </div>
            </div>
          )}

          {/* Subtle bottom gradient shadow */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-black/20 pointer-events-none" />

          {/* Quick Header Overlay */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 z-10">
            <span className="px-3 py-1 rounded-full bg-neutral-950/80 backdrop-blur-md border border-neutral-700/60 text-white text-xs font-bold shadow-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>First Love Cape Coast</span>
            </span>
          </div>

          {/* Quick Action Trigger on the banner */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
            <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-300 font-medium bg-neutral-950/85 backdrop-blur-md px-4 py-2 rounded-xl border border-neutral-800">
              <span className="text-white font-bold">Standard Cotton: GHC 60</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="text-amber-400 font-bold">Heavyweight Oversized: GHC 100</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="text-amber-400 font-semibold">Basonta + Church-Wide Editions</span>
            </div>

            <button
              onClick={onScrollToCustomizer}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-blue-600/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Explore Basonta & Match Shirts</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
