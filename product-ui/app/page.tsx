import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { businessPillars, executionRoadmap, products, sellers } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <div className="pageStack">
      <section className="heroSurface">
        <div>
          <p className="eyebrow">Business-First Product Design</p>
          <h2>Build a marketplace that feels premium, trustworthy, and operationally scalable.</h2>
          <p>
            This front-end is intentionally decoupled from backend implementation so we can perfect visual language,
            flow architecture, and conversion mechanics first.
          </p>
          <div className="heroActions">
            <Link href="/marketplace" className="button primary">
              Explore Marketplace
            </Link>
            <Link href="/business" className="button">
              View Business Structure
            </Link>
          </div>
        </div>

        <aside className="heroPanel">
          <h3>Minimum Product Surfaces</h3>
          <ul>
            <li>Homepage: acquisition and credibility</li>
            <li>Marketplace: discovery and conversion</li>
            <li>User: usage and retention</li>
            <li>Seller: monetization and optimization</li>
            <li>Admin: governance and control</li>
          </ul>
        </aside>
      </section>

      <section className="statsGrid">
        <article className="statCard">
          <p>Active Listings</p>
          <h3>{products.length}</h3>
        </article>
        <article className="statCard">
          <p>Verified Sellers</p>
          <h3>{sellers.filter((seller) => seller.verified).length}</h3>
        </article>
        <article className="statCard">
          <p>Avg Seller Health</p>
          <h3>{Math.round(sellers.reduce((sum, seller) => sum + seller.health, 0) / sellers.length)}</h3>
        </article>
        <article className="statCard">
          <p>Top Listing Efficiency</p>
          <h3>{Math.max(...products.map((product) => product.metrics.efficiency))}</h3>
        </article>
      </section>

      <section className="contentGrid twoCols">
        <article className="surface">
          <header className="surfaceHeader">
            <div>
              <h2>Top Listings Preview</h2>
              <p>Design benchmark: clear hierarchy, dense value, low cognitive load.</p>
            </div>
          </header>
          <div className="productGrid small">
            {products.slice(0, 2).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </article>

        <article className="surface">
          <header className="surfaceHeader">
            <div>
              <h2>Execution Roadmap</h2>
              <p>How design and business priorities roll out in production.</p>
            </div>
          </header>
          <div className="stackList">
            {executionRoadmap.map((phase) => (
              <div key={phase.phase} className="stackCard">
                <strong>{phase.phase}</strong>
                <h3>{phase.focus}</h3>
                <p>{phase.outcome}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="surface">
        <header className="surfaceHeader">
          <div>
            <h2>Business Operating Pillars</h2>
            <p>The structure that keeps design quality aligned with commercial performance.</p>
          </div>
        </header>
        <div className="pillarGrid">
          {businessPillars.map((pillar) => (
            <article key={pillar.title} className="pillarCard">
              <h3>{pillar.title}</h3>
              <p>{pillar.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
