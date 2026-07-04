/* =========================================================
   VillageMart — Shared UI helpers used on every page
   ========================================================= */

const UI = {
  money(n) {
    return CONFIG.CURRENCY + Number(n).toFixed(2).replace(/\.00$/, "");
  },

  toast(message, ms = 2200) {
    let el = document.getElementById("vm-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "vm-toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove("show"), ms);
  },

  /* Wires up hamburger menu, cart badge, and login/logout nav state.
     Call once on DOMContentLoaded on every page. */
  initHeader() {
    const burger = document.querySelector(".hamburger");
    const links = document.querySelector(".nav-links");
    if (burger && links) {
      burger.addEventListener("click", () => links.classList.toggle("open"));
      links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => links.classList.remove("open")));
    }

    const badge = document.getElementById("cart-count");
    if (badge) {
      const count = Cart.count();
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    }

    const authSlot = document.getElementById("auth-slot");
    const adminLink = document.getElementById("admin-link");
    const user = Auth.currentUser();

    if (authSlot) {
      if (user) {
        authSlot.innerHTML = `
          <a href="profile.html">👤 ${this.escape(user.name.split(" ")[0])}</a>
          <button class="link-btn" id="logout-btn">Logout</button>`;
        document.getElementById("logout-btn").addEventListener("click", () => {
          Auth.logout();
          UI.toast("Logged out");
          setTimeout(() => window.location.href = "index.html", 500);
        });
      } else {
        authSlot.innerHTML = `<a href="login.html">Login</a><a href="signup.html">Sign Up</a>`;
      }
    }

    if (adminLink) adminLink.style.display = Auth.isAdmin() ? "" : "none";

    // Highlight active nav link
    const current = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach(a => {
      if (a.getAttribute("href") === current) a.classList.add("active");
    });
  },

  escape(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  },

  categoryIcon(cat) {
    return (CONFIG.CATEGORY_ICONS && CONFIG.CATEGORY_ICONS[cat]) || "🧺";
  },

  /* Renders a single product card element (used on home + listing pages) */
  productCardHTML(p) {
    const photo = Sheets.resolvePhoto(p.photo);
    const outOfStock = Number(p.stock) <= 0;
    return `
      <div class="product-card" data-id="${p.id}">
        <a href="product.html?id=${encodeURIComponent(p.id)}" class="thumb-wrap">
          <img src="${photo}" alt="${this.escape(p.name)}" loading="lazy"
               onerror="this.onerror=null;this.src='${CONFIG.PLACEHOLDER_IMAGE}';">
          ${!outOfStock ? `<span class="tag-stock">${p.stock} in stock</span>` : `<span class="tag-out">OUT OF STOCK</span>`}
        </a>
        <div class="card-body">
          <span class="card-cat">${this.escape(p.category)}</span>
          <a href="product.html?id=${encodeURIComponent(p.id)}" class="card-name" style="color:inherit;">${this.escape(p.name)}</a>
          <div class="card-price">${this.money(p.price)}</div>
          <div class="card-actions">
            <button class="btn btn-primary btn-sm add-to-cart-btn" data-id="${p.id}" ${outOfStock ? "disabled" : ""}>
              ${outOfStock ? "Unavailable" : "Add to cart"}
            </button>
          </div>
        </div>
      </div>`;
  },

  /* Delegated click handler for "add to cart" buttons inside a container */
  bindAddToCart(containerEl, products) {
    containerEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".add-to-cart-btn");
      if (!btn) return;
      const id = btn.dataset.id;
      const product = products.find(p => String(p.id) === String(id));
      if (!product || product.stock <= 0) return;
      Cart.add(id, 1, product.stock);
      UI.toast(`${product.name} added to cart`);
      const badge = document.getElementById("cart-count");
      if (badge) { badge.textContent = Cart.count(); badge.style.display = "flex"; }
    });
  },

  whatsappLink(text) {
    return `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  },

  formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) +
      " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
};
