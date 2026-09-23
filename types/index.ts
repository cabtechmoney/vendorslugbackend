// types/index.ts
export interface User {
  id: string;
  email: string;
  shopName?: string;
  whatsappNumber?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  img: string;
  tag?: string;
  category: string;
  inStock: boolean;
  vendorId: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  slug: string;
  description: string;
  whatsapp: string;
  logo?: string;
  isActive: boolean;
  productCount?: number;
  createdAt: string;
  logo_url?: string;
  products: Product[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  estimatedDays: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  deliveryFee: number;
  deliveryZone: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

// New types for auth
export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData extends LoginData {
  shopName: string;
  whatsappNumber: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
