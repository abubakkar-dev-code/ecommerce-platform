import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import productService, { type CatalogOption } from "../../services/productService";
import CatalogImage from "../products/CatalogImage";
import { FiArrowUpRight } from "react-icons/fi";

export default function Category() {
  const [categories, setCategories] = useState<CatalogOption[]>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let mounted = true;
    productService.getCategories().then(
      (items) => { if (mounted) setCategories(items.filter((item) => !item.parentCategory)); },
      () => { if (mounted) setFailed(true); },
    );
    return () => { mounted = false; };
  }, []);

  return (
    <section aria-labelledby="browse-categories">
      <h2 id="browse-categories" className="mb-5 text-2xl font-bold">Shop by category</h2>
      {failed ? <p role="alert">Categories could not be loaded.</p>
        : !categories ? <p role="status">Loading categories...</p>
        : !categories.length ? <p>No categories are available yet.</p>
        : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <Link key={category._id} to={`/products?category=${category._id}`}
                className="group overflow-hidden rounded-2xl border border-border bg-white transition hover:border-primary hover:shadow-sm">
                <CatalogImage src={category.image} alt="" className="aspect-[4/3] w-full bg-surface object-cover" />
                <span className="flex items-center justify-between gap-2 p-4 text-sm font-semibold group-hover:text-primary"><span className="min-w-0 break-words">{category.name}</span><FiArrowUpRight className="shrink-0" aria-hidden="true" /></span>
              </Link>
            ))}
          </div>}
    </section>
  );
}
