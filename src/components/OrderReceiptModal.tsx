import React from 'react';
import { CustomerOrder } from '../types/merch';
import { COLOR_OPTIONS, cartItemTitle, isBasontaColor, BASONTA_PRICE_GHC } from '../data/merchData';
import { CheckCircle2, X, MessageCircle, ExternalLink } from 'lucide-react';

interface OrderReceiptModalProps {
  order: CustomerOrder | null;
  onClose: () => void;
}

/** Official First Love Cape Coast pre-order WhatsApp group. */
export const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/DKOiIKkBd3MG9pvPAdXRIm';

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const orderDate = new Date(order.paidAt || order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const totalShirts = order.items.reduce((acc, item) => acc + item.quantity, 0);
  const itemsSubtotal = order.items.reduce((acc, item) => acc + item.subtotal, 0);
  const fee = order.processingFeeGhc ?? order.totalAmountGhc - itemsSubtotal;
  const reference = order.paystackReference || order.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl my-auto overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 p-5 sm:p-6 text-neutral-950 text-center relative">
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-neutral-950 transition-colors cursor-pointer"
              aria-label="Close ticket"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-neutral-950 text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-lg">
              <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase text-neutral-900 block">
              First Love Cape Coast
            </span>
            <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5 text-neutral-950">Payment Confirmed!</h2>
            <p className="text-xs text-neutral-900 font-semibold mt-0.5">
              Ticket ID: <span className="font-mono font-black">{order.id}</span> · {totalShirts}{' '}
              {totalShirts === 1 ? 'shirt' : 'shirts'}
            </p>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* Ticket Code Box */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">
                  Pickup Ticket
                </span>
                <span className="text-xl sm:text-2xl font-mono font-black text-amber-400 tracking-wider">{order.id}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Paid</span>
              </div>
            </div>

            <p className="text-[11px] sm:text-xs text-neutral-300 leading-relaxed">
              Your shirts are on the distribution list. Show this ticket (or give your name / phone number) at the
              First Love Cape Coast distribution desk to collect.
            </p>

            {/* Payment Details */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-emerald-500/30 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-neutral-400">
                <span>Paid Via:</span>
                <span className="font-semibold text-white">
                  Paystack{order.channel ? ` · ${order.channel.replace(/_/g, ' ')}` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Payment Reference:</span>
                <span className="font-mono font-bold text-emerald-400">{reference}</span>
              </div>
            </div>

            {/* Purchaser */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/80">
                <span className="text-neutral-500 block mb-0.5 text-[10px] uppercase font-bold">Purchaser</span>
                <span className="font-semibold text-white block truncate">{order.customerName}</span>
                <span className="text-neutral-400 font-mono text-[11px]">{order.customerPhone}</span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/80">
                <span className="text-neutral-500 block mb-0.5 text-[10px] uppercase font-bold">Collection Venue</span>
                <span className="font-semibold text-white block">First Love Cape Coast</span>
                <span className="text-neutral-400 text-[11px]">Distribution Desk</span>
              </div>
            </div>

            {/* Itemized Shirt Breakdown */}
            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/40">
              <div className="px-3.5 py-2 bg-neutral-950 text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 flex items-center justify-between">
                <span>Shirt Order Info</span>
                <span className="text-[10px] text-neutral-500">{order.items.length} item(s)</span>
              </div>
              <div className="divide-y divide-neutral-800/60 p-1.5">
                {order.items.map((item) => {
                  const color = COLOR_OPTIONS.find((c) => c.id === item.color);
                  const basonta = isBasontaColor(color, item.color);
                  const title = cartItemTitle(item, COLOR_OPTIONS);
                  return (
                    <div key={item.id} className="py-2.5 px-2.5 flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: color?.hex }}
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">
                            {item.quantity}x {title}
                          </div>
                          <div className="text-neutral-400 text-[11px] truncate">
                            {basonta ? `Basonta · GHC ${BASONTA_PRICE_GHC}` : `Colorway: ${color?.name || color?.shortName}`}
                            {' · Size: '}
                            <span className="text-white font-mono font-bold">{item.size}</span>
                          </div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-white tabular-nums shrink-0 text-right">
                        GHC {item.subtotal.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-3.5 py-2 border-t border-neutral-800/80 bg-neutral-950/60 space-y-1 text-xs">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Shirts Subtotal:</span>
                  <span className="font-mono text-neutral-300">GHC {itemsSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Charges:</span>
                  <span className="font-mono text-amber-400 font-semibold">+ GHC {fee.toFixed(2)}</span>
                </div>
              </div>
              <div className="px-3.5 py-2.5 bg-neutral-950/90 border-t border-neutral-800 flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-200">Total Paid:</span>
                <span className="text-base font-mono font-black text-emerald-300 tabular-nums">
                  GHC {order.totalAmountGhc.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-neutral-500 font-mono text-center">
              Date: {orderDate} · Reference: {reference}
            </div>

            {/* Final step: join the group for pickup updates */}
            <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-700/50 text-xs text-emerald-200 space-y-1">
              <strong className="text-white block text-xs sm:text-sm">Last step: join the WhatsApp group</strong>
              <span className="text-emerald-300/90 text-[11px] sm:text-xs leading-relaxed block">
                Pickup dates and distribution updates are shared there.
              </span>
            </div>

            <div className="pt-1 space-y-2 pb-4">
              <a
                href={WHATSAPP_GROUP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-600/30 cursor-pointer min-h-[48px]"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Join the WhatsApp Group</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white font-semibold text-xs transition-colors cursor-pointer text-center min-h-[40px] border border-neutral-800"
              >
                Done / Close Ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
