export interface ProductImage {
  _id?: string;
  image: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ProductVariantAttributes {
  ram?: string;
  storage?: string;
  color?: string;
  [key: string]: string | undefined;
}

export interface ProductVariant {
  _id: string;
  product?: string;
  sku?: string;
  attributes?: ProductVariantAttributes;
  price: number;
  comparedAt?: number;
  isActive?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}

export interface Brand {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  isActive?: boolean;
}

export interface Product {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  category?: string | Category;
  categories?: Category;
  brand?: string | Brand;
  isActive?: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  _id: string;
  product: Product;
  varient: ProductVariant;
  quantity: number;
  price: number;
  itemTotal: number;
}

export interface CartData {
  cartItems: CartItem[];
  totalAmount: number;
}

export interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
}
