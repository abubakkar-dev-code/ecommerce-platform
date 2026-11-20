import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Category from "../../componenets/categories/Category";
import Hero from "../../componenets/hero/Hero";
import CatalogImage from "../../componenets/products/CatalogImage";
import ProductCard from "../../componenets/products/ProductCard";
import type { Product } from "../../redux/slices/productSlice";
import productService, { type CatalogOption } from "../../services/productService";

export default function Home() {
  const [products, setProducts] = useState<Product[]>();
  const [brands, setBrands] = useState<CatalogOption[]>();
  const [categories, setCategories] = useState<CatalogOption[]>();
  const [productError, setProductError] = useState(false);
  const [brandError, setBrandError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    productService.getProducts({ limit: 4, sort: "newest" }, controller.signal).then(
      ({ data }) => { if (!controller.signal.aborted) setProducts(data); },
      () => { if (!controller.signal.aborted) setProductError(true); },
    );
    productService.getBrands().then(
      (data) => { if (!controller.signal.aborted) setBrands(data); },
      () => { if (!controller.signal.aborted) setBrandError(true); },
    );
    productService.getCategories().then(
      (data) => { if (!controller.signal.aborted) setCategories(data); }, () => undefined,
    );
    return () => controller.abort();
  }, []);

  return (
    <div className="store-page space-y-12 sm:space-y-16">
      <Hero featured={products?.find((product) => product.images?.[0]?.primaryImage || product.images?.[0]?.thumbnails?.[0]?.url)} />
      <Category />
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">New arrivals</h2>
          <Link to="/products?sort=newest" className="text-sm font-semibold text-primary hover:underline">View all products</Link>
        </div>
        {productError ? <p role="alert">Products could not be loaded.</p>
          : !products ? <div role="status" className="grid grid-cols-2 gap-4 lg:grid-cols-4"><span className="sr-only">Loading products</span>{[0, 1, 2, 3].map((item) => <div key={item} aria-hidden="true" className="h-56 rounded-2xl bg-surface motion-safe:animate-pulse" />)}</div>
          : !products.length ? <p>No products are available yet.</p>
          : <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {products.map((product) => <ProductCard key={product._id} product={product}
              brandName={brands?.find((brand) => brand._id === product.brand)?.name}
              categoryName={categories?.find((category) => category._id === product.category)?.name} />)}
          </div>}
      </section>
      <section>
        <h2 className="mb-5 text-2xl font-bold">Shop by brand</h2>
        {brandError ? <p role="alert">Brands could not be loaded.</p>
          : !brands ? <p role="status">Loading brands...</p>
          : !brands.length ? <p>No brands are available yet.</p>
          : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {brands.slice(0, 12).map((brand) => <Link key={brand._id} to={`/products?brand=${brand._id}`}
              className="flex min-w-0 flex-col items-center gap-3 rounded-2xl border border-border bg-white p-4 text-center text-sm font-semibold hover:border-primary">
              <CatalogImage src={brand.logo} alt="" className="size-14 rounded-lg bg-surface object-contain p-1" />
              <span className="break-words">{brand.name}</span>
            </Link>)}
          </div>}
      </section>
    </div>
  );
}
