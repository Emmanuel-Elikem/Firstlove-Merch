export type ShirtEdition = 'standard' | 'premium';

export type ShirtCategory = 'basonta' | 'first-love';

export type ShirtColor = 
  // Basonta / Workforce Shirts with uploaded images
  | 'dancing-stars'
  | 'film-stars'
  | 'fragrance-ministry'
  | 'lovelets'
  | 'ushers'
  | 'hearing-and-seeing'
  // First Love Church Merch Shirts
  | 'black-cyan'
  | 'blue-yellow'
  | 'white-purple'
  | 'purple-yellow'
  | 'white-teal'
  | 'sand-green'
  | string;

export type ShirtSize = 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';

export interface ShirtOption {
  edition: ShirtEdition;
  name: string;
  tagline: string;
  priceGhc: number;
  fabric: string;
  fit: string;
  features: string[];
}

export interface ColorOption {
  id: ShirtColor;
  name: string;
  shortName: string;
  category?: ShirtCategory;
  bodyColor: string;
  hex: string;
  printColors: string;
  accentHex: string;
  textColor: string;
  imageFile: string;
  frontText: string;
  backText: string;
  tagline: string;
  description: string;
}

export interface CartItem {
  id: string; // unique item uuid in cart
  edition: ShirtEdition;
  color: ShirtColor;
  size: ShirtSize;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CustomerOrder {
  id: string; // e.g. "FLC-2601"
  churchBranch?: string; // "First Love Cape Coast"
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupNotes?: string;
  items: CartItem[];
  subtotalGhc?: number;
  processingFeeGhc?: number;
  totalAmountGhc: number;
  currency: 'GHS';
  momoNumber?: string;
  momoAccountName?: string;
  momoReference?: string;
  momoSenderPhone?: string;
  momoTransactionId?: string;
  screenshotProofUrl?: string;
  feePerShirtGhc?: number;
  paymentMode?: 'live' | 'test';
  paymentStatus: 'paid' | 'pending' | 'failed';
  collectionStatus: 'pending' | 'ready_for_pickup' | 'collected';
  channel?: string; // 'mobile_money'
  paidAt?: string;
  createdAt: string;
}

export type PhotoMap = Record<string, string>;
