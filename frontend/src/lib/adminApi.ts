const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

async function request(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers:
      options.body instanceof FormData
        ? { ...options.headers }
        : {
            "Content-Type": "application/json",
            ...options.headers,
          },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

/**
 * Upload a file with real upload progress.
 *
 * onProgress is optional, so existing product image uploads
 * continue working without any changes.
 */
function uploadFileWithProgress(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", `${API_URL}/admin/upload`, true);

    // Important because your admin authentication uses cookies.
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentage = Math.round(
          (event.loaded / event.total) * 100
        );

        onProgress(percentage);
      }
    };

    xhr.onload = () => {
      let data: any;

      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Invalid response from server"));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        // Make sure UI reaches 100% when server accepts the upload.
        onProgress?.(100);

        resolve(data);
      } else {
        reject(
          new Error(
            data?.message || "File upload failed"
          )
        );
      }
    };

    xhr.onerror = () => {
      reject(
        new Error(
          "Network error while uploading the file"
        )
      );
    };

    xhr.onabort = () => {
      reject(
        new Error("File upload was cancelled")
      );
    };

    const formData = new FormData();
    formData.append("image", file);

    xhr.send(formData);
  });
}

export const adminApi = {
  // --------------------------------------------------
  // Auth
  // --------------------------------------------------

  login: (email: string, password: string) =>
    request("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    }),

  logout: () =>
    request("/admin/auth/logout", {
      method: "POST",
    }),

  getMe: () =>
    request("/admin/auth/me", {
      method: "GET",
    }),

  // --------------------------------------------------
  // Products
  // --------------------------------------------------

  getProducts: () =>
    request("/admin/products", {
      method: "GET",
    }),

  createProduct: (data: Record<string, any>) =>
    request("/admin/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProduct: (
    id: string,
    data: Record<string, any>
  ) =>
    request(`/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string) =>
    request(`/admin/products/${id}`, {
      method: "DELETE",
    }),

  bulkProductAction: (
    ids: string[],
    action: "activate" | "deactivate" | "delete"
  ) =>
    request("/admin/products/bulk", {
      method: "POST",
      body: JSON.stringify({
        ids,
        action,
      }),
    }),

  // --------------------------------------------------
  // Image / Media Upload
  // --------------------------------------------------

  uploadImage: (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{
    success: boolean;
    url: string;
  }> => {
    return uploadFileWithProgress(
      file,
      onProgress
    );
  },

  // --------------------------------------------------
  // Categories
  // --------------------------------------------------

  getCategories: () =>
    request("/admin/categories", {
      method: "GET",
    }),

  createCategory: (
    data: Record<string, any>
  ) =>
    request("/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCategory: (
    id: string,
    data: Record<string, any>
  ) =>
    request(`/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: string) =>
    request(`/admin/categories/${id}`, {
      method: "DELETE",
    }),

  reorderCategories: (
    orderedIds: string[]
  ) =>
    request("/admin/categories/reorder", {
      method: "POST",
      body: JSON.stringify({
        orderedIds,
      }),
    }),

  // --------------------------------------------------
  // Discounts
  // --------------------------------------------------

  getDiscounts: () =>
    request("/admin/discounts", {
      method: "GET",
    }),

  createDiscount: (
    data: Record<string, any>
  ) =>
    request("/admin/discounts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteDiscount: (id: string) =>
    request(`/admin/discounts/${id}`, {
      method: "DELETE",
    }),

  // --------------------------------------------------
  // Reels
  // --------------------------------------------------

  getReels: () =>
    request("/reels", {
      method: "GET",
    }),

  createReel: (
    data: Record<string, any>
  ) =>
    request("/reels", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateReel: (
    id: string,
    data: Record<string, any>
  ) =>
    request(`/reels/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteReel: (id: string) =>
    request(`/reels/${id}`, {
      method: "DELETE",
    }),

  // --------------------------------------------------
  // Customers
  // --------------------------------------------------

  getCustomers: () =>
    request("/admin/customers", {
      method: "GET",
    }),

  // --------------------------------------------------
  // Orders
  // --------------------------------------------------

  getOrders: (
    params?: {
      status?: string;
      search?: string;
    }
  ) => {
    const query = new URLSearchParams();

    if (
      params?.status &&
      params.status !== "all"
    ) {
      query.set("status", params.status);
    }

    if (params?.search) {
      query.set("search", params.search);
    }

    const qs = query.toString();

    return request(
      `/admin/orders${qs ? `?${qs}` : ""}`,
      {
        method: "GET",
      }
    );
  },

  getOrderById: (orderId: string) =>
    request(`/admin/orders/${orderId}`, {
      method: "GET",
    }),

  updateOrderStatus: (
    orderId: string,
    status: string
  ) =>
    request(
      `/admin/orders/${orderId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status,
        }),
      }
    ),

  generateOrderManifest: (
    orderId: string
  ) =>
    request(
      `/admin/orders/${orderId}/generate-manifest`,
      {
        method: "POST",
      }
    ),

  generateOrderLabel: (
    orderId: string
  ) =>
    request(
      `/admin/orders/${orderId}/generate-label`,
      {
        method: "POST",
      }
    ),

  printOrderInvoice: (
    orderId: string
  ) =>
    request(
      `/admin/orders/${orderId}/print-invoice`,
      {
        method: "POST",
      }
    ),

  cancelOrder: (orderId: string) =>
    request(
      `/admin/orders/${orderId}/cancel`,
      {
        method: "POST",
      }
    ),
};