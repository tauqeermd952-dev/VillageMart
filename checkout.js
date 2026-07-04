/* =========================================================
   VillageMart — checkout.html page logic
   ========================================================= */

const DELIVERY_FEE = 20;
let CHECKOUT_PRODUCTS = [];
let CHECKOUT_ITEMS = [];

document.addEventListener("DOMContentLoaded", async () => {
  UI.initHeader();
  if (!Auth.requireLogin("login.html")) return;

  CHECKOUT_PRODUCTS = await Sheets.loadProducts();
  CHECKOUT_ITEMS = Cart.getLineItems(CHECKOUT_PRODUCTS);

  if (!CHECKOUT_ITEMS.length) {
    UI.toast("Your cart is empty");
    setTimeout(() => window.location.href = "products.html", 800);
    return;
  }

  const user = Auth.currentUser();
  document.getElementById("name").value = user.name || "";
  document.getElementById("phone").value = user.phone || "";
  document.getElementById("address").value = user.address || "";

  renderSummary();

  document.getElementById("checkout-form").addEventListener("submit", (e) => {
    e.preventDefault();
    placeOrder();
  });
});

function renderSummary() {
  const wrap = document.getElementById("checkout-items");
  wrap.innerHTML = CHECKOUT_ITEMS.map(item => `
    <div class="summary-row"><span>${item.qty} × ${UI.escape(item.product.name)}</span><span>${UI.money(item.lineTotal)}</span></div>
  `).join("");

  const subtotal = CHECKOUT_ITEMS.reduce((s, i) => s + i.lineTotal, 0);
  document.getElementById("sum-subtotal").textContent = UI.money(subtotal);
  document.getElementById("sum-delivery").textContent = UI.money(DELIVERY_FEE);
  document.getElementById("sum-total").textContent = UI.money(subtotal + DELIVERY_FEE);
}

function placeOrder() {
  const user = Auth.currentUser();
  const subtotal = CHECKOUT_ITEMS.reduce((s, i) => s + i.lineTotal, 0);
  const total = subtotal + DELIVERY_FEE;

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const paymentMethod = document.getElementById("payment").value;

  const order = Orders.place({
    userEmail: user.email,
    items: CHECKOUT_ITEMS,
    total, name, phone, address, paymentMethod
  });

  Cart.clear();

  // Compose a WhatsApp message summarizing the order for the store to see
  const lines = CHECKOUT_ITEMS.map(i => `• ${i.qty} x ${i.product.name} — ${UI.money(i.lineTotal)}`).join("\n");
  const message = `🧺 New VillageMart Order (#${order.id})\n\n${lines}\n\nDelivery: ${UI.money(DELIVERY_FEE)}\nTotal: ${UI.money(total)}\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\nPayment: ${paymentMethod}`;

  UI.toast("Order placed successfully!");
  const waLink = UI.whatsappLink(message);
  window.open(waLink, "_blank");

  setTimeout(() => window.location.href = "orders.html", 700);
}
