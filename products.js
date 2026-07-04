/* =========================================================
   VillageMart — products.html page logic
   ========================================================= */

let ALL_PRODUCTS = [];

document.addEventListener("DOMContentLoaded", async () => {
  UI.initHeader();
  document.getElementById("wa-float").href = UI.whatsappLink("Hi VillageMart! I'd like to place an order.");

  ALL_PRODUCTS = await Sheets.loadProducts();
  populateCategoryFilter(ALL_PRODUCTS);
  applyFiltersFromURL();
  applyAndRender();

  document.getElementById("search-input").addEventListener("input", debounce(applyAndRender, 200));
  document.getElementById("category-filter").addEventListener("change", applyAndRender);
  document.getElementById("sort-select").addEventListener("change", applyAndRender);
  document.getElementById("in-stock-only").addEventListener("change", applyAndRender);
});

function populateCategoryFilter(products) {
  const select = document.getElementById("category-filter");
  const cats = [...new Set(products.map(p => p.category))].sort();
  cats.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c;
    select.appendChild(opt);
  });
}

function applyFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  const search = params.get("search");
  const category = params.get("category");
  if (search) document.getElementById("search-input").value = search;
  if (category) document.getElementById("category-filter").value = category;
}

function applyAndRender() {
  const search = document.getElementById("search-input").value.trim().toLowerCase();
  const category = document.getElementById("category-filter").value;
  const sort = document.getElementById("sort-select").value;
  const inStockOnly = document.getElementById("in-stock-only").checked;

  let list = ALL_PRODUCTS.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search);
    const matchesCategory = !category || p.category === category;
    const matchesStock = !inStockOnly || p.stock > 0;
    return matchesSearch && matchesCategory && matchesStock;
  });

  switch (sort) {
    case "price-asc": list.sort((a, b) => a.price - b.price); break;
    case "price-desc": list.sort((a, b) => b.price - a.price); break;
    case "name-asc": list.sort((a, b) => a.name.localeCompare(b.name)); break;
    case "stock-desc": list.sort((a, b) => b.stock - a.stock); break;
  }

  document.getElementById("result-count").textContent =
    `${list.length} product${list.length === 1 ? "" : "s"} found`;

  const grid = document.getElementById("product-grid");
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span class="emoji">🔍</span>No products match your search.<br>Try a different keyword or clear filters.</div>`;
    return;
  }
  grid.innerHTML = list.map(p => UI.productCardHTML(p)).join("");
  UI.bindAddToCart(grid, ALL_PRODUCTS);
}

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}
