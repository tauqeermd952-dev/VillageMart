/* =========================================================
   VillageMart — localStorage-backed data store
   Acts as the app's lightweight "database" for everything
   that isn't the product catalog (which comes from Sheets).
   ========================================================= */

const STORE_KEYS = {
  USERS: "vm_users",
  CURRENT_USER: "vm_current_user",
  CART: "vm_cart",
  ORDERS: "vm_orders",
  PRODUCT_CACHE: "vm_product_cache",
  PRODUCT_OVERRIDES: "vm_product_overrides" // admin add/edit/delete on top of the sheet
};

const Store = {
  /* ---------- generic helpers ---------- */
  _get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn("Store read error for", key, e);
      return fallback;
    }
  },
  _set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  /* ---------- users ---------- */
  getUsers() { return this._get(STORE_KEYS.USERS, []); },
  saveUsers(users) { this._set(STORE_KEYS.USERS, users); },

  ensureSeedAdmin() {
    const users = this.getUsers();
    if (!users.find(u => u.email === "admin@villagemart.com")) {
      users.push({
        name: "Store Admin",
        email: "admin@villagemart.com",
        phone: "9999999999",
        password: "admin123",
        role: "admin",
        address: "VillageMart HQ"
      });
      this.saveUsers(users);
    }
  },

  getCurrentUser() { return this._get(STORE_KEYS.CURRENT_USER, null); },
  setCurrentUser(user) { this._set(STORE_KEYS.CURRENT_USER, user); },
  clearCurrentUser() { localStorage.removeItem(STORE_KEYS.CURRENT_USER); },

  /* ---------- cart: { productId: qty } ---------- */
  getCart() { return this._get(STORE_KEYS.CART, {}); },
  saveCart(cart) { this._set(STORE_KEYS.CART, cart); },
  clearCart() { this._set(STORE_KEYS.CART, {}); },

  /* ---------- orders ---------- */
  getOrders() { return this._get(STORE_KEYS.ORDERS, []); },
  saveOrders(orders) { this._set(STORE_KEYS.ORDERS, orders); },

  /* ---------- product cache (raw sheet snapshot) ---------- */
  getProductCache() { return this._get(STORE_KEYS.PRODUCT_CACHE, null); },
  saveProductCache(products) {
    this._set(STORE_KEYS.PRODUCT_CACHE, { fetchedAt: Date.now(), products });
  },

  /* ---------- admin overrides on top of the sheet ---------- */
  getOverrides() {
    return this._get(STORE_KEYS.PRODUCT_OVERRIDES, { added: [], edited: {}, deleted: [] });
  },
  saveOverrides(overrides) { this._set(STORE_KEYS.PRODUCT_OVERRIDES, overrides); },

  /* ---------- misc ---------- */
  nextId(prefix) {
    return prefix + "_" + Date.now().toString(36) + Math.floor(Math.random() * 1000);
  }
};

Store.ensureSeedAdmin();
