import api from "./api";

const paymentService = {
  createPayment: async (orderId: string) => {
    const response = await api.post("/payment", {
      orderId,
    });

    return response.data;
  },

  verifyPayment: async (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const response = await api.post("/payment/verify", paymentData);

    return response.data;
  },
};

export default paymentService;