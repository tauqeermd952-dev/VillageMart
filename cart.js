/* =========================================================
   VillageMart — Shopping cart logic
   Cart is stored as { productId: quantity } in localStorage
   ========================================================= */

const Cart = {
  get() { return Store.getCart(); },

  count() {
    const cart = this.get();
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  },

  add(productId, qty = 1, maxStock = Infinity) {
    const cart = this.get();
    const newQty = (cart[productId] || 0) + qty;
    cart[productId] = Math.max(1, Math.min(newQty, maxStock));
    Store.saveCart(cart);
    return cart[productId];
  },

  setQty(productId, qty, maxStock = Infinity) {
    const cart = this.get();
    if (qty <= 0) { delete cart[productId]; }
    else { cart[productId] = Math.min(qty, maxStock); }
    Store.saveCart(cart);
  },

  remove(productId) {
    const cart = this.get();
    delete cart[productId];
    Store.saveCart(cart);
  },

  clear() { Store.clearCart(); },

  /* Build a line-item list joined with live product data */
  getLineItems(products) {
    const cart = this.get();
    return Object.keys(cart)
      .map(id => {
        const product = products.find(p => String(p.id) === String(id));
        if (!product) return null;
        return { product, qty: cart[id], lineTotal: product.price * cart[id] };
      })
      .filter(Boolean);
  },

  total(products) {
    return this.getLineItems(products).reduce((sum, item) => sum + item.lineTotal, 0);
  }
};
