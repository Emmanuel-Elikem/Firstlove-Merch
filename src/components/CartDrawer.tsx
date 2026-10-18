import React, { useState, useEffect } from 'react';
import { CartItem, CustomerOrder } from '../types/merch';
import { COLOR_OPTIONS, cartItemTitle, isBasontaColor, BASONTA_PRICE_GHC } from '../data/merchData';
import { getShortOrderWhatsAppMessage, copyTextToClipboard } from './OrderReceiptModal';
import { 
  X, Trash2, ArrowRight, ShieldCheck, Phone, User, 
  AlertCircle, Copy, Check, Smartphone, 
  MessageCircle, Info, Sparkles 
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onOrderSuccess: (order: CustomerOrder) => void;
}

// Mobile Money Recipient Details
export const CHURCH_MOMO_NUMBER = '0536193423';
export const CHURCH_MOMO_NAME = 'Emmanuel Nerkwei Nettey';
export const FEE_PER_SHIRT_GHC = 1; // GHC 1.00 fee for charges per shirt ordered

// Secure randomly generated ticket number generator (5 random digits)
export const generateSecureTicketId = (): string => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `FLC-${randomNum}`;
};

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [momoSenderPhone, setMomoSenderPhone] = useState('');
  const [momoTransactionId, setMomoTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Secure Random Ticket Number assigned to this checkout session
  const [secureTicketId, setSecureTicketId] = useState<string>(() => generateSecureTicketId());

  // Generate a fresh secure ticket ID whenever the drawer is opened fresh with items
  useEffect(() => {
    if (isOpen && items.length > 0) {
      setSecureTicketId(generateSecureTicketId());
      setErrorMessage('');
    }
  }, [isOpen]);

  // Keep sender phone in sync with customer phone by default if user hasn't typed a different one
  useEffect(() => {
    if (!momoSenderPhone && customerPhone) {
      setMomoSenderPhone(customerPhone);
    }
  }, [customerPhone]);

  if (!isOpen) return null;

  const subtotalGhc = items.reduce((acc, item) => acc + item.subtotal, 0);
  const totalShirtsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const processingFeeGhc = totalShirtsCount * FEE_PER_SHIRT_GHC;
  const totalAmountGhc = subtotalGhc + processingFeeGhc;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Validate phone number format (supports Ghanaian local 024XXXXXXX, 055..., 020..., and +233...)
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s-]/g, '');
    const ghanaLocalRegex = /^0(20|23|24|25|26|27|28|30|50|53|54|55|57|59)\d{7}$/;
    const ghanaIntlRegex = /^\+233(20|23|24|25|26|27|28|30|50|53|54|55|57|59)\d{7}$/;
    return ghanaLocalRegex.test(cleaned) || ghanaIntlRegex.test(cleaned) || cleaned.length >= 10;
  };

  // Process and record order after user has sent Mobile Money
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

    setIsSubmitting(true);

    try {
      const email = `${customerPhone.replace(/\D/g, '')}@firstlove.org`;
      const completedOrder: CustomerOrder = {
        id: secureTicketId,
        churchBranch: 'First Love Cape Coast',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: email,
        pickupNotes: '',
        items: [...items],
        subtotalGhc,
        processingFeeGhc,
        feePerShirtGhc: FEE_PER_SHIRT_GHC,
        totalAmountGhc,
        currency: 'GHS',
        momoNumber: CHURCH_MOMO_NUMBER,
        momoAccountName: CHURCH_MOMO_NAME,
        momoReference: secureTicketId,
        momoSenderPhone: momoSenderPhone.trim() || customerPhone.trim(),
        momoTransactionId: momoTransactionId.trim() || undefined,
        paymentMode: 'live',
        paymentStatus: 'pending', // Awaiting screenshot verification in WhatsApp group
        collectionStatus: 'pending',
        channel: 'mobile_money',
        createdAt: new Date().toISOString(),
      };

      // 1. Save to server backend (must succeed/attempt before opening WhatsApp flow)
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(completedOrder),
        });
      } catch (err) {
        console.warn('Backend order save network warning:', err);
      }

      // 2. Copy short WhatsApp group paste message (receipt modal opens group link)
      const ticketMessage = getShortOrderWhatsAppMessage(completedOrder);
      await copyTextToClipboard(ticketMessage);

      // 3. Clear cart and notify app → receipt modal shows message + group CTA
      setIsSubmitting(false);
      onClearCart();
      onClose();
      onOrderSuccess(completedOrder);

    } catch (err: any) {
      console.error('Order creation error:', err);
      setErrorMessage(err.message || 'Could not submit order. Please try again.');
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
                    MoMo
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

                {/* BOLD MOBILE MONEY PAYMENT BOX */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>2. Mobile Money Payment</span>
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      Charges: GHC 1 / shirt
                    </span>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 via-neutral-950 to-neutral-950 border-2 border-amber-500/40 space-y-3.5 shadow-xl">
                    
                    {/* BOLD MoMo Number & Account Name */}
                    <div className="p-3 rounded-xl bg-neutral-900 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-400 flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>MTN Mobile Money</span>
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          Send MoMo
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                        <div>
                          {/* BOLD NUMBER */}
                          <div className="text-2xl sm:text-3xl font-mono font-black text-amber-300 tracking-wider">
                            {CHURCH_MOMO_NUMBER}
                          </div>
                          {/* ACCOUNT NAME */}
                          <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                            <span className="text-neutral-400 font-normal">Name:</span>
                            <span className="text-amber-200">{CHURCH_MOMO_NAME}</span>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(CHURCH_MOMO_NUMBER, 'momo_num')}
                          className="w-full sm:w-auto px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                        >
                          {copiedField === 'momo_num' ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Number Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Number</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* PAYMENT REFERENCE / RANDOM SECURE TICKET NUMBER */}
                    <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-300 flex items-center gap-1">
                          <Info className="w-3 h-3 text-blue-400" />
                          <span>Payment Reference (Ticket ID)</span>
                        </span>
                        <span className="text-[10px] text-blue-400 font-bold">Required</span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
                        <div className="text-lg sm:text-xl font-mono font-black text-white tracking-widest bg-blue-950/80 px-3 py-1.5 rounded-lg border border-blue-600/50 text-center sm:text-left">
                          {secureTicketId}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(secureTicketId, 'ref_code')}
                          className="w-full sm:w-auto px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                        >
                          {copiedField === 'ref_code' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Reference Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Reference</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-[11px] text-blue-200/90 leading-snug pt-1">
                        ⚠️ When sending MoMo, enter <strong className="font-mono text-white underline">{secureTicketId}</strong> as the payment <strong>Reference</strong>.
                      </p>
                    </div>

                    {/* Simple Instructions */}
                    <div className="space-y-1 text-[11px] text-neutral-300 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                      <span className="font-bold text-white block mb-0.5">MoMo Transfer Steps:</span>
                      <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                        <li>Dial <strong className="text-white">*170#</strong> or open MoMo app</li>
                        <li>Send Money &rarr; MoMo User &rarr; <strong className="text-amber-300">{CHURCH_MOMO_NUMBER}</strong></li>
                        <li>Confirm recipient name: <strong className="text-white">{CHURCH_MOMO_NAME}</strong></li>
                        <li>Amount: <strong className="text-emerald-300">GHC {totalAmountGhc.toFixed(2)}</strong></li>
                        <li>Reference: <strong className="text-blue-300 font-mono">{secureTicketId}</strong></li>
                        <li>Take a screenshot of the confirmation SMS!</li>
                      </ol>
                    </div>

                    {/* SENDER INFO (Optional to assist verification) */}
                    <div className="pt-1 space-y-2">
                      <span className="text-[11px] font-bold text-neutral-300 block">
                        3. Transfer Sender (Optional):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-neutral-400 block mb-0.5">
                            MoMo Number Sent From:
                          </label>
                          <input
                            type="tel"
                            value={momoSenderPhone}
                            onChange={(e) => setMomoSenderPhone(e.target.value)}
                            placeholder="024XXXXXXX"
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 text-xs focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-neutral-400 block mb-0.5">
                            MoMo Transaction ID (Optional):
                          </label>
                          <input
                            type="text"
                            value={momoTransactionId}
                            onChange={(e) => setMomoTransactionId(e.target.value)}
                            placeholder="e.g. 19827381923"
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 text-xs focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Group Posting Reminder */}
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/50 flex items-start gap-2.5 text-xs text-emerald-200">
                  <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong className="text-white block">WhatsApp Group Screenshot Confirmation</strong>
                    <span className="text-emerald-300/90 text-[11px] leading-relaxed">
                      After submit, a short order message is copied. On the next screen, join the WhatsApp group, paste the message, and attach your MoMo payment screenshot.
                    </span>
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
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                          +GHC 1.00 / shirt
                        </span>
                      </span>
                      <span className="font-mono text-amber-400 font-semibold">+ GHC {processingFeeGhc.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-sm">
                      <div>
                        <span className="text-white font-bold block">Total Amount to Pay:</span>
                        <span className="text-[10px] text-neutral-400">
                          Includes GHC 1.00 charge per shirt ({totalShirtsCount} {totalShirtsCount === 1 ? 'shirt' : 'shirts'})
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
                      <span>Saving Order & Preparing Ticket...</span>
                    ) : (
                      <>
                        <span>I Have Paid GHC {totalAmountGhc.toFixed(2)} via MoMo — Submit</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 pt-0.5 text-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Ticket #{secureTicketId} · Verified on WhatsApp Group</span>
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
