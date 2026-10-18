import React, { useState } from 'react';
import { CustomerOrder } from '../types/merch';
import { COLOR_OPTIONS, cartItemTitle, isBasontaColor, BASONTA_PRICE_GHC } from '../data/merchData';
import { 
  CheckCircle2, X, MessageCircle, Copy, Check, 
  ExternalLink, Users, Package, Smartphone, Camera 
} from 'lucide-react';

interface OrderReceiptModalProps {
  order: CustomerOrder | null;
  onClose: () => void;
}

export const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/DKOiIKkBd3MG9pvPAdXRIm';

export const getFormattedTicketMessage = (order: CustomerOrder) => {
  const totalShirts = order.items.reduce((acc, item) => acc + item.quantity, 0);
  const itemsSubtotal = order.items.reduce((acc, item) => acc + item.subtotal, 0);
  const fee = order.processingFeeGhc !== undefined 
    ? order.processingFeeGhc 
    : (order.totalAmountGhc > itemsSubtotal ? Number((order.totalAmountGhc - itemsSubtotal).toFixed(2)) : totalShirts * 1);

  const itemsSummary = order.items
    .map((i, idx) => {
      const color = COLOR_OPTIONS.find((c) => c.id === i.color);
      const basonta = isBasontaColor(color, i.color);
      const title = cartItemTitle(i, COLOR_OPTIONS);
      const typeLine = basonta
        ? `   • Type: Basonta (GHC ${BASONTA_PRICE_GHC})`
        : `   • Color: ${color?.name || color?.shortName || i.color}`;
      return `${idx + 1}. *${i.quantity}x ${title}*\n${typeLine}\n   • Size: ${i.size}\n   • Amount: GHC ${i.subtotal.toFixed(2)}`;
    })
    .join('\n\n');

  return (
    `*FIRST LOVE CAPE COAST - T-SHIRT PRE-ORDER*\n` +
    `========================================\n` +
    `🎟️ *Ticket ID:* ${order.id}\n` +
    `👤 *Purchaser:* ${order.customerName}\n` +
    `📱 *Phone:* ${order.customerPhone}\n` +
    (order.momoSenderPhone && order.momoSenderPhone !== order.customerPhone ? `📲 *MoMo Sender Phone:* ${order.momoSenderPhone}\n` : '') +
    (order.momoTransactionId ? `🔢 *MoMo Tx ID:* ${order.momoTransactionId}\n` : '') +
    `\n📦 *ORDERED SHIRT(S) & INFO (${totalShirts} total):*\n` +
    `${itemsSummary}\n\n` +
    `💰 *PAYMENT SUMMARY:*\n` +
    `• Shirts Subtotal: GHC ${itemsSubtotal.toFixed(2)}\n` +
    `• Charges: GHC ${fee.toFixed(2)} (GHC 1/shirt)\n` +
    `• *TOTAL PAID VIA MOMO: GHC ${order.totalAmountGhc.toFixed(2)}*\n` +
    `• Paid To: 0536193423 (Emmanuel Nerkwei Nettey)\n` +
    `• Reference Used: ${order.momoReference || order.id}\n\n` +
    `----------------------------------------\n` +
    `📸 *PLEASE UPLOAD A SCREENSHOT OF YOUR MOMO RECEIPT*\n` +
    `Please attach your Mobile Money payment receipt screenshot or SMS confirmation right below this message to verify and finalize your pre-order!\n` +
    `----------------------------------------\n\n` +
    `📍 *Collection Venue:* First Love Cape Coast In-Church Distribution Desk\n` +
    `👥 *Official WhatsApp Group:* ${WHATSAPP_GROUP_LINK}`
  );
};

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ order, onClose }) => {
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (order) {
      const message = getFormattedTicketMessage(order);
      navigator.clipboard?.writeText(message).catch(() => {});
    }
  }, [order?.id]);

  if (!order) return null;

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const totalShirts = order.items.reduce((acc, item) => acc + item.quantity, 0);
  const itemsSubtotal = order.items.reduce((acc, item) => acc + item.subtotal, 0);
  const fee = order.processingFeeGhc !== undefined ? order.processingFeeGhc : totalShirts * 1;

  // Open WhatsApp with pre-filled shirt and order info + screenshot upload prompt
  const openWhatsAppWithOrderInfo = () => {
    const message = getFormattedTicketMessage(order);
    navigator.clipboard?.writeText(message).catch(() => {});
    setCopied(true);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const openGroupLink = () => {
    const message = getFormattedTicketMessage(order);
    navigator.clipboard?.writeText(message).catch(() => {});
    setCopied(true);
    window.open(WHATSAPP_GROUP_LINK, '_blank');
  };

  const copyOnly = () => {
    const message = getFormattedTicketMessage(order);
    navigator.clipboard?.writeText(message).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl my-auto overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ONE Single Continuous Scrollable Container - Mobile First, No Static Pinned Bottom Tabs */}
        <div className="overflow-y-auto flex-1">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 p-5 sm:p-6 text-neutral-950 text-center relative">
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-neutral-950 transition-colors cursor-pointer"
              aria-label="Close ticket"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-neutral-950 text-amber-400 flex items-center justify-center mx-auto mb-2 shadow-lg">
              <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase text-neutral-900 block">
              First Love Cape Coast
            </span>
            <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5 text-neutral-950">
              Pre-Order Ticket Generated!
            </h2>
            <p className="text-xs text-neutral-900 font-semibold mt-0.5">
              Ticket ID: <span className="font-mono font-black">{order.id}</span> · {totalShirts} {totalShirts === 1 ? 'shirt' : 'shirts'}
            </p>
          </div>

          {/* Action Required Alert: Upload Screenshot */}
          <div className="bg-emerald-950/90 border-b border-emerald-800/80 p-4 sm:p-5 flex items-start gap-3 text-xs text-emerald-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Camera className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <strong className="text-white block text-xs sm:text-sm">
                Next Step: Upload Screenshot of MoMo Receipt
              </strong>
              <p className="text-emerald-300/90 text-[11px] sm:text-xs leading-relaxed">
                Tap <strong>"Send to WhatsApp"</strong> below. It will open WhatsApp with your full shirt & order info already filled in, with a prompt to attach your MoMo payment receipt screenshot!
              </p>
            </div>
          </div>

          {/* Ticket Card Details */}
          <div className="p-4 sm:p-6 space-y-4">
            {/* Ticket Code Box */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">
                  Ticket Number / MoMo Ref
                </span>
                <span className="text-xl sm:text-2xl font-mono font-black text-amber-400 tracking-wider">
                  {order.id}
                </span>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>MoMo Submitted</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {totalShirts} {totalShirts === 1 ? 'shirt' : 'shirts'}
                </span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-amber-500/30 space-y-1.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 text-neutral-400">
                <span>Sent To:</span>
                <span className="font-semibold text-white font-mono">0536193423 (Emmanuel Nerkwei Nettey)</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Payment Reference:</span>
                <span className="font-mono font-bold text-amber-400">{order.momoReference || order.id}</span>
              </div>
              {order.momoSenderPhone && (
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Sender Phone:</span>
                  <span className="font-mono text-neutral-200">{order.momoSenderPhone}</span>
                </div>
              )}
            </div>

            {/* Purchaser & Venue Info */}
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
                            {basonta
                              ? `Basonta · GHC ${BASONTA_PRICE_GHC}`
                              : `Colorway: ${color?.name || color?.shortName}`}
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

              {/* Price Breakdown */}
              <div className="px-3.5 py-2 border-t border-neutral-800/80 bg-neutral-950/60 space-y-1 text-xs">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Shirts Subtotal:</span>
                  <span className="font-mono text-neutral-300">
                    GHC {itemsSubtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <span>Charges:</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      GHC 1 × {totalShirts} shirt{totalShirts === 1 ? '' : 's'}
                    </span>
                  </span>
                  <span className="font-mono text-amber-400 font-semibold">
                    + GHC {fee.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="px-3.5 py-2.5 bg-neutral-950/90 border-t border-neutral-800 flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-200">Total MoMo Paid:</span>
                <span className="text-base font-mono font-black text-amber-300 tabular-nums">
                  GHC {order.totalAmountGhc.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Copy feedback notification */}
            {copied && (
              <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-150">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Order details copied! Paste it into WhatsApp along with your MoMo screenshot.</span>
              </div>
            )}

            <div className="text-[11px] text-neutral-500 font-mono text-center">
              Date: {orderDate} · Reference: {order.momoReference || order.id}
            </div>

            {/* ACTION BUTTONS (In natural scroll flow - No Static Tabs) */}
            <div className="pt-2 space-y-2 pb-4">
              {/* PRIMARY ACTION: Open WhatsApp with prefilled order info & prompt to upload screenshot */}
              <button
                type="button"
                onClick={openWhatsAppWithOrderInfo}
                className="w-full py-4 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-600/30 cursor-pointer min-h-[48px]"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Send Order to WhatsApp & Upload MoMo Screenshot</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
              </button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={openGroupLink}
                  className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[42px]"
                >
                  <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">Join Group Link</span>
                </button>

                <button
                  type="button"
                  onClick={copyOnly}
                  className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[42px]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                  <span>{copied ? 'Copied!' : 'Copy Info'}</span>
                </button>
              </div>

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
