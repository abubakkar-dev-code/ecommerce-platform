import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { errorMessage, request, RequestError, validId } from "../adminApi";
import useCatalogMutation from "../useCatalogMutation";

type ImageRecord = { _id: string; primaryImage?: string; thumbnails: { url: string; publicId: string }[] };
const accept = "image/jpeg,image/png,image/webp";

function Preview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") setUrl(reader.result); };
    reader.readAsDataURL(file);
    return () => { if (reader.readyState === FileReader.LOADING) reader.abort(); };
  }, [file]);
  return url ? <img src={url} alt={file.name} className="size-16 rounded-lg bg-background object-contain" /> : null;
}

function Upload({ title, primary, thumbnails, multi, busy, onUpload }: {
  title: string;
  primary?: boolean;
  thumbnails?: boolean;
  multi?: boolean;
  busy: boolean;
  onUpload: (body: FormData) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = new FormData();
    for (const [key, value] of form) {
      if (value instanceof File && value.name) data.append(key, value);
    }
    const selected = [...data.values()] as File[];
    if (data.getAll("thumbnails").length > 5 || selected.some((file) => file.size > 5 * 1024 * 1024 || !accept.split(",").includes(file.type))) {
      setError("Choose up to five JPEG, PNG, or WebP thumbnails. Each image must be 5 MB or smaller.");
      return;
    }
    if (!selected.length) return;
    setError("");
    onUpload(data);
  };

  return <form onSubmit={submit} className="grid gap-3 admin-panel">
    <h2 className="font-semibold">{title}</h2>
    <fieldset disabled={busy} className="grid min-w-0 gap-3 disabled:opacity-50" onChange={(event) => {
      setFiles([...event.currentTarget.querySelectorAll("input")].flatMap((input) => Array.from(input.files ?? [])));
    }}>
      {primary && <label className="grid min-w-0 gap-1 text-sm">Primary image<input className="max-w-full" required type="file" accept={accept} name="primaryImage" /></label>}
      {thumbnails && <label className="grid min-w-0 gap-1 text-sm">Thumbnails<input className="max-w-full" required={!primary} type="file" multiple={multi} accept={accept} name="thumbnails" /></label>}
      {!!files.length && <div className="flex flex-wrap gap-2">{files.map((file, index) => <Preview key={file.name + index} file={file} />)}</div>}
      <div><button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Upload</button></div>
    </fieldset>
    {error && <p role="alert" className="text-sm text-error">{error}</p>}
  </form>;
}

function ImageManager({ product }: { product: string }) {
  const [record, setRecord] = useState<ImageRecord | null>();
  const { busy, notice, error, setError, revision, mutate } = useCatalogMutation();

  useEffect(() => {
    const controller = new AbortController();
    request<ImageRecord>("/product-images/" + product, "GET", undefined, controller.signal).then(
      ({ data }) => { if (!controller.signal.aborted) setRecord(data); },
      (failure: unknown) => {
        if (controller.signal.aborted) return;
        if (failure instanceof RequestError && failure.status === 404) setRecord(null);
        else setError(errorMessage(failure));
      },
    );
    return () => controller.abort();
  }, [product, revision, setError]);

  const path = "/product-images/" + record?._id;
  const changeThumbnails = (mode: "all" | "single", publicId?: string) => (body: FormData) => {
    body.append("mode", mode);
    if (publicId) body.append("publicId", publicId);
    void mutate(() => request(path + "/thumbnails", "PATCH", body), "Thumbnails updated.");
  };
  const removeThumbnails = (mode: "all" | "single", publicId?: string) => {
    if (window.confirm(mode === "all" ? "Delete all thumbnails?" : "Delete this thumbnail?")) {
      void mutate(() => request(path + "/thumbnail", "DELETE", { mode, ...(publicId ? { publicId } : {}) }), "Thumbnails removed.");
    }
  };

  return <section className="admin-page">
    <Link to="/products" className="text-sm font-semibold text-primary">Back to products</Link>
    <h1 className="admin-heading">Product images</h1>
    {busy && <p role="status">Saving images...</p>}
    {error && <p role="alert" className="text-error">{error}</p>}
    {notice && <p role="status" className="text-success">{notice}</p>}
    {record === undefined && !error && <p role="status">Loading images...</p>}
    {record === null && <Upload key={revision} title="Upload product images" primary thumbnails multi busy={busy}
      onUpload={(body) => void mutate(() => request("/product-images/" + product, "POST", body), "Images uploaded.")} />}
    {record && <div key={revision} className="space-y-4">
      {record.primaryImage && <div className="space-y-2 admin-panel">
        <img src={record.primaryImage} alt="Primary product image" className="max-h-52 max-w-full object-contain" />
        <button type="button" disabled={busy} className="text-sm font-semibold text-error" onClick={() => {
          if (window.confirm("Delete the primary image?")) void mutate(() => request(path, "DELETE"), "Primary image removed.");
        }}>Delete primary image</button>
      </div>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Upload title={record.primaryImage ? "Replace primary image" : "Set primary image"} primary busy={busy}
          onUpload={(body) => void mutate(() => request(path, "PATCH", body), "Primary image saved.")} />
        <Upload title="Replace all thumbnails" thumbnails multi busy={busy} onUpload={changeThumbnails("all")} />
      </div>
      {!!record.thumbnails.length && <button type="button" disabled={busy} className="text-sm font-semibold text-error" onClick={() => removeThumbnails("all")}>Delete all thumbnails</button>}
      <div className="grid gap-4 lg:grid-cols-2">
        {record.thumbnails.map((thumbnail, index) => <div key={thumbnail.publicId} className="space-y-2 admin-panel">
          <img src={thumbnail.url} alt={`Product thumbnail ${index + 1}`} loading="lazy" className="size-24 object-contain" />
          <Upload title={`Replace thumbnail ${index + 1}`} thumbnails busy={busy} onUpload={changeThumbnails("single", thumbnail.publicId)} />
          <button type="button" disabled={busy} className="text-sm font-semibold text-error" onClick={() => removeThumbnails("single", thumbnail.publicId)}>Delete thumbnail</button>
        </div>)}
      </div>
    </div>}
  </section>;
}

export default function ProductImages() {
  const { productId } = useParams();
  return productId && validId.test(productId) ? <ImageManager key={productId} product={productId} /> : <p role="alert">Invalid product ID.</p>;
}
