/* =========================================================
   VillageMart — Authentication (demo-grade, localStorage based)
   Note: passwords are stored in plain text in localStorage for
   demo purposes only. Do not reuse this for a production app;
   wire up a real backend with hashed passwords instead.
   ========================================================= */

const Auth = {
  signup({ name, email, phone, password, address }) {
    const users = Store.getUsers();
    email = email.trim().toLowerCase();
    if (users.find(u => u.email === email)) {
      throw new Error("An account with this email already exists.");
    }
    const user = { name: name.trim(), email, phone: phone.trim(), password, address: address || "", role: "customer" };
    users.push(user);
    Store.saveUsers(users);
    Store.setCurrentUser(this._publicUser(user));
    return user;
  },

  login(email, password) {
    email = email.trim().toLowerCase();
    const users = Store.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error("Incorrect email or password.");
    Store.setCurrentUser(this._publicUser(user));
    return user;
  },

  logout() {
    Store.clearCurrentUser();
  },

  updateProfile(email, updates) {
    const users = Store.getUsers();
    const i = users.findIndex(u => u.email === email);
    if (i === -1) throw new Error("User not found.");
    users[i] = { ...users[i], ...updates };
    Store.saveUsers(users);
    Store.setCurrentUser(this._publicUser(users[i]));
    return users[i];
  },

  _publicUser(user) {
    return { name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role };
  },

  currentUser() { return Store.getCurrentUser(); },
  isLoggedIn() { return !!Store.getCurrentUser(); },
  isAdmin() {
    const u = Store.getCurrentUser();
    return !!u && u.role === "admin";
  },

  /* Redirect helpers used at the top of protected pages */
  requireLogin(redirectTo = "login.html") {
    if (!this.isLoggedIn()) {
      window.location.href = redirectTo + "?next=" + encodeURIComponent(window.location.pathname.split("/").pop());
      return false;
    }
    return true;
  },
  requireAdmin(redirectTo = "index.html") {
    if (!this.isAdmin()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  }
};
