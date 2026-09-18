import api from "./api";

const createOrUpdateAddress = async (data: {
  fullName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault?: boolean;
}) => {
  const response = await api.post("/address", data);
  return response.data;
};

const getAddress = async () => {
  const response = await api.get("/address");
  return response.data;
};

export default {
  createOrUpdateAddress,
  getAddress,
};
