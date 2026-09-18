import api from "./api";

const getproducts = async () => {
  const response = await api.get("/products");
  return response.data;
};

const getProductsById = async (productId: string) => {
  const response = await api.get(`/products/${productId}`);
  return response.data;
};

export default { getproducts, getProductsById };
