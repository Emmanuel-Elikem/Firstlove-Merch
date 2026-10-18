import React, { useRef, useState } from 'react';
import { ColorOption, ShirtColor, ShirtEdition, ShirtSize } from '../types/merch';
import { COLOR_OPTIONS, BASONTA_SHIRTS, FIRST_LOVE_MERCH_SHIRTS, SHIRT_EDITIONS, deduplicateById, sanitizeBasontas, unitPriceForShirt, BASONTA_PRICE_GHC } from '../data/merchData';
import { ShirtPhotoCard } from './ShirtPhotoCard';
import { EditionSelector } from './EditionSelector';
import { 
  ChevronLeft, ChevronRight, ShoppingBag, ArrowRight, 
  Sparkles, ShieldCheck, MapPin, Camera, Lock, Plus
} from 'lucide-react';

interface ColorGallerySectionProps {
  selectedColorId: ShirtColor;
  onSelectColor: (color: ShirtColor) => void;
  selectedEdition: ShirtEdition;
  onSelectEdition: (edition: ShirtEdition) => void;
  selectedSize: ShirtSize;
  onSelectSize: (size: ShirtSize) => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToCart: (openImmediately?: boolean) => void;
  onOpenSizeGuide: () => void;
  cartCount: number;
  onOpenCart: () => void;
  customPhotos?: Record<string, string>;
  onUploadPhoto?: (shirtId: string, file: File) => void;
  onOpenUploadManager?: () => void;
  basontas?: ColorOption[];
  isAdminAuthenticated?: boolean;
  onOpenAdminAuth?: () => void;
}

export const ColorGallerySection: React.FC<ColorGallerySectionProps> = ({
  selectedColorId,
  onSelectColor,
  selectedEdition,
  onSelectEdition,
  selectedSize,
  onSelectSize,
  quantity,
  onQuantityChange,
  onAddToCart,
  onOpenSizeGuide,
  cartCount,
  onOpenCart,
  customPhotos = {},
  onUploadPhoto,
  onOpenUploadManager,
  basontas = BASONTA_SHIRTS,
  isAdminAuthenticated = false,
  onOpenAdminAuth,
}) => {
  const customizerRef = useRef<HTMLDivElement>(null);
  const customizerFileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'basonta' | 'first-love'>('all');

  const uniqueBasontas = sanitizeBasontas(basontas);
  const allAvailableShirts = deduplicateById([...uniqueBasontas, ...FIRST_LOVE_MERCH_SHIRTS]);
  const selectedColor = allAvailableShirts.find((c) => c.id === selectedColorId) || allAvailableShirts[0];
  const selectedEditionData = SHIRT_EDITIONS[selectedEdition];
  const unitPrice = unitPriceForShirt(selectedColor, selectedEdition, selectedColorId);
  const isBasontaSelected = selectedColor?.category === 'basonta';
  const currentIndex = allAvailableShirts.findIndex((c) => c.id === selectedColorId);

  const handleSelectColorAndScroll = (colorId: ShirtColor) => {
    onSelectColor(colorId);
    if (customizerRef.current) {
      customizerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handlePrevColor = () => {
    const prevIndex = (currentIndex - 1 + allAvailableShirts.length) % allAvailableShirts.length;
    onSelectColor(allAvailableShirts[prevIndex].id);
  };

  const handleNextColor = () => {
    const nextIndex = (currentIndex + 1) % allAvailableShirts.length;
    onSelectColor(allAvailableShirts[nextIndex].id);
  };

  const handleCustomizerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadPhoto) {
      onUploadPhoto(selectedColor.id, file);
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-12" id="merch-store">
      {/* 4-Step Guided Order Roadmap Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Official Pre-Order · First Love Cape Coast</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
          Select Your Church Apparel
        </h2>

        <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-xl leading-relaxed">
          Basonta workforce ministry shirts are featured at the top below, followed by the First Love church-wide merch shirts. Tap any shirt to customize and pre-order.
        </p>

        {/* 4 Steps at the top with clean arrows */}
        <div className="w-full max-w-3xl mt-6 px-1 py-2">
          <div className="grid grid-cols-7 items-center gap-1 sm:gap-2">
            {/* Step 1 */}
            <div className="col-span-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-blue-600 text-white text-[11px] sm:text-xs font-bold shadow-md shadow-blue-600/30">
              <span className="w-4 h-4 rounded-full bg-white text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0">1</span>
              <span className="hidden sm:inline">Shirt</span>
            </div>

            {/* Arrow 1 -> 2 */}
            <div className="flex justify-center">
              <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />
            </div>

            {/* Step 2 */}
            <div className="col-span-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px] sm:text-xs font-semibold">
              <span className="w-4 h-4 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center text-[10px] font-black shrink-0">2</span>
              <span className="hidden sm:inline">GHC 35 / 60</span>
            </div>

            {/* Arrow 2 -> 3 */}
            <div className="flex justify-center">
              <ArrowRight className="w-4 h-4 text-neutral-600 shrink-0" />
            </div>

            {/* Step 3 */}
            <div className="col-span-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px] sm:text-xs font-semibold">
              <span className="w-4 h-4 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center text-[10px] font-black shrink-0">3</span>
              <span className="hidden sm:inline">Size</span>
            </div>

            {/* Arrow 3 -> 4 */}
            <div className="flex justify-center">
              <ArrowRight className="w-4 h-4 text-neutral-600 shrink-0" />
            </div>

            {/* Step 4 */}
            <div className="col-span-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px] sm:text-xs font-semibold">
              <span className="w-4 h-4 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center text-[10px] font-black shrink-0">4</span>
              <span className="hidden sm:inline">Pay</span>
            </div>
          </div>

          <div className="flex sm:hidden justify-between text-[10px] text-neutral-400 font-medium px-2 mt-2">
            <span>1. Shirt</span>
            <span>2. Tier</span>
            <span>3. Size</span>
            <span>4. Pay</span>
          </div>
        </div>

        {/* Quick Filter Pill Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Apparel ({allAvailableShirts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('basonta')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'basonta'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Basonta Shirts ({basontas.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('first-love')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'first-love'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              First Love Merch ({FIRST_LOVE_MERCH_SHIRTS.length})
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. BASONTA OR MINI SHIRTS SECTION (PLACED AT THE VERY TOP) */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'basonta') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[10px] uppercase tracking-wider border border-amber-500/30">
                  Featured Top
                </span>
                <span className="text-xs font-semibold text-neutral-400">
                  {uniqueBasontas.length} Basonta Wings
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Basonta Ministry Workforce Shirts
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Official workforce apparel for each ministry wing — <strong className="text-neutral-300">GHC {BASONTA_PRICE_GHC}</strong> each.
              </p>
            </div>
          </div>

          {/* Grid of Basonta Shirts */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-6">
            {uniqueBasontas.map((col) => {
              const isSelected = col.id === selectedColorId;
              return (
                <ShirtPhotoCard
                  key={col.id}
                  color={col}
                  isSelected={isSelected}
                  onSelect={() => handleSelectColorAndScroll(col.id)}
                  customPhoto={customPhotos[col.id]}
                  onUploadPhoto={isAdminAuthenticated && onUploadPhoto ? (file) => onUploadPhoto(col.id, file) : undefined}
                />
              );
            })}

            {/* "Add Another Basonta" Card - Only visible when staff unlocked */}
            {isAdminAuthenticated && onOpenUploadManager && (
              <div 
                onClick={onOpenUploadManager}
                className="p-6 rounded-2xl border-2 border-dashed border-neutral-800 bg-neutral-900/30 flex flex-col items-center justify-center text-center group hover:border-amber-500/60 hover:bg-neutral-900/60 transition-all cursor-pointer min-h-[260px]"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-all">
                  <Plus className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Add Another Basonta</h4>
                <p className="text-xs text-neutral-400 max-w-[200px] leading-relaxed">
                  Click to add more ministry wings or upload images.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FOCUSED CONFIGURATOR & SLIDE CONTROLS (Steps 2, 3, 4) */}
      {/* ========================================================================= */}
      <div 
        ref={customizerRef}
        className="p-6 sm:p-8 rounded-3xl bg-neutral-900/70 border border-neutral-800 shadow-2xl relative scroll-mt-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Big Selected Shirt Photo with Next/Prev Slide Controls */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* Quick Navigation Slider Bar */}
            <div className="w-full flex items-center justify-between gap-3 mb-4">
              <button
                type="button"
                onClick={handlePrevColor}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer"
                title="Slide to previous shirt"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="flex items-center gap-2 overflow-hidden px-2">
                <span className="text-xs sm:text-sm font-bold text-white truncate">
                  {selectedColor.name}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextColor}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer"
                title="Slide to next shirt"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Main Showcase Photo with Upload Capability */}
            <div className="w-full max-w-xl">
              <ShirtPhotoCard
                color={selectedColor}
                isSelected={true}
                customPhoto={customPhotos[selectedColor.id]}
                onUploadPhoto={isAdminAuthenticated && onUploadPhoto ? (file) => onUploadPhoto(selectedColor.id, file) : undefined}
              />
            </div>

            {/* Direct Upload Bar for currently selected shirt - Only visible if staff unlocked */}
            {isAdminAuthenticated && onUploadPhoto && (
              <div className="w-full max-w-xl mt-3 flex items-center justify-between gap-3 p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs">
                <input
                  ref={customizerFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCustomizerFileChange}
                />
                <span className="text-neutral-400 truncate">
                  Image for <strong>{selectedColor.name}</strong>: {customPhotos[selectedColor.id] ? 'Uploaded' : 'Empty'}
                </span>
                <button
                  type="button"
                  onClick={() => customizerFileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 border border-neutral-700 transition-colors cursor-pointer shrink-0"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>{customPhotos[selectedColor.id] ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Step 2 & 3 (Edition, Size, Quantity, Add to Bag) */}
          <div className="lg:col-span-5 flex flex-col gap-6 p-6 rounded-2xl bg-neutral-950/80 border border-neutral-800">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Configure Shirt (Step 2 & 3)
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {selectedColor.shortName}
                </span>
              </div>

              <h3 className="text-xl font-black text-white mt-1">
                {selectedEditionData.name}
              </h3>

              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-mono font-black text-white tabular-nums">
                  GHC {unitPrice.toFixed(2)}
                </span>
                <span className="text-xs text-neutral-500">
                  {isBasontaSelected
                    ? `per basonta shirt (GHC ${BASONTA_PRICE_GHC})`
                    : 'per shirt (Cape Coast Collection)'}
                </span>
              </div>
            </div>

            {/* Edition & Size Selector Component */}
            <EditionSelector
              selectedEdition={selectedEdition}
              onEditionChange={onSelectEdition}
              selectedSize={selectedSize}
              onSizeChange={onSelectSize}
              quantity={quantity}
              onQuantityChange={onQuantityChange}
              onOpenSizeGuide={onOpenSizeGuide}
            />

            {/* Subtotal Card */}
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400 block">Subtotal ({quantity} items)</span>
                <span className="text-xs font-semibold text-neutral-200">
                  {selectedColor.shortName} · Size {selectedSize}
                </span>
              </div>
              <div className="text-xl font-mono font-black text-white tabular-nums">
                GHC {(unitPrice * quantity).toFixed(2)}
              </div>
            </div>

            {/* Dual Action Buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => onAddToCart(false)}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Pre-Order Bag</span>
              </button>

              <button
                type="button"
                onClick={() => onAddToCart(true)}
                className="w-full py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs flex items-center justify-center gap-2 border border-neutral-700 transition-colors cursor-pointer"
              >
                <span>Instant MoMo Checkout</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>

            {/* Bag Status Reminder */}
            {cartCount > 0 && (
              <div 
                onClick={onOpenCart}
                className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200 cursor-pointer hover:bg-blue-950/60 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                  <span><strong>{cartCount}</strong> shirt(s) in your pre-order bag</span>
                </span>
                <span className="font-bold text-blue-400 hover:underline flex items-center gap-1">
                  <span>View Bag</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            )}

            {/* Trust Markers */}
            <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-800/80">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Direct MTN MoMo
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" /> First Love Cape Coast
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FIRST LOVE MERCH SHIRTS SECTION (DOWN AT THE BOTTOM) */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'first-love') && (
        <div className="space-y-4 pt-6 border-t border-neutral-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-extrabold text-[10px] uppercase tracking-wider border border-blue-500/30">
                  Church-Wide Merch
                </span>
                <span className="text-xs font-semibold text-neutral-400">
                  {FIRST_LOVE_MERCH_SHIRTS.length} Campaign Colorways
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                First Love Merch Shirts
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                The signature &quot;THE LORD IS THERE&quot; church-wide colorways for all services and fellowship gatherings.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-neutral-400 font-medium">Standard <strong>GHC 60</strong> · Heavyweight <strong>GHC 100</strong></span>
            </div>
          </div>

          {/* Grid of First Love Merch Shirts */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {FIRST_LOVE_MERCH_SHIRTS.map((col) => {
              const isSelected = col.id === selectedColorId;
              return (
                <ShirtPhotoCard
                  key={col.id}
                  color={col}
                  isSelected={isSelected}
                  onSelect={() => handleSelectColorAndScroll(col.id)}
                  customPhoto={customPhotos[col.id]}
                  onUploadPhoto={isAdminAuthenticated && onUploadPhoto ? (file) => onUploadPhoto(col.id, file) : undefined}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BOTTOM APPAREL & PHOTO MANAGER (PROTECTED BY PASSCODE: FLC) */}
      {/* ========================================================================= */}
      <div className="pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-400">
        <div className="text-xs text-neutral-500 text-center sm:text-left">
          <span>First Love Church Cape Coast · All official pre-orders powered by MTN MoMo</span>
        </div>

        <div className="flex items-center gap-3">
          {isAdminAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                Staff Unlocked (FLC)
              </span>
              {onOpenUploadManager && (
                <button
                  type="button"
                  onClick={onOpenUploadManager}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload & Edit Photos</span>
                </button>
              )}
            </div>
          ) : (
            onOpenAdminAuth && (
              <button
                type="button"
                onClick={onOpenAdminAuth}
                className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-neutral-500" />
                <span>Staff / Photo Manager (Passcode: FLC)</span>
              </button>
            )
          )}
        </div>
      </div>
    </section>
  );
};
