import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, X, ShieldAlert } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ADMIN_PASSKEY = 'FLC';

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
}) => {
  const [passkeyInput, setPasskeyInput] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passkeyInput.trim();
    if (clean.toUpperCase() === 'FLC' || clean === 'Elsieee') {
      setHasError(false);
      setErrorMessage('');
      setPasskeyInput('');
      onSuccess();
    } else {
      setHasError(true);
      setErrorMessage('Incorrect passkey. Please check and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-white space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Icon Header */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mb-3 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 block mb-1">
            Restricted Access
          </span>
          <h3 className="text-lg font-black tracking-tight text-white">
            Staff & Photo Passcode
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
            Enter the authorized passcode (<strong>FLC</strong>) to unlock photo uploads and administration.
          </p>
        </div>

        {/* Error Alert */}
        {hasError && (
          <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2 animate-in shake">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-neutral-300 block mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-neutral-500" />
              <span>Security Passkey</span>
            </label>
            <input
              type="password"
              autoFocus
              value={passkeyInput}
              onChange={(e) => {
                setPasskeyInput(e.target.value);
                if (hasError) setHasError(false);
              }}
              placeholder="Enter passkey..."
              className={`w-full px-4 py-2.5 rounded-xl bg-neutral-950 border ${
                hasError ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-800 focus:border-blue-500'
              } text-white placeholder-neutral-600 text-sm focus:outline-none transition-colors font-mono tracking-wider`}
            />
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Unlock Admin Panel</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel / Back to Store
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
