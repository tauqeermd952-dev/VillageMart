/* =========================================================
   VillageMart — Global configuration
   =========================================================
   HOW TO CONNECT YOUR OWN GOOGLE SHEET
   -------------------------------------------------
   1. Create a Google Sheet with these columns in row 1 (exact
      order does not matter, names matching is enough):
         ID | Name | Category | Price | Stock | Photo
   2. File -> Share -> Publish to web -> choose the product
      sheet/tab -> Comma-separated values (.csv) -> Publish.
   3. Copy the generated URL and paste it below as SHEET_CSV_URL.
   4. Leave Photo empty for any row to use the default
      placeholder image automatically.

   Until you add a real link, VillageMart runs on built-in
   demo data so the app works out of the box.
   ========================================================= */

const CONFIG = {
  // Paste your published Google Sheet CSV link here:
  SHEET_CSV_URL: "",

  // WhatsApp business number in international format, no + or spaces
  WHATSAPP_NUMBER: "919999999999",

  CURRENCY: "₹",
  PLACEHOLDER_IMAGE: "assets/placeholder.svg",

  // How long (minutes) cached sheet data stays valid before refetching
  CACHE_MINUTES: 15,

  // Default category emoji map (falls back to a basket icon)
  CATEGORY_ICONS: {
    "Vegetables": "🥦",
    "Fruits": "🍎",
    "Dairy": "🥛",
    "Bakery": "🍞",
    "Grains": "🌾",
    "Beverages": "🧃",
    "Snacks": "🍪",
    "Spices": "🌶️",
    "Household": "🧺",
    "Personal Care": "🧴"
  }
};
