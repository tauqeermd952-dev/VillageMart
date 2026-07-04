# 🌿 VillageMart

A complete, mobile-first grocery shopping web app built with plain **HTML, CSS and JavaScript** — no frameworks, no build step. Product data is loaded live from a **Google Sheet**.

---

## ✨ Features

- Modern green & white, mobile-first responsive UI
- Login & Signup (localStorage-based demo auth)
- Home page with hero banner and category browsing
- Product listing with image, name, price, stock, category
- Search and filters (category, price sort, in-stock only)
- Product details page with quantity selector
- Shopping cart with quantity +/- controls
- Checkout page with delivery details & payment method
- Order history per user
- User profile management
- Admin dashboard: stats, product Add/Edit/Delete, order status management
- "Order via WhatsApp" button on product & checkout pages
- Products load automatically from a Google Sheet on app start
- Missing photos automatically fall back to a placeholder image

---

## 📁 Project structure

```
villagemart/
├── index.html            Home page (hero, categories, featured products)
├── login.html            Login page
├── signup.html           Signup page
├── products.html         Full product listing with search/filters
├── product.html          Single product details page (?id=...)
├── cart.html             Shopping cart
├── checkout.html         Checkout / delivery details
├── orders.html           Order history (per logged-in user)
├── profile.html          User profile
├── admin.html            Admin dashboard (products + orders)
├── css/
│   └── style.css         All styling (design tokens, layout, components)
├── js/
│   ├── config.js         Global settings (Sheet URL, WhatsApp number, etc.)
│   ├── store.js          localStorage helpers (users, cart, orders, overrides)
│   ├── sheets.js         Google Sheets loader + CSV parser + demo fallback
│   ├── auth.js           Signup / login / logout / route guards
│   ├── cart.js           Cart logic
│   ├── orders.js         Order placement & history
│   ├── ui.js             Shared UI helpers (nav, toasts, product cards)
│   ├── products.js       products.html page logic
│   ├── product-details.js product.html page logic
│   ├── checkout.js       checkout.html page logic
│   └── admin.js          admin.html page logic
├── assets/
│   └── placeholder.svg   Default image shown when Photo column is empty
└── README.md
```

---

## 🔌 Connecting your Google Sheet (product database)

1. Create a Google Sheet with a header row containing these columns (any order):

   | ID | Name | Category | Price | Stock | Photo |
   |----|------|----------|-------|-------|-------|

   - **Photo** should be a direct image URL. Leave it blank to automatically show the default placeholder image.
2. In Google Sheets: **File → Share → Publish to web**.
3. Choose the sheet/tab with your products, set the format to **Comma-separated values (.csv)**, then click **Publish**.
4. Copy the generated URL.
5. Open `js/config.js` and paste it into `SHEET_CSV_URL`:

   ```js
   const CONFIG = {
     SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/XXXXXXX/pub?output=csv",
     ...
   };
   ```
6. Reload the app — products load automatically on startup. They're re-fetched every `CACHE_MINUTES` (default 15) and cached in `localStorage` in between, or instantly via the **🔄 Refresh from Google Sheet** button on the Admin dashboard.

Until you add a real link, VillageMart runs on a small built-in demo catalog so the app works out of the box.

---

## 🛠️ Admin product Add/Edit/Delete — how it works

A published CSV feed from Google Sheets is **read-only** from the browser. So that the Admin dashboard's Add/Edit/Delete still works immediately, VillageMart stores admin changes as an **override layer** in `localStorage` (`vm_product_overrides`) that is merged on top of whatever comes from the Sheet. This means:

- Edits/deletes to a Sheet product apply in this browser without touching the Sheet itself.
- New products added from the dashboard exist in this browser until you also add them as a row in the Sheet.
- This keeps the demo fully functional without requiring a backend.

### Optional: real write-back to Google Sheets

If you want Add/Edit/Delete to actually update the Sheet for everyone, add a small [Google Apps Script](https://developers.google.com/apps-script) Web App that handles `doPost` requests and writes to the sheet, then call it from `js/admin.js` with `fetch()`. Example Apps Script starting point:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Products");
  const data = JSON.parse(e.postData.contents);

  if (data.action === "add") {
    sheet.appendRow([data.id, data.name, data.category, data.price, data.stock, data.photo]);
  }
  if (data.action === "edit") {
    const rows = sheet.getDataRange().getValues();
    const rowIndex = rows.findIndex(r => String(r[0]) === String(data.id));
    if (rowIndex > -1) {
      sheet.getRange(rowIndex + 1, 1, 1, 6).setValues([[data.id, data.name, data.category, data.price, data.stock, data.photo]]);
    }
  }
  if (data.action === "delete") {
    const rows = sheet.getDataRange().getValues();
    const rowIndex = rows.findIndex(r => String(r[0]) === String(data.id));
    if (rowIndex > -1) sheet.deleteRow(rowIndex + 1);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
```

Deploy it as a Web App (Execute as: Me, Access: Anyone), then POST to its URL from `admin.js`.

---

## 💬 WhatsApp ordering

Set your store's WhatsApp number in `js/config.js`:

```js
WHATSAPP_NUMBER: "919999999999" // country code + number, no + or spaces
```

Buttons on the product page, checkout page, and the floating chat button all open WhatsApp with a pre-filled order message.

---

## 👤 Demo accounts

- **Admin:** `admin@villagemart.com` / `admin123` (seeded automatically on first load)
- **Customer:** create one via the Signup page

---

## 🚀 Running the app

No build tools needed — it's static HTML/CSS/JS.

- Easiest: open `index.html` directly in a browser, or
- Recommended: serve the folder with any static server so relative fetches behave consistently, e.g.:
  ```bash
  npx serve .
  # or
  python3 -m http.server 8080
  ```
Then visit `http://localhost:8080`.

---

## ⚠️ Notes on this demo

- Authentication and orders are stored in the browser's `localStorage` — this is a front-end demo, not a production-grade backend. For real deployments, replace `js/auth.js` / `js/orders.js` calls with real API requests to your backend.
- Passwords are stored in plain text locally for demo simplicity — never do this in production.
