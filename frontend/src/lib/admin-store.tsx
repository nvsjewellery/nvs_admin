import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { adminApi } from "./adminApi";
import {
  INITIAL_RATES, INITIAL_RATE_HISTORY,
  type Product, type Rates, type RateHistoryEntry,
} from "./mock";

type Discount = {
  id: string;
  metal: "Gold" | "Silver";
  category: string;
  productIds: string[];
  scope: "VA" | "Total";
  kind: "percent" | "flat";
  value: number;
  createdAt: string;
};

type AdminUser = { email: string; role: string };

type Category = {
  id: string;
  metal: "Gold" | "Silver";
  name: string;
  slug: string;
  metaTitle: string;
  metaDesc: string;
  image: string;
  sortOrder: number;
};

type Ctx = {
  rates: Rates;
  setRates: (r: Rates) => void;
  rateHistory: RateHistoryEntry[];
  addRateHistory: (entries: RateHistoryEntry[]) => void;
  ratesLastUpdated: string;

  products: Product[];
  productsLoading: boolean;
  loadProducts: () => Promise<void>;
  createProduct: (p: Partial<Product>, imageFile?: File | null) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>, imageFile?: File | null) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  bulkProductAction: (ids: string[], action: "activate" | "deactivate" | "delete") => Promise<void>;

  discounts: Discount[];
discountsLoading: boolean;
loadDiscounts: () => Promise<void>;
addDiscount: (d: Omit<Discount, "id" | "createdAt">) => Promise<void>;
removeDiscount: (id: string) => Promise<void>;

  adminUser: AdminUser | null;
  authChecked: boolean;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
  checkAdminAuth: () => Promise<void>;

  categories: Category[];
  categoriesLoading: boolean;
  loadCategories: () => Promise<void>;
  createCategory: (data: Record<string, any>) => Promise<void>;
  updateCategory: (id: string, data: Record<string, any>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (orderedIds: string[]) => Promise<void>;
};

const AdminCtx = createContext<Ctx | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [rates, setRatesRaw] = useState<Rates>(INITIAL_RATES);
  const [rateHistory, setRateHistory] = useState<RateHistoryEntry[]>(INITIAL_RATE_HISTORY);
  const [ratesLastUpdated, setLastUpdated] = useState<string>("2026-07-13 09:12");

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [discounts, setDiscounts] = useState<Discount[]>([]);
const [discountsLoading, setDiscountsLoading] = useState(false);

const loadDiscounts = async () => {
  setDiscountsLoading(true);
  try {
    const res = await adminApi.getDiscounts();
    setDiscounts(res.discounts ?? []);
  } finally {
    setDiscountsLoading(false);
  }
};

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const setRates = (r: Rates) => {
    setRatesRaw(r);
    setLastUpdated(new Date().toISOString().slice(0, 16).replace("T", " "));
  };

  const loginAdmin = async (email: string, password: string) => {
    const res = await adminApi.login(email, password);
    if (res.admin) setAdminUser(res.admin);
  };

  const logoutAdmin = async () => {
    try {
      await adminApi.logout();
    } finally {
      setAdminUser(null);
    }
  };

  const checkAdminAuth = async () => {
    try {
      const res = await adminApi.getMe();
      setAdminUser(res.admin ?? null);
    } catch {
      setAdminUser(null);
    } finally {
      setAuthChecked(true);
    }
  };

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await adminApi.getProducts();
      setProducts(res.products ?? []);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await adminApi.getCategories();
      setCategories(res.categories ?? []);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Once we know the admin is authenticated, pull real data from the backend
  useEffect(() => {
    if (adminUser) {
      loadProducts();
      loadCategories();
      loadDiscounts();
    }
  }, [adminUser]);

  const createProduct = async (p: Partial<Product>, imageFile?: File | null) => {
    let imageUrl = p.image ?? "";
    if (imageFile) {
      const uploadRes = await adminApi.uploadImage(imageFile);
      imageUrl = uploadRes.url;
    }
    const res = await adminApi.createProduct({ ...p, image: imageUrl });
    setProducts((ps) => [res.product, ...ps]);
  };

  const updateProduct = async (id: string, p: Partial<Product>, imageFile?: File | null) => {
    let imageUrl = p.image ?? "";
    if (imageFile) {
      const uploadRes = await adminApi.uploadImage(imageFile);
      imageUrl = uploadRes.url;
    }
    const res = await adminApi.updateProduct(id, { ...p, image: imageUrl });
    setProducts((ps) => ps.map((x) => (x.id === id ? res.product : x)));
  };

  const deleteProduct = async (id: string) => {
    await adminApi.deleteProduct(id);
    setProducts((ps) => ps.filter((x) => x.id !== id));
  };

  const bulkProductAction = async (ids: string[], action: "activate" | "deactivate" | "delete") => {
    await adminApi.bulkProductAction(ids, action);
    if (action === "delete") {
      setProducts((ps) => ps.filter((p) => !ids.includes(p.id)));
    } else {
      setProducts((ps) =>
        ps.map((p) => (ids.includes(p.id) ? { ...p, status: action === "activate" ? "Active" : "Inactive" } : p))
      );
    }
  };

  const createCategory = async (data: Record<string, any>) => {
    const res = await adminApi.createCategory(data);
    setCategories((cs) => [...cs, res.category]);
  };

  const updateCategory = async (id: string, data: Record<string, any>) => {
    const res = await adminApi.updateCategory(id, data);
    setCategories((cs) => cs.map((c) => (c.id === id ? res.category : c)));
  };

  const deleteCategory = async (id: string) => {
    await adminApi.deleteCategory(id);
    setCategories((cs) => cs.filter((c) => c.id !== id));
  };

  const reorderCategories = async (orderedIds: string[]) => {
    await adminApi.reorderCategories(orderedIds);
    setCategories((cs) => {
      const map = new Map(cs.map((c) => [c.id, c]));
      return orderedIds.map((id, i) => ({ ...(map.get(id) as Category), sortOrder: i }));
    });
  };

  const addDiscount = async (d: Omit<Discount, "id" | "createdAt">) => {
  const res = await adminApi.createDiscount(d);
  setDiscounts((x) => [res.discount, ...x]);
};

const removeDiscount = async (id: string) => {
  await adminApi.deleteDiscount(id);
  setDiscounts((x) => x.filter((d) => d.id !== id));
};

  const value = useMemo<Ctx>(() => ({
    rates, setRates, rateHistory,
    addRateHistory: (e) => setRateHistory((h) => [...e, ...h]),
    ratesLastUpdated,

    products, productsLoading, loadProducts,
    createProduct, updateProduct, deleteProduct, bulkProductAction,

    discounts, discountsLoading, loadDiscounts,
    addDiscount, removeDiscount,

    adminUser, authChecked, loginAdmin, logoutAdmin, checkAdminAuth,

    categories, categoriesLoading, loadCategories,
    createCategory, updateCategory, deleteCategory, reorderCategories,
  }), [
    rates, rateHistory, ratesLastUpdated,
    products, productsLoading,
    discounts,
    adminUser, authChecked,
    categories, categoriesLoading,
  ]);

  

  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}

export function useAdmin() {
  const v = useContext(AdminCtx);
  if (!v) throw new Error("useAdmin must be inside AdminProvider");
  return v;
}

export type { Discount };