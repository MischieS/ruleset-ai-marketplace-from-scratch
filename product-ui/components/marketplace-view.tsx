"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { products, type Product } from "@/lib/mock-data";

type ViewMode = "catalog" | "discovery";
type SortMode = "efficiency" | "likes" | "price";

function matchesQuery(product: Product, query: string, typeFilter: string) {
  const q = query.trim().toLowerCase();
  const typeOk = typeFilter ? product.type === typeFilter : true;
  if (!q) return typeOk;
  const haystack = `${product.name} ${product.description} ${product.tags.join(" ")}`.toLowerCase();
  return typeOk && haystack.includes(q);
}

export function MarketplaceView() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("efficiency");
  const [viewMode, setViewMode] = useState<ViewMode>("catalog");

  const rows = useMemo(() => {
    const filtered = products.filter((product) => matchesQuery(product, query, typeFilter));

    filtered.sort((a, b) => {
      if (sortMode === "efficiency") return b.metrics.efficiency - a.metrics.efficiency;
      if (sortMode === "likes") return b.likes - a.likes;
      return a.priceUsd - b.priceUsd;
    });

    if (viewMode === "discovery") {
      return filtered.sort((a, b) => {
        const aSponsored = a.sponsored ? 1 : 0;
        const bSponsored = b.sponsored ? 1 : 0;
        if (aSponsored !== bSponsored) return bSponsored - aSponsored;
        return b.metrics.efficiency - a.metrics.efficiency;
      });
    }

    return filtered;
  }, [query, typeFilter, sortMode, viewMode]);

  return (
    <section className="surface">
      <header className="surfaceHeader">
        <div>
          <h1>Marketplace</h1>
          <p>Premium discovery designed for conversion without heavy motion overhead.</p>
        </div>
        <span className="chip">{rows.length} listings</span>
      </header>

      <div className="controlGrid">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search skills, agents, rules, workflows"
        />
        <select value={viewMode} onChange={(event) => setViewMode(event.target.value as ViewMode)}>
          <option value="catalog">Catalog View</option>
          <option value="discovery">Discovery Feed</option>
        </select>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="">All Types</option>
          <option value="rule">Rule</option>
          <option value="skill">Skill</option>
          <option value="agent">Agent</option>
          <option value="n8n_workflow">n8n Workflow</option>
        </select>
        <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
          <option value="efficiency">Top Efficiency</option>
          <option value="likes">Most Liked</option>
          <option value="price">Lowest Price</option>
        </select>
      </div>

      <div className="productGrid">
        {rows.map((product) => (
          <ProductCard key={product.id} product={product} discovery={viewMode === "discovery"} />
        ))}
      </div>
    </section>
  );
}
