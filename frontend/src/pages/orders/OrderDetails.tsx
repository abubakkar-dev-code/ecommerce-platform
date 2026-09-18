const OrderDetails = () => {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">Order Details</h1>

        <p className="mt-2 text-muted">Order #ORD-2026-00125</p>
      </div>

      {/* Order Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <section className="space-y-8 lg:col-span-2">
          {/* Order Status */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text">
                  Order Status
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Your order has been delivered.
                </p>
              </div>

              <span className="w-fit rounded-full bg-background px-4 py-1.5 text-sm font-medium text-success">
                Delivered
              </span>
            </div>

            {/* Tracking Steps */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                {/* Confirmed */}
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success text-sm font-semibold text-white">
                    ✓
                  </div>

                  <p className="mt-2 text-xs font-medium text-text">
                    Confirmed
                  </p>
                </div>

                {/* Processing */}
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success text-sm font-semibold text-white">
                    ✓
                  </div>

                  <p className="mt-2 text-xs font-medium text-text">
                    Processing
                  </p>
                </div>

                {/* Shipped */}
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success text-sm font-semibold text-white">
                    ✓
                  </div>

                  <p className="mt-2 text-xs font-medium text-text">Shipped</p>
                </div>

                {/* Delivered */}
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success text-sm font-semibold text-white">
                    ✓
                  </div>

                  <p className="mt-2 text-xs font-medium text-text">
                    Delivered
                  </p>
                </div>
              </div>

              {/* Progress Line */}
              <div className="mt-[-48px] mb-8 hidden h-1 bg-success sm:block" />
            </div>
          </div>
          {/* Ordered Products */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text">
              Ordered Products
            </h2>

            <div className="mt-6">
              {/* Product */}
              <div className="flex flex-col gap-5 border-t border-border pt-6 sm:flex-row">
                {/* Product Image */}
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg bg-background p-3">
                  <img
                    src="https://placehold.co/200x200?text=iPhone+15"
                    alt="iPhone 15"
                    className="h-full w-full object-contain"
                  />
                </div>

                {/* Product Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-text">iPhone 15</h3>

                    <p className="mt-1 text-sm text-muted">Storage: 128GB</p>

                    <p className="mt-1 text-sm text-muted">Quantity: 1</p>
                  </div>

                  <div className="mt-4 sm:mt-0">
                    <p className="text-lg font-semibold text-text">₹79,900</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Shipping Address */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text">
              Shipping Address
            </h2>

            <div className="mt-5 rounded-lg bg-background p-5">
              <h3 className="font-medium text-text">John Doe</h3>

              <p className="mt-2 text-sm leading-6 text-muted">
                123 Main Street
                <br />
                Apartment 4B
                <br />
                Chennai, Tamil Nadu - 600001
                <br />
                India
              </p>

              <p className="mt-3 text-sm text-muted">Phone: +91 98765 43210</p>
            </div>
          </div>
        </section>

        {/* Order Summary */}
          <aside className="h-fit rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text">Order Summary</h2>

            {/* Price Details */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Subtotal</span>

                <span className="font-medium text-text">₹79,900</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Shipping</span>

                <span className="font-medium text-success">Free</span>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text">Total</span>

                  <span className="text-xl font-bold text-text">₹79,900</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-sm font-semibold text-text">
                Payment Information
              </h3>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Payment Method</span>

                  <span className="text-sm font-medium text-text">
                    Online Payment
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Payment Status</span>

                  <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-success">
                    Paid
                  </span>
                </div>
              </div>
            </div>

            {/* Order Date */}
            <div className="mt-6 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Order Date</span>

                <span className="text-sm font-medium text-text">
                  Sep 17, 2026
                </span>
              </div>
            </div>
          </aside>
      </div>
    </main>
  );
};

export default OrderDetails;
