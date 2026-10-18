import React from 'react';
import { Bus, Users, Video, HeartHandshake, UserCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const BasontaTeaser: React.FC = () => {
  const basontas = [
    'Dancing Stars',
    'Film Stars',
    'Fragrance Ministry',
    'Projection',
    'Lovelets',
    'Ushers',
    'Culinary Stars',
    'Worship Stars',
    'Sheep Seeking',
    'Telepastoring',
    'Flowing Waters',
    'Diamond Bond',
    'Airport Stars',
    'GLGC Family',
  ];

  return (
    <section className="w-full max-w-7xl mx-auto my-12 p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Basonta Workforce Apparel Now Available</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Official First Love Church Workforce Wings
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Pre-order your official ministry wing shirt at the top of the store — flat <strong className="text-amber-300">GHC 35</strong> each (no Standard / Premium tiers).
          </p>
        </div>

        <div className="text-xs text-amber-300 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 self-start md:self-auto font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>GHC 35 · Cape Coast Pre-Order</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 relative z-10">
        {basontas.map((name) => (
          <div
            key={name}
            className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/70 hover:border-neutral-700 transition-colors flex items-center justify-between group"
          >
            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{name}</h4>
          </div>
        ))}
      </div>
    </section>
  );
};
