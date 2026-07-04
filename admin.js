/* =========================================================
   VillageMart — admin.html page logic
   Product add/edit/delete is stored as an "override" layer on
   top of the Google Sheet data (see js/sheets.js applyOverrides).
   This keeps the Sheet as the source of truth for bulk catalog
   management while still letting admins make quick edits here.
   ========================================================= */

let ADMIN_PRODUCTS = [];

document.addEventListener("DOMContentLoaded", async () => {
  UI.initHeader();
  document.getElementById("admin-link").style.display = "";
  if (!Auth.requireAdmin("index.html")) return;

  await loadAndRenderAll();

  document.getElementById("refresh-sheet-btn").addEventListener("click", async () => {
    UI.toast("Refreshing from Google Sheet...");
    ADMIN_PRODUCTS = await Sheets.loadProducts({ forceRefresh: true });
    renderProductsTable();
    renderStats();
    UI.toast("Product catalog refreshed");
  });

  document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("products-tab").style.display = tab.dataset.tab === "products-tab" ? "" : "none";
      document.getElementById("orders-tab").style.display = tab.dataset.tab === "orders-tab" ? "" : "none";
    });
  });

  document.getElementById("add-product-btn").addEventListener("click", () => openProductModal());
  document.getElementById("modal-cancel").addEventListener("click", closeProductModal);
  document.getElementById("product-form").addEventListener("submit", saveProductForm);
});

async function loadAndRenderAll() {
  ADMIN_PRODUCTS = await Sheets.loadProducts();
  renderStats();
  renderProductsTable();
  renderOrdersTable();
}

function renderStats() {
  const orders = Orders.all();
  const lowStock = ADMIN_PRODUCTS.filter(p => p.stock <= 5).length;
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  document.getElementById("stat-products").textContent = ADMIN_PRODUCTS.length;
  document.getElementById("stat-lowstock").textContent = lowStock;
  document.getElementById("stat-orders").textContent = orders.length;
  document.getElementById("stat-revenue").textContent = UI.money(revenue);
}

function renderProductsTable() {
  const body = document.getElementById("products-table-body");
  if (!ADMIN_PRODUCTS.length) {
    body.innerHTML = `<tr><td colspan="6" class="muted text-center">No products found.</td></tr>`;
    return;
  }
  body.innerHTML = ADMIN_PRODUCTS.map(p => `
    <tr data-id="${p.id}">
      <td><img src="${Sheets.resolvePhoto(p.photo)}" alt="" onerror="this.onerror=null;this.src='${CONFIG.PLACEHOLDER_IMAGE}';"></td>
      <td>${UI.escape(p.name)}</td>
      <td>${UI.escape(p.category)}</td>
      <td>${UI.money(p.price)}</td>
      <td>${p.stock <= 0 ? `<span class="muted" style="color:var(--tomato);">Out of stock</span>` : (p.stock <= 5 ? `<span style="color:var(--turmeric-dark);font-weight:700;">${p.stock} low</span>` : p.stock)}</td>
      <td class="admin-actions">
        <button class="btn btn-outline btn-sm edit-btn">Edit</button>
        <button class="btn btn-danger btn-sm delete-btn">Delete</button>
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("tr").forEach(row => {
    const id = row.dataset.id;
    const product = ADMIN_PRODUCTS.find(p => String(p.id) === id);
    row.querySelector(".edit-btn").addEventListener("click", () => openProductModal(product));
    row.querySelector(".delete-btn").addEventListener("click", () => deleteProduct(product));
  });
}

function renderOrdersTable() {
  const body = document.getElementById("orders-table-body");
  const orders = Orders.all();
  if (!orders.length) {
    body.innerHTML = `<tr><td colspan="6" class="muted text-center">No orders placed yet.</td></tr>`;
    return;
  }
  body.innerHTML = orders.map(o => `
    <tr data-id="${o.id}">
      <td>${o.id}</td>
      <td>${UI.escape(o.name)}<br><span class="muted" style="font-size:.78rem;">${UI.escape(o.userEmail)}</span></td>
      <td>${o.items.map(i => `${i.qty}× ${UI.escape(i.name)}`).join(", ")}</td>
      <td>${UI.money(o.total)}</td>
      <td>${UI.formatDate(o.date)}</td>
      <td>
        <select class="status-select">
          ${["Pending", "Confirmed", "Delivered", "Cancelled"].map(s => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("tr").forEach(row => {
    const id = row.dataset.id;
    row.querySelector(".status-select").addEventListener("change", (e) => {
      Orders.updateStatus(id, e.target.value);
      UI.toast("Order status updated");
      renderStats();
    });
  });
}

/* ---------- Product modal (add / edit) ---------- */
function openProductModal(product = null) {
  document.getElementById("modal-title").textContent = product ? "Edit product" : "Add product";
  document.getElementById("p-id").value = product ? product.id : "";
  document.getElementById("p-name").value = product ? product.name : "";
  document.getElementById("p-category").value = product ? product.category : "";
  document.getElementById("p-price").value = product ? product.price : "";
  document.getElementById("p-stock").value = product ? product.stock : "";
  document.getElementById("p-photo").value = product ? product.photo : "";
  document.getElementById("product-modal").classList.remove("hidden");
}
function closeProductModal() {
  document.getElementById("product-modal").classList.add("hidden");
}

function saveProductForm(e) {
  e.preventDefault();
  const id = document.getElementById("p-id").value;
  const data = {
    name: document.getElementById("p-name").value.trim(),
    category: document.getElementById("p-category").value.trim(),
    price: parseFloat(document.getElementById("p-price").value) || 0,
    stock: parseInt(document.getElementById("p-stock").value, 10) || 0,
    photo: document.getElementById("p-photo").value.trim()
  };

  const ov = Store.getOverrides();
  if (id) {
    // Editing an existing sheet row or a previously-added product
    const addedIndex = ov.added.findIndex(a => a.id === id);
    if (addedIndex > -1) {
      ov.added[addedIndex] = { ...ov.added[addedIndex], ...data };
    } else {
      ov.edited[id] = { ...(ov.edited[id] || {}), ...data };
    }
  } else {
    // New product only known to this browser until added to the Sheet
    ov.added.push({ id: Store.nextId("P"), ...data });
  }
  Store.saveOverrides(ov);

  ADMIN_PRODUCTS = Sheets.getCachedProducts();
  renderProductsTable();
  renderStats();
  closeProductModal();
  UI.toast("Product saved");
}

function deleteProduct(product) {
  if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;
  const ov = Store.getOverrides();
  ov.deleted.push(product.id);
  Store.saveOverrides(ov);
  ADMIN_PRODUCTS = Sheets.getCachedProducts();
  renderProductsTable();
  renderStats();
  UI.toast("Product deleted");
}
