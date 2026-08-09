
// Shared mock data for NVS Jewellery admin

export type MetalType = "Gold" | "Silver";
export type GoldPurity = "9K" | "14K" | "18K" | "22K";
export type SilverPurity = "75" | "80" | "83.5" | "92.5";

export const GOLD_CATEGORIES = [
  "Rings",
  "Chains",
  "Necklaces",
  "Earrings",
  "Bangles",
  "Bracelets",
  "Pendants",
  "Mangalsutra",
  "Anklets",
  "Nose Pins",
  "Others",
] as const;

export const SILVER_CATEGORIES = [
  "Rings",
  "Chains",
  "Anklets",
  "Bracelets",
  "Earrings",
  "Pendants",
  "Nose Pins",
  "Others",
] as const;

export type Rates = {
  gold: Record<GoldPurity, number>;
  silver: Record<SilverPurity, number>;
};

export const INITIAL_RATES: Rates = {
  gold: {
    "9K": 4180,
    "14K": 6490,
    "18K": 8340,
    "22K": 10190,
  },
  silver: {
    "75": 78,
    "80": 82,
    "83.5": 86,
    "92.5": 96,
  },
};

export type RateHistoryEntry = {
  id: string;
  when: string;
  metal: MetalType;
  purity: string;
  oldRate: number;
  newRate: number;
  changedBy: string;
};

export const INITIAL_RATE_HISTORY: RateHistoryEntry[] = [
  {
    id: "rh1",
    when: "2026-07-13 09:12",
    metal: "Gold",
    purity: "22K",
    oldRate: 10120,
    newRate: 10190,
    changedBy: "Anil Verma",
  },
  {
    id: "rh2",
    when: "2026-07-13 09:12",
    metal: "Gold",
    purity: "18K",
    oldRate: 8280,
    newRate: 8340,
    changedBy: "Anil Verma",
  },
  {
    id: "rh3",
    when: "2026-07-12 10:30",
    metal: "Silver",
    purity: "92.5",
    oldRate: 94,
    newRate: 96,
    changedBy: "Priya Nair",
  },
  {
    id: "rh4",
    when: "2026-07-11 11:05",
    metal: "Gold",
    purity: "14K",
    oldRate: 6430,
    newRate: 6490,
    changedBy: "Anil Verma",
  },
  {
    id: "rh5",
    when: "2026-07-10 08:45",
    metal: "Silver",
    purity: "83.5",
    oldRate: 84,
    newRate: 86,
    changedBy: "Priya Nair",
  },
];

/* =========================================================
   PRODUCT
========================================================= */

export type Product = {
  id: string;

  name: string;
  description?: string;

  metal: "Gold" | "Silver";
  category: string;
  purity: string;

  grossWeight?: number | null;
  stoneWeight?: number | null;
  stoneCost?: number | null;

  hallmarkId?: string | null;

  sku: string;

  va?: number | null;
  gstRate?: number | null;

  isDirectSterling?: boolean;
  pieceCost?: number | null;

  /*
   * Primary product image.
   *
   * Kept for backward compatibility with
   * existing admin/customer code.
   *
   * This will always point to the first
   * image in the images[] gallery.
   */
  image: string;

  /*
   * Product image gallery.
   *
   * Maximum 4 images.
   *
   * images[0] is always the primary image.
   */
  images: string[];

  status:
    | "Draft"
    | "Active"
    | "Inactive";

  stock: number;

  sold?: number;

  createdAt?: string;
  updatedAt?: string;

  // Real-time computed price from backend
  livePrice?: number;
};

/* =========================================================
   IMAGE HELPER
========================================================= */

const img = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=200&q=60`;

/* =========================================================
   INITIAL PRODUCTS
========================================================= */

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Radiance 22K Gold Ring",
    description:
      "Classic bridal ring with fine engraving.",
    metal: "Gold",
    category: "Rings",
    purity: "22K",
    grossWeight: 6.2,
    stoneWeight: 0.3,
    stoneCost: 4500,
    hallmarkId: "HM-22K-A419",
    sku: "NVS-GR-0421",
    va: 12,
    image: img("1611591437281-460bfbe1220a"),
    images: [
      img("1611591437281-460bfbe1220a"),
    ],
    status: "Active",
    stock: 8,
    sold: 34,
  },

  {
    id: "p2",
    name: "Aashvi Temple Necklace",
    description:
      "Handcrafted temple design with pearl drops.",
    metal: "Gold",
    category: "Necklaces",
    purity: "22K",
    grossWeight: 28.6,
    stoneWeight: 1.2,
    stoneCost: 12000,
    hallmarkId: "HM-22K-B221",
    sku: "NVS-GN-0189",
    va: 15,
    image: img("1602751584552-8ba73aad10e1"),
    images: [
      img("1602751584552-8ba73aad10e1"),
    ],
    status: "Active",
    stock: 3,
    sold: 12,
  },

  {
    id: "p3",
    name: "Meera Diamond Pendant",
    description:
      "18K white gold pendant with solitaire.",
    metal: "Gold",
    category: "Pendants",
    purity: "18K",
    grossWeight: 3.4,
    stoneWeight: 0.5,
    stoneCost: 35000,
    hallmarkId: "HM-18K-C002",
    sku: "NVS-GP-0331",
    va: 18,
    image: img("1599643477877-530eb83abc8e"),
    images: [
      img("1599643477877-530eb83abc8e"),
    ],
    status: "Active",
    stock: 5,
    sold: 21,
  },

  {
    id: "p4",
    name: "Kiaan Kada Bangle",
    description:
      "Men's bold 22K gold kada.",
    metal: "Gold",
    category: "Bangles",
    purity: "22K",
    grossWeight: 42.1,
    stoneWeight: 0,
    stoneCost: 0,
    hallmarkId: "HM-22K-D881",
    sku: "NVS-GB-0552",
    va: 10,
    image: img("1515562141207-7a88fb7ce338"),
    images: [
      img("1515562141207-7a88fb7ce338"),
    ],
    status: "Active",
    stock: 2,
    sold: 6,
  },

  {
    id: "p5",
    name: "Ishani 14K Chain",
    description:
      "Everyday 14K rope chain, 20 inch.",
    metal: "Gold",
    category: "Chains",
    purity: "14K",
    grossWeight: 8.9,
    stoneWeight: 0,
    stoneCost: 0,
    hallmarkId: "HM-14K-E110",
    sku: "NVS-GC-0088",
    va: 8,
    image: img("1573408301185-9146fe634ad0"),
    images: [
      img("1573408301185-9146fe634ad0"),
    ],
    status: "Active",
    stock: 14,
    sold: 47,
  },

  {
    id: "p6",
    name: "Anika Jhumka Earrings",
    description:
      "Traditional jhumkas with kundan work.",
    metal: "Gold",
    category: "Earrings",
    purity: "22K",
    grossWeight: 10.4,
    stoneWeight: 0.8,
    stoneCost: 6500,
    hallmarkId: "HM-22K-F721",
    sku: "NVS-GE-0244",
    va: 14,
    image: img("1535632066927-ab7c9ab60908"),
    images: [
      img("1535632066927-ab7c9ab60908"),
    ],
    status: "Active",
    stock: 6,
    sold: 29,
  },

  {
    id: "p7",
    name: "Riya Mangalsutra",
    description:
      "22K black bead mangalsutra with pendant.",
    metal: "Gold",
    category: "Mangalsutra",
    purity: "22K",
    grossWeight: 18.2,
    stoneWeight: 0.4,
    stoneCost: 3200,
    hallmarkId: "HM-22K-G991",
    sku: "NVS-GM-0107",
    va: 13,
    image: img("1611652022419-a9419f74343d"),
    images: [
      img("1611652022419-a9419f74343d"),
    ],
    status: "Draft",
    stock: 4,
    sold: 8,
  },

  {
    id: "p8",
    name: "Sterling Om Pendant",
    description:
      "Direct sterling silver Om pendant.",
    metal: "Silver",
    category: "Pendants",
    purity: "92.5",
    isDirectSterling: true,
    pieceCost: 1499,
    sku: "NVS-SP-1201",
    image: img("1617038220319-276d3cfab638"),
    images: [
      img("1617038220319-276d3cfab638"),
    ],
    status: "Active",
    stock: 45,
    sold: 132,
  },

  {
    id: "p9",
    name: "Silver Anklet Pair",
    description:
      "92.5 pure silver payal with ghungroo.",
    metal: "Silver",
    category: "Anklets",
    purity: "92.5",
    grossWeight: 22.4,
    stoneWeight: 0,
    stoneCost: 0,
    va: 20,
    sku: "NVS-SA-0331",
    image: img("1583937443351-c1f8afe74f66"),
    images: [
      img("1583937443351-c1f8afe74f66"),
    ],
    status: "Active",
    stock: 22,
    sold: 68,
  },

  {
    id: "p10",
    name: "Silver Chain 80",
    description:
      "80 purity daily wear chain.",
    metal: "Silver",
    category: "Chains",
    purity: "80",
    grossWeight: 14.1,
    stoneWeight: 0,
    stoneCost: 0,
    va: 15,
    sku: "NVS-SC-0554",
    image: img("1617038260897-41a1f14a8ca0"),
    images: [
      img("1617038260897-41a1f14a8ca0"),
    ],
    status: "Active",
    stock: 30,
    sold: 91,
  },

  {
    id: "p11",
    name: "Sterling Toe Ring Set",
    description:
      "Direct sterling silver toe ring pair.",
    metal: "Silver",
    category: "Rings",
    purity: "92.5",
    isDirectSterling: true,
    pieceCost: 799,
    sku: "NVS-SR-0221",
    image: img("1602173574767-37ac01994b2a"),
    images: [
      img("1602173574767-37ac01994b2a"),
    ],
    status: "Active",
    stock: 60,
    sold: 210,
  },

  {
    id: "p12",
    name: "Silver Nose Pin",
    description:
      "92.5 silver studded nose pin.",
    metal: "Silver",
    category: "Nose Pins",
    purity: "92.5",
    grossWeight: 1.2,
    stoneWeight: 0.1,
    stoneCost: 200,
    va: 25,
    sku: "NVS-SN-0091",
    image: img("1602752275197-9d21bd3a4d1c"),
    images: [
      img("1602752275197-9d21bd3a4d1c"),
    ],
    status: "Inactive",
    stock: 0,
    sold: 14,
  },
];

export const GST_RATE = 0.03;

/* =========================================================
   GOLD PRICE
========================================================= */

export function calcGoldPrice(
  p: Pick<
    Product,
    | "grossWeight"
    | "stoneWeight"
    | "stoneCost"
    | "purity"
    | "va"
  >,
  rates: Rates,
) {
  const rate =
    rates.gold[
      p.purity as GoldPurity
    ] ?? 0;

  const net = Math.max(
    0,
    (p.grossWeight ?? 0) -
      (p.stoneWeight ?? 0)
  );

  const metalVal =
    net * rate;

  const making =
    metalVal *
    ((p.va ?? 0) / 100);

  const subtotal =
    metalVal +
    making +
    (p.stoneCost ?? 0);

  const gst =
    subtotal * GST_RATE;

  return {
    net,
    rate,
    metalVal,
    making,
    subtotal,
    gst,
    total: subtotal + gst,
  };
}

/* =========================================================
   SILVER PRICE
========================================================= */

export function calcSilverPrice(
  p: Product,
  rates: Rates
) {
  if (p.isDirectSterling) {
    const sub =
      p.pieceCost ?? 0;

    const gst =
      sub * GST_RATE;

    return {
      net: 0,
      rate: 0,
      metalVal: sub,
      making: 0,
      subtotal: sub,
      gst,
      total: sub + gst,
    };
  }

  const rate =
    rates.silver[
      p.purity as SilverPurity
    ] ?? 0;

  const net = Math.max(
    0,
    (p.grossWeight ?? 0) -
      (p.stoneWeight ?? 0)
  );

  const metalVal =
    net * rate;

  const making =
    metalVal *
    ((p.va ?? 0) / 100);

  const subtotal =
    metalVal +
    making +
    (p.stoneCost ?? 0);

  const gst =
    subtotal * GST_RATE;

  return {
    net,
    rate,
    metalVal,
    making,
    subtotal,
    gst,
    total: subtotal + gst,
  };
}

/* =========================================================
   PRODUCT TOTAL
========================================================= */

export function productTotal(
  p: Product,
  rates: Rates
) {
  return p.metal === "Gold"
    ? calcGoldPrice(
        p,
        rates
      ).total
    : calcSilverPrice(
        p,
        rates
      ).total;
}

/* =========================================================
   INR FORMATTER
========================================================= */

export const inr = (
  n: number
) =>
  "₹" +
  Math.round(n).toLocaleString(
    "en-IN"
  );

/* =========================================================
   CUSTOMERS
========================================================= */

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  spend: number;
  status: "Active" | "Blocked";
  joined: string;
  tags: string[];
};

export const CUSTOMERS: Customer[] = [
  {
    id: "c1",
    name: "Aditi Sharma",
    email: "aditi.sharma@gmail.com",
    phone: "+91 98210 44112",
    orders: 8,
    spend: 342000,
    status: "Active",
    joined: "2024-11-04",
    tags: ["VIP"],
  },
  {
    id: "c2",
    name: "Rohan Mehta",
    email: "rohan.mehta@outlook.com",
    phone: "+91 99872 00981",
    orders: 3,
    spend: 78900,
    status: "Active",
    joined: "2025-02-18",
    tags: [],
  },
  {
    id: "c3",
    name: "Priya Iyer",
    email: "priya.iyer@yahoo.in",
    phone: "+91 98450 33122",
    orders: 12,
    spend: 512400,
    status: "Active",
    joined: "2024-06-30",
    tags: ["VIP", "Wholesale"],
  },
  {
    id: "c4",
    name: "Vikram Rao",
    email: "vikram.r@gmail.com",
    phone: "+91 90123 88445",
    orders: 1,
    spend: 12400,
    status: "Active",
    joined: "2026-05-12",
    tags: [],
  },
  {
    id: "c5",
    name: "Neha Kapoor",
    email: "neha.kapoor@gmail.com",
    phone: "+91 98987 22133",
    orders: 6,
    spend: 189600,
    status: "Active",
    joined: "2025-08-01",
    tags: ["VIP"],
  },
  {
    id: "c6",
    name: "Suresh Patel",
    email: "suresh.p@rediff.com",
    phone: "+91 98212 66554",
    orders: 0,
    spend: 0,
    status: "Blocked",
    joined: "2026-01-22",
    tags: ["Flagged"],
  },
  {
    id: "c7",
    name: "Kavya Nambiar",
    email: "kavya.n@gmail.com",
    phone: "+91 91234 22001",
    orders: 4,
    spend: 96700,
    status: "Active",
    joined: "2025-12-09",
    tags: [],
  },
  {
    id: "c8",
    name: "Arjun Desai",
    email: "arjun.desai@gmail.com",
    phone: "+91 90876 55321",
    orders: 2,
    spend: 44500,
    status: "Active",
    joined: "2026-03-14",
    tags: [],
  },
];

/* =========================================================
   ORDERS
========================================================= */

export type Order = {
  id: string;
  customer: string;
  amount: number;
  payment:
    | "Paid"
    | "Pending"
    | "Refunded"
    | "COD";
  status:
    | "Pending"
    | "Processing"
    | "Shipped"
    | "Delivered"
    | "Cancelled"
    | "Returned";
  date: string;
  items: number;
};

export const ORDERS: Order[] = [
  {
    id: "NVS-10241",
    customer: "Aditi Sharma",
    amount: 84500,
    payment: "Paid",
    status: "Delivered",
    date: "2026-07-11",
    items: 2,
  },
  {
    id: "NVS-10240",
    customer: "Rohan Mehta",
    amount: 26400,
    payment: "Paid",
    status: "Shipped",
    date: "2026-07-12",
    items: 1,
  },
  {
    id: "NVS-10239",
    customer: "Priya Iyer",
    amount: 152300,
    payment: "Paid",
    status: "Processing",
    date: "2026-07-13",
    items: 3,
  },
  {
    id: "NVS-10238",
    customer: "Neha Kapoor",
    amount: 34400,
    payment: "COD",
    status: "Pending",
    date: "2026-07-13",
    items: 1,
  },
  {
    id: "NVS-10237",
    customer: "Vikram Rao",
    amount: 12400,
    payment: "Paid",
    status: "Delivered",
    date: "2026-07-09",
    items: 1,
  },
  {
    id: "NVS-10236",
    customer: "Kavya Nambiar",
    amount: 47200,
    payment: "Refunded",
    status: "Cancelled",
    date: "2026-07-08",
    items: 2,
  },
  {
    id: "NVS-10235",
    customer: "Arjun Desai",
    amount: 22100,
    payment: "Paid",
    status: "Shipped",
    date: "2026-07-10",
    items: 1,
  },
  {
    id: "NVS-10234",
    customer: "Aditi Sharma",
    amount: 68900,
    payment: "Paid",
    status: "Delivered",
    date: "2026-07-06",
    items: 2,
  },
  {
    id: "NVS-10233",
    customer: "Priya Iyer",
    amount: 210500,
    payment: "Paid",
    status: "Processing",
    date: "2026-07-13",
    items: 4,
  },
  {
    id: "NVS-10232",
    customer: "Rohan Mehta",
    amount: 15600,
    payment: "Pending",
    status: "Pending",
    date: "2026-07-13",
    items: 1,
  },
];

/* =========================================================
   COUPONS
========================================================= */

export type Coupon = {
  id: string;
  code: string;
  type: "flat" | "percent";
  value: number;
  categories: string[];
  minOrder: number;
  usageLimit: number;
  used: number;
  from: string;
  to: string;
  status:
    | "Active"
    | "Expired"
    | "Scheduled";
  autoApply: boolean;
  stackable: boolean;
  revenue: number;
};

export const COUPONS: Coupon[] = [
  {
    id: "cp1",
    code: "DIWALI25",
    type: "percent",
    value: 25,
    categories: ["All"],
    minOrder: 25000,
    usageLimit: 500,
    used: 218,
    from: "2026-10-15",
    to: "2026-11-15",
    status: "Scheduled",
    autoApply: false,
    stackable: false,
    revenue: 0,
  },
  {
    id: "cp2",
    code: "SILVER10",
    type: "percent",
    value: 10,
    categories: ["Silver"],
    minOrder: 2000,
    usageLimit: 1000,
    used: 412,
    from: "2026-06-01",
    to: "2026-08-31",
    status: "Active",
    autoApply: true,
    stackable: false,
    revenue: 384000,
  },
  {
    id: "cp3",
    code: "FLAT500",
    type: "flat",
    value: 500,
    categories: ["All"],
    minOrder: 5000,
    usageLimit: 200,
    used: 200,
    from: "2026-04-01",
    to: "2026-05-31",
    status: "Expired",
    autoApply: false,
    stackable: true,
    revenue: 224000,
  },
  {
    id: "cp4",
    code: "BRIDAL15",
    type: "percent",
    value: 15,
    categories: [
      "Gold-Necklaces",
      "Gold-Mangalsutra",
    ],
    minOrder: 100000,
    usageLimit: 100,
    used: 47,
    from: "2026-07-01",
    to: "2026-12-31",
    status: "Active",
    autoApply: false,
    stackable: false,
    revenue: 1780000,
  },
];

/* =========================================================
   SHIPMENTS
========================================================= */

export type Shipment = {
  id: string;
  orderId: string;
  awb: string;
  courier: string;
  status:
    | "Booked"
    | "In Transit"
    | "Out for Delivery"
    | "Delivered"
    | "RTO";
  updated: string;
  eta: string;
};

export const SHIPMENTS: Shipment[] = [
  {
    id: "s1",
    orderId: "NVS-10241",
    awb: "BDPL0092841",
    courier: "Bluedart",
    status: "Delivered",
    updated: "2026-07-13 14:22",
    eta: "2026-07-13",
  },
  {
    id: "s2",
    orderId: "NVS-10240",
    awb: "DTDC221947",
    courier: "DTDC",
    status: "In Transit",
    updated: "2026-07-13 09:11",
    eta: "2026-07-15",
  },
  {
    id: "s3",
    orderId: "NVS-10237",
    awb: "BDPL0092811",
    courier: "Bluedart",
    status: "Delivered",
    updated: "2026-07-10 17:44",
    eta: "2026-07-10",
  },
  {
    id: "s4",
    orderId: "NVS-10235",
    awb: "SFPL00042",
    courier: "Sequel",
    status: "Out for Delivery",
    updated: "2026-07-14 08:02",
    eta: "2026-07-14",
  },
  {
    id: "s5",
    orderId: "NVS-10234",
    awb: "BDPL0091722",
    courier: "Bluedart",
    status: "Delivered",
    updated: "2026-07-07 12:30",
    eta: "2026-07-07",
  },
];

/* =========================================================
   REVIEWS
========================================================= */

export type Review = {
  id: string;
  product: string;
  customer: string;
  rating: number;
  text: string;
  date: string;
  status:
    | "Published"
    | "Pending"
    | "Flagged";
};

export const REVIEWS: Review[] = [
  {
    id: "r1",
    product: "Radiance 22K Gold Ring",
    customer: "Aditi Sharma",
    rating: 5,
    text: "Absolutely stunning craftsmanship, worth every rupee.",
    date: "2026-07-08",
    status: "Published",
  },
  {
    id: "r2",
    product: "Sterling Om Pendant",
    customer: "Rohan Mehta",
    rating: 4,
    text: "Nice finish, delivery was quick.",
    date: "2026-07-11",
    status: "Published",
  },
  {
    id: "r3",
    product: "Silver Anklet Pair",
    customer: "Kavya Nambiar",
    rating: 3,
    text: "Good but slightly heavier than expected.",
    date: "2026-07-10",
    status: "Pending",
  },
  {
    id: "r4",
    product: "Aashvi Temple Necklace",
    customer: "Priya Iyer",
    rating: 5,
    text: "The design is even better in person.",
    date: "2026-07-09",
    status: "Published",
  },
  {
    id: "r5",
    product: "Ishani 14K Chain",
    customer: "Vikram Rao",
    rating: 2,
    text: "Chain looks thinner than shown.",
    date: "2026-07-12",
    status: "Flagged",
  },
];

/* =========================================================
   STAFF
========================================================= */

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  role:
    | "Super Admin"
    | "Staff"
    | "Support";
  lastLogin: string;
  status: "Active" | "Inactive";
};

export const STAFF: StaffUser[] = [
  {
    id: "u1",
    name: "Anil Verma",
    email: "anil@nvsjewellery.in",
    role: "Super Admin",
    lastLogin: "2026-07-14 09:02",
    status: "Active",
  },
  {
    id: "u2",
    name: "Priya Nair",
    email: "priya@nvsjewellery.in",
    role: "Staff",
    lastLogin: "2026-07-13 18:44",
    status: "Active",
  },
  {
    id: "u3",
    name: "Ramesh Iyer",
    email: "ramesh@nvsjewellery.in",
    role: "Support",
    lastLogin: "2026-07-14 08:12",
    status: "Active",
  },
  {
    id: "u4",
    name: "Sneha Bhat",
    email: "sneha@nvsjewellery.in",
    role: "Staff",
    lastLogin: "2026-06-30 11:20",
    status: "Inactive",
  },
];

/* =========================================================
   PERMISSION MODULES
========================================================= */

export const PERMISSION_MODULES = [
  "Dashboard",
  "Live Metal Rates",
  "Products",
  "Categories",
  "Discounts",
  "Homepage Builder",
  "Customers",
  "Orders",
  "Coupons",
  "Shipping",
  "Reviews",
  "Reports",
  "Users & Roles",
  "Settings",
];
