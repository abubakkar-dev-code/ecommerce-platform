import { Link } from "react-router-dom";

const Profile = () => {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">My Profile</h1>

        <p className="mt-2 text-muted">
          Manage your account and personal information.
        </p>
      </div>

      {/* Profile Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <section className="space-y-8 lg:col-span-2">
          {/* Personal Information */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text">
                  Personal Information
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Your basic account information.
                </p>
              </div>

              <button
                type="button"
                className="text-sm font-medium text-primary transition hover:text-primary-hover"
              >
                Edit
              </button>
            </div>

            {/* Information */}
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {/* Name */}
              <div>
                <p className="text-sm text-muted">Full Name</p>

                <p className="mt-1 font-medium text-text">John Doe</p>
              </div>

              {/* Email */}
              <div>
                <p className="text-sm text-muted">Email Address</p>

                <p className="mt-1 font-medium text-text">john@example.com</p>
              </div>

              {/* Phone */}
              <div>
                <p className="text-sm text-muted">Phone Number</p>

                <p className="mt-1 font-medium text-text">+91 98765 43210</p>
              </div>

              {/* Account Type */}
              <div>
                <p className="text-sm text-muted">Account Type</p>

                <p className="mt-1 font-medium capitalize text-text">
                  Customer
                </p>
              </div>
            </div>
          </div>
          {/* Saved Addresses */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text">
                  Saved Addresses
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Manage your delivery addresses.
                </p>
              </div>

              <button
                type="button"
                className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
              >
                + Add Address
              </button>
            </div>

            {/* Address Card */}
            <div className="mt-6 rounded-lg border border-border p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text">John Doe</h3>

                    <span className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-primary">
                      Default
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    123 Main Street
                    <br />
                    Apartment 4B
                    <br />
                    Chennai, Tamil Nadu - 600001
                    <br />
                    India
                  </p>

                  <p className="mt-3 text-sm text-muted">
                    Phone: +91 98765 43210
                  </p>
                </div>

                {/* Address Actions */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="text-sm font-medium text-primary transition hover:text-primary-hover"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="text-sm font-medium text-error transition hover:opacity-80"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Account Actions */}
        <aside className="h-fit rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text">Account</h2>

          <div className="mt-5 space-y-2">
            {/* Edit Profile */}
            <button
              type="button"
              className="w-full rounded-md border border-border px-4 py-3 text-left text-sm font-medium text-text transition hover:border-primary hover:text-primary"
            >
              Edit Profile
            </button>

            {/* Change Password */}
            <button
              type="button"
              className="w-full rounded-md border border-border px-4 py-3 text-left text-sm font-medium text-text transition hover:border-primary hover:text-primary"
            >
              Change Password
            </button>

            {/* My Orders */}
            <Link
              to="/orders"
              className="block w-full rounded-md border border-border px-4 py-3 text-left text-sm font-medium text-text transition hover:border-primary hover:text-primary"
            >
              My Orders
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="block w-full rounded-md border border-border px-4 py-3 text-left text-sm font-medium text-text transition hover:border-primary hover:text-primary"
            >
              Wishlist
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Profile;
