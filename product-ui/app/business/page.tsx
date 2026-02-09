import { businessPillars, executionRoadmap } from "@/lib/mock-data";

const operatingLoops = [
  {
    name: "Acquisition Loop",
    detail: "Content SEO -> landing conversion -> first value event -> social proof amplification.",
  },
  {
    name: "Marketplace Loop",
    detail: "Discovery quality -> purchase trust -> satisfaction feedback -> better ranking signals.",
  },
  {
    name: "Seller Loop",
    detail: "Revenue visibility -> campaign optimization -> better assets -> stronger retention.",
  },
  {
    name: "Governance Loop",
    detail: "Risk detection -> human review -> policy improvement -> safer marketplace outcomes.",
  },
];

const kpis = [
  ["CAC Payback", "< 3 months"],
  ["Activation", "> 45%"],
  ["Listing to Purchase CVR", "> 6%"],
  ["Seller 30-Day Retention", "> 70%"],
  ["Payout SLA", "< 12h"],
  ["Dispute Rate", "< 1.5%"],
];

export default function BusinessPage() {
  return (
    <div className="pageStack">
      <section className="surface">
        <header className="surfaceHeader">
          <div>
            <h1>Business Architecture</h1>
            <p>A practical structure that aligns design, operations, and monetization for production scale.</p>
          </div>
          <span className="chip">Strategy Layer</span>
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

      <section className="contentGrid twoCols">
        <article className="surface">
          <header className="surfaceHeader">
            <div>
              <h2>Operating Loops</h2>
              <p>Each loop has product, UX, and operational owners.</p>
            </div>
          </header>
          <div className="stackList">
            {operatingLoops.map((loop) => (
              <article key={loop.name} className="stackCard">
                <h3>{loop.name}</h3>
                <p>{loop.detail}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="surface">
          <header className="surfaceHeader">
            <div>
              <h2>North-Star KPI Set</h2>
              <p>Targets for growth, trust, and marketplace liquidity.</p>
            </div>
          </header>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map(([metric, target]) => (
                  <tr key={metric}>
                    <td>{metric}</td>
                    <td>{target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="surface">
        <header className="surfaceHeader">
          <div>
            <h2>Execution Sequence</h2>
            <p>Ship order to balance visual quality with commercial readiness.</p>
          </div>
        </header>

        <div className="stackList">
          {executionRoadmap.map((phase) => (
            <article key={phase.phase} className="stackCard">
              <strong>{phase.phase}</strong>
              <h3>{phase.focus}</h3>
              <p>{phase.outcome}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
