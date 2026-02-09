"use client";

import { useMemo, useState } from "react";
import { userOrders } from "@/lib/mock-data";

export function UserWorkspace() {
  const [statusFilter, setStatusFilter] = useState<"All" | "Completed" | "Processing">("All");

  const rows = useMemo(() => {
    if (statusFilter === "All") return userOrders;
    return userOrders.filter((order) => order.status === statusFilter);
  }, [statusFilter]);

  return (
    <section className="surface stackGap">
      <header className="surfaceHeader">
        <div>
          <h1>User Workspace</h1>
          <p>Designed for clarity-first usage with straightforward order and activity visibility.</p>
        </div>
        <span className="chip">Buyer Persona</span>
      </header>

      <div className="statsGrid compact">
        <article className="statCard">
          <p>Total Orders</p>
          <h3>{userOrders.length}</h3>
        </article>
        <article className="statCard">
          <p>Completed</p>
          <h3>{userOrders.filter((order) => order.status === "Completed").length}</h3>
        </article>
        <article className="statCard">
          <p>In Progress</p>
          <h3>{userOrders.filter((order) => order.status === "Processing").length}</h3>
        </article>
      </div>

      <div className="tableControls">
        <label>
          Filter status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="All">All</option>
            <option value="Completed">Completed</option>
            <option value="Processing">Processing</option>
          </select>
        </label>
      </div>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Product</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.productName}</td>
                <td>${order.amountUsd}</td>
                <td>
                  <span className={order.status === "Completed" ? "pill good" : "pill warn"}>{order.status}</span>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
