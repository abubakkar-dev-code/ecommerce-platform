import React, { useState } from "react";
import { Link } from "react-router-dom";

type OrderSummaryProps = {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  appliedPromo: string | null;
  onApplyPromo: (code: string) => { success: boolean; message: string };
  onRemovePromo: () => void;
};

const OrderSummary = ({
  subtotal,
  shipping,
  tax,
  discount,
  total,
  appliedPromo,
  onApplyPromo,
  onRemovePromo,
}: OrderSummaryProps) => {
  const [promoInput, setPromoInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    const res = onApplyPromo(promoInput.trim());
    if (res.success) {
      setPromoMessage({ text: res.message, isError: false });
      setPromoInput("");
    } else {
      setPromoMessage({ text: res.message, isError: true });
    }
  };

  const freeShippingThreshold = 200;
  const progressToFreeShipping = Math.min(
    100,
    (subtotal / freeShippingThreshold) * 100
  );
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24">
      <h2 className="text-xl font-bold text-gray-900 mb-5">Order Summary</h2>

      {/* Free Shipping Progress Indicator */}
      <div className="mb-6 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
        <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
          <span className="text-gray-700">
            {remainingForFreeShipping === 0
              ? "🎉 You unlocked FREE standard shipping!"
              : `Add $${remainingForFreeShipping.toFixed(2)} more for FREE shipping`}
          </span>
          <span className="text-primary font-bold">
            {progressToFreeShipping.toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressToFreeShipping}%` }}
          />
        </div>
      </div>

      {/* Price breakdown */}
      <div className="space-y-3.5 text-sm text-gray-600 pb-5 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <span>Subtotal</span>
          <span className="font-semibold text-gray-900">
            ${subtotal.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span>Estimated Shipping</span>
          <span>
            {shipping === 0 ? (
              <span className="text-emerald-600 font-bold uppercase text-xs bg-emerald-50 px-2 py-0.5 rounded-md">
                Free
              </span>
            ) : (
              <span className="font-semibold text-gray-900">
                ${shipping.toFixed(2)}
              </span>
            )}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span>Estimated Tax</span>
          <span className="font-semibold text-gray-900">${tax.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between items-center text-emerald-600 font-medium">
            <span className="flex items-center gap-1">
              Promo Discount ({appliedPromo})
            </span>
            <span className="font-bold">-${discount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Promo Code Input */}
      <div className="my-5">
        {appliedPromo ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold text-xs">🏷️ {appliedPromo}</span>
              <span className="text-xs text-emerald-700">Applied</span>
            </div>
            <button
              type="button"
              onClick={onRemovePromo}
              className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyPromo} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Promo code (e.g. SAVE10)"
                className="w-full text-sm uppercase px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:normal-case placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={!promoInput.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Apply
              </button>
            </div>
            {promoMessage && (
              <p
                className={`text-xs ${
                  promoMessage.isError ? "text-red-500" : "text-emerald-600"
                }`}
              >
                {promoMessage.text}
              </p>
            )}
          </form>
        )}
      </div>

      {/* Total Row */}
      <div className="pt-4 border-t border-gray-100 flex justify-between items-baseline mb-6">
        <div>
          <span className="text-base font-bold text-gray-900 block">Total</span>
          <span className="text-xs text-gray-400">Including taxes & duties</span>
        </div>
        <span className="text-2xl font-extrabold text-gray-900">
          ${total.toFixed(2)}
        </span>
      </div>

      {/* Checkout Actions */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => alert("Proceeding to checkout!")}
          className="w-full py-3.5 px-6 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-base active:scale-[0.99]"
        >
          <span>🔒</span> Proceed to Checkout
        </button>

        <Link
          to="/products"
          className="block text-center text-sm font-semibold text-gray-600 hover:text-primary transition-colors py-1"
        >
          &larr; Continue Shopping
        </Link>
      </div>

      {/* Trust Badges */}
      <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="text-primary text-base">🛡️</span>
          <span>Secure 256-Bit SSL Checkout</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary text-base">🔄</span>
          <span>30-Day Easy Returns</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
