import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { errorMessage, request, validId } from "../adminApi";
import useCatalogMutation from "../useCatalogMutation";

type Variant = { _id: string; sku: string; attributes: Record<string, string>; price: number; comparedAt?: number; isActive: boolean };
const field = "admin-input";

function VariantManager({ product }: { product: string }) {
  const [items, setItems] = useState<Variant[]>();
  const [editing, setEditing] = useState<Variant>();
  const { busy, notice, error, setError, revision, mutate } = useCatalogMutation();

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      const path = "/varients/" + product;
      const results: Variant[] = [];
      let page = 1;
      let pages: number;
      do {
        const { data, pagination } = await request<Variant[]>(`${path}?limit=100&page=${page}`, "GET", undefined, controller.signal);
        results.push(...data);
        pages = Math.min(pagination?.totalPages ?? 1, 10000);
        page++;
      } while (page <= pages);
      return results;
    };
    load().then(
      (data) => { if (!controller.signal.aborted) setItems(data); },
      (failure: unknown) => { if (!controller.signal.aborted) setError(errorMessage(failure)); },
    );
    return () => controller.abort();
  }, [product, revision, setError]);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const entries = String(data.get("attributes")).split("\n").filter((line) => line.trim()).map((line) => {
      const equals = line.indexOf("=");
      return equals < 0 ? ["", ""] : [line.slice(0, equals).trim(), line.slice(equals + 1).trim()];
    });
    if (!entries.length || entries.some(([key, value]) => !key || !value) ||
        new Set(entries.map(([key]) => key)).size !== entries.length) {
      setError("Enter unique attributes as name=value, one per line.");
      return;
    }
    const compared = String(data.get("comparedAt"));
    const body = { attributes: Object.fromEntries(entries), price: Number(data.get("price")),
      isActive: data.has("isActive"), ...(compared ? { comparedAt: Number(compared) } : {}) };
    void mutate(async () => {
      if (editing) await request("/varients/" + editing._id, "PATCH", body);
      else await request("/varients/create-varient", "POST", { ...body, product, sku: data.get("sku") });
      setEditing(undefined);
    }, "Variant saved.");
  };

  return <section className="admin-page">
    <Link to="/products" className="text-sm font-semibold text-primary">Back to products</Link>
    <h1 className="admin-heading">Product variants</h1>
    {error && <p role="alert" className="text-error">{error}</p>}
    {notice && <p role="status" className="text-success">{notice}</p>}
    <form key={editing?._id ?? revision} onSubmit={save} className="grid gap-4 admin-panel sm:grid-cols-2">
      <h2 className="font-bold sm:col-span-2">{editing ? `Edit ${editing.sku}` : "Create variant"}</h2>
      {!editing && <label className="grid gap-1 text-sm font-semibold">SKU<input className={field} name="sku" required maxLength={80} /></label>}
      <label className="grid gap-1 text-sm font-semibold">Price<input className={field} name="price" type="number" required min="0" step="0.01" defaultValue={editing?.price} /></label>
      <label className="grid gap-1 text-sm font-semibold">Compared-at price<input className={field} name="comparedAt" type="number" min="0" step="0.01" defaultValue={editing?.comparedAt} /></label>
      <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Attributes (name=value per line)
        <textarea className={field} name="attributes" required rows={3} defaultValue={Object.entries(editing?.attributes ?? {}).map(([key, value]) => `${key}=${value}`).join("\n")} />
      </label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={editing?.isActive ?? true} />Active</label>
      <div className="flex gap-3 sm:col-span-2">
        <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50">Save variant</button>
        {editing && <button type="button" onClick={() => setEditing(undefined)} disabled={busy}>Cancel</button>}
      </div>
    </form>
    {!items && !error && <p role="status">Loading variants...</p>}
    {items?.length === 0 && <p>No active variants.</p>}
    <ul className="grid gap-3">
      {items?.map((item) => <li key={item._id} className="flex flex-wrap justify-between gap-3 rounded-lg border border-border bg-white p-4">
        <div><p className="font-semibold">{item.sku}</p><p className="break-all text-xs text-muted">{item._id}</p></div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link to={`/inventory?variant=${item._id}`} className="text-primary">Inventory</Link>
          <button type="button" disabled={busy} onClick={() => setEditing(item)} className="text-primary">Edit</button>
          <button type="button" disabled={busy} onClick={() => {
            if (window.confirm(`Deactivate ${item.sku}?`)) void mutate(() => request("/varients/" + item._id, "DELETE"), "Variant deactivated.");
          }} className="text-error">Deactivate</button>
        </div>
      </li>)}
    </ul>
  </section>;
}

export default function Variants() {
  const { productId } = useParams();
  return productId && validId.test(productId) ? <VariantManager key={productId} product={productId} /> : <p role="alert">Invalid product ID.</p>;
}
