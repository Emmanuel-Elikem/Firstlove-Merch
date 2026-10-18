import { ColorOption, ShirtOption, ShirtSize, CustomerOrder, ShirtEdition } from '../types/merch';

export const LANDSCAPE_HERO_IMAGE = '/images/banner.png';

/** Basonta (ministry / workforce) shirts — flat price per shirt */
export const BASONTA_PRICE_GHC = 35;
/** First Love merch — standard edition */
export const MERCH_STANDARD_PRICE_GHC = 60;
/** First Love merch — premium / heavyweight edition */
export const MERCH_PREMIUM_PRICE_GHC = 100;
export const FEE_PER_SHIRT_GHC = 1;

export const SHIRT_EDITIONS: Record<'standard' | 'premium', ShirtOption> = {
  standard: {
    edition: 'standard',
    name: 'Standard T-Shirt',
    tagline: 'Classic Church Wear',
    priceGhc: MERCH_STANDARD_PRICE_GHC,
    fabric: '100% Breathable Ringspun Cotton (180 GSM)',
    fit: 'Regular Comfort Fit',
    features: [
      'Soft combed ringspun cotton',
      'Durable screen-printed graphics (Front & Back)',
      'Reinforced crew neck collar',
      'Ideal for weekly fellowships and campus outreach'
    ]
  },
  premium: {
    edition: 'premium',
    name: 'Premium Heavyweight Oversized',
    tagline: 'Luxury Streetwear Drop-Shoulder',
    priceGhc: MERCH_PREMIUM_PRICE_GHC,
    fabric: 'Ultra-Heavy Combed Cotton (240+ GSM)',
    fit: 'Relaxed Drop-Shoulder Oversized Cut',
    features: [
      'Heavyweight luxury streetwear fabric',
      'Boxy drop-shoulder modern drape',
      'High-density screenprint (Front & Back)',
      'Pre-shrunk double-stitched hem and thick rib collar'
    ]
  }
};

export const BASONTA_SHIRTS: ColorOption[] = [
  {
    id: 'dancing-stars',
    name: 'Dancing Stars',
    shortName: 'Dancing Stars',
    category: 'basonta',
    bodyColor: '#18181B',
    hex: '#18181B',
    accentHex: '#FBBF24',
    textColor: '#FFFFFF',
    printColors: 'Custom Print',
    imageFile: '/images/dancing-stars.jpg',
    frontText: 'DANCING STARS',
    backText: 'FIRST LOVE CHURCH',
    tagline: '',
    description: ''
  },
  {
    id: 'film-stars',
    name: 'Film Stars',
    shortName: 'Film Stars',
    category: 'basonta',
    bodyColor: '#5C2E1A',
    hex: '#5C2E1A',
    accentHex: '#0EA5E9',
    textColor: '#FFFFFF',
    printColors: 'Cyan & White',
    imageFile: '/images/film-stars.png',
    frontText: 'FILM STARS',
    backText: 'FIRST LOVE CHURCH',
    tagline: '',
    description: ''
  },
  {
    id: 'fragrance-ministry',
    name: 'Fragrance Ministry',
    shortName: 'Fragrance Ministry',
    category: 'basonta',
    bodyColor: '#F472B6',
    hex: '#F472B6',
    accentHex: '#06B6D4',
    textColor: '#FFFFFF',
    printColors: 'Cyan & White',
    imageFile: '/images/fragrance-ministry.png',
    frontText: 'JOIN THE FRAGRANCE MINISTRY',
    backText: 'FIRST LOVE THE LORD IS THERE',
    tagline: 'Signature Pink Ministry Apparel',
    description: 'Vibrant pink workforce apparel with vertical front typography and cyan FIRST LOVE back graphics.'
  },
  {
    id: 'lovelets',
    name: 'Lovelets',
    shortName: 'Lovelets',
    category: 'basonta',
    bodyColor: '#18181B',
    hex: '#18181B',
    accentHex: '#CBD5E1',
    textColor: '#FFFFFF',
    printColors: 'Custom Print',
    imageFile: '/images/lovelets.png',
    frontText: 'LOVELETS',
    backText: 'FIRST LOVE CHURCH',
    tagline: '',
    description: ''
  },
  {
    id: 'ushers',
    name: 'Ushers',
    shortName: 'Ushers',
    category: 'basonta',
    bodyColor: '#18181B',
    hex: '#18181B',
    accentHex: '#F59E0B',
    textColor: '#FFFFFF',
    printColors: 'Custom Print',
    imageFile: '/images/ushers.png',
    frontText: 'USHERS',
    backText: 'FIRST LOVE CHURCH',
    tagline: '',
    description: ''
  },
  {
    id: 'hearing-and-seeing',
    name: 'Projection',
    shortName: 'Projection',
    category: 'basonta',
    bodyColor: '#111215',
    hex: '#111215',
    accentHex: '#EA580C',
    textColor: '#FFFFFF',
    printColors: 'Orange & White',
    imageFile: '/images/hearing-and-seeing.jpg',
    frontText: 'PROJECTION',
    backText: 'HEARING SEEING · ROMANS 10:17',
    tagline: 'Projection & Media Crew',
    description: 'Official projection and media workforce t-shirt featuring front chest PROJECTION lettering and multi-icon back graphics.'
  },
  {
    id: 'culinary-stars',
    name: 'Culinary Stars',
    shortName: 'Culinary Stars',
    category: 'basonta',
    bodyColor: '#F8FAFC',
    hex: '#F8FAFC',
    accentHex: '#E11D1B',
    textColor: '#E11D1B',
    printColors: 'Red & Black',
    imageFile: '/images/culinary-stars.png',
    frontText: 'CULINARY STARS',
    backText: 'FIRST LOVE CHURCH',
    tagline: '',
    description: ''
  },
  {
    id: 'worship-stars',
    name: 'Worship Stars',
    shortName: 'Worship Stars',
    category: 'basonta',
    bodyColor: '#14532D',
    hex: '#14532D',
    accentHex: '#0EA5E9',
    textColor: '#FFFFFF',
    printColors: 'Cyan & White',
    imageFile: '/images/worship-stars.png',
    frontText: 'WORSHIP STARS',
    backText: 'FIRST LOVE CHURCH',
    tagline: '',
    description: ''
  },
  {
    id: 'sheep-seeking',
    name: 'Sheep Seeking',
    shortName: 'Sheep Seeking',
    category: 'basonta',
    bodyColor: '#C2610C',
    hex: '#C2610C',
    accentHex: '#0EA5E9',
    textColor: '#FFFFFF',
    printColors: 'Cyan & White',
    imageFile: '/images/sheep-seeking.png',
    frontText: 'SHEEP SEEKING',
    backText: 'FIRST LOVE CHURCH',
    tagline: '',
    description: ''
  }
];

export const FIRST_LOVE_MERCH_SHIRTS: ColorOption[] = [
  {
    id: 'black-cyan',
    name: 'Jet Black with Cyan & White',
    shortName: 'Black / Cyan',
    category: 'first-love',
    bodyColor: '#111215',
    hex: '#111215',
    accentHex: '#06B6D4',
    textColor: '#FFFFFF',
    printColors: 'Cyan & White',
    imageFile: '/images/black-cyan.jpg',
    frontText: 'THE LORD IS THERE',
    backText: 'FIRST LOVE CHURCH',
    tagline: 'Signature Streetwear',
    description: 'Classic jet black with electric cyan and white vertical back graphics and front chest insignia.'
  },
  {
    id: 'blue-yellow',
    name: 'Royal Blue with Yellow & White',
    shortName: 'Royal Blue / Yellow',
    category: 'first-love',
    bodyColor: '#1D4ED8',
    hex: '#1D4ED8',
    accentHex: '#FACC15',
    textColor: '#FFFFFF',
    printColors: 'Yellow & White',
    imageFile: '/images/blue-yellow.png',
    frontText: 'THE LORD IS THERE',
    backText: 'FIRST LOVE CHURCH',
    tagline: 'High Energy Blue',
    description: 'Electric cobalt royal blue with high-visibility bright yellow lettering and sacred emblems.'
  },
  {
    id: 'white-purple',
    name: 'Crisp White with Purple & Pink',
    shortName: 'White / Purple-Pink',
    category: 'first-love',
    bodyColor: '#F8FAFC',
    hex: '#F8FAFC',
    accentHex: '#7C3AED',
    textColor: '#1E1B4B',
    printColors: 'Purple & Magenta Pink',
    imageFile: '/images/white-purple.png',
    frontText: 'THE LORD IS THERE',
    backText: 'FIRST LOVE CHURCH',
    tagline: 'Vibrant Duo Tone',
    description: 'Pure white streetwear silhouette with royal purple FIRST and vibrant magenta LOVE typography.'
  },
  {
    id: 'purple-yellow',
    name: 'Royal Purple with Yellow & Gold',
    shortName: 'Purple / Yellow',
    category: 'first-love',
    bodyColor: '#581C87',
    hex: '#581C87',
    accentHex: '#FACC15',
    textColor: '#FFFFFF',
    printColors: 'Yellow & Gold',
    imageFile: '/images/purple-yellow.png',
    frontText: 'THE LORD IS THERE',
    backText: 'FIRST LOVE CHURCH',
    tagline: 'Regal Streetwear',
    description: 'Deep royal purple with iconic bold yellow block lettering spanning the full back length.'
  },
  {
    id: 'white-teal',
    name: 'Crisp White with Deep Teal & Black',
    shortName: 'White / Deep Teal',
    category: 'first-love',
    bodyColor: '#FFFFFF',
    hex: '#FFFFFF',
    accentHex: '#0F766E',
    textColor: '#042F2E',
    printColors: 'Deep Teal & Black',
    imageFile: '/images/white-teal.png',
    frontText: 'THE LORD IS THERE',
    backText: 'FIRST LOVE CHURCH',
    tagline: 'Minimalist Clean',
    description: 'Architectural white fabric with bold dark teal block graphics and black typography.'
  },
  {
    id: 'sand-green',
    name: 'Desert Sand with Forest Green & Orange',
    shortName: 'Sand / Forest Green',
    category: 'first-love',
    bodyColor: '#EAD7BA',
    hex: '#EAD7BA',
    accentHex: '#14532D',
    textColor: '#14532D',
    printColors: 'Forest Green & Orange',
    imageFile: '/images/sand-green.png',
    frontText: 'THE LORD IS THERE',
    backText: 'FIRST LOVE CHURCH',
    tagline: 'Earth Tone Streetwear',
    description: 'Warm desert sand heavy cotton with deep forest green graphics and warm orange highlights.'
  }
];

// Alias for backwards-compatibility
export const FIRST_LOVE_MATCH_SHIRTS = FIRST_LOVE_MERCH_SHIRTS;

/** Known First Love merch colorway ids (edition pricing 60 / 100 applies only to these). */
export const FIRST_LOVE_MERCH_IDS = new Set(FIRST_LOVE_MERCH_SHIRTS.map((m) => m.id));

/** Known basonta catalog ids (custom uploaded wings are treated as basonta too). */
export const BASONTA_CATALOG_IDS = new Set(BASONTA_SHIRTS.map((b) => b.id));

/** True when this colorway is a basonta / ministry shirt (flat GHC 35 — never edition tiers). */
export function isBasontaColor(
  colorOrId: ColorOption | string | undefined,
  colorId?: string
): boolean {
  const color = typeof colorOrId === 'object' ? colorOrId : undefined;
  const id = (color?.id || (typeof colorOrId === 'string' ? colorOrId : '') || colorId || '').trim();
  if (!id || id === 'banner') return false;
  if (color?.category === 'basonta') return true;
  if (BASONTA_CATALOG_IDS.has(id)) return true;
  if (FIRST_LOVE_MERCH_IDS.has(id)) return false;
  // Custom non-merch ids (admin-added wings) are basonta workforce shirts
  return true;
}

/** Unit price: basonta → GHC 35; First Love merch → edition price (60 / 100). */
export function unitPriceForShirt(
  color: ColorOption | undefined,
  edition: ShirtEdition,
  colorId?: string
): number {
  if (isBasontaColor(color, colorId)) return BASONTA_PRICE_GHC;
  return SHIRT_EDITIONS[edition]?.priceGhc ?? MERCH_STANDARD_PRICE_GHC;
}

/** Line-item title for cart / receipt / admin — never shows Standard/Premium for basontas. */
export function cartItemTitle(
  item: { color: string; edition: ShirtEdition },
  colors: ColorOption[] = COLOR_OPTIONS
): string {
  const color = colors.find((c) => c.id === item.color);
  if (isBasontaColor(color, item.color)) {
    return color?.name || color?.shortName || item.color;
  }
  return SHIRT_EDITIONS[item.edition]?.name || item.edition;
}

/** Edition / product-type label for CSV & admin — "Basonta (GHC 35)" vs Standard/Premium. */
export function cartItemProductLabel(
  item: { color: string; edition: ShirtEdition },
  colors: ColorOption[] = COLOR_OPTIONS
): string {
  const color = colors.find((c) => c.id === item.color);
  if (isBasontaColor(color, item.color)) {
    return `Basonta (GHC ${BASONTA_PRICE_GHC})`;
  }
  return SHIRT_EDITIONS[item.edition]?.name || item.edition;
}

/**
 * Merge code-default basontas with a stored/server list.
 * - Stored entries win for staff edits (name, uploaded imageFile, etc.)
 * - Default basontas missing from stored are added
 * - Default imageFile is used when stored imageFile is missing/empty
 * - deletedIds keeps explicitly DELETE'd default wings hidden
 * - Staff-added (non-default) wings are always preserved
 */
export function mergeBasontasWithDefaults(
  stored: ColorOption[] | null | undefined,
  deletedIds: string[] | null | undefined = [],
  defaults: ColorOption[] = BASONTA_SHIRTS
): ColorOption[] {
  const deleted = new Set((deletedIds || []).filter(Boolean));
  const storedList = Array.isArray(stored) ? stored : [];
  const byId = new Map<string, ColorOption>();

  for (const d of defaults) {
    if (!d?.id || deleted.has(d.id)) continue;
    byId.set(d.id, { ...d, category: 'basonta' });
  }

  for (const s of storedList) {
    if (!s?.id) continue;
    const isDefault = defaults.some((d) => d.id === s.id);
    if (isDefault && deleted.has(s.id)) continue;

    const base = byId.get(s.id);
    if (base) {
      byId.set(s.id, {
        ...base,
        ...s,
        id: s.id,
        category: 'basonta',
        imageFile: (s.imageFile && String(s.imageFile).trim()) || base.imageFile,
        name: s.name || base.name,
        shortName: s.shortName || base.shortName,
      });
    } else {
      byId.set(s.id, {
        ...s,
        category: s.category || 'basonta',
      });
    }
  }

  const result: ColorOption[] = [];
  const seen = new Set<string>();
  for (const d of defaults) {
    if (deleted.has(d.id)) continue;
    const item = byId.get(d.id);
    if (item) {
      result.push(item);
      seen.add(d.id);
    }
  }
  for (const [id, item] of byId) {
    if (!seen.has(id)) {
      result.push(item);
      seen.add(id);
    }
  }
  return sanitizeBasontas(result);
}

// Deduplication helper to prevent duplicate key errors across components
export function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

// Sanitization & deduplication specifically for Basontas
// Ensures only ONE Fragrance Ministry is present, normalizes names, and removes duplicates
export function sanitizeBasontas(items: ColorOption[]): ColorOption[] {
  const seenIds = new Set<string>();
  let fragranceSeen = false;
  const result: ColorOption[] = [];

  for (const item of items) {
    if (!item || !item.id) continue;

    // Normalization
    const normalized = { ...item };
    if (normalized.id === 'choreography-and-dance' || normalized.id === 'dancing-stars') {
      normalized.id = 'dancing-stars';
      normalized.name = 'Dancing Stars';
      normalized.shortName = 'Dancing Stars';
      normalized.imageFile = normalized.imageFile || '/images/dancing-stars.jpg';
    }

    // Filter duplicate fragrance items (only 1 Fragrance Ministry allowed)
    const isFragrance =
      normalized.id === 'fragrance-ministry' ||
      normalized.id === 'fragrance-stars' ||
      normalized.id === 'fragrance' ||
      normalized.name.toLowerCase().includes('fragrance');

    if (isFragrance) {
      if (fragranceSeen) {
        // Drop duplicate Fragrance!
        continue;
      }
      fragranceSeen = true;
      // Standardize to official Fragrance Ministry (Pink shirt with cyan back)
      normalized.id = 'fragrance-ministry';
      normalized.name = 'Fragrance Ministry';
      normalized.shortName = 'Fragrance Ministry';
      normalized.bodyColor = '#F472B6';
      normalized.hex = '#F472B6';
      normalized.accentHex = '#06B6D4';
      normalized.imageFile = normalized.imageFile || '/images/fragrance-ministry.png';
      normalized.frontText = 'JOIN THE FRAGRANCE MINISTRY';
      normalized.backText = 'FIRST LOVE THE LORD IS THERE';
    }

    if (normalized.id === 'hearing-and-seeing') {
      normalized.name = 'Projection';
      normalized.shortName = 'Projection';
      normalized.bodyColor = '#111215';
      normalized.hex = '#111215';
      normalized.accentHex = normalized.accentHex || '#EA580C';
      normalized.imageFile = normalized.imageFile || '/images/hearing-and-seeing.jpg';
      normalized.frontText = 'PROJECTION';
      normalized.backText = normalized.backText || 'HEARING SEEING · ROMANS 10:17';
    }

    if (!seenIds.has(normalized.id)) {
      seenIds.add(normalized.id);
      result.push(normalized);
    }
  }

  return result;
}

// All shirts combined - Basonta shirts at the top as requested
export const COLOR_OPTIONS: ColorOption[] = deduplicateById([
  ...BASONTA_SHIRTS,
  ...FIRST_LOVE_MERCH_SHIRTS
]);

export const AVAILABLE_SIZES: { size: ShirtSize; chestInches: string; lengthInches: string; recommendation: string }[] = [
  { size: 'S', chestInches: '36-38"', lengthInches: '27"', recommendation: 'Fitted (50-60kg)' },
  { size: 'M', chestInches: '39-41"', lengthInches: '28"', recommendation: 'Standard (60-72kg)' },
  { size: 'L', chestInches: '42-44"', lengthInches: '29"', recommendation: 'Popular (72-84kg)' },
  { size: 'XL', chestInches: '45-47"', lengthInches: '30"', recommendation: 'Relaxed (84-95kg)' },
  { size: '2XL', chestInches: '48-50"', lengthInches: '31"', recommendation: 'Oversized (95-108kg)' },
  { size: '3XL', chestInches: '51-53"', lengthInches: '32"', recommendation: 'Roomy (108kg+)' }
];

export const INITIAL_ORDERS: CustomerOrder[] = [
  {
    id: 'FLC-8020',
    churchBranch: 'First Love Cape Coast',
    customerName: 'Ama Boateng',
    customerPhone: '0244001122',
    customerEmail: 'ama.boateng@gmail.com',
    pickupNotes: 'Basonta desk',
    items: [
      {
        id: 'item-0',
        edition: 'standard',
        color: 'culinary-stars',
        size: 'M',
        quantity: 1,
        unitPrice: BASONTA_PRICE_GHC,
        subtotal: BASONTA_PRICE_GHC
      }
    ],
    subtotalGhc: BASONTA_PRICE_GHC,
    processingFeeGhc: 1,
    feePerShirtGhc: 1,
    totalAmountGhc: BASONTA_PRICE_GHC + 1,
    currency: 'GHS',
    momoNumber: '0536193423',
    momoAccountName: 'Emmanuel Nerkwei Nettey',
    momoReference: 'FLC-8020',
    momoSenderPhone: '0244001122',
    paymentStatus: 'paid',
    collectionStatus: 'pending',
    channel: 'mobile_money',
    paidAt: '2026-10-15T13:00:00Z',
    createdAt: '2026-10-15T12:58:00Z'
  },
  {
    id: 'FLC-8021',
    churchBranch: 'First Love Cape Coast',
    customerName: 'Kofi Mensah',
    customerPhone: '0244123456',
    customerEmail: 'kofi.mensah@gmail.com',
    pickupNotes: 'Valco Hall / North Zone',
    items: [
      {
        id: 'item-1',
        edition: 'premium',
        color: 'black-cyan',
        size: 'L',
        quantity: 1,
        unitPrice: 100,
        subtotal: 100
      }
    ],
    subtotalGhc: 100,
    processingFeeGhc: 1,
    feePerShirtGhc: 1,
    totalAmountGhc: 101,
    currency: 'GHS',
    momoNumber: '0536193423',
    momoAccountName: 'Emmanuel Nerkwei Nettey',
    momoReference: 'FLC-8021',
    momoSenderPhone: '0244123456',
    paymentStatus: 'paid',
    collectionStatus: 'ready_for_pickup',
    channel: 'mobile_money',
    paidAt: '2026-10-15T14:30:00Z',
    createdAt: '2026-10-15T14:28:10Z'
  },
  {
    id: 'FLC-8022',
    churchBranch: 'First Love Cape Coast',
    customerName: 'Abena Osei',
    customerPhone: '0559876543',
    customerEmail: 'abena.osei@yahoo.com',
    pickupNotes: 'Adehye Hall',
    items: [
      {
        id: 'item-2',
        edition: 'standard',
        color: 'white-purple',
        size: 'M',
        quantity: 2,
        unitPrice: 60,
        subtotal: 120
      },
      {
        id: 'item-3',
        edition: 'premium',
        color: 'sand-green',
        size: 'XL',
        quantity: 1,
        unitPrice: 100,
        subtotal: 100
      }
    ],
    subtotalGhc: 220,
    processingFeeGhc: 3,
    feePerShirtGhc: 1,
    totalAmountGhc: 223,
    currency: 'GHS',
    momoNumber: '0536193423',
    momoAccountName: 'Emmanuel Nerkwei Nettey',
    momoReference: 'FLC-8022',
    momoSenderPhone: '0559876543',
    paymentStatus: 'paid',
    collectionStatus: 'collected',
    channel: 'mobile_money',
    paidAt: '2026-10-15T15:10:00Z',
    createdAt: '2026-10-15T15:08:45Z'
  },
  {
    id: 'FLC-8023',
    churchBranch: 'First Love Cape Coast',
    customerName: 'Emmanuel Ansah',
    customerPhone: '0207654321',
    customerEmail: 'eansah@gmail.com',
    pickupNotes: 'UCC Casford Hostel',
    items: [
      {
        id: 'item-4',
        edition: 'premium',
        color: 'white-teal',
        size: 'XL',
        quantity: 1,
        unitPrice: 100,
        subtotal: 100
      },
      {
        id: 'item-5',
        edition: 'standard',
        color: 'purple-yellow',
        size: 'M',
        quantity: 1,
        unitPrice: 60,
        subtotal: 60
      }
    ],
    subtotalGhc: 160,
    processingFeeGhc: 2,
    feePerShirtGhc: 1,
    totalAmountGhc: 162,
    currency: 'GHS',
    momoNumber: '0536193423',
    momoAccountName: 'Emmanuel Nerkwei Nettey',
    momoReference: 'FLC-8023',
    momoSenderPhone: '0207654321',
    paymentStatus: 'pending',
    collectionStatus: 'pending',
    channel: 'mobile_money',
    createdAt: '2026-10-15T15:59:12Z'
  }
];
