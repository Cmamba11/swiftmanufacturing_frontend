import {
  Product,
  Transaction,
  Customer,
  IssuingRecord,
  ProductionRecord,
  SparePart,
  SparePartIssuance,
  MaterialStock,
  MaterialGrade,
  AuthUser,
  ManagedUser,
  CreateUserInput,
  UpdateUserInput,
} from '../types';

const rawApiBase = import.meta.env.VITE_API_BASE_URL?.toString().trim();
const apiOrigin = rawApiBase
  ? rawApiBase.replace(/\/+$/, '').replace(/\/api$/i, '')
  : '';

const API_BASE = apiOrigin ? `${apiOrigin}/api` : '/api';
const TOKEN_KEY = 'swift_auth_token';

/* =========================
   TOKEN HELPERS
========================= */
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/* =========================
   SAFE FETCH CORE
========================= */
class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';

  // ✅ SAFE PARSING (fixes your crash)
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    const text = await res.text();
    data = text || null;
  }

  if (!res.ok) {
    const message =
      data?.error ||
      `Request failed (${res.status})`;

    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

/* =========================
   AUTH
========================= */
export const api = {
  getToken,
  clearToken,

  login: async (username: string, password: string): Promise<AuthUser> => {
    const res = await request<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    setToken(res.token);
    return res.user;
  },

  logout: () => clearToken(),

  getMe: () => request<AuthUser>('/auth/me'),

  /* =========================
     USERS
  ========================= */
  getUsers: () => request<ManagedUser[]>('/users'),

  createUser: (user: CreateUserInput) =>
    request<ManagedUser>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    }),

  updateUser: (id: string, data: UpdateUserInput) =>
    request<ManagedUser>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  resetUserPassword: (id: string, password: string) =>
    request<{ success: boolean }>(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    }),

  deleteUser: (id: string) =>
    request<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    }),

  /* =========================
     PRODUCTS
  ========================= */
  getProducts: () => request<Product[]>('/products'),

  addProduct: (product: Product) =>
    request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),

  updateProduct: (id: string, data: Partial<Product>) =>
    request<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string) =>
    request<{ success: boolean }>(`/products/${id}`, {
      method: 'DELETE',
    }),

  /* =========================
     CUSTOMERS
  ========================= */
  getCustomers: () => request<Customer[]>('/customers'),

  addCustomer: (customer: Customer) =>
    request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    }),

  updateCustomer: (id: string, data: Partial<Customer>) =>
    request<Customer>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCustomer: (id: string) =>
    request<{ success: boolean }>(`/customers/${id}`, {
      method: 'DELETE',
    }),

  /* =========================
     TRANSACTIONS
  ========================= */
  getTransactions: () => request<Transaction[]>('/transactions'),

  addTransaction: (t: Transaction) =>
    request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(t),
    }),

  voidTransaction: (id: string) =>
    request<Transaction>(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ voided: true }),
    }),

  /* =========================
     ISSUING RECORDS
  ========================= */
  getIssuingRecords: () => request<IssuingRecord[]>('/issuing-records'),

  addIssuingRecord: (r: IssuingRecord) =>
    request<IssuingRecord>('/issuing-records', {
      method: 'POST',
      body: JSON.stringify(r),
    }),

  deleteIssuingRecord: (id: string) =>
    request<{ success: boolean }>(`/issuing-records/${id}`, {
      method: 'DELETE',
    }),

  /* =========================
     PRODUCTION RECORDS
  ========================= */
  getProductionRecords: () => request<ProductionRecord[]>('/production-records'),

  addProductionRecord: (r: ProductionRecord) =>
    request<ProductionRecord>('/production-records', {
      method: 'POST',
      body: JSON.stringify(r),
    }),

  deleteProductionRecord: (id: string) =>
    request<{ success: boolean }>(`/production-records/${id}`, {
      method: 'DELETE',
    }),

  /* =========================
     MATERIAL STOCK
  ========================= */
  getMaterialStock: () =>
    request<MaterialStock>('/material-stock'),

  updateMaterialStock: (grade: MaterialGrade, amount: number) =>
    request<MaterialStock>('/material-stock', {
      method: 'PATCH',
      body: JSON.stringify({
        [grade.toLowerCase()]: { increment: amount },
      }),
    }),

  /* =========================
     SPARE PARTS
  ========================= */
  getSpareParts: () => request<SparePart[]>('/spare-parts'),

  addSparePart: (p: SparePart) =>
    request<SparePart>('/spare-parts', {
      method: 'POST',
      body: JSON.stringify(p),
    }),

  updateSparePart: (id: string, data: Partial<SparePart>) =>
    request<SparePart>(`/spare-parts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /* =========================
     SPARE ISSUANCE
  ========================= */
  getSpareIssuances: () => request<SparePartIssuance[]>('/spare-issuances'),

  addSpareIssuance: (i: SparePartIssuance) =>
    request<SparePartIssuance>('/spare-issuances', {
      method: 'POST',
      body: JSON.stringify(i),
    }),
};