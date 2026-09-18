import api from "./api";

const createCart = async (
  productId: string,
  variantId: string,
  quantity: number,
) => {
  const response = await api.post(`/cart/${productId}/${variantId}`, {
    quantity,
  });
  return response.data;
};
const getCart = async () => {
  const response = await api.get("/cart");
  return response.data;
};
const removeCart = async (varientId: string) => {
  const response = await api.delete(`/cart/${varientId}`);
  return response.data;
};
const clearCart = async () => {
  const response = await api.delete("/cart/clear");
  return response.data;
};
export default { createCart, getCart, removeCart,clearCart};
