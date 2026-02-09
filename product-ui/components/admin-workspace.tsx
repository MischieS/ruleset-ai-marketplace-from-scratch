"use client";

import { useMemo, useState } from "react";
import { payoutQueue } from "@/lib/mock-data";

export function AdminWorkspace() {
  const [queue, setQueue] = useState(payoutQueue);

  const pendingCount = useMemo(() => queue.filter((item) => item.status === "pending").length, [queue]);
  const pendingTotal = useMemo(
    () => queue.filter((item) => item.status === "pending").reduce((sum, item) => sum + item.amountUsd, 0),
    [queue],
  );

  function approve(id: string) {
    setQueue((current) => current.map((item) => (item.id === id ? { ...item, status: "approved" } : item)));
  }

  return (
    <section className="surface stackGap">
      <header className="surfaceHeader">
        <div>
          <h1>Admin Workspace</h1>
          <p>Governance controls, payout settlement, and risk visibility for marketplace trust.</p>
        </div>
        <span className="chip">Operations</span>
      </header>

      <div className="statsGrid compact">
        <article className="statCard">
          <p>Pending Payouts</p>
          <h3>{pendingCount}</h3>
        </article>
        <article className="statCard">
          <p>Pending Volume</p>
          <h3>${pendingTotal.toLocaleString()}</h3>
        </article>
        <article className="statCard">
          <p>Risk Alerts</p>
          <h3>4</h3>
        </article>
      </div>

      <div className="splitBlock">
        <article className="subPanel">
          <h2>Risk Priorities</h2>
          <ul>
            <li>Promotion click-spike anomalies</li>
            <li>Refund-rate outliers by seller cohort</li>
            <li>Unverified sellers with high paid exposure</li>
          </ul>
        </article>
        <article className="subPanel">
          <h2>Admin SLA</h2>
          <ul>
            <li>Payout review target: under 12h</li>
            <li>Abuse escalation target: under 2h</li>
            <li>Dispute response target: under 24h</li>
          </ul>
        </article>
      </div>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Seller</th>
              <th>Amount</th>
              <th>Requested</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.sellerName}</td>
                <td>${item.amountUsd}</td>
                <td>{new Date(item.requestedAt).toLocaleString()}</td>
                <td>
                  <span className={item.status === "pending" ? "pill warn" : "pill good"}>{item.status}</span>
                </td>
                <td>
                  <button disabled={item.status === "approved"} onClick={() => approve(item.id)}>
                    Mark Approved
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
