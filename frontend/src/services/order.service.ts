import api from "./api";

const orderService = {
  createOrder: async (addressId: string) => {
    const response = await api.post("/orders", {
      addressId,
    });

    return response.data;
  },

  getOrders: async () => {
    const response = await api.get("/orders");

    return response.data;
  },

  getOrderById: async (orderId: string) => {
    const response = await api.get(`/orders/${orderId}`);

    return response.data;
  },

  cancelOrder: async (orderId: string) => {
    const response = await api.patch(`/orders/${orderId}/cancel`);

    return response.data;
  },
};

export default orderService;
