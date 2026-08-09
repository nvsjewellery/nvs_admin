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

/* =========================================================
   DISCOUNT
========================================================= */

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

export type CreateDiscountInput = {
  name?: string | null;

  /*
   * For COUPON:
   * Backend generates the coupon code.
   */
  code?: string | null;

  type: DiscountType;

  target: DiscountTarget;

  kind: DiscountKind;

  /*
   * Always represents discount against
   * VA / making charges.
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
   PRODUCT IMAGE LIMIT
========================================================= */

const MAX_PRODUCT_IMAGES = 4;

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
    imageFiles?: File[] | null
  ) => Promise<void>;

  updateProduct: (
    id: string,
    p: Partial<Product>,
    imageFiles?: File[] | null
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
  ) => Promise<Discount>;

  updateDiscount: (
    id: string,
    discount: UpdateDiscountInput
  ) => Promise<Discount>;

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

  const setRates = useCallback(
    (r: Rates) => {
      setRatesRaw(r);

      setLastUpdated(
        new Date()
          .toISOString()
          .slice(0, 16)
          .replace("T", " ")
      );
    },
    []
  );

  /* =======================================================
     ADMIN LOGIN
  ======================================================= */

  const loginAdmin = useCallback(
    async (
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
    },
    []
  );

  /* =======================================================
     ADMIN LOGOUT
  ======================================================= */

  const logoutAdmin = useCallback(
    async () => {
      try {
        await adminApi.logout();
      } finally {
        setAdminUser(null);
      }
    },
    []
  );

  /* =======================================================
     CHECK ADMIN AUTH
  ======================================================= */

  const checkAdminAuth =
    useCallback(async () => {
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
    }, []);

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
      ): Promise<Discount> => {
        const payload: CreateDiscountInput = {
          ...discount,
        };

        const res =
          await adminApi.createDiscount(
            payload
          );

        const createdDiscount =
          res.discount as Discount;

        setDiscounts((current) => [
          createdDiscount,
          ...current,
        ]);

        return createdDiscount;
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
      ): Promise<Discount> => {
        const payload: UpdateDiscountInput = {
          ...discount,
        };

        const res =
          await adminApi.updateDiscount(
            id,
            payload
          );

        const updatedDiscount =
          res.discount as Discount;

        setDiscounts((current) =>
          current.map((item) =>
            item.id === id
              ? updatedDiscount
              : item
          )
        );

        return updatedDiscount;
      },
      []
    );

  /* =======================================================
     REMOVE DISCOUNT
  ======================================================= */

  const removeDiscount =
    useCallback(
      async (
        id: string
      ): Promise<void> => {
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
     NORMALIZE PRODUCT
  ======================================================= */

  const normalizeProduct =
    useCallback(
      (
        product: Product
      ): Product => {
        let images: string[] = [];

        /*
         * Prefer the new images[] field.
         */
        if (
          Array.isArray(
            product.images
          )
        ) {
          images =
            product.images.filter(
              (
                image
              ): image is string =>
                typeof image ===
                  "string" &&
                image.trim()
                  .length > 0
            );
        }

        /*
         * Backward compatibility
         * with old products.
         */
        if (
          images.length === 0 &&
          typeof product.image ===
            "string" &&
          product.image.trim()
            .length > 0
        ) {
          images = [
            product.image.trim(),
          ];
        }

        /*
         * Hard maximum of 4 images.
         */
        images = images.slice(
          0,
          MAX_PRODUCT_IMAGES
        );

        return {
          ...product,

          images,

          /*
           * First gallery image is
           * always the primary image.
           */
          image:
            images[0] ??
            "",
        };
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

        const backendProducts =
          Array.isArray(
            res.products
          )
            ? res.products
            : [];

        const normalizedProducts =
          backendProducts.map(
            (product: Product) =>
              normalizeProduct(
                product
              )
          );

        setProducts(
          normalizedProducts
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
    }, [normalizeProduct]);

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
          Array.isArray(
            res.categories
          )
            ? res.categories
            : []
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
          Array.isArray(
            res.reels
          )
            ? res.reels
            : []
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

    void loadProducts();
    void loadCategories();
    void loadDiscounts();
    void loadReels();
  }, [
    adminUser,
    loadProducts,
    loadCategories,
    loadDiscounts,
    loadReels,
  ]);

  /* =======================================================
     UPLOAD PRODUCT IMAGES
  ======================================================= */

  const uploadProductImages =
    useCallback(
      async (
        files: File[]
      ): Promise<string[]> => {
        if (!files.length) {
          return [];
        }

        if (
          files.length >
          MAX_PRODUCT_IMAGES
        ) {
          throw new Error(
            `A product can have a maximum of ${MAX_PRODUCT_IMAGES} images`
          );
        }

        const uploadedUrls: string[] =
          [];

        /*
         * Upload sequentially.
         *
         * This works with the current
         * single-file upload endpoint.
         */
        for (const file of files) {
          const uploadRes =
            await adminApi.uploadImage(
              file
            );

          if (
            uploadRes?.url &&
            typeof uploadRes.url ===
              "string"
          ) {
            uploadedUrls.push(
              uploadRes.url
            );
          }
        }

        return uploadedUrls;
      },
      []
    );

  /* =======================================================
     GET EXISTING PRODUCT IMAGES
  ======================================================= */

  const getExistingProductImages =
    useCallback(
      (
        p: Partial<Product>
      ): string[] => {
        let images: string[] = [];

        if (
          Array.isArray(
            p.images
          )
        ) {
          images =
            p.images.filter(
              (
                image
              ): image is string =>
                typeof image ===
                  "string" &&
                image.trim()
                  .length > 0
            );
        }

        /*
         * Backward compatibility
         * with old single-image products.
         */
        if (
          images.length === 0 &&
          typeof p.image ===
            "string" &&
          p.image.trim().length > 0
        ) {
          images = [
            p.image.trim(),
          ];
        }

        return images.slice(
          0,
          MAX_PRODUCT_IMAGES
        );
      },
      []
    );

  /* =======================================================
     BUILD PRODUCT IMAGE DATA
  ======================================================= */

  const buildProductImageData =
    useCallback(
      (
        p: Partial<Product>,
        uploadedImages: string[],
        appendToExisting: boolean
      ) => {
        const existingImages =
          getExistingProductImages(
            p
          );

        let images: string[];

        if (
          uploadedImages.length ===
          0
        ) {
          /*
           * No new files:
           * preserve existing gallery.
           */
          images = existingImages;
        } else if (
          appendToExisting
        ) {
          /*
           * Editing an existing product:
           *
           * New uploaded images become
           * primary images first, followed
           * by existing images.
           *
           * Maximum 4 total.
           */
          images = [
            ...uploadedImages,
            ...existingImages,
          ].slice(
            0,
            MAX_PRODUCT_IMAGES
          );
        } else {
          /*
           * Creating a new product:
           * uploaded images are the
           * complete gallery.
           */
          images =
            uploadedImages.slice(
              0,
              MAX_PRODUCT_IMAGES
            );
        }

        return {
          images,
          image:
            images[0] ?? "",
        };
      },
      [getExistingProductImages]
    );

  /* =======================================================
     CREATE PRODUCT
  ======================================================= */

  const createProduct =
    useCallback(
      async (
        p: Partial<Product>,
        imageFiles?: File[] | null
      ) => {
        const files =
          (imageFiles ?? []).slice(
            0,
            MAX_PRODUCT_IMAGES
          );

        const uploadedImages =
          await uploadProductImages(
            files
          );

        const imageData =
          buildProductImageData(
            p,
            uploadedImages,
            false
          );

        const res =
          await adminApi.createProduct({
            ...p,

            /*
             * Primary image.
             */
            image:
              imageData.image,

            /*
             * Complete gallery.
             */
            images:
              imageData.images,
          });

        const product =
          res.product as Product;

        const normalizedProduct =
          normalizeProduct(
            product
          );

        setProducts((current) => [
          normalizedProduct,
          ...current,
        ]);
      },
      [
        uploadProductImages,
        buildProductImageData,
        normalizeProduct,
      ]
    );

  /* =======================================================
     UPDATE PRODUCT
  ======================================================= */

  const updateProduct =
    useCallback(
      async (
        id: string,
        p: Partial<Product>,
        imageFiles?: File[] | null
      ) => {
        const files =
          (imageFiles ?? []).slice(
            0,
            MAX_PRODUCT_IMAGES
          );

        const uploadedImages =
          await uploadProductImages(
            files
          );

        /*
         * If this is an edit:
         *
         * - No new image:
         *   keep existing gallery.
         *
         * - New image(s):
         *   add them to the beginning.
         *
         * Existing images are preserved
         * until the 4-image limit.
         */
        const imageData =
          buildProductImageData(
            p,
            uploadedImages,
            true
          );

        const res =
          await adminApi.updateProduct(
            id,
            {
              ...p,

              image:
                imageData.image,

              images:
                imageData.images,
            }
          );

        const product =
          res.product as Product;

        const normalizedProduct =
          normalizeProduct(
            product
          );

        setProducts((current) =>
          current.map(
            (existing) =>
              existing.id === id
                ? normalizedProduct
                : existing
          )
        );
      },
      [
        uploadProductImages,
        buildProductImageData,
        normalizeProduct,
      ]
    );

  /* =======================================================
     DELETE PRODUCT
  ======================================================= */

  const deleteProduct =
    useCallback(
      async (
        id: string
      ) => {
        await adminApi.deleteProduct(
          id
        );

        setProducts((current) =>
          current.filter(
            (product) =>
              product.id !== id
          )
        );
      },
      []
    );

  /* =======================================================
     BULK PRODUCT ACTION
  ======================================================= */

  const bulkProductAction =
    useCallback(
      async (
        ids: string[],
        action:
          | "activate"
          | "deactivate"
          | "delete"
      ) => {
        if (ids.length === 0) {
          return;
        }

        await adminApi.bulkProductAction(
          ids,
          action
        );

        if (
          action === "delete"
        ) {
          setProducts((current) =>
            current.filter(
              (product) =>
                !ids.includes(
                  product.id
                )
            )
          );

          return;
        }

        setProducts((current) =>
          current.map(
            (product) =>
              ids.includes(
                product.id
              )
                ? {
                    ...product,
                    status:
                      action ===
                      "activate"
                        ? "Active"
                        : "Inactive",
                  }
                : product
          )
        );
      },
      []
    );

  /* =======================================================
     CREATE CATEGORY
  ======================================================= */

  const createCategory =
    useCallback(
      async (
        data: Record<string, any>
      ) => {
        const res =
          await adminApi.createCategory(
            data
          );

        setCategories(
          (current) => [
            ...current,
            res.category,
          ]
        );
      },
      []
    );

  /* =======================================================
     UPDATE CATEGORY
  ======================================================= */

  const updateCategory =
    useCallback(
      async (
        id: string,
        data: Record<string, any>
      ) => {
        const res =
          await adminApi.updateCategory(
            id,
            data
          );

        setCategories(
          (current) =>
            current.map(
              (category) =>
                category.id === id
                  ? res.category
                  : category
            )
        );
      },
      []
    );

  /* =======================================================
     DELETE CATEGORY
  ======================================================= */

  const deleteCategory =
    useCallback(
      async (
        id: string
      ) => {
        await adminApi.deleteCategory(
          id
        );

        setCategories(
          (current) =>
            current.filter(
              (category) =>
                category.id !== id
            )
        );
      },
      []
    );

  /* =======================================================
     REORDER CATEGORIES
  ======================================================= */

  const reorderCategories =
    useCallback(
      async (
        orderedIds: string[]
      ) => {
        await adminApi.reorderCategories(
          orderedIds
        );

        setCategories(
          (current) => {
            const map =
              new Map(
                current.map(
                  (category) => [
                    category.id,
                    category,
                  ]
                )
              );

            return orderedIds
              .map(
                (
                  id,
                  index
                ) => {
                  const category =
                    map.get(id);

                  if (
                    !category
                  ) {
                    return null;
                  }

                  return {
                    ...category,
                    sortOrder:
                      index,
                  };
                }
              )
              .filter(
                (
                  category
                ): category is Category =>
                  category !==
                  null
              );
          }
        );
      },
      []
    );

  /* =======================================================
     CREATE REEL
  ======================================================= */

  const createReel =
    useCallback(
      async (
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

          videoUrl =
            uploadRes.url;
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
      },
      []
    );

  /* =======================================================
     UPDATE REEL
  ======================================================= */

  const updateReel =
    useCallback(
      async (
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
      },
      []
    );

  /* =======================================================
     DELETE REEL
  ======================================================= */

  const deleteReel =
    useCallback(
      async (
        id: string
      ) => {
        await adminApi.deleteReel(
          id
        );

        setReels((current) =>
          current.filter(
            (reel) =>
              reel.id !== id
          )
        );
      },
      []
    );

  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const value = useMemo<Ctx>(
    () => ({
      /* -------------------------
         Rates
      ------------------------- */

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

      /* -------------------------
         Products
      ------------------------- */

      products,

      productsLoading,

      loadProducts,

      createProduct,

      updateProduct,

      deleteProduct,

      bulkProductAction,

      /* -------------------------
         Discounts
      ------------------------- */

      discounts,

      discountsLoading,

      loadDiscounts,

      addDiscount,

      updateDiscount,

      removeDiscount,

      /* -------------------------
         Admin Auth
      ------------------------- */

      adminUser,

      authChecked,

      loginAdmin,

      logoutAdmin,

      checkAdminAuth,

      /* -------------------------
         Categories
      ------------------------- */

      categories,

      categoriesLoading,

      loadCategories,

      createCategory,

      updateCategory,

      deleteCategory,

      reorderCategories,

      /* -------------------------
         Reels
      ------------------------- */

      reels,

      reelsLoading,

      loadReels,

      createReel,

      updateReel,

      deleteReel,
    }),
    [
      rates,
      setRates,

      rateHistory,

      ratesLastUpdated,

      products,
      productsLoading,
      loadProducts,
      createProduct,
      updateProduct,
      deleteProduct,
      bulkProductAction,

      discounts,
      discountsLoading,
      loadDiscounts,
      addDiscount,
      updateDiscount,
      removeDiscount,

      adminUser,
      authChecked,
      loginAdmin,
      logoutAdmin,
      checkAdminAuth,

      categories,
      categoriesLoading,
      loadCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      reorderCategories,

      reels,
      reelsLoading,
      loadReels,
      createReel,
      updateReel,
      deleteReel,
    ]
  );

  /* =======================================================
     PROVIDER
  ======================================================= */

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