import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { errorMessage, request, validId } from "../adminApi";
import useCatalogMutation from "../useCatalogMutation";

type InventoryRecord = { _id: string; varient: string; quantity: number; reservedQuantity: number; lowStockThreshold: number };
type InventoryListRecord = Omit<InventoryRecord, "varient"> & { varient?: { _id: string; sku: string } };
const field = "admin-input";

export default function Inventory() {
  const [params, setParams] = useSearchParams();
  const id = params.get("id") ?? "";
  const variant = params.get("variant") ?? "";
  const [list, setList] = useState<{ key: string; entries: InventoryListRecord[]; totalPages: number }>();
  const [listError, setListError] = useState("");
  const page = Math.min(10000, Math.max(1, Math.floor(Number(params.get("page")) || 1)));
  const lowOnly = params.get("lowStock") === "true";
  const query = new URLSearchParams({ page: String(page), limit: "12", ...(validId.test(variant) ? { varient: variant } : {}), ...(lowOnly ? { lowStock: "true" } : {}) }).toString();
  const currentList = list?.key === query ? list : undefined;
  const [loaded, setLoaded] = useState<InventoryRecord>();
  const [readError, setReadError] = useState<{ id: string; text: string }>();
  const { busy, notice, error, revision, mutate } = useCatalogMutation();
  const record = loaded?._id === id ? loaded : undefined;

  useEffect(() => {
    if (!validId.test(id)) return;
    const controller = new AbortController();
    request<InventoryRecord>("/inventories/" + id, "GET", undefined, controller.signal).then(
      ({ data }) => { if (!controller.signal.aborted) { setLoaded(data); setReadError(undefined); } },
      (failure: unknown) => { if (!controller.signal.aborted) setReadError({ id, text: errorMessage(failure) }); },
    );
    return () => controller.abort();
  }, [id, revision]);

  useEffect(() => {
    const controller = new AbortController();
    request<InventoryListRecord[]>("/admin/inventory?" + query, "GET", undefined, controller.signal).then(
      ({ data, pagination }) => {
        if (!controller.signal.aborted) {
          setList({ key: query, entries: data, totalPages: pagination?.totalPages ?? 0 });
          setListError("");
        }
      },
      (failure: unknown) => { if (!controller.signal.aborted) setListError(errorMessage(failure)); },
    );
    return () => controller.abort();
  }, [query, revision]);

  const navigateList = (values: Record<string, string>) => setParams({ ...Object.fromEntries(params), ...values });
  return <section className="admin-page">
    <h1 className="admin-heading">Inventory</h1>
    <section className="space-y-3 admin-panel">
      <div className="flex flex-wrap justify-between gap-3"><h2 className="font-bold">Stock records</h2>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={lowOnly} onChange={(event) => navigateList({ page: "1", lowStock: String(event.target.checked) })} /> Low stock only</label>
      </div>
      {listError && <p role="alert" className="text-error">{listError}</p>}
      {!currentList && !listError && <p role="status">Loading stock records...</p>}
      {currentList?.entries.length === 0 && <p>No matching inventory records.</p>}
      <ul className="divide-y divide-border">{currentList?.entries.map((item) => <li key={item._id} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
        <span>{item.varient?.sku ?? "Unavailable variant"}</span>
        <span>{item.quantity - (item.reservedQuantity ?? 0)} available</span>
        <Link className="font-semibold text-primary" to={{ search: new URLSearchParams({ ...Object.fromEntries(params), id: item._id }).toString() }}>Manage</Link>
      </li>)}</ul>
      {(currentList?.totalPages ?? 0) > 1 && <nav aria-label="Inventory pagination" className="flex gap-4 text-sm">
        <button type="button" disabled={page <= 1} onClick={() => navigateList({ page: String(page - 1) })}>Previous</button>
        <span>Page {page} of {currentList?.totalPages}</span>
        <button type="button" disabled={page >= (currentList?.totalPages ?? 0)} onClick={() => navigateList({ page: String(page + 1) })}>Next</button>
      </nav>}
    </section>
    {error && <p role="alert" className="text-error">{error}</p>}
    {readError?.id === id && <p role="alert" className="text-error">{readError.text}</p>}
    {notice && <p role="status" className="text-success">{notice}</p>}
    <form key={id} className="flex flex-wrap items-end gap-3 admin-panel" onSubmit={(event) => {
      event.preventDefault();
      const next = String(new FormData(event.currentTarget).get("id"));
      if (validId.test(next)) setParams({ id: next });
    }}>
      <label className="grid w-full max-w-xs gap-1 text-sm font-semibold">Inventory record ID<input className={field} name="id" required pattern="[a-fA-F0-9]{24}" defaultValue={id} /></label>
      <button className="rounded-lg bg-primary px-4 py-2 text-white">Load inventory</button>
    </form>
    {id && !record && readError?.id !== id && <p role="status">{validId.test(id) ? "Loading inventory..." : "Invalid inventory record ID."}</p>}
    {record && <form key={record._id + ":" + revision} className="grid gap-4 admin-panel sm:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const reason = String(data.get("reason")).trim();
      void mutate(async () => {
        const response = await request<InventoryRecord>("/inventories/" + record._id, "PATCH", {
          quantity: Number(data.get("quantity")), lowStockThreshold: Number(data.get("threshold")), ...(reason ? { reason } : {}),
        });
        setLoaded(response.data);
      }, "Inventory updated.");
    }}>
      <p className="sm:col-span-2">Available {record.quantity - record.reservedQuantity} · Reserved {record.reservedQuantity}
        {record.quantity - record.reservedQuantity <= record.lowStockThreshold && <span className="ml-3 font-semibold text-error">Low stock</span>}</p>
      <label className="grid gap-1 text-sm font-semibold">On hand<input className={field} required type="number" min={record.reservedQuantity} step="1" name="quantity" defaultValue={record.quantity} /></label>
      <label className="grid gap-1 text-sm font-semibold">Low stock threshold<input className={field} required type="number" min="0" step="1" name="threshold" defaultValue={record.lowStockThreshold} /></label>
      <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Reason<input className={field} name="reason" maxLength={300} /></label>
      <div className="flex flex-wrap gap-4 sm:col-span-2">
        <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50">Save stock</button>
        {record.quantity === 0 && record.reservedQuantity === 0 && <button type="button" disabled={busy} className="text-error" onClick={() => {
          if (window.confirm("Delete this empty inventory record?")) void mutate(async () => {
            await request("/inventories/" + record._id, "DELETE");
            setLoaded(undefined);
            setParams({});
          }, "Inventory deleted.");
        }}>Delete record</button>}
      </div>
    </form>}
    <form key={variant} className="grid gap-4 admin-panel sm:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      void mutate(async () => {
        const { data } = await request<InventoryRecord>("/inventories/create-inventory", "POST",
          { varient: form.get("variant"), quantity: Number(form.get("quantity")) });
        setParams({ id: data._id });
      }, "Inventory created.");
    }}>
      <h2 className="font-bold sm:col-span-2">Create inventory</h2>
      <label className="grid gap-1 text-sm font-semibold">Variant ID<input className={field} name="variant" required pattern="[a-fA-F0-9]{24}" defaultValue={variant} /></label>
      <label className="grid gap-1 text-sm font-semibold">On hand<input className={field} name="quantity" type="number" required min="0" step="1" /></label>
      <div><button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50">Create inventory</button></div>
    </form>
  </section>;
}
