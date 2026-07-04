/* =========================================================
   VillageMart — Google Sheets product database connector
   =========================================================
   Reads product rows from a Google Sheet published as CSV
   (see CONFIG.SHEET_CSV_URL in js/config.js). Expected
   columns: ID, Name, Category, Price, Stock, Photo.

   Falls back to bundled demo data when no sheet is
   configured or the network request fails, so the app is
   always demoable.
   ========================================================= */

const Sheets = {

  /* Small built-in catalog used until a real sheet is connected */
  DEMO_PRODUCTS: [
    { id: "1", name: "Fresh Tomatoes (1kg)", category: "Vegetables", price: 40, stock: 32, photo: "" },
    { id: "2", name: "Organic Spinach Bunch", category: "Vegetables", price: 25, stock: 18, photo: "" },
    { id: "3", name: "Potatoes (1kg)", category: "Vegetables", price: 30, stock: 50, photo: "" },
    { id: "4", name: "Red Onions (1kg)", category: "Vegetables", price: 35, stock: 0, photo: "" },
    { id: "5", name: "Bananas (dozen)", category: "Fruits", price: 55, stock: 24, photo: "" },
    { id: "6", name: "Alphonso Mangoes (1kg)", category: "Fruits", price: 180, stock: 12, photo: "" },
    { id: "7", name: "Green Apples (1kg)", category: "Fruits", price: 160, stock: 20, photo: "" },
    { id: "8", name: "Full Cream Milk (1L)", category: "Dairy", price: 62, stock: 40, photo: "" },
    { id: "9", name: "Farm Fresh Paneer (200g)", category: "Dairy", price: 85, stock: 15, photo: "" },
    { id: "10", name: "Curd / Yogurt (400g)", category: "Dairy", price: 45, stock: 22, photo: "" },
    { id: "11", name: "Whole Wheat Bread", category: "Bakery", price: 48, stock: 10, photo: "" },
    { id: "12", name: "Butter Croissants (4pc)", category: "Bakery", price: 120, stock: 0, photo: "" },
    { id: "13", name: "Basmati Rice (5kg)", category: "Grains", price: 520, stock: 14, photo: "" },
    { id: "14", name: "Toor Dal (1kg)", category: "Grains", price: 140, stock: 30, photo: "" },
    { id: "15", name: "Orange Juice (1L)", category: "Beverages", price: 110, stock: 16, photo: "" },
    { id: "16", name: "Masala Tea (250g)", category: "Beverages", price: 95, stock: 28, photo: "" },
    { id: "17", name: "Banana Chips (200g)", category: "Snacks", price: 60, stock: 33, photo: "" },
    { id: "18", name: "Mixed Namkeen (400g)", category: "Snacks", price: 90, stock: 19, photo: "" },
    { id: "19", name: "Turmeric Powder (200g)", category: "Spices", price: 55, stock: 25, photo: "" },
    { id: "20", name: "Dish Wash Liquid (500ml)", category: "Household", price: 99, stock: 20, photo: "" }
  ],

  /* ---------- CSV parsing (handles quoted commas) ---------- */
  parseCSV(text) {
    const rows = [];
    let row = [], field = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i], next = text[i + 1];
      if (inQuotes) {
        if (c === '"' && next === '"') { field += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else { field += c; }
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ',') { row.push(field); field = ""; }
        else if (c === '\n' || c === '\r') {
          if (field !== "" || row.length) { row.push(field); rows.push(row); row = []; field = ""; }
          if (c === '\r' && next === '\n') i++;
        } else field += c;
      }
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows.filter(r => r.some(cell => cell.trim() !== ""));
  },

  rowsToProducts(rows) {
    if (!rows.length) return [];
    const header = rows[0].map(h => h.trim().toLowerCase());
    const idx = {
      id: header.indexOf("id"),
      name: header.indexOf("name"),
      category: header.indexOf("category"),
      price: header.indexOf("price"),
      stock: header.indexOf("stock"),
      photo: header.indexOf("photo")
    };
    const products = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r.length) continue;
      const name = idx.name > -1 ? (r[idx.name] || "").trim() : "";
      if (!name) continue;
      products.push({
        id: (idx.id > -1 && r[idx.id] && r[idx.id].trim()) || String(i),
        name,
        category: (idx.category > -1 && r[idx.category] && r[idx.category].trim()) || "Others",
        price: parseFloat(idx.price > -1 ? r[idx.price] : 0) || 0,
        stock: parseInt(idx.stock > -1 ? r[idx.stock] : 0, 10) || 0,
        photo: (idx.photo > -1 && r[idx.photo] && r[idx.photo].trim()) || ""
      });
    }
    return products;
  },

  /* ---------- fetch from the configured sheet ---------- */
  async fetchFromSheet() {
    if (!CONFIG.SHEET_CSV_URL) return null;
    const res = await fetch(CONFIG.SHEET_CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Sheet fetch failed: " + res.status);
    const text = await res.text();
    return this.rowsToProducts(this.parseCSV(text));
  },

  /* ---------- apply admin add/edit/delete overrides ---------- */
  applyOverrides(products) {
    const ov = Store.getOverrides();
    let list = products
      .filter(p => !ov.deleted.includes(p.id))
      .map(p => (ov.edited[p.id] ? { ...p, ...ov.edited[p.id] } : p));
    list = list.concat(ov.added.filter(a => !ov.deleted.includes(a.id)));
    return list;
  },

  /* ---------- public: load products (cache-first, then refresh) ---------- */
  async loadProducts({ forceRefresh = false } = {}) {
    const cache = Store.getProductCache();
    const isFresh = cache && (Date.now() - cache.fetchedAt) < CONFIG.CACHE_MINUTES * 60 * 1000;

    if (cache && isFresh && !forceRefresh) {
      return this.applyOverrides(cache.products);
    }

    try {
      const fresh = await this.fetchFromSheet();
      if (fresh && fresh.length) {
        Store.saveProductCache(fresh);
        return this.applyOverrides(fresh);
      }
    } catch (e) {
      console.warn("VillageMart: could not load Google Sheet, using cache/demo data.", e);
    }

    // Fall back to whatever we have cached, else the bundled demo catalog
    const base = (cache && cache.products) || this.DEMO_PRODUCTS;
    if (!cache) Store.saveProductCache(base);
    return this.applyOverrides(base);
  },

  /* Read-only sync accessor used by pages that already triggered a load */
  getCachedProducts() {
    const cache = Store.getProductCache();
    const base = (cache && cache.products) || this.DEMO_PRODUCTS;
    return this.applyOverrides(base);
  },

  resolvePhoto(photo) {
    return photo && photo.trim() ? photo.trim() : CONFIG.PLACEHOLDER_IMAGE;
  }
};
