const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

async function request(endpoint: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: options.body instanceof FormData
      ? { ...options.headers }
      : { "Content-Type": "application/json", ...options.headers },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export const adminApi = {
  // Auth
  login: (email: string, password: string) =>
    request("/admin/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request("/admin/auth/logout", { method: "POST" }),
  getMe: () => request("/admin/auth/me", { method: "GET" }),

  // Products
  getProducts: () => request("/admin/products", { method: "GET" }),
  createProduct: (data: Record<string, any>) =>
    request("/admin/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Record<string, any>) =>
    request(`/admin/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    request(`/admin/products/${id}`, { method: "DELETE" }),
  bulkProductAction: (ids: string[], action: "activate" | "deactivate" | "delete") =>
    request("/admin/products/bulk", { method: "POST", body: JSON.stringify({ ids, action }) }),

  // Image / Media Upload
  uploadImage: (file: File): Promise<{ success: boolean; url: string }> => {
    const formData = new FormData();
    formData.append("image", file);
    return request("/admin/upload", { method: "POST", body: formData });
  },

  // Categories
  getCategories: () => request("/admin/categories", { method: "GET" }),
  createCategory: (data: Record<string, any>) =>
    request("/admin/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id: string, data: Record<string, any>) =>
    request(`/admin/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (id: string) =>
    request(`/admin/categories/${id}`, { method: "DELETE" }),
  reorderCategories: (orderedIds: string[]) =>
    request("/admin/categories/reorder", { method: "POST", body: JSON.stringify({ orderedIds }) }),

  // Discounts
  getDiscounts: () => request("/admin/discounts", { method: "GET" }),
  createDiscount: (data: Record<string, any>) =>
    request("/admin/discounts", { method: "POST", body: JSON.stringify(data) }),
  deleteDiscount: (id: string) =>
    request(`/admin/discounts/${id}`, { method: "DELETE" }),

  // Reels APIs (Refactored to use request helper)
  getReels: () => request("/reels", { method: "GET" }),
  createReel: (data: Record<string, any>) =>
    request("/reels", { method: "POST", body: JSON.stringify(data) }),
  updateReel: (id: string, data: Record<string, any>) =>
    request(`/reels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteReel: (id: string) =>
    request(`/reels/${id}`, { method: "DELETE" }),

  // Customers
getCustomers: () =>
  request("/admin/customers", { method: "GET" }),
};