import { Heart } from "lucide-react";

interface ProductCardProps {
  name: string;
  image: string;
  price: number;
  comparedAt?: number;
}

const ProductCard = ({ name, image, price, comparedAt }: ProductCardProps) => {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface transition hover:shadow-md">
      {/* Product Image */}
      <div className="relative flex h-56 items-center justify-center bg-background p-4">
        {/* Wishlist Button */}
        <button
          type="button"
          className="absolute right-2 top-3 z-10 rounded-full bg-surface p-2 text-muted shadow-sm transition hover:text-error"
        >
          <Heart size={20} />
        </button>

        {/* Image */}
        <img src={image} alt={name} className="h-full w-full object-contain" />
      </div>

      {/* Product Information */}
      <div className="p-4">
        <h3 className="font-semibold text-text">{name}</h3>

        {/* Price */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-text">₹{price}</span>

          {comparedAt && (
            <span className="text-sm text-muted line-through">
              ₹{comparedAt}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          type="button"
          className="mt-4 w-full rounded-md border border-primary px-4 py-2 font-medium text-primary transition hover:bg-primary hover:text-white"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
