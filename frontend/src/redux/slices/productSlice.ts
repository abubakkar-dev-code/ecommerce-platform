import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ProductVariant {
  _id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  comparedAt?: number | null;
  inStock?: boolean;
  inventory?: { varient: string; inStock: boolean } | null;
}

type ProductBrand = { _id: string; name: string; slug?: string; logo?: string };

export interface Product {
  _id: string;
  name: string;
  description?: string;
  category: string;
  categories?: { _id: string; name: string };
  brand: string | ProductBrand;
  brandDetails?: ProductBrand;
  images: Array<{
    primaryImage?: string;
    thumbnails: Array<{
      url: string;

    }>;
  }>;
  rating?: number;
  reviews?: number;
  variants: ProductVariant[];
}

interface ProductState {
  products: Product[];
}

const initialState: ProductState = {
  products: [],
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setproducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
  },
});

export const { setproducts } = productSlice.actions;
export default productSlice.reducer;
