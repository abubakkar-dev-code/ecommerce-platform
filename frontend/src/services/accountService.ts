import { isAxiosError } from "axios";
import api from "../api/api";

export type AddressInput = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
};

export type Address = AddressInput & { _id: string };

export type BuyNow = { productId: string; variantId: string; quantity: number };

export type PaymentMethod = "cod" | "razorpay";

export type Order = {
  _id: string;
  createdAt: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod?: PaymentMethod;
  shippingAddress: AddressInput;
  subtotal: number;
  shippingCharge: number;
  totalAmount: number;
  items: {
    _id: string;
    product: { _id: string; name: string } | null;
    varient: { sku: string; attributes: Record<string, string> } | null;
    price: number;
    quantity: number;
    productName?: string;
    image?: string;
    sku?: string;
    attributes?: Record<string, string>;
  }[];
};

type SavedProduct = { _id: string; name: string; isActive: boolean };
type Envelope<T> = { data: T };

async function read<T>(path: string, signal?: AbortSignal) {
  return (await api.get<Envelope<T>>(path, { signal })).data.data;
}

async function readList<T>(path: string, signal?: AbortSignal) {
  try {
    return await read<T[]>(path, signal);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return [];
    throw error;
  }
}

const getOrders = (signal?: AbortSignal) => readList<Order>("/orders", signal);
const getOrder = (id: string, signal?: AbortSignal) => read<Order>(`/orders/${encodeURIComponent(id)}`, signal);
const cancelOrder = (id: string) => api.patch(`/orders/${encodeURIComponent(id)}`);
const getAddresses = (signal?: AbortSignal) => readList<Address>("/address", signal);
const saveAddress = (address: AddressInput, id?: string) =>
  id ? api.patch(`/address/${encodeURIComponent(id)}`, address) : api.post("/address", address);
const deleteAddress = (id: string) => api.delete(`/address/${encodeURIComponent(id)}`);

const getWishlist = async (signal?: AbortSignal) => {
  try {
    return (await read<{ products: SavedProduct[] }>("/wishList", signal)).products;
  } catch (error) {
    if (isAxiosError<{ message?: string }>(error) && error.response?.status === 400 &&
      error.response.data?.message === "WishList is Empty") return [];
    throw error;
  }
};

const saveProduct = (id: string) => api.post(`/wishList/${encodeURIComponent(id)}`);
const removeProduct = (id: string) => api.delete(`/wishList/${encodeURIComponent(id)}`);

export default { getOrders, getOrder, cancelOrder, getAddresses, saveAddress, deleteAddress, getWishlist, saveProduct, removeProduct };
