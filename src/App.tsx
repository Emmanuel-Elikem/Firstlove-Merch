/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShirtColor, ShirtEdition, ShirtSize, CartItem, CustomerOrder, PhotoMap, ColorOption } from './types/merch';
import { BASONTA_SHIRTS, FIRST_LOVE_MERCH_SHIRTS, INITIAL_ORDERS, sanitizeBasontas, unitPriceForShirt, mergeBasontasWithDefaults, isBasontaColor } from './data/merchData';
import { Navbar } from './components/Navbar';
import { LandscapeCampaignBanner } from './components/LandscapeCampaignBanner';
import { ColorGallerySection } from './components/ColorGallerySection';
import { CartDrawer } from './components/CartDrawer';
import { FlyerModal } from './components/FlyerModal';
import { SizeGuideModal } from './components/SizeGuideModal';
import { OrderReceiptModal } from './components/OrderReceiptModal';
import { AdminOrdersView } from './components/AdminOrdersView';
import { AdminAuthModal } from './components/AdminAuthModal';
import { BasontaTeaser } from './components/BasontaTeaser';
import { BasontaUploadModal } from './components/BasontaUploadModal';
import { Sparkles, ShoppingBag } from 'lucide-react';

// Helper to compress client-selected images before upload to keep payloads fast & under storage quota
function compressImageFile(file: File, maxDimension = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
          resolve(compressed);
          return;
        }
        resolve(e.target?.result as string);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export default function App() {
  // Navigation
  const [currentView, setCurrentView] = useState<'store' | 'admin'>('store');

  // Basontas List State — merge localStorage with code defaults so stale cached
  // lists (e.g. old 6 wings) never hide new default basontas from BASONTA_SHIRTS.
  const [basontas, setBasontas] = useState<ColorOption[]>(() => {
    let deletedIds: string[] = [];
    try {
      const rawDeleted = localStorage.getItem('flc_deleted_basontas');
      if (rawDeleted) {
        const parsedDeleted = JSON.parse(rawDeleted);
        if (Array.isArray(parsedDeleted)) deletedIds = parsedDeleted.filter((id) => typeof id === 'string');
      }
    } catch (e) {}

    let stored: ColorOption[] = [];
    try {
      const saved = localStorage.getItem('flc_basontas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) stored = parsed;
      }
    } catch (e) {}

    const merged = mergeBasontasWithDefaults(stored, deletedIds, BASONTA_SHIRTS);
    try {
      localStorage.setItem('flc_basontas', JSON.stringify(merged));
    } catch (e) {}
    return merged;
  });

  // Merch Configurator State (Defaults to Dancing Stars)
  const [selectedColorId, setSelectedColorId] = useState<ShirtColor>('dancing-stars');
  const [selectedEdition, setSelectedEdition] = useState<ShirtEdition>('standard');
  const [selectedSize, setSelectedSize] = useState<ShirtSize>('L');
  const [quantity, setQuantity] = useState<number>(1);

  // Cart State (Persisted in localStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('flc_merch_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom Shirt & Banner Photos (Direct real photos with server-backed URL sync)
  const [customPhotos, setCustomPhotos] = useState<PhotoMap>(() => {
    const base: PhotoMap = {
      banner: '/images/banner.png',
      'black-cyan': '/images/black-cyan.jpg',
      'blue-yellow': '/images/blue-yellow.png',
      'white-purple': '/images/white-purple.png',
      'purple-yellow': '/images/purple-yellow.png',
      'white-teal': '/images/white-teal.png',
      'sand-green': '/images/sand-green.png',
      'dancing-stars': '/images/dancing-stars.png',
      'film-stars': '/images/film-stars.png',
      'fragrance-ministry': '/images/fragrance-ministry.png',
      'lovelets': '/images/lovelets.png',
      'ushers': '/images/ushers.png',
      'hearing-and-seeing': '/images/hearing-and-seeing.jpg',
      'culinary-stars': '/images/culinary-stars.png',
      'worship-stars': '/images/worship-stars.png',
      'sheep-seeking': '/images/sheep-seeking.png',
      'telepastoring': '/images/telepastoring.png',
      'flowing-waters': '/images/flowing-waters.png',
      'diamond-bond': '/images/diamond-bond.png',
      'airport-stars': '/images/airport-stars.png',
      'glgc-family': '/images/glgc-family.png',
    };
    try {
      const cached = localStorage.getItem('flc_uploaded_photos');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Clean out duplicate fragrance keys
        delete parsed['fragrance-stars'];
        delete parsed['fragrance'];
        // Purge any huge raw base64 data URLs that caused storage quota issues
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'string' && v.startsWith('data:image/') && v.length > 500) {
            delete parsed[k];
          }
        }
        // Migrate superseded default photo paths (dancing-stars.jpg → .png)
        if (
          parsed['dancing-stars'] === '/images/dancing-stars.jpg' ||
          (typeof parsed['dancing-stars'] === 'string' &&
            String(parsed['dancing-stars']).endsWith('/dancing-stars.jpg'))
        ) {
          parsed['dancing-stars'] = '/images/dancing-stars.png';
        }
        const merged = { ...base, ...parsed };
        delete merged['fragrance-stars'];
        delete merged['fragrance'];
        // Prefer code-default png over any remaining stale jpg overlay
        if (
          merged['dancing-stars'] === '/images/dancing-stars.jpg' ||
          (typeof merged['dancing-stars'] === 'string' &&
            String(merged['dancing-stars']).endsWith('/dancing-stars.jpg'))
        ) {
          merged['dancing-stars'] = '/images/dancing-stars.png';
        }
        try {
          localStorage.setItem('flc_uploaded_photos', JSON.stringify(merged));
        } catch (e) {}
        return merged;
      }
    } catch (e) {}
    return base;
  });

  // Orders State (Synced with Backend /api/orders)
  const [orders, setOrders] = useState<CustomerOrder[]>(INITIAL_ORDERS);
  const [confirmedOrder, setConfirmedOrder] = useState<CustomerOrder | null>(null);

  // Modals & Notifications
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFlyerOpen, setIsFlyerOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Staff Passcode Authentication State (Passcode: FLC)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('flc_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminAuthPendingAction, setAdminAuthPendingAction] = useState<'admin' | 'upload' | null>(null);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('flc_merch_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }, [cartItems]);

  // Fetch photos, custom basontas and live orders from server
  const fetchServerData = async () => {
    try {
      const [ordersRes, photosRes, basontasRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/photos'),
        fetch('/api/basontas')
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (ordersData.orders && Array.isArray(ordersData.orders)) {
          setOrders(ordersData.orders);
        }
      }

      if (photosRes.ok) {
        const photosData = await photosRes.json();
        if (photosData.photos && typeof photosData.photos === 'object') {
          delete photosData.photos['fragrance-stars'];
          delete photosData.photos['fragrance'];
          setCustomPhotos((prev) => {
            const merged = { ...prev, ...photosData.photos };
            delete merged['fragrance-stars'];
            delete merged['fragrance'];
            try {
              localStorage.setItem('flc_uploaded_photos', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      }

      if (basontasRes.ok) {
        const basontasData = await basontasRes.json();
        if (basontasData.basontas && Array.isArray(basontasData.basontas)) {
          let deletedIds: string[] = [];
          try {
            const rawDeleted = localStorage.getItem('flc_deleted_basontas');
            if (rawDeleted) {
              const parsedDeleted = JSON.parse(rawDeleted);
              if (Array.isArray(parsedDeleted)) {
                deletedIds = parsedDeleted.filter((id: unknown) => typeof id === 'string');
              }
            }
          } catch (e) {}
          // Server already merges defaults; still merge client-side so localStorage
          // tombstones and any race with stale cache cannot drop new defaults.
          const finalBasontas = mergeBasontasWithDefaults(
            basontasData.basontas,
            deletedIds,
            BASONTA_SHIRTS
          );
          setBasontas(finalBasontas);
          try {
            localStorage.setItem('flc_basontas', JSON.stringify(finalBasontas));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Backend server fetch error (using local state fallback):', err);
    }
  };

  useEffect(() => {
    fetchServerData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Direct Photo Upload Handler with client-side compression & quota safety
  const handleUploadPhoto = async (shirtId: string, file: File) => {
    const targetShirt = [...basontas, ...FIRST_LOVE_MERCH_SHIRTS].find((s) => s.id === shirtId);
    const displayName = targetShirt?.name || shirtId;
    showToast(`Optimizing & uploading photo for ${displayName}...`);

    try {
      // Compress image client-side to keep under storage limits and upload fast
      const dataUrl = await compressImageFile(file);
      if (!dataUrl) {
        showToast('Could not process image file.');
        return;
      }

      // Update state in memory for immediate UI feedback (never store raw base64 in localStorage!)
      setCustomPhotos((prev) => ({ ...prev, [shirtId]: dataUrl }));

      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: shirtId, dataUrl }),
      });

      if (res.ok) {
        const resData = await res.json();
        const serverUrl = resData.url || `/images/${shirtId}.png`;

        // Update photo map with permanent lightweight server URL
        setCustomPhotos((prev) => {
          const next = { ...prev, [shirtId]: serverUrl };
          try {
            localStorage.setItem('flc_uploaded_photos', JSON.stringify(next));
          } catch (e) {}
          return next;
        });

        // Update basontas array so imageFile is permanently populated
        setBasontas((prev) => {
          const updated = prev.map((b) => (b.id === shirtId ? { ...b, imageFile: serverUrl } : b));
          const sanitized = sanitizeBasontas(updated);
          try {
            localStorage.setItem('flc_basontas', JSON.stringify(sanitized));
          } catch (e) {}
          return sanitized;
        });

        showToast(`✓ Image for ${displayName} uploaded successfully!`);
      } else {
        showToast(`Image loaded for this session.`);
      }
    } catch (err) {
      console.error('Failed to persist photo to backend:', err);
      showToast(`Upload completed locally.`);
    }
  };

  // Add New Basonta Wing
  const handleAddNewBasonta = async (name: string, file?: File) => {
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let finalName = name;
    // Prevent duplicate fragrance wing creation
    if (slug.includes('fragrance')) {
      slug = 'fragrance-ministry';
      finalName = 'Fragrance Ministry';
    }

    const newBasonta: ColorOption = {
      id: slug,
      name: finalName,
      shortName: finalName,
      category: 'basonta',
      bodyColor: '#18181B',
      hex: '#18181B',
      accentHex: '#F59E0B',
      textColor: '#FFFFFF',
      printColors: 'Custom Print',
      imageFile: '',
      frontText: finalName.toUpperCase(),
      backText: 'FIRST LOVE CHURCH',
      tagline: '',
      description: ''
    };

    // Clearing a tombstone if this id was previously DELETE'd (re-add)
    let deletedIds: string[] = [];
    try {
      const rawDeleted = localStorage.getItem('flc_deleted_basontas');
      if (rawDeleted) {
        const parsedDeleted = JSON.parse(rawDeleted);
        if (Array.isArray(parsedDeleted)) {
          deletedIds = parsedDeleted.filter((id: unknown) => typeof id === 'string' && id !== slug);
          localStorage.setItem('flc_deleted_basontas', JSON.stringify(deletedIds));
        }
      }
    } catch (e) {}

    setBasontas((prev) => {
      const exists = prev.some((b) => b.id === slug);
      const updated = exists
        ? prev.map((b) => (b.id === slug ? { ...b, ...newBasonta } : b))
        : [...prev, newBasonta];
      const merged = mergeBasontasWithDefaults(updated, deletedIds, BASONTA_SHIRTS);
      try {
        localStorage.setItem('flc_basontas', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });

    try {
      await fetch('/api/basontas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basonta: newBasonta }),
      });
    } catch (e) {}

    setSelectedColorId(slug);

    if (file) {
      handleUploadPhoto(slug, file);
    }

    showToast(`✓ Basonta "${finalName}" slot updated!`);
  };

  // Delete Basonta Wing
  const handleDeleteBasonta = async (shirtId: string) => {
    // Tombstone default catalog ids so merge does not re-inject them after DELETE
    const isDefault = BASONTA_SHIRTS.some((b) => b.id === shirtId);
    let deletedIds: string[] = [];
    try {
      const rawDeleted = localStorage.getItem('flc_deleted_basontas');
      if (rawDeleted) {
        const parsedDeleted = JSON.parse(rawDeleted);
        if (Array.isArray(parsedDeleted)) {
          deletedIds = parsedDeleted.filter((id: unknown) => typeof id === 'string');
        }
      }
      if (isDefault && !deletedIds.includes(shirtId)) {
        deletedIds = [...deletedIds, shirtId];
      }
      localStorage.setItem('flc_deleted_basontas', JSON.stringify(deletedIds));
    } catch (e) {}

    setBasontas((prev) => {
      const updated = prev.filter((b) => b.id !== shirtId);
      const merged = mergeBasontasWithDefaults(updated, deletedIds, BASONTA_SHIRTS);
      try {
        localStorage.setItem('flc_basontas', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });

    setCustomPhotos((prev) => {
      const next = { ...prev };
      delete next[shirtId];
      try {
        localStorage.setItem('flc_uploaded_photos', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    try {
      await fetch(`/api/basontas/${shirtId}`, { method: 'DELETE' });
    } catch (e) {}

    showToast(`✓ Removed wing`);
  };

  // Admin and Photo Manager access control (Passcode: FLC)
  const handleNavigate = (view: 'store' | 'admin') => {
    if (view === 'admin') {
      if (isAdminAuthenticated) {
        setCurrentView('admin');
      } else {
        setAdminAuthPendingAction('admin');
        setIsAdminAuthModalOpen(true);
      }
    } else {
      setCurrentView('store');
    }
  };

  const handleAdminAuthSuccess = () => {
    try {
      sessionStorage.setItem('flc_admin_auth', 'true');
    } catch (e) {}
    setIsAdminAuthenticated(true);
    setIsAdminAuthModalOpen(false);

    if (adminAuthPendingAction === 'upload') {
      setIsUploadModalOpen(true);
      showToast('✓ Passcode FLC verified. Photo Manager opened!');
    } else {
      setCurrentView('admin');
      showToast('✓ Passcode FLC verified. Coordinator Admin opened!');
    }
    setAdminAuthPendingAction(null);
  };

  const handleLockAdmin = () => {
    try {
      sessionStorage.removeItem('flc_admin_auth');
    } catch (e) {}
    setIsAdminAuthenticated(false);
    setCurrentView('store');
    showToast('Admin session locked');
  };

  // Cart operations
  const handleAddToCart = (openCartImmediately: boolean = false) => {
    const allShirtsForPrice = [...basontas, ...FIRST_LOVE_MERCH_SHIRTS];
    const selectedShirt = allShirtsForPrice.find((c) => c.id === selectedColorId);
    // Basonta never uses Standard/Premium edition pricing — pin edition key for cart merge only
    const cartEdition = isBasontaColor(selectedShirt, selectedColorId) ? 'standard' : selectedEdition;
    const currentPrice = unitPriceForShirt(selectedShirt, cartEdition, selectedColorId);
    const existingIndex = cartItems.findIndex(
      (item) => item.edition === cartEdition && item.color === selectedColorId && item.size === selectedSize
    );

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += quantity;
      updated[existingIndex].unitPrice = currentPrice;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * currentPrice;
      setCartItems(updated);
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        edition: cartEdition,
        color: selectedColorId,
        size: selectedSize,
        quantity,
        unitPrice: currentPrice,
        subtotal: quantity * currentPrice,
      };
      setCartItems([...cartItems, newItem]);
    }

    const colorName = allShirtsForPrice.find((c) => c.id === selectedColorId)?.shortName || selectedColorId;
    showToast(`Added ${quantity}x ${colorName} (${selectedSize}) to pre-order bag!`);

    if (openCartImmediately) {
      setIsCartOpen(true);
    }
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? { ...item, quantity: newQty, subtotal: newQty * item.unitPrice }
              : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOrderSuccess = (newOrder: CustomerOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    setConfirmedOrder(newOrder);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'pending' | 'ready_for_pickup' | 'collected') => {
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionStatus: status }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, collectionStatus: status } : o))
      );
      showToast(`Order ${orderId} marked as ${status.replace(/_/g, ' ')}!`);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: 'paid' | 'pending' | 'failed') => {
    try {
      await fetch(`/api/orders/${orderId}/payment-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o))
      );
      showToast(`Order ${orderId} marked as ${paymentStatus === 'paid' ? 'VERIFIED' : paymentStatus.toUpperCase()}!`);
    } catch (err) {
      console.error('Failed to update payment status:', err);
    }
  };

  const scrollToCustomizer = () => {
    const el = document.getElementById('merch-store');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotalGhc = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-4 sm:right-8 z-50 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xl shadow-blue-900/40 border border-blue-400 flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenFlyer={() => setIsFlyerOpen(true)}
        onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
        cartCount={cartCount}
        cartTotalGhc={cartTotalGhc}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenUploadManager={() => setIsUploadModalOpen(true)}
      />

      {/* Main View Area */}
      {currentView === 'admin' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
          <AdminOrdersView
            orders={orders}
            onUpdateStatus={handleUpdateOrderStatus}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
            onRefreshOrders={fetchServerData}
            onLockAdmin={handleLockAdmin}
          />
        </main>
      ) : (
        <main className="flex-1 flex flex-col">
          {/* 1. TOP LANDSCAPE CAMPAIGN BANNER */}
          <LandscapeCampaignBanner
            onScrollToCustomizer={scrollToCustomizer}
            customBannerPhoto={customPhotos['banner']}
          />

          {/* 2. COLOR GALLERY & GUIDED CUSTOMIZER (Basonta Shirts at the Top, First Love Merch Shirts at Bottom) */}
          <ColorGallerySection
            selectedColorId={selectedColorId}
            onSelectColor={setSelectedColorId}
            selectedEdition={selectedEdition}
            onSelectEdition={setSelectedEdition}
            selectedSize={selectedSize}
            onSelectSize={setSelectedSize}
            quantity={quantity}
            onQuantityChange={setQuantity}
            onAddToCart={handleAddToCart}
            onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
            cartCount={cartCount}
            onOpenCart={() => setIsCartOpen(true)}
            customPhotos={customPhotos}
            onUploadPhoto={handleUploadPhoto}
            onOpenUploadManager={() => setIsUploadModalOpen(true)}
            basontas={basontas}
            isAdminAuthenticated={isAdminAuthenticated}
            onOpenAdminAuth={() => {
              setAdminAuthPendingAction('upload');
              setIsAdminAuthModalOpen(true);
            }}
          />

          {/* 3. SIMPLE 3-STEP COLLECTION GUIDE IN CAPE COAST */}
          <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
            <div className="p-8 rounded-3xl bg-neutral-900/50 border border-neutral-800">
              <h3 className="text-lg font-bold text-white text-center mb-6">
                How Pre-Ordering & Collection Works in Cape Coast
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black flex items-center justify-center mb-3">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Pick Shirt & Send MoMo</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Select your Basonta wing or First Love merch shirt & size, then transfer the total amount via MTN Mobile Money to <strong className="text-amber-300">0536193423</strong> with your ticket number as reference.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black flex items-center justify-center mb-3">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Upload Proof in WhatsApp Group</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Tap to join the official WhatsApp Group, paste your generated ticket, and upload your MoMo payment screenshot for instant verification.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black flex items-center justify-center mb-3">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Collect at Church</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Present your confirmed ticket number at the First Love Cape Coast distribution desk during Sunday service or bacenta to collect your shirt(s).
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. BASONTA DIRECTORY & WINGS SUMMARY */}
          <section className="px-4 sm:px-8">
            <BasontaTeaser />
          </section>
        </main>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-900 bg-neutral-950 px-4 sm:px-8 py-8 text-neutral-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-neutral-300 font-bold">First Love Cape Coast</span>
            <span>· All rights reserved</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsFlyerOpen(true)}
              className="hover:text-neutral-300 transition-colors cursor-pointer"
            >
              Official Campaign Flyer
            </button>
            <button
              onClick={() => setIsSizeGuideOpen(true)}
              className="hover:text-neutral-300 transition-colors cursor-pointer"
            >
              Size Chart
            </button>
            <button
              onClick={() => {
                if (isAdminAuthenticated) {
                  setIsUploadModalOpen(true);
                } else {
                  setAdminAuthPendingAction('upload');
                  setIsAdminAuthModalOpen(true);
                }
              }}
              className="hover:text-amber-300 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Photo Manager (Passcode: FLC)
            </button>
            <button
              onClick={() => (currentView === 'store' ? handleNavigate('admin') : setCurrentView('store'))}
              className="hover:text-neutral-300 transition-colors cursor-pointer"
            >
              {currentView === 'store' ? 'Coordinator Admin' : 'Back to Store'}
            </button>
          </div>
        </div>
      </footer>

      {/* Slide-Over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Direct Basonta Photo Upload & Wing Manager Modal */}
      <BasontaUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        basontas={basontas}
        customPhotos={customPhotos}
        onUploadPhoto={handleUploadPhoto}
        onAddNewBasonta={handleAddNewBasonta}
        onDeleteBasonta={handleDeleteBasonta}
      />

      {/* Official Flyer Modal */}
      <FlyerModal isOpen={isFlyerOpen} onClose={() => setIsFlyerOpen(false)} />

      {/* Sizing Guide Modal */}
      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />

      {/* Digital Receipt Modal (Consolidated Master Ticket for Multi-Shirt Orders) */}
      <OrderReceiptModal order={confirmedOrder} onClose={() => setConfirmedOrder(null)} />

      {/* Coordinator Passkey Modal (Passkey: Elsieee) */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onSuccess={handleAdminAuthSuccess}
        onCancel={() => setIsAdminAuthModalOpen(false)}
      />
    </div>
  );
}
