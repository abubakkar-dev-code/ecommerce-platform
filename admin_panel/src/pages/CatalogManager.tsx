import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { errorMessage, listCatalog, request, validId, type CatalogRecord } from "../adminApi";

type Kind = "categories" | "brands" | "products";
const config = {
  categories: { title: "Categories", create: "/create-category" },
  brands: { title: "Brands", create: "/create-brand" },
  products: { title: "Products", create: "/create-product" },
};
const field = "w-full min-w-0 rounded-lg border border-border bg-white px-3 py-2 focus-visible:outline-primary";

export default function CatalogManager({ kind }: { kind: Kind }) {
  const path = "/" + kind;
  const { title, create } = config[kind];
  const [records, setRecords] = useState<CatalogRecord[]>();
  const [categories, setCategories] = useState<CatalogRecord[]>([]);
  const [brands, setBrands] = useState<CatalogRecord[]>([]);
  const [editing, setEditing] = useState<CatalogRecord | "new">();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const pending = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const recordsRequest = listCatalog(path, controller.signal);
    Promise.all([
      recordsRequest,
      kind === "categories" ? recordsRequest : kind === "products" ? listCatalog("/categories", controller.signal) : Promise.resolve([]),
      kind === "products" ? listCatalog("/brands", controller.signal) : Promise.resolve([]),
    ]).then(
      ([records, categoryOptions, brandOptions]) => {
        if (controller.signal.aborted) return;
        setRecords(records);
        setCategories(categoryOptions);
        setBrands(brandOptions);
      },
      (failure: unknown) => { if (!controller.signal.aborted) setError(errorMessage(failure)); },
    );
    return () => controller.abort();
  }, [path, kind, refresh]);

  const mutate = async (operation: () => Promise<unknown>, message: string) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
      setEditing(undefined);
      setNotice(message);
      setRefresh((value) => value + 1);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const current = typeof editing === "object" ? editing : undefined;
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const body: Record<string, unknown> = Object.fromEntries(fields);
    body.isActive = fields.has("isActive");
    if (kind === "categories") body.parentCategory = fields.get("parentCategory") || null;
    void mutate(() => current ? request(path + "/" + current._id, "PATCH", body) : request(path + create, "POST", body), "Saved.");
  };

  return <section className="admin-page">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="admin-heading">{title}</h1>
      <button type="button" disabled={busy} onClick={() => setEditing("new")} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Create</button>
    </div>
    {error && <p role="alert" className="text-error">{error}</p>}
    {notice && <p role="status" className="text-success">{notice}</p>}
    {editing && <form key={current?._id ?? "new"} onSubmit={save} className="grid gap-4 admin-panel sm:grid-cols-2">
      <h2 className="font-bold sm:col-span-2">{current ? `Edit ${current.name}` : "Create record"}</h2>
      <label className="grid gap-1 text-sm font-semibold">Name<input name="name" defaultValue={current?.name} className={field} required maxLength={160} /></label>
      <label className="grid gap-1 text-sm font-semibold">Slug<input name="slug" defaultValue={current?.slug} className={field} required maxLength={160} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label>
      <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Description<textarea name="description" defaultValue={current?.description} className={field} maxLength={10000} /></label>
      {kind === "brands" && <label className="grid gap-1 text-sm font-semibold">Logo URL<input type="url" name="logo" defaultValue={current?.logo} className={field} /></label>}
      {kind === "categories" && <>
        <label className="grid gap-1 text-sm font-semibold">Image URL<input type="url" name="image" defaultValue={current?.image} className={field} /></label>
        <label className="grid gap-1 text-sm font-semibold">Parent category
          <select name="parentCategory" className={field} defaultValue={current?.parentCategory ?? ""}>
            <option value="">None</option>
            {categories.filter((option) => option._id !== current?._id).map((option) => <option key={option._id} value={option._id}>{option.name}</option>)}
          </select>
        </label>
      </>}
      {kind === "products" && <>
        <label className="grid gap-1 text-sm font-semibold">Category<select name="category" className={field} defaultValue={current?.category ?? ""} required>
          <option value="">Select category</option>
          {categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
        </select></label>
        <label className="grid gap-1 text-sm font-semibold">Brand<select name="brand" className={field} defaultValue={current?.brand ?? ""} required>
          <option value="">Select brand</option>
          {brands.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
        </select></label>
      </>}
      <label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={current?.isActive ?? true} />Active</label>
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save</button>
        <button type="button" disabled={busy} onClick={() => setEditing(undefined)} className="text-sm">Cancel</button>
      </div>
    </form>}
    <form className="flex flex-wrap items-end gap-3 admin-panel" onSubmit={(event) => {
      event.preventDefault();
      const id = String(new FormData(event.currentTarget).get("id") ?? "").trim();
      if (validId.test(id)) void mutate(() => request(path + "/" + id, "PATCH", { isActive: true }), "Record activated.");
    }}>
      <label className="grid w-full max-w-xs gap-1 text-sm font-semibold">Inactive record ID
        <input name="id" required pattern="[a-fA-F0-9]{24}" className={field} />
      </label>
      <button disabled={busy} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">Activate by ID</button>
    </form>
    {!records && !error && <p role="status">Loading records...</p>}
    {records?.length === 0 && <p>No active records.</p>}
    <ul className="grid gap-3">
      {records?.map((item) => <li key={item._id} className="flex flex-wrap items-center justify-between gap-4 admin-panel">
        <div className="min-w-0">
          <p className="break-words font-semibold">{item.name}</p>
          <p className="break-all text-xs text-muted">{item._id}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold">
          {kind === "products" && <>
            <Link className="text-primary" to={`/products/${item._id}/variants`}>Variants</Link>
            <Link className="text-primary" to={`/products/${item._id}/images`}>Images</Link>
          </>}
          <button type="button" disabled={busy} onClick={() => setEditing(item)} className="text-primary">Edit</button>
          <button type="button" disabled={busy} className="text-error" onClick={() => {
            if (window.confirm(`Deactivate ${item.name}?`)) void mutate(() => request(path + "/" + item._id, "DELETE"), "Record deactivated.");
          }}>Deactivate</button>
        </div>
      </li>)}
    </ul>
  </section>;
}
