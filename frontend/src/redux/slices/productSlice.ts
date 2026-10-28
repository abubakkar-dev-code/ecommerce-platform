import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  products: [],
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setproducts: (state, action) => {
      state.products =action.payload
    },
  },
});

export const { setproducts } = productSlice.actions;
export default productSlice.reducer;
