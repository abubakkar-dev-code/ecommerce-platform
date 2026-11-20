import { useState } from "react";
import placeholder from "./product-placeholder.svg";

export default function CatalogImage({ src, alt, className, eager = false }: {
  src?: string;
  alt: string;
  className: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState<string>();
  const source = src?.trim();
  const remote = source && /^https?:\/\//i.test(source) && failed !== source;
  return <img src={remote ? source : placeholder} alt={alt} className={className}
    loading={eager ? "eager" : "lazy"} decoding="async"
    onError={remote ? () => setFailed(source) : undefined} />;
}
