import { Link } from "react-router-dom";

const Orders = () => {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">My Orders</h1>

        <p className="mt-2 text-muted">View and track your orders.</p>
      </div>

      {/* Orders */}
      <section className="space-y-5">
        {/* Order Card */}
        <div className="rounded-xl border border-border bg-surface p-6">
          {/* Order Header */}
          <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted">Order ID</p>

              <p className="mt-1 font-semibold text-text">#ORD-2026-00125</p>
            </div>

            <div className="rounded-full bg-background px-3 py-1 text-sm font-medium text-success">
              Delivered
            </div>
          </div>

          {/* Order Details */}
          <div className="mt-5 flex flex-col gap-5 sm:flex-row">
            {/* Product Image */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-background p-3">
              <img
                src="https://placehold.co/150x150?text=iPhone+15"
                alt="iPhone 15"
                className="h-full w-full object-contain"
              />
            </div>

            {/* Product Information */}
            <div className="flex-1">
              <h3 className="font-semibold text-text">iPhone 15</h3>

              <p className="mt-1 text-sm text-muted">Storage: 128GB</p>

              <p className="mt-1 text-sm text-muted">Quantity: 1</p>

              <p className="mt-3 font-semibold text-text">₹79,900</p>
            </div>
          </div>

          {/* Order Footer */}
          <div className="mt-5 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted">Order Total</p>

              <p className="mt-1 text-lg font-bold text-text">₹79,900</p>
            </div>

            <Link
              to="/orders/ORD-2026-00125"
              className="rounded-md border border-primary px-5 py-2.5 text-center text-sm font-medium text-primary transition hover:bg-primary hover:text-white"
            >
              View Order
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Orders;
