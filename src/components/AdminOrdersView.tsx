import React, { useState } from 'react';
import { CustomerOrder, ShirtEdition, ShirtColor, ShirtSize } from '../types/merch';
import {
  COLOR_OPTIONS,
  AVAILABLE_SIZES,
  BASONTA_SHIRTS,
  BASONTA_PRICE_GHC,
  isBasontaColor,
  cartItemProductLabel,
} from '../data/merchData';
import { 
  Package, DollarSign, Download, Search, CheckCircle, Clock, 
  Copy, Check, AlertCircle, RefreshCw, Phone, ShieldCheck, 
  Lock, ExternalLink, Filter, HelpCircle, Layers, Smartphone, MessageCircle, Trash2 
} from 'lucide-react';

interface AdminOrdersViewProps {
  orders: CustomerOrder[];
  onUpdateStatus: (orderId: string, status: 'pending' | 'ready_for_pickup' | 'collected') => void;
  onUpdatePaymentStatus?: (orderId: string, paymentStatus: 'paid' | 'pending' | 'failed') => void;
  onDeleteOrder?: (orderId: string) => void;
  onRefreshOrders: () => void;
  onLockAdmin?: () => void;
}

export const AdminOrdersView: React.FC<AdminOrdersViewProps> = ({
  orders,
  onUpdateStatus,
  onUpdatePaymentStatus,
  onDeleteOrder,
  onRefreshOrders,
  onLockAdmin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'ready_for_pickup' | 'collected'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Helper to get descriptive name for shirt color (explicitly distinguishes the two whites)
  const getColorDisplayName = (colorId: ShirtColor): string => {
    if (colorId === 'white-purple') {
      return 'White with Purple & Pink';
    }
    if (colorId === 'white-teal') {
      return 'White with Deep Teal & Black';
    }
    const color = COLOR_OPTIONS.find((c) => c.id === colorId);
    return color?.name || color?.shortName || colorId;
  };

  // Metrics calculations
  const totalOrdersCount = orders.length;
  const verifiedOrders = orders.filter((o) => o.paymentStatus === 'paid');
  const pendingOrders = orders.filter((o) => o.paymentStatus === 'pending');

  const verifiedRevenueGhc = verifiedOrders.reduce((acc, o) => acc + o.totalAmountGhc, 0);
  const pendingRevenueGhc = pendingOrders.reduce((acc, o) => acc + o.totalAmountGhc, 0);
  const totalRevenueGhc = orders.reduce((acc, o) => acc + o.totalAmountGhc, 0);

  // Individual shirts count by production tally
  let totalShirtsCount = 0;
  let verifiedShirtsCount = 0;

  const sizeTally: Record<ShirtSize, number> = { S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0 };
  const colorTally: Record<string, number> = {
    'black-cyan': 0,
    'blue-yellow': 0,
    'white-purple': 0,
    'purple-yellow': 0,
    'white-teal': 0,
    'sand-green': 0,
  };
  for (const b of BASONTA_SHIRTS) {
    colorTally[b.id] = 0;
  }
  const editionTally: Record<ShirtEdition, number> = { standard: 0, premium: 0 };
  let basontaTally = 0;

  orders.forEach((order) => {
    order.items.forEach((item) => {
      totalShirtsCount += item.quantity;
      if (order.paymentStatus === 'paid') {
        verifiedShirtsCount += item.quantity;
      }
      if (sizeTally[item.size] !== undefined) sizeTally[item.size] += item.quantity;
      if (colorTally[item.color] !== undefined) {
        colorTally[item.color] += item.quantity;
      } else if (isBasontaColor(item.color)) {
        colorTally[item.color] = (colorTally[item.color] || 0) + item.quantity;
      }
      // Edition 60/100 tallies are First Love merch only — never count basontas
      if (isBasontaColor(item.color)) {
        basontaTally += item.quantity;
      } else if (editionTally[item.edition] !== undefined) {
        editionTally[item.edition] += item.quantity;
      }
    });
  });

  // Filtered orders list by search query, collection status filter, and payment verification filter
  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      order.customerName.toLowerCase().includes(query) ||
      order.customerPhone.includes(query) ||
      order.id.toLowerCase().includes(query) ||
      (order.momoReference && order.momoReference.toLowerCase().includes(query)) ||
      (order.momoSenderPhone && order.momoSenderPhone.includes(query)) ||
      (order.momoTransactionId && order.momoTransactionId.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'all' || order.collectionStatus === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Export to CSV for manufacturer and church administration
  const exportToCSV = () => {
    const headers = [
      'Ticket ID', 
      'Branch', 
      'Date', 
      'Customer Name', 
      'Phone', 
      'MoMo Sender',
      'Payment Status', 
      'Collection Status', 
      'Edition', 
      'Color Option', 
      'Size', 
      'Qty', 
      'Unit Price GHC', 
      'Item Subtotal GHC', 
      'Order Subtotal GHC', 
      'Charges GHC (1/shirt)', 
      'Total Amount GHC', 
      'Notes'
    ];

    const rows: string[][] = [];

    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB');
      const orderSubtotal = order.subtotalGhc ?? order.items.reduce((acc, i) => acc + i.subtotal, 0);
      const fee = order.processingFeeGhc ?? (order.totalAmountGhc - orderSubtotal);

      order.items.forEach((item) => {
        const productLabel = cartItemProductLabel(item, COLOR_OPTIONS);
        const colorName = getColorDisplayName(item.color);

        rows.push([
          `"${order.id}"`,
          `"${order.churchBranch || 'First Love Cape Coast'}"`,
          `"${orderDate}"`,
          `"${order.customerName.replace(/"/g, '""')}"`,
          `"${order.customerPhone}"`,
          `"${order.momoSenderPhone || order.customerPhone}"`,
          `"${order.paymentStatus.toUpperCase()}"`,
          `"${order.collectionStatus.replace(/_/g, ' ').toUpperCase()}"`,
          `"${productLabel}"`,
          `"${colorName}"`,
          `"${item.size}"`,
          `"${item.quantity}"`,
          `"${item.unitPrice.toFixed(2)}"`,
          `"${item.subtotal.toFixed(2)}"`,
          `"${orderSubtotal.toFixed(2)}"`,
          `"${fee.toFixed(2)}"`,
          `"${order.totalAmountGhc.toFixed(2)}"`,
          `"${(order.pickupNotes || '').replace(/"/g, '""')}"`,
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FLC_Cape_Coast_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Admin Navigation / Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Admin & Distribution Console
            </span>
            <span className="text-xs text-neutral-500">First Love Cape Coast</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Pre-Orders Dashboard</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Track MoMo payments, verify WhatsApp screenshots, and update collection status anytime.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={onRefreshOrders}
            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {onLockAdmin && (
            <button
              onClick={onLockAdmin}
              className="px-3.5 py-2 rounded-xl bg-neutral-950 hover:bg-red-950/60 border border-neutral-800 hover:border-red-800/80 text-neutral-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Lock Admin Session"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>
          )}
        </div>
      </div>

      {/* MoMo Account Notice Card */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Payments via Paystack</span>
            <span className="font-bold text-white text-sm">Mobile Money & card, confirmed automatically</span>
          </div>
        </div>
        <div className="text-[11px] text-neutral-400">
          Paid orders are sent to the <a href="https://flc-shirts.vercel.app" target="_blank" rel="noopener noreferrer" className="text-amber-300 underline">FLC Shirts delivery list</a> automatically, one row per shirt.
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-xs uppercase font-bold text-neutral-400 block mb-1">
            Total Pre-Orders
          </span>
          <div className="text-2xl font-black text-white font-mono">{totalOrdersCount}</div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            {totalShirtsCount} shirts total reserved
          </span>
        </div>

        {/* Verified Revenue */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-emerald-800/50">
          <span className="text-xs uppercase font-bold text-emerald-400 block mb-1 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Verified Paid</span>
          </span>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            GHC {verifiedRevenueGhc.toFixed(2)}
          </div>
          <span className="text-[11px] text-emerald-400/80 mt-1 block">
            {verifiedOrders.length} orders verified ({verifiedShirtsCount} shirts)
          </span>
        </div>

        {/* Pending Verification */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-amber-800/50">
          <span className="text-xs uppercase font-bold text-amber-400 block mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Awaiting Verification</span>
          </span>
          <div className="text-2xl font-black text-amber-300 font-mono">
            GHC {pendingRevenueGhc.toFixed(2)}
          </div>
          <span className="text-[11px] text-amber-400/80 mt-1 block">
            {pendingOrders.length} orders awaiting WhatsApp proof
          </span>
        </div>

        {/* Total Expected Volume */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-xs uppercase font-bold text-neutral-400 block mb-1">
            Total Volume (Gross)
          </span>
          <div className="text-2xl font-black text-white font-mono">
            GHC {totalRevenueGhc.toFixed(2)}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            All submitted orders (incl. GHC 1 charges)
          </span>
        </div>
      </div>

      {/* Production Breakdowns */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Production Tallies & Inventory Breakdown</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Exact shirt quantities by size, edition, and color (with two whites clearly distinguished).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sizes Tally */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80">
            <span className="text-xs uppercase font-bold text-neutral-400 block mb-3">
              Size Quantities
            </span>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_SIZES.map((szObj) => (
                <div key={szObj.size} className="p-2.5 rounded bg-neutral-900 border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 block">{szObj.size}</span>
                  <span className="font-mono font-bold text-white text-sm">{sizeTally[szObj.size] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Colorway Tally (EXPLICIT DISTINCTION BETWEEN TWO WHITES) */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold text-neutral-400 block">
                Color Options
              </span>
              <span className="text-[10px] text-amber-400 font-semibold">2 Whites Distinct</span>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {COLOR_OPTIONS.map((c) => {
                const count = colorTally[c.id];
                const isWhite = c.id === 'white-purple' || c.id === 'white-teal';

                return (
                  <div 
                    key={c.id} 
                    className={`flex items-center justify-between text-xs p-2 rounded ${
                      isWhite 
                        ? 'bg-neutral-900 border border-neutral-700/80 shadow-sm' 
                        : 'bg-neutral-900/60 border border-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-neutral-600 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className={`truncate ${isWhite ? 'font-bold text-white' : 'text-neutral-300'}`}>
                        {getColorDisplayName(c.id)}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-white tabular-nums shrink-0 ml-2">
                      {count} {count === 1 ? 'shirt' : 'shirts'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edition / Basonta Tally — 60/100 are merch-only; basonta is flat 35 */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80">
            <span className="text-xs uppercase font-bold text-neutral-400 block mb-3">
              Edition / Product Breakdown
            </span>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs p-2.5 rounded bg-neutral-900 border border-amber-500/30">
                <span className="text-amber-300 font-medium">Basonta (GHC {BASONTA_PRICE_GHC})</span>
                <span className="font-mono font-bold text-amber-400 tabular-nums">{basontaTally} shirts</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2.5 rounded bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-300 font-medium">Standard Merch (GHC 60)</span>
                <span className="font-mono font-bold text-white tabular-nums">{editionTally.standard} shirts</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2.5 rounded bg-neutral-900 border border-neutral-800">
                <span className="text-amber-300 font-medium">Heavyweight Oversized (GHC 100)</span>
                <span className="font-mono font-bold text-amber-400 tabular-nums">{editionTally.premium} shirts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table & Search / Filter Controls */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Registered Customer Pre-Orders</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Change collection status reversibly anytime via the dropdown, or verify MoMo payment.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticket, name, or phone..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Filter Tabs: Payment Status & Collection Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-800/60">
          {/* Payment Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-500 text-[11px] font-semibold uppercase tracking-wider mr-1">
              Payment:
            </span>
            <button
              onClick={() => setPaymentFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                paymentFilter === 'all'
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setPaymentFilter('paid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                paymentFilter === 'paid'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold'
                  : 'text-neutral-400 hover:text-emerald-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Verified ({orders.filter(o => o.paymentStatus === 'paid').length})</span>
            </button>
            <button
              onClick={() => setPaymentFilter('pending')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                paymentFilter === 'pending'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700 font-bold'
                  : 'text-neutral-400 hover:text-amber-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Awaiting Proof ({orders.filter(o => o.paymentStatus === 'pending').length})</span>
            </button>
          </div>

          {/* Collection Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-500 text-[11px] font-semibold uppercase tracking-wider mr-1">
              Collection:
            </span>
            {(['all', 'pending', 'ready_for_pickup', 'collected'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950 text-neutral-400 font-semibold border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Ticket / Ref</th>
                <th className="py-3 px-4">Payment Verification</th>
                <th className="py-3 px-4">Purchaser Details</th>
                <th className="py-3 px-4">Items & White Text Distinction</th>
                <th className="py-3 px-4">Amount (GHC 1 Fee)</th>
                <th className="py-3 px-4">Collection Status & Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500 font-sans">
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isPaid = order.paymentStatus === 'paid';
                  const totalShirtsInOrder = order.items.reduce((acc, i) => acc + i.quantity, 0);

                  // WhatsApp quick-link to customer
                  const cleanPhone = order.customerPhone.replace(/\D/g, '');
                  const waNumber = cleanPhone.startsWith('0') ? `233${cleanPhone.slice(1)}` : cleanPhone;
                  const waPrompt = `Hello ${order.customerName}, this is First Love Cape Coast regarding your shirt pre-order ticket #${order.id}.`;
                  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waPrompt)}`;

                  return (
                    <tr key={order.id} className="hover:bg-neutral-800/30 transition-colors font-sans">
                      {/* Ticket Code */}
                      <td className="py-3.5 px-4 font-bold text-white font-mono">
                        <div className="text-amber-400 font-black text-sm">{order.id}</div>
                        <div className="text-[10px] text-neutral-500 font-mono truncate max-w-[120px]">
                          Ref: {order.paystackReference || order.momoReference || order.id}
                        </div>
                      </td>

                      {/* Payment Verification Status with 1-click Toggle */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/80 shadow-sm shadow-emerald-950/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>Verified Paid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-700/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <span>{order.paystackReference ? 'Awaiting Paystack' : 'Awaiting Proof'}</span>
                            </span>
                          )}

                          {isPaid && order.paystackReference && (
                            order.deliveryListSyncedAt ? (
                              <span className="block text-[10px] text-emerald-400/90">On delivery list</span>
                            ) : (
                              <button
                                type="button"
                                onClick={async () => {
                                  await fetch(`/api/orders/${order.id}/sync-delivery`, { method: 'POST' }).catch(() => {});
                                  onRefreshOrders?.();
                                }}
                                title={order.deliveryListError || undefined}
                                className="block text-[10px] font-semibold underline text-red-400 hover:text-red-300 cursor-pointer"
                              >
                                Not on delivery list · Retry
                              </button>
                            )
                          )}

                          {/* Quick Toggle for Payment */}
                          {onUpdatePaymentStatus && (
                            <button
                              type="button"
                              onClick={() => onUpdatePaymentStatus(order.id, isPaid ? 'pending' : 'paid')}
                              className={`block text-[10px] font-semibold underline transition-colors cursor-pointer ${
                                isPaid ? 'text-neutral-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'
                              }`}
                            >
                              {isPaid ? 'Revert to Pending' : '✓ Mark Verified'}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Purchaser Details with WhatsApp Quick-Message */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{order.customerName}</div>
                        <div className="text-neutral-400 font-mono text-[11px] flex items-center gap-2 mt-0.5">
                          <a href={`tel:${order.customerPhone}`} className="hover:underline text-neutral-300">
                            {order.customerPhone}
                          </a>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900 transition-colors"
                            title="Chat with purchaser on WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </a>
                        </div>
                        {order.momoSenderPhone && order.momoSenderPhone !== order.customerPhone && (
                          <div className="text-[10px] text-amber-400/90 font-mono mt-0.5">
                            MoMo Sent From: {order.momoSenderPhone}
                          </div>
                        )}
                      </td>

                      {/* Items Summary with Clear White Distinction */}
                      <td className="py-3.5 px-4 text-neutral-300 text-xs">
                        <div className="space-y-1.5">
                          {order.items.map((i, idx) => {
                            const color = COLOR_OPTIONS.find((c) => c.id === i.color);
                            const isWhite = i.color === 'white-purple' || i.color === 'white-teal';
                            const colorLabel = getColorDisplayName(i.color);

                            return (
                              <div 
                                key={idx} 
                                className={`flex items-center gap-2 py-1 px-2.5 rounded-lg ${
                                  isWhite 
                                    ? 'bg-neutral-900 border border-amber-500/40 text-white font-medium shadow-sm' 
                                    : 'bg-neutral-950/80 border border-neutral-800/60'
                                }`}
                              >
                                {/* Color dot with accent */}
                                <span 
                                  className="w-3.5 h-3.5 rounded-full border border-neutral-600 shrink-0 flex items-center justify-center overflow-hidden"
                                  style={{ backgroundColor: color?.hex || '#ffffff' }}
                                >
                                  {color?.accentHex && (
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color.accentHex }} />
                                  )}
                                </span>

                                <span className="font-bold text-white font-mono">{i.quantity}x</span>
                                <span className="font-mono font-bold text-amber-400 text-[11px]">{i.size}</span>
                                
                                {/* Clearly identified color option */}
                                <span className={isWhite ? 'text-amber-200 font-bold' : 'text-neutral-300'}>
                                  {colorLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {order.pickupNotes && (
                          <div className="text-[10px] text-neutral-400 italic mt-1">
                            Note: {order.pickupNotes}
                          </div>
                        )}
                      </td>

                      {/* Amount Paid with GHC 1 per shirt Fee Breakdown */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white tabular-nums">
                        <div className="text-sm font-black text-amber-300">GHC {order.totalAmountGhc.toFixed(2)}</div>
                        <div className="text-[10px] text-neutral-400 font-sans font-normal mt-0.5">
                          {order.processingFeeGhc !== undefined 
                            ? `+GHC ${order.processingFeeGhc.toFixed(2)} charges (${totalShirtsInOrder} shirt${totalShirtsInOrder === 1 ? '' : 's'})` 
                            : `incl. GHC ${totalShirtsInOrder * 1} charges`}
                        </div>
                      </td>

                      {/* Reversible Status Dropdown & Delete Action */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={order.collectionStatus}
                            onChange={(e) => onUpdateStatus(order.id, e.target.value as 'pending' | 'ready_for_pickup' | 'collected')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer outline-none ${
                              order.collectionStatus === 'collected'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900/80'
                                : order.collectionStatus === 'ready_for_pickup'
                                ? 'bg-blue-950 text-blue-300 border-blue-700 hover:bg-blue-900/80'
                                : 'bg-amber-950 text-amber-300 border-amber-700 hover:bg-amber-900/80'
                            }`}
                          >
                            <option value="pending" className="bg-neutral-900 text-amber-300 font-semibold">
                              ⏳ Pending
                            </option>
                            <option value="ready_for_pickup" className="bg-neutral-900 text-blue-300 font-semibold">
                              📦 Ready for Pickup
                            </option>
                            <option value="collected" className="bg-neutral-900 text-emerald-300 font-semibold">
                              ✅ Collected
                            </option>
                          </select>

                          {/* 1-Click Delete Order Button */}
                          {onDeleteOrder && (
                            confirmDeleteId === order.id ? (
                              <div className="flex items-center gap-1.5 bg-red-950/90 border border-red-600/70 p-1 rounded-xl shadow-lg animate-in fade-in">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteOrder(order.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-wider cursor-pointer whitespace-nowrap shadow-sm"
                                  title="Permanently remove order"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-1.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] cursor-pointer"
                                  title="Cancel deletion"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(order.id)}
                                className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-950/40 transition-all cursor-pointer"
                                title={`Delete order ${order.id}`}
                                aria-label={`Delete order ${order.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
