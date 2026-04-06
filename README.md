# NepalBite — React + Firebase 🇳🇵

Nepal's Food-Tech SaaS Platform built in React.js + Firebase.

## Project Structure

```
NepalBite/
├── public/
│   └── index.html              ← HTML shell
├── src/
│   ├── firebase.js             ← Firebase config (your credentials already here)
│   ├── App.jsx                 ← Routes: /, /admin, /table
│   ├── index.js                ← React entry point
│   │
│   ├── data/
│   │   └── menu.js             ← All 42 menu items (edit here to change menu)
│   │
│   ├── context/
│   │   ├── AuthContext.js      ← Login, Register, Forgot Password logic
│   │   └── CartContext.js      ← Cart state (add, remove, qty)
│   │
│   ├── hooks/
│   │   ├── useCursor.js        ← Custom gold cursor (PC only, hidden on phone)
│   │   └── useToast.js         ← Toast notification system
│   │
│   ├── styles/
│   │   └── globals.css         ← CSS variables, cursor, badges, inputs
│   │
│   ├── components/
│   │   ├── Navbar.jsx/css      ← Top nav + mobile drawer + user menu
│   │   ├── AuthModal.jsx/css   ← Login + Register + Forgot Password modal
│   │   ├── CartSidebar.jsx/css ← Slide-out cart with qty controls
│   │   ├── CheckoutModal.jsx/css ← All payment methods + print bill + Firestore save
│   │   └── Chatbot.jsx/css     ← Neela AI chatbot (mood, weather, budget suggestions)
│   │
│   └── pages/
│       ├── Home.jsx/css        ← Full customer site (hero, stories, menu, gallery, about, contact)
│       ├── Admin.jsx/css       ← Admin dashboard (Firebase auth, live orders, QR, export)
│       └── Table.jsx/css       ← QR table ordering page (/table?table=5)
│
├── package.json
└── README.md (this file)
```

## Run Locally (VS Code)

```bash
# Step 1 — Open terminal in VS Code (Ctrl + `)
# Step 2 — Install dependencies (only once)
npm install

# Step 3 — Start development server
npm start

# Your site opens at http://localhost:3000
# Admin panel: http://localhost:3000/admin
# Table QR:    http://localhost:3000/table?table=3
```

## Build for Production (Deploy to Netlify)

```bash
npm run build
```
This creates a `build/` folder. Drag that folder to https://app.netlify.com/drop

## Firebase Setup (Already Connected)

Your Firebase project `nepalbite-30c26` is already connected.

### Create Admin Account (One Time)
1. Go to https://console.firebase.google.com
2. Click project `nepalbite-30c26`
3. Authentication → Users → Add User
4. Email: admin@nepalbite.com | Password: Admin@123
5. Done — login at /admin with those credentials

### Firestore Rules (Paste in Firebase Console → Firestore → Rules → Publish)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /menu/{doc}     { allow read: if true; allow write: if request.auth != null; }
    match /orders/{doc}   { allow read, write: if request.auth != null; }
    match /stories/{doc}  { allow read: if true; allow write: if true; }
    match /feedback/{doc} { allow write: if true; allow read: if request.auth != null; }
    match /users/{doc}    { allow read, write: if request.auth != null; }
  }
}
```

## Pages & Features

### / (Customer Site — Home.jsx)
- Hero with search
- 24-hour Stories system with viewer
- Signature Dishes (10 famous items)
- Full menu (42 items, 8 categories, filter by category)
- Gallery with date archive
- Customer Login / Register / Forgot Password (Firebase Auth)
- Cart sidebar with qty controls
- Checkout with 6 payment methods (eSewa, Khalti, Fonepay, ConnectIPS, Card, Cash)
- Print / Download Bill (PDF)
- Feedback form → saved to Firestore
- Testimonials, About, Contact sections
- Neela AI Chatbot (mood, weather, budget, vegetarian, spicy suggestions)
- Custom gold cursor (PC/laptop only, never shows on phone)

### /admin (Admin Dashboard — Admin.jsx)
- Firebase Email/Password login
- Forgot Password → real email from Firebase
- Live orders from Firestore (updates in real time)
- Order status: Accept → Preparing → Ready → Delivered → Cancel
- Menu Manager (toggle live/hidden, add item → saves to Firestore)
- Story Moderation (approve/remove)
- Analytics charts (weekly revenue, monthly, categories)
- Customer Feedback (live from Firestore)
- Inventory tracking
- Tables & QR Code system (1-50 tables, print QR per table)
- Export: CSV, Excel, JSON, Print/PDF
- Settings with toggles
- Role-based view (Admin/Owner/Staff)

### /table?table=N (QR Table Page — Table.jsx)
- Customer scans QR → opens this page with table=N in URL
- Full menu with category filters
- Add to cart with qty controls
- Enter name + choose payment method
- Place order → saved to Firestore with tableNo field
- Admin sees "Table: T-N" in orders panel in real time
- Print / Download bill as PDF

## Edit Menu Items

Open `src/data/menu.js` and edit the MENU array.
Each item has: `id, name, nep, cat, price, desc, img, tags, famous, famDesc`

## Change Firebase Project

Edit `src/firebase.js` and replace the firebaseConfig values.

## Cursor Behaviour

- **PC/Laptop with mouse**: Gold dot cursor + ring follows smoothly
- **Phone/Tablet**: Zero cursor code runs, normal browser touch
- Never flickers, never shows bold on scroll

## Tech Stack
- React 18
- React Router v6
- Firebase 10 (Auth + Firestore + Storage)
- CSS Modules (no Tailwind, pure CSS variables)
- Playfair Display + DM Sans fonts
