import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";

import { adminApi } from "./adminApi";

import {
  INITIAL_RATES,
  INITIAL_RATE_HISTORY,
  type Product,
  type Rates,
  type RateHistoryEntry,
} from "./mock";

/* =========================================================
   DISCOUNT TYPES
========================================================= */

export type DiscountType =
  | "SEASONAL"
  | "COUPON"
  | "CUSTOMER";

export type DiscountTarget =
  | "PRODUCT"
  | "CATEGORY"
  | "CART"
  | "CUSTOMER";

export type DiscountKind =
  | "percent"
  | "flat";

/*
 * Discount stored in frontend state.
 *
 * IMPORTANT:
 * There is NO "scope" field anymore.
 *
 * Every discount is applied ONLY to VA / making charges.
 */
export type Discount = {
  id: string;

  name?: string | null;
  code?: string | null;

  type: DiscountType;

  target: DiscountTarget;

  kind: DiscountKind;

  value: number;

  metal?: "Gold" | "Silver" | null;

  category?: string | null;

  productIds?: string[];

  userId?: string | null;

  startDate?: string | null;

  endDate?: string | null;

  usageLimit?: number | null;

  usageCount?: number;

  isActive: boolean;

  createdAt: string;

  updatedAt?: string;
};

/* =========================================================
   CREATE / UPDATE DISCOUNT INPUT
========================================================= */

/*
 * This intentionally does NOT use Omit<Discount>.
 *
 * Backend allows productIds/userId/etc. to be optional
 * depending on the discount target.
 */
export type CreateDiscountInput = {
  name?: string | null;

  code?: string | null;

  type: DiscountType;

  target: DiscountTarget;

  kind: DiscountKind;

  /*
   * ALWAYS represents discount against VA.
   */
  value: number;

  metal?: "Gold" | "Silver" | null;

  category?: string | null;

  productIds?: string[];

  userId?: string | null;

  startDate?: string | null;

  endDate?: string | null;

  usageLimit?: number | null;

  isActive?: boolean;
};

export type UpdateDiscountInput =
  Partial<CreateDiscountInput>;

/* =========================================================
   ADMIN USER
========================================================= */

type AdminUser = {
  email: string;
  role: string;
};

/* =========================================================
   CATEGORY
========================================================= */

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

/* =========================================================
   REEL
========================================================= */

export type Reel = {
  id: string;
  title?: string;
  instagramUrl: string;
  videoUrl: string;
  isActive: boolean;
  sortOrder: number;
};

/* =========================================================
   CONTEXT TYPE
========================================================= */

type Ctx = {
  /* -------------------------
     RATES
  ------------------------- */

  rates: Rates;

  setRates: (r: Rates) => void;

  rateHistory: RateHistoryEntry[];

  addRateHistory: (
    entries: RateHistoryEntry[]
  ) => void;

  ratesLastUpdated: string;

  /* -------------------------
     PRODUCTS
  ------------------------- */

  products: Product[];

  productsLoading: boolean;

  loadProducts: () => Promise<void>;

  createProduct: (
    p: Partial<Product>,
    imageFile?: File | null
  ) => Promise<void>;

  updateProduct: (
    id: string,
    p: Partial<Product>,
    imageFile?: File | null
  ) => Promise<void>;

  deleteProduct: (
    id: string
  ) => Promise<void>;

  bulkProductAction: (
    ids: string[],
    action:
      | "activate"
      | "deactivate"
      | "delete"
  ) => Promise<void>;

  /* -------------------------
     DISCOUNTS
  ------------------------- */

  discounts: Discount[];

  discountsLoading: boolean;

  loadDiscounts: () => Promise<void>;

  addDiscount: (
    discount: CreateDiscountInput
  ) => Promise<void>;

  updateDiscount: (
    id: string,
    discount: UpdateDiscountInput
  ) => Promise<void>;

  removeDiscount: (
    id: string
  ) => Promise<void>;

  /* -------------------------
     ADMIN AUTH
  ------------------------- */

  adminUser: AdminUser | null;

  authChecked: boolean;

  loginAdmin: (
    email: string,
    password: string
  ) => Promise<void>;

  logoutAdmin: () => Promise<void>;

  checkAdminAuth: () => Promise<void>;

  /* -------------------------
     CATEGORIES
  ------------------------- */

  categories: Category[];

  categoriesLoading: boolean;

  loadCategories: () => Promise<void>;

  createCategory: (
    data: Record<string, any>
  ) => Promise<void>;

  updateCategory: (
    id: string,
    data: Record<string, any>
  ) => Promise<void>;

  deleteCategory: (
    id: string
  ) => Promise<void>;

  reorderCategories: (
    orderedIds: string[]
  ) => Promise<void>;

  /* -------------------------
     REELS
  ------------------------- */

  reels: Reel[];

  reelsLoading: boolean;

  loadReels: () => Promise<void>;

  createReel: (
    data: Partial<Reel>,
    videoFile?: File | null,
    onProgress?: (
      progress: number
    ) => void
  ) => Promise<void>;

  updateReel: (
    id: string,
    data: Partial<Reel>
  ) => Promise<void>;

  deleteReel: (
    id: string
  ) => Promise<void>;
};

/* =========================================================
   CONTEXT
========================================================= */

const AdminCtx =
  createContext<Ctx | null>(null);

/* =========================================================
   PROVIDER
========================================================= */

export function AdminProvider({
  children,
}: {
  children: ReactNode;
}) {
  /* =======================================================
     RATES STATE
  ======================================================= */

  const [rates, setRatesRaw] =
    useState<Rates>(INITIAL_RATES);

  const [rateHistory, setRateHistory] =
    useState<RateHistoryEntry[]>(
      INITIAL_RATE_HISTORY
    );

  const [ratesLastUpdated, setLastUpdated] =
    useState<string>(
      "2026-07-13 09:12"
    );

  /* =======================================================
     PRODUCTS STATE
  ======================================================= */

  const [products, setProducts] =
    useState<Product[]>([]);

  const [productsLoading, setProductsLoading] =
    useState(false);

  /* =======================================================
     DISCOUNTS STATE
  ======================================================= */

  const [discounts, setDiscounts] =
    useState<Discount[]>([]);

  const [discountsLoading, setDiscountsLoading] =
    useState(false);

  /* =======================================================
     ADMIN AUTH STATE
  ======================================================= */

  const [adminUser, setAdminUser] =
    useState<AdminUser | null>(null);

  const [authChecked, setAuthChecked] =
    useState(false);

  /* =======================================================
     CATEGORIES STATE
  ======================================================= */

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [categoriesLoading, setCategoriesLoading] =
    useState(false);

  /* =======================================================
     REELS STATE
  ======================================================= */

  const [reels, setReels] =
    useState<Reel[]>([]);

  const [reelsLoading, setReelsLoading] =
    useState(false);

  /* =======================================================
     RATES
  ======================================================= */

  const setRates = (r: Rates) => {
    setRatesRaw(r);

    setLastUpdated(
      new Date()
        .toISOString()
        .slice(0, 16)
        .replace("T", " ")
    );
  };

  /* =======================================================
     ADMIN LOGIN
  ======================================================= */

  const loginAdmin = async (
    email: string,
    password: string
  ) => {
    const res =
      await adminApi.login(
        email,
        password
      );

    if (res.admin) {
      setAdminUser(res.admin);
    }
  };

  /* =======================================================
     ADMIN LOGOUT
  ======================================================= */

  const logoutAdmin = async () => {
    try {
      await adminApi.logout();
    } finally {
      setAdminUser(null);
    }
  };

  /* =======================================================
     CHECK ADMIN AUTH
  ======================================================= */

  const checkAdminAuth = async () => {
    try {
      const res =
        await adminApi.getMe();

      setAdminUser(
        res.admin ?? null
      );
    } catch {
      setAdminUser(null);
    } finally {
      setAuthChecked(true);
    }
  };

  /* =======================================================
     LOAD DISCOUNTS
  ======================================================= */

  const loadDiscounts =
    useCallback(async () => {
      setDiscountsLoading(true);

      try {
        const res =
          await adminApi.getDiscounts();

        setDiscounts(
          (res.discounts ??
            []) as Discount[]
        );
      } catch (err) {
        console.error(
          "Failed to load discounts:",
          err
        );

        throw err;
      } finally {
        setDiscountsLoading(false);
      }
    }, []);

  /* =======================================================
     ADD DISCOUNT
  ======================================================= */

  const addDiscount =
    useCallback(
      async (
        discount: CreateDiscountInput
      ) => {
        /*
         * IMPORTANT:
         *
         * No "scope" is sent.
         *
         * kind + value describe the VA discount.
         *
         * The backend also enforces that discounts
         * are VA-only.
         */

        const payload: CreateDiscountInput = {
          ...discount,
        };

        const res =
          await adminApi.createDiscount(
            payload
          );

        setDiscounts((current) => [
          res.discount as Discount,
          ...current,
        ]);
      },
      []
    );

  /* =======================================================
     UPDATE DISCOUNT
  ======================================================= */

  const updateDiscount =
    useCallback(
      async (
        id: string,
        discount: UpdateDiscountInput
      ) => {
        const payload: UpdateDiscountInput = {
          ...discount,
        };

        const res =
          await adminApi.updateDiscount(
            id,
            payload
          );

        setDiscounts((current) =>
          current.map((item) =>
            item.id === id
              ? (res.discount as Discount)
              : item
          )
        );
      },
      []
    );

  /* =======================================================
     REMOVE DISCOUNT
  ======================================================= */

  const removeDiscount =
    useCallback(
      async (id: string) => {
        await adminApi.deleteDiscount(
          id
        );

        setDiscounts((current) =>
          current.filter(
            (discount) =>
              discount.id !== id
          )
        );
      },
      []
    );

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  const loadProducts =
    useCallback(async () => {
      setProductsLoading(true);

      try {
        const res =
          await adminApi.getProducts();

        setProducts(
          res.products ?? []
        );
      } catch (err) {
        console.error(
          "Failed to load products:",
          err
        );

        throw err;
      } finally {
        setProductsLoading(false);
      }
    }, []);

  /* =======================================================
     LOAD CATEGORIES
  ======================================================= */

  const loadCategories =
    useCallback(async () => {
      setCategoriesLoading(true);

      try {
        const res =
          await adminApi.getCategories();

        setCategories(
          res.categories ?? []
        );
      } catch (err) {
        console.error(
          "Failed to load categories:",
          err
        );

        throw err;
      } finally {
        setCategoriesLoading(false);
      }
    }, []);

  /* =======================================================
     LOAD REELS
  ======================================================= */

  const loadReels =
    useCallback(async () => {
      setReelsLoading(true);

      try {
        const res =
          await adminApi.getReels();

        setReels(
          res.reels ?? []
        );
      } catch (err) {
        console.error(
          "Error loading reels:",
          err
        );
      } finally {
        setReelsLoading(false);
      }
    }, []);

  /* =======================================================
     AUTOMATIC ADMIN DATA LOAD
  ======================================================= */

  useEffect(() => {
    if (!adminUser) {
      return;
    }

    loadProducts();
    loadCategories();
    loadDiscounts();
    loadReels();
  }, [
    adminUser,
    loadProducts,
    loadCategories,
    loadDiscounts,
    loadReels,
  ]);

  /* =======================================================
     CREATE PRODUCT
  ======================================================= */

  const createProduct = async (
    p: Partial<Product>,
    imageFile?: File | null
  ) => {
    let imageUrl =
      p.image ?? "";

    if (imageFile) {
      const uploadRes =
        await adminApi.uploadImage(
          imageFile
        );

      imageUrl = uploadRes.url;
    }

    const res =
      await adminApi.createProduct({
        ...p,
        image: imageUrl,
      });

    setProducts((current) => [
      res.product,
      ...current,
    ]);
  };

  /* =======================================================
     UPDATE PRODUCT
  ======================================================= */

  const updateProduct = async (
    id: string,
    p: Partial<Product>,
    imageFile?: File | null
  ) => {
    let imageUrl =
      p.image ?? "";

    if (imageFile) {
      const uploadRes =
        await adminApi.uploadImage(
          imageFile
        );

      imageUrl = uploadRes.url;
    }

    const res =
      await adminApi.updateProduct(
        id,
        {
          ...p,
          image: imageUrl,
        }
      );

    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? res.product
          : product
      )
    );
  };

  /* =======================================================
     DELETE PRODUCT
  ======================================================= */

  const deleteProduct = async (
    id: string
  ) => {
    await adminApi.deleteProduct(id);

    setProducts((current) =>
      current.filter(
        (product) =>
          product.id !== id
      )
    );
  };

  /* =======================================================
     BULK PRODUCT ACTION
  ======================================================= */

  const bulkProductAction = async (
    ids: string[],
    action:
      | "activate"
      | "deactivate"
      | "delete"
  ) => {
    await adminApi.bulkProductAction(
      ids,
      action
    );

    if (action === "delete") {
      setProducts((current) =>
        current.filter(
          (product) =>
            !ids.includes(product.id)
        )
      );

      return;
    }

    setProducts((current) =>
      current.map((product) =>
        ids.includes(product.id)
          ? {
              ...product,
              status:
                action === "activate"
                  ? "Active"
                  : "Inactive",
            }
          : product
      )
    );
  };

  /* =======================================================
     CREATE CATEGORY
  ======================================================= */

  const createCategory = async (
    data: Record<string, any>
  ) => {
    const res =
      await adminApi.createCategory(
        data
      );

    setCategories((current) => [
      ...current,
      res.category,
    ]);
  };

  /* =======================================================
     UPDATE CATEGORY
  ======================================================= */

  const updateCategory = async (
    id: string,
    data: Record<string, any>
  ) => {
    const res =
      await adminApi.updateCategory(
        id,
        data
      );

    setCategories((current) =>
      current.map((category) =>
        category.id === id
          ? res.category
          : category
      )
    );
  };

  /* =======================================================
     DELETE CATEGORY
  ======================================================= */

  const deleteCategory = async (
    id: string
  ) => {
    await adminApi.deleteCategory(id);

    setCategories((current) =>
      current.filter(
        (category) =>
          category.id !== id
      )
    );
  };

  /* =======================================================
     REORDER CATEGORIES
  ======================================================= */

  const reorderCategories = async (
    orderedIds: string[]
  ) => {
    await adminApi.reorderCategories(
      orderedIds
    );

    setCategories((current) => {
      const map = new Map(
        current.map((category) => [
          category.id,
          category,
        ])
      );

      return orderedIds
        .map((id, index) => {
          const category =
            map.get(id);

          if (!category) {
            return null;
          }

          return {
            ...category,
            sortOrder: index,
          };
        })
        .filter(
          Boolean
        ) as Category[];
    });
  };

  /* =======================================================
     CREATE REEL
  ======================================================= */

  const createReel = async (
    data: Partial<Reel>,
    videoFile?: File | null,
    onProgress?: (
      progress: number
    ) => void
  ) => {
    let videoUrl =
      data.videoUrl ?? "";

    if (videoFile) {
      const uploadRes =
        await adminApi.uploadImage(
          videoFile,
          onProgress
        );

      videoUrl = uploadRes.url;
    }

    const res =
      await adminApi.createReel({
        ...data,
        videoUrl,
      });

    setReels((current) => [
      ...current,
      res.reel,
    ]);
  };

  /* =======================================================
     UPDATE REEL
  ======================================================= */

  const updateReel = async (
    id: string,
    data: Partial<Reel>
  ) => {
    const res =
      await adminApi.updateReel(
        id,
        data
      );

    setReels((current) =>
      current.map((reel) =>
        reel.id === id
          ? res.reel
          : reel
      )
    );
  };

  /* =======================================================
     DELETE REEL
  ======================================================= */

  const deleteReel = async (
    id: string
  ) => {
    await adminApi.deleteReel(id);

    setReels((current) =>
      current.filter(
        (reel) =>
          reel.id !== id
      )
    );
  };

  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const value = useMemo<Ctx>(
    () => ({
      /* Rates */
      rates,
      setRates,
      rateHistory,

      addRateHistory: (
        entries
      ) =>
        setRateHistory(
          (history) => [
            ...entries,
            ...history,
          ]
        ),

      ratesLastUpdated,

      /* Products */
      products,
      productsLoading,
      loadProducts,
      createProduct,
      updateProduct,
      deleteProduct,
      bulkProductAction,

      /* Discounts */
      discounts,
      discountsLoading,
      loadDiscounts,
      addDiscount,
      updateDiscount,
      removeDiscount,

      /* Admin auth */
      adminUser,
      authChecked,
      loginAdmin,
      logoutAdmin,
      checkAdminAuth,

      /* Categories */
      categories,
      categoriesLoading,
      loadCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      reorderCategories,

      /* Reels */
      reels,
      reelsLoading,
      loadReels,
      createReel,
      updateReel,
      deleteReel,
    }),
    [
      rates,
      rateHistory,
      ratesLastUpdated,

      products,
      productsLoading,
      loadProducts,

      discounts,
      discountsLoading,
      loadDiscounts,
      addDiscount,
      updateDiscount,
      removeDiscount,

      adminUser,
      authChecked,

      categories,
      categoriesLoading,
      loadCategories,

      reels,
      reelsLoading,
      loadReels,
    ]
  );

  return (
    <AdminCtx.Provider value={value}>
      {children}
    </AdminCtx.Provider>
  );
}

/* =========================================================
   USE ADMIN HOOK
========================================================= */

export function useAdmin() {
  const value =
    useContext(AdminCtx);

  if (!value) {
    throw new Error(
      "useAdmin must be inside AdminProvider"
    );
  }

  return value;
}