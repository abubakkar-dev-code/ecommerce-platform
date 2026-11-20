import { isAxiosError } from "axios";
import api from "../api/api";
import type { ProductVariant } from "../redux/slices/productSlice";
import productService from "./productService";

type CartItem = {
  _id: string;
  product: { _id: string; name: string; isActive: boolean } | null;
  varient: (Pick<ProductVariant, "_id" | "sku" | "attributes"> & { isActive: boolean }) | null;
  quantity: number;
  price: number;
  itemTotal: number;
};

type CartResponse = {
  cartItems: CartItem[];
  totalAmount: number;
};

type Availability = "in-stock" | "out-of-stock" | "unavailable" | "unknown";

export type CartLine = CartItem & { image?: string; availability: Availability };
export type Cart = { cartItems: CartLine[]; totalAmount: number };

const readCart = async (signal?: AbortSignal): Promise<CartResponse> => {
  try {
    const response = await api.get<{ data: CartResponse }>("/cart", { signal });
    return response.data.data;
  } catch (error) {
    if (isAxiosError<{ message?: string }>(error) && error.response?.status === 400 &&
      error.response.data?.message === "Cart is Empty,keep shopping") {
      return { cartItems: [], totalAmount: 0 };
    }
    throw error;
  }
};

const getCart = async (signal?: AbortSignal): Promise<Cart> => {
  const { cartItems, totalAmount } = await readCart(signal);
  const products = new Map<string, ReturnType<typeof readProduct>>();

  const lines = await Promise.all(cartItems.map(async (item): Promise<CartLine> => {
    const { product, varient } = item;
    if (!product || product.isActive === false) return { ...item, availability: "unavailable" };

    let details = products.get(product._id);
    if (!details) {
      details = readProduct(product._id, signal);
      products.set(product._id, details);
    }

    const [catalog, stock] = await Promise.all([
      details,
      varient && varient.isActive !== false ? readStock(varient._id, item.quantity, signal) : "unavailable" as const,
    ]);
    const availability = !catalog.available && stock !== "unavailable"
      ? catalog.availability
      : stock;
    return { ...item, image: catalog.image, availability };
  }));

  return { cartItems: lines, totalAmount };
};

async function readProduct(id: string, signal?: AbortSignal): Promise<
  { available: true; image?: string } | { available: false; image?: undefined; availability: "unavailable" | "unknown" }
> {
  try {
    const product = await productService.getProductById(id, signal);
    return {
      available: true,
      image: product.images?.[0]?.primaryImage?.trim() || product.images?.[0]?.thumbnails?.[0]?.url,
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { available: false, availability: failedAvailability(error) };
  }
}

async function readStock(id: string, quantity: number, signal?: AbortSignal): Promise<Availability> {
  try {
    return await productService.getVariantAvailability(id, signal, quantity) ? "in-stock" : "out-of-stock";
  } catch (error) {
    if (signal?.aborted) throw error;
    return failedAvailability(error);
  }
}

function failedAvailability(error: unknown): "unavailable" | "unknown" {
  return isAxiosError(error) && error.response?.status === 404 ? "unavailable" : "unknown";
}

const getCount = async (signal?: AbortSignal) => (await readCart(signal)).cartItems.reduce((count, item) => count + item.quantity, 0);

const notify = () => window.dispatchEvent(new Event("cart-updated"));

const addItem = async (productId: string, variantId: string, quantity: number): Promise<void> => {
  await api.post(`/cart/${encodeURIComponent(productId)}/${encodeURIComponent(variantId)}`, { quantity });
  notify();
};

const updateQuantity = async (variantId: string, quantity: number): Promise<void> => {
  await api.patch(`/cart/${encodeURIComponent(variantId)}`, { quantity });
  notify();
};

const removeItem = async (variantId: string): Promise<void> => {
  await api.delete(`/cart/${encodeURIComponent(variantId)}`);
  notify();
};

export default { addItem, getCart, getCount, updateQuantity, removeItem };
