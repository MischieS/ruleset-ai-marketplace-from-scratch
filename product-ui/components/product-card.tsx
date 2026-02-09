import type { Product } from "@/lib/mock-data";
import { ScoreBars } from "@/components/score-bars";

type ProductCardProps = {
  product: Product;
  discovery?: boolean;
};

export function ProductCard({ product, discovery = false }: ProductCardProps) {
  return (
    <article className={product.sponsored && discovery ? "productCard sponsored" : "productCard"}>
      <div className="productTop">
        <span className="typeBadge">{product.type}</span>
        <div className="qualityWrap">
          {product.sponsored && discovery ? <span className="sponsoredTag">Sponsored</span> : null}
          <strong>{product.metrics.efficiency}</strong>
        </div>
      </div>

      <h3>{product.name}</h3>
      <p>{product.description}</p>

      <div className="metaRow">
        <span>${product.priceUsd}</span>
        <span>{product.qualityTier}</span>
        <span>{product.likes} likes</span>
      </div>

      <ScoreBars
        efficiency={product.metrics.efficiency}
        speed={product.metrics.speed}
        stability={product.metrics.stability}
      />

      <div className="tagRow">
        {product.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <div className="actionRow">
        <button>Buy</button>
        <button>Message</button>
        <button>Compare</button>
      </div>
    </article>
  );
}
