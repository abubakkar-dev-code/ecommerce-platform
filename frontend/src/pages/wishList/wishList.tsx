import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import accountService from "../../services/accountService";
import apiError from "../../services/apiError";

type WishlistData = Awaited<ReturnType<typeof accountService.getWishlist>>;

export default function Wishlist() {
  const [items, setItems] = useState<WishlistData>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    const request = new AbortController();
    accountService.getWishlist(request.signal).then(
      (data) => { if (!request.signal.aborted) setItems(data); },
      (failure: unknown) => { if (!request.signal.aborted) setError(apiError(failure, "Could not load your wishlist.")); },
    );
    return () => request.abort();
  }, []);

  const remove = async (id: string) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await accountService.removeProduct(id);
      setItems((current) => current?.filter((item) => item._id !== id));
    } catch (failure) {
      setError(apiError(failure, "Could not remove this product."));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return <section className="store-page space-y-5">
    <h1 className="store-title">Your wishlist</h1>
    {error && <p role="alert" className="text-error">{error}</p>}
    {!items && !error && <p role="status">Loading wishlist...</p>}
    {items?.length === 0 && <p className="store-empty">Your wishlist is empty. <Link to="/products" className="text-primary hover:underline">Browse products</Link></p>}
    <ul className="grid gap-3">
      {items?.map((item) => <li key={item._id} className="store-panel flex flex-wrap items-center justify-between gap-3">
        {item.isActive ? <Link to={`/products/${item._id}`} className="font-semibold hover:text-primary">{item.name}</Link>
          : <p>{item.name} <span className="text-sm text-muted">Unavailable</span></p>}
        <button type="button" disabled={busy} aria-label={`Remove ${item.name}`} onClick={() => void remove(item._id)}
          className="rounded-lg border border-border px-3 py-2 text-sm text-error disabled:opacity-50">Remove</button>
      </li>)}
    </ul>
  </section>;
}
