const routeLinks = Array.from(document.querySelectorAll("[data-route]"));
const pages = {
  home: document.getElementById("page-home"),
  marketplace: document.getElementById("page-marketplace"),
  user: document.getElementById("page-user"),
  seller: document.getElementById("page-seller"),
  admin: document.getElementById("page-admin"),
};

const authState = document.getElementById("authState");
const systemOutput = document.getElementById("systemOutput");

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

const refreshAllBtn = document.getElementById("refreshAllBtn");
const logoutBtn = document.getElementById("logoutBtn");
const quickMeBtn = document.getElementById("quickMeBtn");
const quickOrdersBtn = document.getElementById("quickOrdersBtn");
const quickFinanceBtn = document.getElementById("quickFinanceBtn");
const quickPromotionsBtn = document.getElementById("quickPromotionsBtn");
const quickPayoutsBtn = document.getElementById("quickPayoutsBtn");

const metricProducts = document.getElementById("metricProducts");
const metricAvgScore = document.getElementById("metricAvgScore");
const metricSponsoredRatio = document.getElementById("metricSponsoredRatio");
const metricTopSeller = document.getElementById("metricTopSeller");

const homeTopProducts = document.getElementById("homeTopProducts");
const homeTopSellers = document.getElementById("homeTopSellers");

const gotoMarketplaceBtn = document.getElementById("gotoMarketplaceBtn");
const gotoSellerBtn = document.getElementById("gotoSellerBtn");

const searchInput = document.getElementById("searchInput");
const viewMode = document.getElementById("viewMode");
const typeFilter = document.getElementById("typeFilter");
const sortFilter = document.getElementById("sortFilter");
const slotFilter = document.getElementById("slotFilter");
const marketplaceList = document.getElementById("marketplaceList");

const userSummary = document.getElementById("userSummary");
const userOrders = document.getElementById("userOrders");
const userRefreshOrdersBtn = document.getElementById("userRefreshOrdersBtn");
const threadForm = document.getElementById("threadForm");
const threadProductIdInput = document.getElementById("threadProductIdInput");
const threadWithUserIdInput = document.getElementById("threadWithUserIdInput");
const threadOutput = document.getElementById("threadOutput");

const sellerSummary = document.getElementById("sellerSummary");
const sellerFinance = document.getElementById("sellerFinance");
const sellerSla = document.getElementById("sellerSla");
const sellerPromotions = document.getElementById("sellerPromotions");
const sellerRefreshFinanceBtn = document.getElementById("sellerRefreshFinanceBtn");
const sellerRefreshSlaBtn = document.getElementById("sellerRefreshSlaBtn");
const sellerRefreshPromotionsBtn = document.getElementById("sellerRefreshPromotionsBtn");
const requestPayoutBtn = document.getElementById("requestPayoutBtn");

const promotionCreateForm = document.getElementById("promotionCreateForm");
const promotionProductIdInput = document.getElementById("promotionProductIdInput");
const promotionBidInput = document.getElementById("promotionBidInput");
const promotionBudgetInput = document.getElementById("promotionBudgetInput");

const promotionStatusForm = document.getElementById("promotionStatusForm");
const promotionCampaignIdInput = document.getElementById("promotionCampaignIdInput");
const promotionStatusInput = document.getElementById("promotionStatusInput");

const adminPayouts = document.getElementById("adminPayouts");
const adminRefreshPayoutsBtn = document.getElementById("adminRefreshPayoutsBtn");

let token = localStorage.getItem("ruleset_token") ?? "";
let me = null;

const state = {
  catalog: [],
  discovery: [],
  sellers: [],
  userOrders: [],
  sellerFinance: null,
  sellerSla: null,
  sellerPromotions: [],
  adminPayouts: [],
};

function setOutput(value) {
  systemOutput.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function formatCurrency(value) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function activeRoute() {
  const route = (location.hash || "#home").replace("#", "");
  if (route in pages) return route;
  return "home";
}

function setRoute(route) {
  const next = route in pages ? route : "home";
  if (location.hash !== `#${next}`) {
    location.hash = next;
  } else {
    applyRoute(next);
  }
}

function applyRoute(route) {
  Object.entries(pages).forEach(([key, node]) => {
    if (!node) return;
    node.hidden = key !== route;
  });

  routeLinks.forEach((link) => {
    const isActive = link.getAttribute("data-route") === route;
    link.classList.toggle("active", isActive);
  });
}

function updateAuthState() {
  authState.textContent = me ? `${me.email} (${me.role})` : "Not logged in";
}

function updateKpis() {
  const products = state.catalog;
  const sellers = state.sellers;
  const discovery = state.discovery;

  const avgScore = products.length
    ? products.reduce((sum, p) => sum + Number(p.score.efficiencyScore), 0) / products.length
    : 0;
  const sponsoredCount = discovery.filter((d) => d.placement === "sponsored").length;
  const sponsoredRatio = discovery.length ? (sponsoredCount / discovery.length) * 100 : 0;

  metricProducts.textContent = String(products.length);
  metricAvgScore.textContent = avgScore.toFixed(1);
  metricSponsoredRatio.textContent = `${sponsoredRatio.toFixed(0)}%`;
  metricTopSeller.textContent = sellers[0]?.sellerName ?? "-";
}

function renderHome() {
  homeTopProducts.innerHTML = "";
  state.catalog.slice(0, 4).forEach((item) => {
    const node = document.createElement("article");
    node.className = "list-item";
    node.innerHTML = `
      <strong>${item.title}</strong>
      <span class="small">${item.type} | ${item.score.qualityTier} | ${item.score.efficiencyScore}</span>
      <span class="small">${formatCurrency(item.priceUsd)} | ${item.likes} likes</span>
    `;
    homeTopProducts.appendChild(node);
  });

  homeTopSellers.innerHTML = "";
  state.sellers.slice(0, 4).forEach((seller) => {
    const node = document.createElement("article");
    node.className = "list-item";
    node.innerHTML = `
      <strong>${seller.sellerName}${seller.verified ? " ✓" : ""}</strong>
      <span class="small">Health ${seller.businessHealthScore} | Avg efficiency ${seller.avgEfficiencyScore}</span>
      <span class="small">${seller.totalLikes} likes across ${seller.productCount} products</span>
    `;
    homeTopSellers.appendChild(node);
  });
}

function scoreClass(score) {
  if (score >= 85) return "good";
  if (score < 60) return "danger";
  return "neutral";
}

function progressRow(label, value) {
  return `
    <div class="progress-row">
      <span>${label}</span>
      <span class="track"><span class="fill" style="width:${Math.max(0, Math.min(100, Number(value)))}%"></span></span>
      <strong>${Number(value).toFixed(0)}</strong>
    </div>
  `;
}

function requireAuth() {
  if (!token) {
    throw new Error("Please login first");
  }
}

function canPromote(item) {
  return me?.role === "seller" && me?.sellerId === item.sellerId;
}

async function registerPromotionClick(context) {
  if (!context?.campaignId) return;
  try {
    await api(`/api/promotions/${context.campaignId}/click`, { method: "POST" });
  } catch {
    // ignore analytics failure
  }
}

function renderMarketplace() {
  const rows = viewMode.value === "discovery" ? state.discovery : state.catalog;
  marketplaceList.innerHTML = "";

  rows.forEach((item) => {
    const isDiscovery = viewMode.value === "discovery";
    const product = isDiscovery ? { ...item.product, score: item.score } : item;

    const card = document.createElement("article");
    card.className = `market-card ${isDiscovery && item.placement === "sponsored" ? "sponsored" : ""}`;

    const sponsoredBadge = isDiscovery && item.placement === "sponsored"
      ? `<span class="badge warn">Sponsored CPM ${formatCurrency(item.adCpmUsd)}</span>`
      : "";

    const promoteAction = canPromote(product) ? `<button data-action="promote">Promote</button>` : "";

    card.innerHTML = `
      <div class="badge-row">
        <span class="badge">${product.type}</span>
        ${sponsoredBadge}
      </div>
      <div class="market-title">${product.title}</div>
      <p class="market-desc">${product.description}</p>
      <div class="meta-row">
        <span>${formatCurrency(product.priceUsd)}</span>
        <span>${product.score.qualityTier}</span>
        <span>${product.likes} likes</span>
        <span>Efficiency ${product.score.efficiencyScore}</span>
      </div>
      <div class="progress-grid">
        ${progressRow("Efficiency", product.score.efficiencyScore)}
        ${progressRow("Speed", product.score.speedScore)}
        ${progressRow("Stability", product.score.stabilityScore)}
      </div>
      <div class="card-actions">
        <button data-action="like">Like</button>
        <button data-action="buy">Buy</button>
        <button data-action="message">Message</button>
        <button data-action="policy">Policy</button>
        ${promoteAction}
      </div>
    `;

    card.querySelector('[data-action="like"]')?.addEventListener("click", async () => {
      try {
        await api(`/api/products/${product.id}/like`, { method: "POST" });
        await refreshCore();
      } catch (error) {
        setOutput(error.message);
      }
    });

    card.querySelector('[data-action="buy"]')?.addEventListener("click", async () => {
      try {
        requireAuth();
        await registerPromotionClick(item);
        const order = await api("/api/orders", {
          method: "POST",
          body: JSON.stringify({ productId: product.id }),
        });
        setOutput(order);
        await refreshUserData();
      } catch (error) {
        setOutput(error.message);
      }
    });

    card.querySelector('[data-action="message"]')?.addEventListener("click", async () => {
      try {
        requireAuth();
        const body = prompt("Message to seller:");
        if (!body) return;

        await registerPromotionClick(item);
        const message = await api("/api/messages", {
          method: "POST",
          body: JSON.stringify({
            productId: product.id,
            toSellerId: product.sellerId,
            body,
          }),
        });
        setOutput(message);
      } catch (error) {
        setOutput(error.message);
      }
    });

    card.querySelector('[data-action="policy"]')?.addEventListener("click", async () => {
      try {
        const policy = await api(`/api/policy/products/${product.id}`);
        setOutput(policy);
      } catch (error) {
        setOutput(error.message);
      }
    });

    card.querySelector('[data-action="promote"]')?.addEventListener("click", () => {
      setRoute("seller");
      promotionProductIdInput.value = product.id;
      promotionBidInput.focus();
    });

    marketplaceList.appendChild(card);
  });
}

function summaryBox(label, value) {
  return `<article class="summary-box"><div class="label">${label}</div><div class="value">${value}</div></article>`;
}

function renderUserSummary() {
  if (!me) {
    userSummary.innerHTML = `<article class="summary-box"><div class="value">Login required</div></article>`;
    userOrders.innerHTML = "";
    threadOutput.innerHTML = "";
    return;
  }

  userSummary.innerHTML = [
    summaryBox("Email", me.email),
    summaryBox("Role", me.role),
    summaryBox("User ID", me.id),
    summaryBox("Orders", state.userOrders.length),
  ].join("");
}

function renderOrdersTable(rows) {
  if (!rows.length) {
    userOrders.innerHTML = `<p class="hint">No orders found.</p>`;
    return;
  }

  userOrders.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Order</th>
          <th>Product</th>
          <th>Amount</th>
          <th>Platform Fee</th>
          <th>Payout</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
          <tr>
            <td>${row.id}</td>
            <td>${row.productId}</td>
            <td>${formatCurrency(row.amountUsd)}</td>
            <td>${formatCurrency(row.platformFeeUsd)}</td>
            <td>${formatCurrency(row.payoutUsd)}</td>
            <td>${new Date(row.createdAt).toLocaleString()}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderSellerSummary() {
  if (!me || me.role !== "seller") {
    sellerSummary.innerHTML = `<article class="summary-box"><div class="value">Seller login required</div></article>`;
    sellerFinance.innerHTML = "";
    sellerSla.innerHTML = "";
    sellerPromotions.innerHTML = "";
    return;
  }

  const finance = state.sellerFinance || {};
  sellerSummary.innerHTML = [
    summaryBox("Seller ID", me.sellerId ?? "-"),
    summaryBox("Gross Revenue", formatCurrency(finance.grossRevenue)),
    summaryBox("Available Payout", formatCurrency(finance.availablePayout)),
    summaryBox("Active Promotions", String(finance.activePromotionCount ?? 0)),
  ].join("");

  sellerFinance.innerHTML = `
    <table>
      <tbody>
        <tr><th>Gross Revenue</th><td>${formatCurrency(finance.grossRevenue)}</td></tr>
        <tr><th>Platform Fees</th><td>${formatCurrency(finance.platformFees)}</td></tr>
        <tr><th>Earned Payout</th><td>${formatCurrency(finance.earnedPayout)}</td></tr>
        <tr><th>Requested Payout</th><td>${formatCurrency(finance.requestedPayout)}</td></tr>
        <tr><th>Available Payout</th><td>${formatCurrency(finance.availablePayout)}</td></tr>
        <tr><th>Ad Spend</th><td>${formatCurrency(finance.adSpendUsd)}</td></tr>
        <tr><th>Net After Ads</th><td>${formatCurrency(finance.netEarningsAfterAdsUsd)}</td></tr>
      </tbody>
    </table>
  `;

  const sla = state.sellerSla || {};
  sellerSla.innerHTML = `
    <table>
      <tbody>
        <tr><th>Conversations</th><td>${sla.conversations ?? 0}</td></tr>
        <tr><th>Avg First Response (h)</th><td>${sla.avgFirstResponseHours ?? 0}</td></tr>
        <tr><th>On-Time Rate</th><td>${sla.onTimeRate ?? 0}%</td></tr>
      </tbody>
    </table>
  `;

  if (!state.sellerPromotions.length) {
    sellerPromotions.innerHTML = `<p class="hint">No campaigns yet.</p>`;
  } else {
    sellerPromotions.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Product</th>
            <th>Status</th>
            <th>Budget</th>
            <th>Spent</th>
            <th>CTR</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${state.sellerPromotions
            .map(
              (row) => `
            <tr>
              <td>${row.id}</td>
              <td>${row.productTitle}</td>
              <td>${row.status}</td>
              <td>${formatCurrency(row.dailyBudgetUsd)}</td>
              <td>${formatCurrency(row.spentUsd)}</td>
              <td>${row.ctrPercent}%</td>
              <td>
                <button data-campaign-id="${row.id}" data-next-status="paused">Pause</button>
                <button data-campaign-id="${row.id}" data-next-status="active">Activate</button>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;

    sellerPromotions.querySelectorAll("[data-campaign-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const campaignId = btn.getAttribute("data-campaign-id");
        const status = btn.getAttribute("data-next-status");
        try {
          await api(`/api/seller/promotions/${campaignId}/status`, {
            method: "POST",
            body: JSON.stringify({ status }),
          });
          await refreshSellerData();
        } catch (error) {
          setOutput(error.message);
        }
      });
    });
  }
}

function renderAdmin() {
  if (!me || me.role !== "admin") {
    adminPayouts.innerHTML = `<p class="hint">Admin login required.</p>`;
    return;
  }

  if (!state.adminPayouts.length) {
    adminPayouts.innerHTML = `<p class="hint">No pending payouts.</p>`;
    return;
  }

  adminPayouts.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Seller</th>
          <th>Amount</th>
          <th>Requested</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${state.adminPayouts
          .map(
            (row) => `
          <tr>
            <td>${row.id}</td>
            <td>${row.sellerId}</td>
            <td>${formatCurrency(row.amountUsd)}</td>
            <td>${new Date(row.createdAt).toLocaleString()}</td>
            <td><button class="primary" data-pay-payout="${row.id}">Mark Paid</button></td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;

  adminPayouts.querySelectorAll("[data-pay-payout]").forEach((button) => {
    button.addEventListener("click", async () => {
      const payoutId = button.getAttribute("data-pay-payout");
      try {
        const updated = await api(`/api/admin/payouts/${payoutId}`, {
          method: "POST",
          body: JSON.stringify({ status: "paid" }),
        });
        setOutput(updated);
        await refreshAdminData();
      } catch (error) {
        setOutput(error.message);
      }
    });
  });
}

async function api(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }

  return data;
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

async function loadCatalog() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  if (typeFilter.value) params.set("type", typeFilter.value);
  params.set("sort", sortFilter.value);

  state.catalog = await api(`/api/products?${params.toString()}`);
}

async function loadDiscovery() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  if (typeFilter.value) params.set("type", typeFilter.value);
  params.set("slots", slotFilter.value);

  state.discovery = await api(`/api/discovery/feed?${params.toString()}`);
}

async function loadSellers() {
  state.sellers = await api("/api/leaderboard/sellers");
}

async function refreshCore() {
  await Promise.all([loadCatalog(), loadDiscovery(), loadSellers()]);
  updateKpis();
  renderHome();
  renderMarketplace();
}

async function refreshUserData() {
  if (!me) {
    state.userOrders = [];
    renderUserSummary();
    renderOrdersTable([]);
    return;
  }

  try {
    state.userOrders = await api("/api/orders/me");
  } catch {
    state.userOrders = [];
  }

  renderUserSummary();
  renderOrdersTable(state.userOrders);
}

async function refreshSellerData() {
  if (!me || me.role !== "seller") {
    state.sellerFinance = null;
    state.sellerSla = null;
    state.sellerPromotions = [];
    renderSellerSummary();
    return;
  }

  try {
    const [finance, promotions, sla] = await Promise.all([
      api("/api/seller/finance"),
      api("/api/seller/promotions"),
      api("/api/sla/seller"),
    ]);
    state.sellerFinance = finance;
    state.sellerPromotions = promotions;
    state.sellerSla = sla;
  } catch (error) {
    setOutput(error.message);
  }

  renderSellerSummary();
}

async function refreshAdminData() {
  if (!me || me.role !== "admin") {
    state.adminPayouts = [];
    renderAdmin();
    return;
  }

  try {
    state.adminPayouts = await api("/api/admin/payouts/pending");
  } catch (error) {
    setOutput(error.message);
  }

  renderAdmin();
}

async function refreshEverything() {
  await loadMe();
  await refreshCore();
  await refreshUserData();
  await refreshSellerData();
  await refreshAdminData();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const login = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: emailInput.value,
        password: passwordInput.value,
      }),
    });
    token = login.token;
    localStorage.setItem("ruleset_token", token);
    me = login.user;
    updateAuthState();
    setOutput(login.user);
    await refreshEverything();
  } catch (error) {
    setOutput(error.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  token = "";
  me = null;
  localStorage.removeItem("ruleset_token");
  updateAuthState();
  setOutput("Logged out");
  await refreshEverything();
});

refreshAllBtn.addEventListener("click", refreshEverything);

quickMeBtn.addEventListener("click", async () => {
  try {
    const profile = await api("/api/auth/me");
    setOutput(profile);
    setRoute("user");
  } catch (error) {
    setOutput(error.message);
  }
});

quickOrdersBtn.addEventListener("click", async () => {
  try {
    const orders = await api("/api/orders/me");
    setOutput(orders);
    setRoute("user");
  } catch (error) {
    setOutput(error.message);
  }
});

quickFinanceBtn.addEventListener("click", async () => {
  try {
    const finance = await api("/api/seller/finance");
    setOutput(finance);
    setRoute("seller");
  } catch (error) {
    setOutput(error.message);
  }
});

quickPromotionsBtn.addEventListener("click", async () => {
  try {
    const promotions = await api("/api/seller/promotions");
    setOutput(promotions);
    setRoute("seller");
  } catch (error) {
    setOutput(error.message);
  }
});

quickPayoutsBtn.addEventListener("click", async () => {
  try {
    const payouts = await api("/api/admin/payouts/pending");
    setOutput(payouts);
    setRoute("admin");
  } catch (error) {
    setOutput(error.message);
  }
});

gotoMarketplaceBtn.addEventListener("click", () => setRoute("marketplace"));
gotoSellerBtn.addEventListener("click", () => setRoute("seller"));

[searchInput, viewMode, typeFilter, sortFilter, slotFilter].forEach((input) => {
  input.addEventListener("input", async () => {
    sortFilter.disabled = viewMode.value === "discovery";
    await refreshCore();
  });
  input.addEventListener("change", async () => {
    sortFilter.disabled = viewMode.value === "discovery";
    await refreshCore();
  });
});

userRefreshOrdersBtn.addEventListener("click", refreshUserData);

threadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const productId = threadProductIdInput.value.trim();
    const withUserId = threadWithUserIdInput.value.trim();
    const rows = await api(`/api/messages/thread?productId=${encodeURIComponent(productId)}&withUserId=${encodeURIComponent(withUserId)}`);
    if (!rows.length) {
      threadOutput.innerHTML = `<p class="hint">No messages in this thread.</p>`;
      return;
    }

    threadOutput.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Message</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <td>${row.fromUserId}</td>
              <td>${row.toUserId}</td>
              <td>${row.body}</td>
              <td>${new Date(row.createdAt).toLocaleString()}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (error) {
    setOutput(error.message);
  }
});

sellerRefreshFinanceBtn.addEventListener("click", refreshSellerData);
sellerRefreshSlaBtn.addEventListener("click", refreshSellerData);
sellerRefreshPromotionsBtn.addEventListener("click", refreshSellerData);

requestPayoutBtn.addEventListener("click", async () => {
  try {
    const payout = await api("/api/seller/payouts/request", { method: "POST" });
    setOutput(payout);
    await Promise.all([refreshSellerData(), refreshAdminData()]);
  } catch (error) {
    setOutput(error.message);
  }
});

promotionCreateForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const created = await api("/api/seller/promotions", {
      method: "POST",
      body: JSON.stringify({
        productId: promotionProductIdInput.value.trim(),
        bidCpmUsd: Number(promotionBidInput.value),
        dailyBudgetUsd: Number(promotionBudgetInput.value),
      }),
    });
    setOutput(created);
    promotionCreateForm.reset();
    await Promise.all([refreshSellerData(), refreshCore()]);
  } catch (error) {
    setOutput(error.message);
  }
});

promotionStatusForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const updated = await api(`/api/seller/promotions/${promotionCampaignIdInput.value.trim()}/status`, {
      method: "POST",
      body: JSON.stringify({ status: promotionStatusInput.value }),
    });
    setOutput(updated);
    await Promise.all([refreshSellerData(), refreshCore()]);
  } catch (error) {
    setOutput(error.message);
  }
});

adminRefreshPayoutsBtn.addEventListener("click", refreshAdminData);

window.addEventListener("hashchange", () => {
  applyRoute(activeRoute());
});

applyRoute(activeRoute());
sortFilter.disabled = viewMode.value === "discovery";

await refreshEverything();
