/* =========================================================
   VillageMart — product.html page logic
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  UI.initHeader();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const products = await Sheets.loadProducts();
  const product = products.find(p => String(p.id) === String(id));
  const container = document.getElementById("detail-container");

  if (!product) {
    container.innerHTML = `<div class="empty-state"><span class="emoji">🚫</span>Product not found.<br><a href="products.html" class="btn btn-outline mt-16">Back to shop</a></div>`;
    return;
  }

  document.title = product.name + " — VillageMart";
  const photo = Sheets.resolvePhoto(product.photo);
  const outOfStock = product.stock <= 0;

  container.innerHTML = `
    <p class="breadcrumb"><a href="index.html">Home</a> / <a href="products.html">Shop</a> / <a href="products.html?category=${encodeURIComponent(product.category)}">${UI.escape(product.category)}</a> / ${UI.escape(product.name)}</p>
    <div class="detail-grid">
      <div class="detail-img">
        <img src="${photo}" alt="${UI.escape(product.name)}" onerror="this.onerror=null;this.src='${CONFIG.PLACEHOLDER_IMAGE}';">
      </div>
      <div>
        <span class="card-cat">${UI.escape(product.category)}</span>
        <h1>${UI.escape(product.name)}</h1>
        <div class="price-row"><span class="price">${UI.money(product.price)}</span></div>
        <p class="stock-line ${outOfStock ? "out" : "in"}">
          ${outOfStock ? "Currently out of stock" : `✔ In stock — ${product.stock} available`}
        </p>
        <p class="muted">Freshly sourced and quality checked before dispatch. Delivered same-day where available.</p>

        <div class="field" style="max-width:160px;">
          <label for="qty-input">Quantity</label>
          <div class="qty-control">
            <button type="button" id="qty-minus">−</button>
            <span id="qty-value">1</span>
            <button type="button" id="qty-plus">+</button>
          </div>
        </div>

        <div class="detail-actions">
          <button class="btn btn-primary" id="add-cart-btn" ${outOfStock ? "disabled" : ""}>🛒 Add to cart</button>
          <a class="btn btn-wa" id="wa-order-btn" target="_blank" rel="noopener">💬 Order via WhatsApp</a>
        </div>
      </div>
    </div>
  `;

  let qty = 1;
  const qtyValue = document.getElementById("qty-value");
  document.getElementById("qty-minus").addEventListener("click", () => {
    qty = Math.max(1, qty - 1); qtyValue.textContent = qty;
  });
  document.getElementById("qty-plus").addEventListener("click", () => {
    qty = Math.min(product.stock || 1, qty + 1); qtyValue.textContent = qty;
  });

  document.getElementById("add-cart-btn").addEventListener("click", () => {
    Cart.add(product.id, qty, product.stock);
    UI.toast(`${product.name} added to cart`);
    const badge = document.getElementById("cart-count");
    if (badge) { badge.textContent = Cart.count(); badge.style.display = "flex"; }
  });

  document.getElementById("wa-order-btn").href = UI.whatsappLink(
    `Hi VillageMart! I'd like to order:\n${qty} x ${product.name} - ${UI.money(product.price)} each\nTotal: ${UI.money(product.price * qty)}`
  );
  document.getElementById("qty-plus").addEventListener("click", () => {
    document.getElementById("wa-order-btn").href = UI.whatsappLink(
      `Hi VillageMart! I'd like to order:\n${qty} x ${product.name} - ${UI.money(product.price)} each\nTotal: ${UI.money(product.price * qty)}`
    );
  });
  document.getElementById("qty-minus").addEventListener("click", () => {
    document.getElementById("wa-order-btn").href = UI.whatsappLink(
      `Hi VillageMart! I'd like to order:\n${qty} x ${product.name} - ${UI.money(product.price)} each\nTotal: ${UI.money(product.price * qty)}`
    );
  });

  // Related products (same category)
  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  if (related.length) {
    document.getElementById("related-section").style.display = "";
    const grid = document.getElementById("related-grid");
    grid.innerHTML = related.map(p => UI.productCardHTML(p)).join("");
    UI.bindAddToCart(grid, products);
  }
});
