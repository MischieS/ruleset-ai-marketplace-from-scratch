const productsNode = document.getElementById("products");
const sellersNode = document.getElementById("sellerLeaderboard");

const searchInput = document.getElementById("searchInput");
const viewMode = document.getElementById("viewMode");
const typeFilter = document.getElementById("typeFilter");
const sortFilter = document.getElementById("sortFilter");
const slotFilter = document.getElementById("slotFilter");

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const authState = document.getElementById("authState");
const authOutput = document.getElementById("authOutput");

const logoutBtn = document.getElementById("logoutBtn");
const myOrdersBtn = document.getElementById("myOrdersBtn");
const financeBtn = document.getElementById("financeBtn");
const myPromotionsBtn = document.getElementById("myPromotionsBtn");
const newPromotionBtn = document.getElementById("newPromotionBtn");
const promotionStatusBtn = document.getElementById("promotionStatusBtn");
const slaBtn = document.getElementById("slaBtn");
const adminPayoutsBtn = document.getElementById("adminPayoutsBtn");

const refreshBtn = document.getElementById("refreshBtn");
const jumpDiscoveryBtn = document.getElementById("jumpDiscoveryBtn");
const jumpCatalogBtn = document.getElementById("jumpCatalogBtn");

const metricProducts = document.getElementById("metricProducts");
const metricProductsMeta = document.getElementById("metricProductsMeta");
const metricAvgScore = document.getElementById("metricAvgScore");
const metricAvgScoreMeta = document.getElementById("metricAvgScoreMeta");
const metricSponsoredShare = document.getElementById("metricSponsoredShare");
const metricSponsoredMeta = document.getElementById("metricSponsoredMeta");
const metricTopSeller = document.getElementById("metricTopSeller");
const metricTopSellerMeta = document.getElementById("metricTopSellerMeta");

let token = localStorage.getItem("ruleset_token") ?? "";
let me = null;

const state = {
  catalogRows: [],
  discoveryRows: [],
  sellers: [],
};

function setAuthOutput(value) {
  authOutput.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function updateAuthState() {
  authState.textContent = me ? `Logged in as ${me.email} (${me.role})` : "Not logged in";
}

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`;
}

function formatPercent(value) {
  return `${Number(value).toFixed(1)}%`;
}

function formatCompact(value) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value));
}

async function api(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

function scoreClass(score) {
  if (score >= 85) return "score-platinum";
  if (score >= 75) return "score-gold";
  if (score >= 60) return "score-silver";
  return "score-low";
}

function canPromoteProduct(item) {
  return me?.role === "seller" && me?.sellerId && me.sellerId === item.sellerId;
}

function createScoreRow(label, value) {
  return `
    <div class="score-row">
      <span>${label}</span>
      <span class="track"><span class="fill" style="width:${Math.max(0, Math.min(100, Number(value)))}%"></span></span>
      <strong>${Number(value).toFixed(0)}</strong>
    </div>
  `;
}

async function showPolicy(productId) {
  try {
    const policy = await api(`/api/policy/products/${productId}`);
    setAuthOutput(policy);
  } catch (error) {
    setAuthOutput(error.message);
  }
}

async function createPromotionForProduct(productId) {
  const bid = Number(prompt("Bid CPM in USD (minimum 1)", "6"));
  const budget = Number(prompt("Daily budget in USD (minimum 10)", "40"));
  if (!Number.isFinite(bid) || !Number.isFinite(budget)) {
    setAuthOutput("Invalid bid or budget");
    return;
  }

  try {
    const created = await api("/api/seller/promotions", {
      method: "POST",
      body: JSON.stringify({ productId, bidCpmUsd: bid, dailyBudgetUsd: budget }),
    });
    setAuthOutput(created);
    await refreshAllData();
  } catch (error) {
    setAuthOutput(error.message);
  }
}

async function trackPromotionClick(context) {
  if (!context?.campaignId) return;
  try {
    await api(`/api/promotions/${context.campaignId}/click`, { method: "POST" });
  } catch {
    // non-blocking analytics path
  }
}

function renderProductCard(item, context = {}) {
  const card = document.createElement("article");
  card.className = "card";

  const sponsoredTop =
    context.placement === "sponsored"
      ? `<div class="sponsored-banner">Sponsored | CPM ${formatCurrency(context.adCpmUsd || 0)}</div>`
      : "";

  const promoteAction = canPromoteProduct(item) ? `<button data-promote="${item.id}">Promote</button>` : "";

  card.innerHTML = `
    ${sponsoredTop}
    <div class="card-top">
      <span class="pill">${item.type}</span>
      <span class="score ${scoreClass(item.score.efficiencyScore)}">${item.score.efficiencyScore}</span>
    </div>
    <h3>${item.title}</h3>
    <p>${item.description}</p>
    <div class="tags">${item.tags.map((t) => `<span>${t}</span>`).join("")}</div>
    <div class="meta">
      <span>${formatCurrency(item.priceUsd)}</span>
      <span>${item.score.qualityTier}</span>
      <span>${item.likes} likes</span>
    </div>
    <div class="score-bars">
      ${createScoreRow("Efficiency", item.score.efficiencyScore)}
      ${createScoreRow("Speed", item.score.speedScore)}
      ${createScoreRow("Stability", item.score.stabilityScore)}
    </div>
    <div class="card-actions">
      <button class="like-btn" data-like="${item.id}">Like</button>
      <button data-buy="${item.id}">Buy</button>
      <button data-message="${item.id}" data-seller="${item.sellerId}">Message</button>
      <button data-policy="${item.id}">Policy</button>
      ${promoteAction}
    </div>
  `;

  card.querySelector("[data-like]")?.addEventListener("click", async () => {
    try {
      await api(`/api/products/${item.id}/like`, { method: "POST" });
      await refreshAllData();
    } catch (error) {
      setAuthOutput(error.message);
    }
  });

  card.querySelector("[data-buy]")?.addEventListener("click", async () => {
    try {
      await trackPromotionClick(context);
      const order = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({ productId: item.id }),
      });
      setAuthOutput(order);
    } catch (error) {
      setAuthOutput(error.message);
    }
  });

  card.querySelector("[data-message]")?.addEventListener("click", async (event) => {
    const sellerId = event.currentTarget.getAttribute("data-seller");
    const body = prompt("Message to seller:");
    if (!body) return;

    try {
      await trackPromotionClick(context);
      const msg = await api("/api/messages", {
        method: "POST",
        body: JSON.stringify({ productId: item.id, toSellerId: sellerId, body }),
      });
      setAuthOutput(msg);
    } catch (error) {
      setAuthOutput(error.message);
    }
  });

  card.querySelector("[data-policy]")?.addEventListener("click", () => showPolicy(item.id));
  card.querySelector("[data-promote]")?.addEventListener("click", () => createPromotionForProduct(item.id));

  return card;
}

function renderDiscoverySlot(row) {
  const wrap = document.createElement("section");
  wrap.className = "feed-slot";
  wrap.innerHTML = `<div class="slot-title">Slot ${row.slot} | ${row.placement === "sponsored" ? "Sponsored" : "Organic"}</div>`;
  wrap.appendChild(renderProductCard({ ...row.product, score: row.score }, row));
  return wrap;
}

function renderCatalog(rows) {
  productsNode.innerHTML = "";
  rows.forEach((row) => productsNode.appendChild(renderProductCard(row)));
}

function renderDiscovery(rows) {
  productsNode.innerHTML = "";
  rows.forEach((row) => productsNode.appendChild(renderDiscoverySlot(row)));
}

function renderSellerBoard(rows) {
  sellersNode.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <td><span class="rank-pill">${row.rank}</span></td>
        <td>${row.sellerName}${row.verified ? " ✓" : ""}</td>
        <td>
          <span class="health-wrap">
            <span class="health-track"><span class="health-fill" style="width:${row.businessHealthScore}%"></span></span>
            <strong>${Number(row.businessHealthScore).toFixed(0)}</strong>
          </span>
        </td>
        <td>${Number(row.avgEfficiencyScore).toFixed(1)}</td>
      </tr>
    `,
    )
    .join("");
}

function updateKpis() {
  const catalog = state.catalogRows;
  const sellers = state.sellers;
  const feed = state.discoveryRows;

  const productCount = catalog.length;
  const avgScore =
    productCount > 0
      ? catalog.reduce((sum, row) => sum + Number(row.score.efficiencyScore), 0) / productCount
      : 0;
  const sponsoredSlots = feed.filter((row) => row.placement === "sponsored").length;
  const sponsoredShare = feed.length > 0 ? (sponsoredSlots / feed.length) * 100 : 0;
  const topSeller = sellers[0];

  metricProducts.textContent = String(productCount);
  metricProductsMeta.textContent = `${formatCompact(catalog.reduce((sum, row) => sum + Number(row.likes || 0), 0))} total likes tracked`;

  metricAvgScore.textContent = Number(avgScore).toFixed(1);
  metricAvgScoreMeta.textContent = `${catalog.filter((row) => row.score.qualityTier === "Platinum").length} platinum assets`;

  metricSponsoredShare.textContent = `${Number(sponsoredShare).toFixed(0)}%`;
  metricSponsoredMeta.textContent = `${sponsoredSlots}/${feed.length || 0} slots are paid placements`;

  metricTopSeller.textContent = topSeller ? topSeller.sellerName : "-";
  metricTopSellerMeta.textContent = topSeller
    ? `Health ${Number(topSeller.businessHealthScore).toFixed(1)} | ${topSeller.totalLikes} likes`
    : "Waiting for seller data";
}

async function loadCatalog() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  if (typeFilter.value) params.set("type", typeFilter.value);
  if (sortFilter.value) params.set("sort", sortFilter.value);

  const rows = await api(`/api/products?${params.toString()}`);
  state.catalogRows = rows;
  return rows;
}

async function loadDiscoveryFeed() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  if (typeFilter.value) params.set("type", typeFilter.value);
  params.set("slots", slotFilter.value || "12");

  const rows = await api(`/api/discovery/feed?${params.toString()}`);
  state.discoveryRows = rows;
  return rows;
}

async function loadSellerBoard() {
  const rows = await api("/api/leaderboard/sellers");
  state.sellers = rows;
  renderSellerBoard(rows);
  return rows;
}

async function refreshMarketplace() {
  sortFilter.disabled = viewMode.value === "discovery";
  productsNode.innerHTML = '<p class="panel-head">Loading marketplace...</p>';

  if (viewMode.value === "discovery") {
    const rows = await loadDiscoveryFeed();
    renderDiscovery(rows);
  } else {
    const rows = await loadCatalog();
    renderCatalog(rows);
  }
}

async function refreshAllData() {
  try {
    const [catalogRows, discoveryRows] = await Promise.all([loadCatalog(), loadDiscoveryFeed()]);
    await loadSellerBoard();

    if (viewMode.value === "discovery") {
      renderDiscovery(discoveryRows);
    } else {
      renderCatalog(catalogRows);
    }
    updateKpis();
  } catch (error) {
    productsNode.innerHTML = `<p>${error.message}</p>`;
  }
}

async function loadMe() {
  if (!token) {
    me = null;
    updateAuthState();
    return;
  }

  try {
    me = await api("/api/auth/me");
  } catch {
    token = "";
    localStorage.removeItem("ruleset_token");
    me = null;
  }
  updateAuthState();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const login = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: emailInput.value, password: passwordInput.value }),
    });
    token = login.token;
    localStorage.setItem("ruleset_token", token);
    me = login.user;
    updateAuthState();
    setAuthOutput(login.user);
  } catch (error) {
    setAuthOutput(error.message);
  }
});

logoutBtn.addEventListener("click", () => {
  token = "";
  me = null;
  localStorage.removeItem("ruleset_token");
  updateAuthState();
  setAuthOutput("Logged out");
});

myOrdersBtn.addEventListener("click", async () => {
  try {
    const orders = await api("/api/orders/me");
    setAuthOutput(orders);
  } catch (error) {
    setAuthOutput(error.message);
  }
});

financeBtn.addEventListener("click", async () => {
  try {
    const finance = await api("/api/seller/finance");
    setAuthOutput(finance);
  } catch (error) {
    setAuthOutput(error.message);
  }
});

myPromotionsBtn.addEventListener("click", async () => {
  try {
    const campaigns = await api("/api/seller/promotions");
    setAuthOutput(campaigns);
  } catch (error) {
    setAuthOutput(error.message);
  }
});

newPromotionBtn.addEventListener("click", async () => {
  const productId = prompt("Product ID to promote:");
  if (!productId) return;
  await createPromotionForProduct(productId.trim());
});

promotionStatusBtn.addEventListener("click", async () => {
  const campaignId = prompt("Promotion campaign ID:");
  if (!campaignId) return;
  const nextStatus = prompt('New status: "active" or "paused"', "paused");
  if (nextStatus !== "active" && nextStatus !== "paused") {
    setAuthOutput('Status must be "active" or "paused"');
    return;
  }

  try {
    const updated = await api(`/api/seller/promotions/${campaignId}/status`, {
      method: "POST",
      body: JSON.stringify({ status: nextStatus }),
    });
    setAuthOutput(updated);
    await refreshAllData();
  } catch (error) {
    setAuthOutput(error.message);
  }
});

slaBtn.addEventListener("click", async () => {
  try {
    const sla = await api("/api/sla/seller");
    setAuthOutput(sla);
  } catch (error) {
    setAuthOutput(error.message);
  }
});

adminPayoutsBtn.addEventListener("click", async () => {
  try {
    const pending = await api("/api/admin/payouts/pending");
    setAuthOutput(pending);
  } catch (error) {
    setAuthOutput(error.message);
  }
});

refreshBtn.addEventListener("click", refreshAllData);

jumpDiscoveryBtn.addEventListener("click", async () => {
  viewMode.value = "discovery";
  await refreshMarketplace();
  document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

jumpCatalogBtn.addEventListener("click", async () => {
  viewMode.value = "catalog";
  await refreshMarketplace();
  document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

[searchInput, viewMode, typeFilter, sortFilter, slotFilter].forEach((el) => {
  el.addEventListener("input", refreshMarketplace);
  el.addEventListener("change", refreshMarketplace);
});

await Promise.all([loadMe(), refreshAllData()]);
