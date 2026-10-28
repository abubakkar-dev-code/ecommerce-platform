import api from "../api/api";

const getProducts = async () => {
  const response = await api.get("/products");
  return response.data;
};

const getCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

const getBrands = async () => {
  const response = await api.get("/brands");
  return response.data;
};
export default { getProducts, getCategories, getBrands };
