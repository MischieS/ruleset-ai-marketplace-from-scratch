const productsNode = document.getElementById("products");
const sellersNode = document.getElementById("sellerLeaderboard");
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const sortFilter = document.getElementById("sortFilter");
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const authState = document.getElementById("authState");
const authOutput = document.getElementById("authOutput");
const logoutBtn = document.getElementById("logoutBtn");
const myOrdersBtn = document.getElementById("myOrdersBtn");
const financeBtn = document.getElementById("financeBtn");
const slaBtn = document.getElementById("slaBtn");
const adminPayoutsBtn = document.getElementById("adminPayoutsBtn");

let token = localStorage.getItem("ruleset_token") ?? "";
let me = null;

function setAuthOutput(value) {
  authOutput.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function updateAuthState() {
  authState.textContent = me ? `Logged in as ${me.email} (${me.role})` : "Not logged in";
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

async function showPolicy(productId) {
  try {
    const policy = await api(`/api/policy/products/${productId}`);
    setAuthOutput(policy);
  } catch (error) {
    setAuthOutput(error.message);
  }
}

function renderProduct(item) {
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <div class="card-top">
      <span class="pill">${item.type}</span>
      <span class="score ${scoreClass(item.score.efficiencyScore)}">${item.score.efficiencyScore}</span>
    </div>
    <h3>${item.title}</h3>
    <p>${item.description}</p>
    <div class="tags">${item.tags.map((t) => `<span>${t}</span>`).join("")}</div>
    <div class="meta">
      <span>$${item.priceUsd}</span>
      <span>Tier: ${item.score.qualityTier}</span>
      <span>Speed: ${item.score.speedScore}</span>
      <span>Stability: ${item.score.stabilityScore}</span>
    </div>
    <div class="card-actions">
      <button class="like-btn" data-like="${item.id}">Like (${item.likes})</button>
      <button data-buy="${item.id}">Buy</button>
      <button data-message="${item.id}" data-seller="${item.sellerId}">Message Seller</button>
      <button data-policy="${item.id}">Policy</button>
    </div>
  `;

  card.querySelector("[data-like]")?.addEventListener("click", async (event) => {
    const btn = event.currentTarget;
    btn.disabled = true;
    try {
      const updated = await api(`/api/products/${item.id}/like`, { method: "POST" });
      btn.textContent = `Like (${updated.likes})`;
      await loadSellerBoard();
    } catch (error) {
      setAuthOutput(error.message);
    }
    btn.disabled = false;
  });

  card.querySelector("[data-buy]")?.addEventListener("click", async () => {
    try {
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

  return card;
}

async function loadProducts() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  if (typeFilter.value) params.set("type", typeFilter.value);
  if (sortFilter.value) params.set("sort", sortFilter.value);

  const rows = await api(`/api/products?${params.toString()}`);
  productsNode.innerHTML = "";
  rows.forEach((row) => productsNode.appendChild(renderProduct(row)));
}

async function loadSellerBoard() {
  const rows = await api("/api/leaderboard/sellers");
  sellersNode.innerHTML = rows
    .map(
      (row) => `<tr><td>${row.rank}</td><td>${row.sellerName}${row.verified ? " ?" : ""}</td><td>${row.businessHealthScore}</td><td>${row.avgEfficiencyScore}</td><td>${row.totalLikes}</td></tr>`,
    )
    .join("");
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

[searchInput, typeFilter, sortFilter].forEach((el) => {
  el.addEventListener("input", loadProducts);
  el.addEventListener("change", loadProducts);
});

await Promise.all([loadProducts(), loadSellerBoard(), loadMe()]);
