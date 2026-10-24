import React, { useState, useEffect } from 'react';
import { CartItem } from '../types/merch';
import { COLOR_OPTIONS, cartItemTitle, isBasontaColor, BASONTA_PRICE_GHC, FEE_PER_SHIRT_GHC, processingFeeFor } from '../data/merchData';
import { 
  X, Trash2, ArrowRight, ShieldCheck, Phone, User, 
  AlertCircle, Smartphone, Mail, Sparkles 
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
}

/** Order saved by /api/checkout while the customer is on the Paystack page. */
export const PENDING_CHECKOUT_KEY = 'flc_pending_checkout';

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotalGhc = items.reduce((acc, item) => acc + item.subtotal, 0);
  const totalShirtsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const processingFeeGhc = processingFeeFor(subtotalGhc, totalShirtsCount);
  const totalAmountGhc = subtotalGhc + processingFeeGhc;

  // Validate phone number format (supports Ghanaian local 024XXXXXXX, 055..., 020..., and +233...)
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s-]/g, '');
    const ghanaLocalRegex = /^0(20|23|24|25|26|27|28|30|50|53|54|55|57|59)\d{7}$/;
    const ghanaIntlRegex = /^\+233(20|23|24|25|26|27|28|30|50|53|54|55|57|59)\d{7}$/;
    return ghanaLocalRegex.test(cleaned) || ghanaIntlRegex.test(cleaned) || cleaned.length >= 10;
  };

  // Server prices the bag, saves a pending order, and returns the Paystack checkout page to send the customer to
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (items.length === 0) {
      setErrorMessage('Your pre-order cart is empty.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name for the pickup ticket.');
      return;
    }

    if (!customerPhone.trim() || !validatePhone(customerPhone)) {
      setErrorMessage('Please enter a valid Ghana phone number (e.g. 024XXXXXXX or +233...).');
      return;
    }

    if (customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      setErrorMessage('That email address does not look right. You can also leave it empty.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || undefined,
          items,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.authorizationUrl) {
        throw new Error(data.message || 'Could not start payment. Please try again.');
      }

      try {
        localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(data.order));
      } catch {}

      window.location.href = data.authorizationUrl;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Could not start payment. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-over panel: 100% full width on mobile, max-md/lg on desktop */}
      <div className="absolute inset-y-0 right-0 w-full sm:max-w-md md:max-w-lg flex">
        <div className="w-full bg-neutral-900 border-l border-neutral-800 flex flex-col shadow-2xl h-full">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                  <span>Pre-Order Bag</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold shrink-0">
                    Paystack
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-400 truncate">First Love Cape Coast</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mx-4 sm:mx-5 mt-3 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Fully Scrollable Body (No static bottom tabs or fixed bars) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {items.length === 0 ? (
              <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-neutral-800/60 flex items-center justify-center text-neutral-500 mb-3">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-neutral-300">Your pre-order bag is empty</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                  Choose a basonta (GHC {BASONTA_PRICE_GHC}) or First Love merch shirt, then pick size to begin.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder} className="space-y-5">
                {/* Cart Items Summary */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-400 uppercase tracking-wider">
                      Selected Shirts ({totalShirtsCount})
                    </span>
                    <span className="text-neutral-500 font-mono">
                      Subtotal: GHC {subtotalGhc.toFixed(2)}
                    </span>
                  </div>

                  <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
                    {items.map((item) => {
                      const color = COLOR_OPTIONS.find((c) => c.id === item.color);
                      const basonta = isBasontaColor(color, item.color);
                      const title = cartItemTitle(item, COLOR_OPTIONS);

                      return (
                        <div key={item.id} className="p-3 flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-6 h-6 rounded-lg border border-white/20 shrink-0 shadow-inner"
                              style={{ backgroundColor: color?.hex }}
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">
                                {title}
                              </h4>
                              <p className="text-[11px] text-neutral-400 truncate">
                                {basonta
                                  ? `Basonta · GHC ${BASONTA_PRICE_GHC} · Size: `
                                  : `${color?.shortName || item.color} · Size: `}
                                <span className="text-white font-mono font-bold">{item.size}</span>
                                {!basonta && (
                                  <span className="text-neutral-500"> · {item.unitPrice === 100 ? 'Premium' : 'Standard'}</span>
                                )}
                              </p>
                              <span className="text-xs font-mono font-bold text-amber-400">
                                GHC {item.subtotal.toFixed(2)}
                                <span className="text-neutral-500 font-normal"> ({item.quantity}× {item.unitPrice.toFixed(0)})</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-mono text-xs font-bold text-white">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.id)}
                              className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Purchaser Details (Required only: Name & Phone) */}
                <div className="space-y-3 pt-1">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                    1. Purchaser Details
                  </span>

                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5 mb-1">
                        <User className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Full Name *</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Samuel Mensah"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5 mb-1">
                        <Phone className="w-3.5 h-3.5 text-neutral-500" />
                        <span>WhatsApp / Phone Number *</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g. 024XXXXXXX or +233..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 text-xs focus:outline-none focus:border-amber-500 transition-colors font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>2. Pay Securely with Paystack</span>
                  </span>

                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 via-neutral-950 to-neutral-950 border-2 border-amber-500/40 space-y-3 shadow-xl">
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-300">
                      <li>Tap <strong className="text-white">Pay</strong> below to open Paystack checkout.</li>
                      <li>Choose <strong className="text-amber-300">Mobile Money</strong> (MTN, Telecel, AirtelTigo) or card.</li>
                      <li>Approve the prompt on your phone.</li>
                      <li>You come back here with your confirmed pickup ticket. No screenshots needed.</li>
                    </ol>

                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5 mb-1">
                        <Mail className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Email for receipt (optional)</span>
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Final Cost Breakdown & Submit Action (At bottom of page flow, fully scrollable) */}
                <div className="pt-2 space-y-3.5 pb-8">
                  {/* Cost breakdown */}
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>Shirts Subtotal:</span>
                      <span className="font-mono text-neutral-200">GHC {subtotalGhc.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <span>Charges:</span>
                        {processingFeeGhc === totalShirtsCount * FEE_PER_SHIRT_GHC && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                            +GHC {FEE_PER_SHIRT_GHC.toFixed(2)} / shirt
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-amber-400 font-semibold">+ GHC {processingFeeGhc.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-sm">
                      <div>
                        <span className="text-white font-bold block">Total Amount to Pay:</span>
                        <span className="text-[10px] text-neutral-400">
                          Includes payment charges ({totalShirtsCount} {totalShirtsCount === 1 ? 'shirt' : 'shirts'})
                        </span>
                      </div>
                      <span className="text-2xl font-mono font-black text-amber-300 tabular-nums">
                        GHC {totalAmountGhc.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Main Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer min-h-[48px]"
                  >
                    {isSubmitting ? (
                      <span>Opening Paystack...</span>
                    ) : (
                      <>
                        <span>Pay GHC {totalAmountGhc.toFixed(2)} with Paystack</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 pt-0.5 text-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Secured by Paystack · Your ticket is confirmed automatically</span>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
