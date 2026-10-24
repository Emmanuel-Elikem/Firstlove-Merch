import React from 'react';
import { Lock, Printer, AlertTriangle, MessageCircle, ShieldCheck, ArrowRight, X } from 'lucide-react';

interface ClosedAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin: () => void;
}

export const ClosedAnnouncementModal: React.FC<ClosedAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onOpenAdmin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Heavy dark backdrop to ensure full focus */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border-2 border-amber-500/40 p-6 sm:p-8 text-neutral-100 shadow-2xl shadow-amber-950/50 z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close "X" Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            <Lock className="w-3.5 h-3.5" />
            <span>Storefront Closed</span>
          </span>
          <span className="text-xs text-neutral-400 font-medium">First Love Cape Coast</span>
        </div>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
          We Are Closed for Now
        </h2>
        <p className="text-sm font-semibold text-amber-400 mt-1">
          Pre-orders have ended · Printing & compilation in progress
        </p>

        {/* Narrative Description */}
        <p className="text-xs sm:text-sm text-neutral-300 mt-3.5 leading-relaxed">
          Time is fast, and our factory production and apparel printing process has officially commenced! 
          We have halted new pre-orders so our coordinators can compile all headcount tallies, verify submitted payments, and send the final batch to print.
        </p>

        {/* Detailed Status Cards */}
        <div className="mt-5 space-y-2.5">
          <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Printing in Progress</h4>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-normal">
                To guarantee timely delivery for church services and avoid production delays, no new shirt orders can be accepted.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Already Paid & Submitted?</h4>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-normal">
                Your order is safely recorded. Coordinators are currently reconciling all MoMo references and compiling the master distribution roster.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            I Understand — View Info Only
          </button>

          <a
            href="https://wa.me/233536193423?text=Hello%20First%20Love%20Cape%20Coast%2C%20I%20have%20an%20inquiry%20regarding%20my%20shirt%20order"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-700/30 hover:bg-emerald-700/50 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-600/40 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Questions or Payment Proof? WhatsApp Support</span>
          </a>

          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
            <span className="text-neutral-500">Need to compile & print orders?</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="text-amber-400 hover:text-amber-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Staff & Admin Portal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
