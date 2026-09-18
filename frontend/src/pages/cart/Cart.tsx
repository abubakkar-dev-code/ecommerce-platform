import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import cartService from "../../services/cart.service";

const Cart = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  useEffect(() => {
    const getCart = async () => {
      try {
        setLoading(true);
        const cartItems = await cartService.getCart();
        console.log(cartItems);
        setItems(cartItems.data.cartItems);
        setTotalAmount(cartItems.data.totalAmount);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    getCart();
  }, []);
  console.log(items);
  const handleRemove = async (varientId: string) => {
    try {
      setLoading(true);

      const response = await cartService.removeCart(varientId);

      console.log(response);
      const updatedCart = await cartService.getCart();

      setItems(updatedCart.data.cartItems);
      setTotalAmount(updatedCart.data.totalAmount);
    } catch (error: any) {
      setError(error?.response?.data?.message || "Failed to remove item");
    } finally {
      setLoading(false);
    }
  };
  const handleClearCart = async () => {
    try {
      setLoading(true);

      const response = await cartService.clearCart();

      console.log(response);

      setItems([]);
      setTotalAmount(0);
    } catch (error: any) {
      setError(error?.response?.data?.message || "Failed to clear cart");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">Shopping Cart</h1>

        <p className="mt-2 text-muted">
          Review the items in your cart before checkout.
        </p>
      </div>

      {/* Cart Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <section className="lg:col-span-2">
          {items.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-surface p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background text-3xl">
                🛒
              </div>

              <h2 className="mt-5 text-xl font-semibold text-text">
                Your cart is empty
              </h2>

              <p className="mt-2 max-w-md text-sm text-muted">
                Looks like you haven't added anything to your cart yet. Start
                shopping and add your favorite products.
              </p>

              <Link
                to="/products"
                className="mt-6 rounded-md bg-primary px-6 py-3 font-medium text-white transition hover:bg-primary-hover"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleClearCart}
                className="mb-4 rounded-md border border-error px-4 py-2 text-sm font-medium text-error hover:bg-error hover:text-white"
              >
                Clear Cart
              </button>
              {items.map((item) => (
                <div
                  key={item.varient._id}
                  className="rounded-xl border border-border bg-surface p-6"
                >
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <img
                      src={item.product.images?.[0]?.image}
                      alt={item.product.name}
                      className="h-32 w-32 rounded-lg object-cover"
                    />

                    {/* Product Details */}
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-text">
                        {item.product.name}
                      </h2>

                      <p className="mt-2 text-sm text-muted">
                        {item.varient.attributes?.ram}/
                        {item.varient.attributes?.storage}
                      </p>

                      <p className="mt-3 font-semibold text-text">
                        ₹{item.price}
                      </p>

                      <p className="mt-1 text-sm text-muted">
                        Quantity: {item.quantity}
                      </p>

                      <p className="mt-2 font-semibold text-text">
                        Item Total: ₹{item.itemTotal}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.varient._id)}
                    className="mt-4 rounded-md border border-error px-4 py-2 text-sm font-medium text-error hover:bg-error hover:text-white"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Order Summary */}
        <aside className="h-fit rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text">Order Summary</h2>
          <div className="mt-6 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Subtotal</span>
              <span className="font-medium text-text">₹{totalAmount}</span>
            </div>

            {/* Shipping */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Shipping</span>
              <span className="font-medium text-success">Free</span>
            </div>

            {/* Divider */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text">Total</span>
                <span className="text-xl font-bold text-text">
                  ₹{totalAmount}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              type="button"
              className="mt-4 w-full rounded-md bg-primary px-6 py-3 font-medium text-white transition hover:bg-primary-hover"
            >
              <Link to="/checkout">Proceed to Checkout</Link>
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Cart;
