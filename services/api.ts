import {
  Product,
  Transaction,
  Customer,
  IssuingRecord,
  ProductionRecord,
  MaterialStock,
  SparePart,
  SparePartIssuance,
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
const AUTH_TOKEN_KEY = 'swift_auth_token';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers = new Headers(init?.headers ?? {});

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? String((payload as { error?: unknown }).error)
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

type LoginResponse = {
  token: string;
  user: AuthUser;
};

type RawMaterialStock = {
  hd?: unknown;
  lld?: unknown;
  exceed?: unknown;
  ipa?: unknown;
  tulane?: unknown;
  HD?: unknown;
  LLD?: unknown;
  EXCEED?: unknown;
  IPA?: unknown;
  TULANE?: unknown;
};

function toFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeMaterialStock(payload: unknown): MaterialStock {
  const stock = (payload ?? {}) as RawMaterialStock;

  return {
    [MaterialGrade.HD]: toFiniteNumber(stock.HD ?? stock.hd),
    [MaterialGrade.LLD]: toFiniteNumber(stock.LLD ?? stock.lld),
    [MaterialGrade.EXCEED]: toFiniteNumber(stock.EXCEED ?? stock.exceed),
    [MaterialGrade.IPA]: toFiniteNumber(stock.IPA ?? stock.ipa),
    [MaterialGrade.TULANE]: toFiniteNumber(stock.TULANE ?? stock.tulane),
  };
}

export const api = {
  getToken,
  clearToken,

  login: async (username: string, password: string): Promise<AuthUser> => {
    const response = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    setToken(response.token);
    return response.user;
  },

  logout: () => {
    clearToken();
  },

  getMe: () => request<AuthUser>('/auth/me'),

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

  getTransactions: () => request<Transaction[]>('/transactions'),
  addTransaction: (transaction: Transaction) =>
    request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    }),
  voidTransaction: (id: string) =>
    request<Transaction>(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ voided: true }),
    }),

  getIssuingRecords: () => request<IssuingRecord[]>('/issuing-records'),
  addIssuingRecord: (record: IssuingRecord) =>
    request<IssuingRecord>('/issuing-records', {
      method: 'POST',
      body: JSON.stringify(record),
    }),

  getProductionRecords: () => request<ProductionRecord[]>('/production-records'),
  addProductionRecord: (record: ProductionRecord) =>
    request<ProductionRecord>('/production-records', {
      method: 'POST',
      body: JSON.stringify(record),
    }),

  getMaterialStock: async () => normalizeMaterialStock(await request<unknown>('/material-stock')),
  updateMaterialStock: (grade: MaterialGrade, amount: number) => {
    const field = grade.toLowerCase();
    return request<unknown>('/material-stock', {
      method: 'PATCH',
      body: JSON.stringify({ [field]: { increment: amount } }),
    }).then(normalizeMaterialStock);
  },

  getSpareParts: () => request<SparePart[]>('/spare-parts'),
  addSparePart: (part: SparePart) =>
    request<SparePart>('/spare-parts', {
      method: 'POST',
      body: JSON.stringify(part),
    }),
  updateSparePart: (id: string, data: Partial<SparePart>) =>
    request<SparePart>(`/spare-parts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getSpareIssuances: () => request<SparePartIssuance[]>('/spare-issuances'),
  addSpareIssuance: (issuance: SparePartIssuance) =>
    request<SparePartIssuance>('/spare-issuances', {
      method: 'POST',
      body: JSON.stringify(issuance),
    }),

  deleteIssuingRecord: (id: string) => fetch(`/api/issuing-records/${id}`, { method: 'DELETE' }).then(res => res.json()),
  deleteProductionRecord: (id: string) => fetch(`/api/production-records/${id}`, { method: 'DELETE' }).then(res => res.json()),
};


