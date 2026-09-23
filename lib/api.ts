import type { AuthResponse, LoginData, Product, SignupData, User, Vendor } from '@/types';

const AUTH_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const PRODUCT_API_URL = (process.env.NEXT_PUBLIC_PRODUCT_API_URL ?? 'http://localhost:8081').replace(/\/$/, '');

type ApiErrorBody = {
  detail?: string | { msg?: string }[];
  message?: string;
  error?: string;
};

type LoginPayload = {
  access_token: string;
  merchant_profile: {
    id: number;
    shop_name: string;
    whatsapp_number: string;
    email: string;
    is_active: boolean;
    created_at?: string;
  };
};

type ApiProduct = {
  id: number;
  vendor_slug: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  tag?: string | null;
  category?: string | null;
  is_available: boolean;
  created_at?: string | null;
};

type ApiVendor = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  whatsapp?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  created_at?: string | null;
  products: ApiProduct[];
};

function getToken() {
  return typeof window === 'undefined' ? null : localStorage.getItem('auth_token');
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  baseUrl: string = AUTH_API_URL,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  let body: unknown = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    body = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const error = body as ApiErrorBody | null;
    const detail = Array.isArray(error?.detail)
      ? error.detail.map((item) => item.msg).filter(Boolean).join(', ')
      : error?.detail;
    throw new Error(
      typeof detail === 'string'
        ? detail
        : error?.message || error?.error || `Request failed (${response.status})`,
    );
  }

  if (!body) throw new Error('Empty response from server');
  return body as T;
}

function unwrap<T>(payload: T | { data: T }): T {
  return typeof payload === 'object' && payload !== null && 'data' in payload
    ? (payload as { data: T }).data
    : (payload as T);
}

// --- Normalizers ---

function normalizeUser(profile: LoginPayload['merchant_profile']): User {
  return {
    id: String(profile.id),
    email: profile.email,
    shopName: profile.shop_name,
    whatsappNumber: profile.whatsapp_number,
    isVerified: profile.is_active,
    createdAt: profile.created_at ?? '',
  };
}

function normalizeAuth(payload: LoginPayload): AuthResponse {
  if (!payload.access_token || !payload.merchant_profile) {
    throw new Error('The API returned an invalid authentication response.');
  }
  return { token: payload.access_token, user: normalizeUser(payload.merchant_profile) };
}

function normalizeProduct(apiProduct: ApiProduct): Product {
  return {
    id: String(apiProduct.id),
    name: apiProduct.name,
    description: apiProduct.description ?? '',
    price: apiProduct.price / 100, // kobo -> NGN
    img: apiProduct.image_url || `https://picsum.photos/seed/${apiProduct.id}/600`,
    tag: apiProduct.tag ?? '',
    category: apiProduct.category ?? 'General',
    inStock: apiProduct.is_available,
    vendorId: apiProduct.vendor_slug,
    createdAt: apiProduct.created_at ?? '',
  };
}

function normalizeVendor(apiVendor: ApiVendor): Vendor {
  return {
    id: String(apiVendor.id),
    name: apiVendor.name,
    slug: apiVendor.slug,
    description: apiVendor.description ?? '',
    whatsapp: apiVendor.whatsapp ?? '',
    logo: apiVendor.logo_url ?? '',
    isActive: apiVendor.is_active,
    createdAt: apiVendor.created_at ?? '',
    products: apiVendor.products.map(normalizeProduct),
  };
}

// --- Client ---

export const api = {
  auth: {
    login: async (credentials: LoginData) =>
      normalizeAuth(
        unwrap(
          await request<LoginPayload | { data: LoginPayload }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
          }),
        ),
      ),

    signup: async (data: SignupData) =>
      request<{ status: string; message: string }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          shop_name: data.shopName,
          whatsapp_number: data.whatsappNumber,
          email: data.email,
          password: data.password,
        }),
      }),

    me: async () =>
      normalizeUser(
        unwrap(
          await request<
            LoginPayload['merchant_profile'] | { data: LoginPayload['merchant_profile'] }
          >('/api/auth/me'),
        ),
      ),
  },

  products: {
    // -> Go product service
    getAll: async (vendorSlug?: string) => {
      const query = vendorSlug
        ? `?${new URLSearchParams({ vendor_slug: vendorSlug })}`
        : '';
      const products = unwrap(
        await request<ApiProduct[] | { data: ApiProduct[] }>(
          `/api/products${query}`,
          {},
          PRODUCT_API_URL,
        ),
      );
      return products.map(normalizeProduct);
    },
    getById: async (id: string, vendorSlug?: string) =>
      normalizeProduct(
        unwrap(
          await request<ApiProduct | { data: ApiProduct }>(
            `/api/products/${id}${vendorSlug ? `?${new URLSearchParams({ vendor_slug: vendorSlug })}` : ''}`,
            {},
            PRODUCT_API_URL,
          ),
        ),
      ),
    create: async (data: ProductCreateInput) =>
      normalizeProduct(
        unwrap(
          await request<ApiProduct | { data: ApiProduct }>(
            '/api/products',
            { method: 'POST', body: JSON.stringify(data) },
            PRODUCT_API_URL,
          ),
        ),
      ),
    update: async (id: string, data: ProductUpdateInput) =>
      request<{ success: boolean; message: string }>(
        `/api/products/${id}`,
        { method: 'PUT', body: JSON.stringify(data) },
        PRODUCT_API_URL,
      ),
    remove: async (id: string) =>
      request<{ success: boolean; message: string }>(
        `/api/products/${id}`,
        { method: 'DELETE' },
        PRODUCT_API_URL,
      ),
  },

  vendors: {
    // -> FastAPI
    getBySlug: async (slug: string) =>
      normalizeVendor(
        unwrap(await request<ApiVendor | { data: ApiVendor }>(`/vendors/${slug}`)),
      ),
  },

  newsletter: {
    subscribe: async (email: string) =>
      request<{ success: boolean }>('/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },
};
type ProductCreateInput = {
  vendor_slug: string;
  name: string;
  description?: string;
  price: number;      // kobo
  image_url?: string;
  tag?: string;
  category?: string;
};

type ProductUpdateInput = {
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  tag?: string;
  category?: string;
  is_available?: boolean;
};