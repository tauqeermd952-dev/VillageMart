/* =========================================================
   VillageMart — Order management
   ========================================================= */

const Orders = {
  place({ userEmail, items, total, name, phone, address, paymentMethod }) {
    const orders = Store.getOrders();
    const order = {
      id: Store.nextId("ORD"),
      userEmail,
      items: items.map(i => ({ id: i.product.id, name: i.product.name, price: i.product.price, qty: i.qty })),
      total,
      name, phone, address, paymentMethod,
      status: "Pending",
      date: new Date().toISOString()
    };
    orders.unshift(order);
    Store.saveOrders(orders);
    this._decrementStock(order.items);
    return order;
  },

  _decrementStock(items) {
    const ov = Store.getOverrides();
    items.forEach(({ id, qty }) => {
      const products = Sheets.getCachedProducts();
      const p = products.find(pp => String(pp.id) === String(id));
      const currentStock = p ? p.stock : 0;
      const newStock = Math.max(0, currentStock - qty);
      ov.edited[id] = { ...(ov.edited[id] || {}), stock: newStock };
    });
    Store.saveOverrides(ov);
  },

  forUser(email) {
    return Store.getOrders().filter(o => o.userEmail === email);
  },

  all() { return Store.getOrders(); },

  updateStatus(orderId, status) {
    const orders = Store.getOrders();
    const o = orders.find(o => o.id === orderId);
    if (o) { o.status = status; Store.saveOrders(orders); }
    return o;
  }
};
