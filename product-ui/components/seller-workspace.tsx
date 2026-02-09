"use client";

import { useMemo, useState } from "react";
import { sellerCampaigns, sellers } from "@/lib/mock-data";

export function SellerWorkspace() {
  const seller = sellers[0];
  const [dailyBudget, setDailyBudget] = useState(140);
  const [campaigns, setCampaigns] = useState(sellerCampaigns);

  const projectedImpressions = useMemo(() => Math.round((dailyBudget / 6.2) * 1000), [dailyBudget]);
  const projectedClicks = useMemo(() => Math.round(projectedImpressions * 0.032), [projectedImpressions]);

  function toggleCampaign(id: string) {
    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === id
          ? { ...campaign, status: campaign.status === "active" ? "paused" : "active" }
          : campaign,
      ),
    );
  }

  return (
    <section className="surface stackGap">
      <header className="surfaceHeader">
        <div>
          <h1>Seller Workspace</h1>
          <p>Revenue operations, promotion economics, and performance health in one workspace.</p>
        </div>
        <span className="chip">{seller.name}</span>
      </header>

      <div className="statsGrid">
        <article className="statCard">
          <p>Monthly Revenue</p>
          <h3>${seller.monthlyRevenueUsd.toLocaleString()}</h3>
        </article>
        <article className="statCard">
          <p>Health Score</p>
          <h3>{seller.health}</h3>
        </article>
        <article className="statCard">
          <p>Avg Efficiency</p>
          <h3>{seller.avgEfficiency}</h3>
        </article>
        <article className="statCard">
          <p>SLA First Reply</p>
          <h3>{seller.responseSlaHours}h</h3>
        </article>
      </div>

      <section className="splitBlock">
        <article className="subPanel">
          <h2>Promotion Budget Simulator</h2>
          <p>Estimate exposure before allocating paid discovery spend.</p>
          <label className="sliderLabel">
            Daily Budget: <strong>${dailyBudget}</strong>
          </label>
          <input
            type="range"
            min={20}
            max={600}
            value={dailyBudget}
            onChange={(event) => setDailyBudget(Number(event.target.value))}
          />
          <div className="miniMetrics">
            <span>Projected Impressions: {projectedImpressions.toLocaleString()}</span>
            <span>Projected Clicks: {projectedClicks.toLocaleString()}</span>
          </div>
        </article>

        <article className="subPanel">
          <h2>Seller Strategy</h2>
          <ul>
            <li>Prioritize high health score assets for paid slots.</li>
            <li>Keep bid discipline around conversion-backed listings.</li>
            <li>Use support SLA as a ranking advantage lever.</li>
          </ul>
        </article>
      </section>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Product</th>
              <th>Bid CPM</th>
              <th>Daily Budget</th>
              <th>Spent</th>
              <th>CTR</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td>{campaign.id}</td>
                <td>{campaign.productName}</td>
                <td>${campaign.bidCpmUsd}</td>
                <td>${campaign.dailyBudgetUsd}</td>
                <td>${campaign.spentUsd}</td>
                <td>{campaign.ctrPercent}%</td>
                <td>
                  <span className={campaign.status === "active" ? "pill good" : "pill"}>{campaign.status}</span>
                </td>
                <td>
                  <button onClick={() => toggleCampaign(campaign.id)}>
                    {campaign.status === "active" ? "Pause" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
