
/**
 * HUNNAR HOUSE — CLIENT APPLICATION
 * Features: Firebase Auth & Firestore, Cart Management,
 * Search, Notifications, UPI Checkout, Receipt Print, Admin Tools.
 */

// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyCd-7tTPQXGU8SaSpZrs9Ct5aWv0jXbtU4",
  authDomain: "hunnar-house.firebaseapp.com",
  projectId: "hunnar-house",
  storageBucket: "hunnar-house.firebasestorage.app",
  messagingSenderId: "312766139472",
  appId: "1:312766139472:web:1a48c6fab5689e2d6a5555"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// 2. STATE & CONFIG
const ADMIN_EMAILS = [
  "hunnarhouse19@gmail.com",
  "daksh0413+hh@gmail.com"
];

let currentUser = null;
let currentProducts = [];
let cart = JSON.parse(localStorage.getItem("hh_cart") || "[]");
let notifications = [
  { id: '1', title: "Welcome to Hunnar House", text: "Every item is lovingly made by heart. Enjoy exploring!", date: "Today" }
];

// Fallback seed catalog
const SEED_PRODUCTS = [
  {
    id: "p1",
    title: "Artisan Scented Soy Candle",
    category: "candles",
    price: 349,
    img: "https://res.cloudinary.com/dpeijmtb6/image/upload/v1791720629/Hunnar_House_wvvnud.jpg",
    desc: "Hand-poured aromatic candle with botanical oils."
  },
  {
    id: "p2",
    title: "Handcrafted Chocolate Truffle Box",
    category: "chocolates",
    price: 499,
    img: "https://res.cloudinary.com/dpeijmtb6/image/upload/v1791720629/Hunnar_House_wvvnud.jpg",
    desc: "Assorted melt-in-mouth artisanal chocolates."
  },
  {
    id: "p3",
    title: "Curated Celebration Gift Hamper",
    category: "gifts",
    price: 999,
    img: "https://res.cloudinary.com/dpeijmtb6/image/upload/v1791720629/Hunnar_House_wvvnud.jpg",
    desc: "Bespoke gift box packed with sweets and thoughtful items."
  }
];

// 3. DOM ELEMENTS
const googleSignInBtn = document.getElementById("googleSignInBtn");
const userMenuWrapper = document.getElementById("userMenuWrapper");
const userAvatarImg = document.getElementById("userAvatarImg");
const userAvatarBtn = document.getElementById("userAvatarBtn");
const userDropdown = document.getElementById("userDropdown");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const adminDashboardBtn = document.getElementById("adminDashboardBtn");
const signOutBtn = document.getElementById("signOutBtn");

const notifTriggerBtn = document.getElementById("notifTriggerBtn");
const notificationDropdown = document.getElementById("notificationDropdown");
const notifCountBadge = document.getElementById("notifCountBadge");
const notifListContainer = document.getElementById("notifListContainer");
const markAllReadBtn = document.getElementById("markAllReadBtn");

const memberUpdatesSection = document.getElementById("memberUpdatesSection");
const updatesGrid = document.getElementById("updatesGrid");

const productsGrid = document.getElementById("productsGrid");
const categoryFilterBar = document.getElementById("categoryFilterBar");

const cartTriggerBtn = document.getElementById("cartTriggerBtn");
const cartBadge = document.getElementById("cartBadge");
const cartDrawer = document.getElementById("cartDrawer");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartItemsList = document.getElementById("cartItemsList");
const cartFooterSection = document.getElementById("cartFooterSection");
const cartSubtotalVal = document.getElementById("cartSubtotalVal");
const cartTotalVal = document.getElementById("cartTotalVal");
const proceedCheckoutBtn = document.getElementById("proceedCheckoutBtn");

const searchTriggerBtn = document.getElementById("searchTriggerBtn");
const searchModal = document.getElementById("searchModal");
const closeSearchBtn = document.getElementById("closeSearchBtn");
const liveSearchInput = document.getElementById("liveSearchInput");
const searchResultsContainer = document.getElementById("searchResultsContainer");

const checkoutModal = document.getElementById("checkoutModal");
const closeCheckoutBtn = document.getElementById("closeCheckoutBtn");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutTotalDisplay = document.getElementById("checkoutTotalDisplay");

const receiptModal = document.getElementById("receiptModal");
const closeReceiptBtn = document.getElementById("closeReceiptBtn");
const printableReceiptContent = document.getElementById("printableReceiptContent");
const printReceiptBtn = document.getElementById("printReceiptBtn");

const adminModal = document.getElementById("adminModal");
const closeAdminBtn = document.getElementById("closeAdminBtn");
const newProductForm = document.getElementById("newProductForm");
const adminProductsList = document.getElementById("adminProductsList");
const newUpdateForm = document.getElementById("newUpdateForm");
const adminUpdatesList = document.getElementById("adminUpdatesList");
const adminOrdersList = document.getElementById("adminOrdersList");

// 4. AUTHENTICATION LOGIC
auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  if (user) {
    googleSignInBtn.style.display = "none";
    userMenuWrapper.style.display = "block";
    userAvatarImg.src = user.photoURL || "https://res.cloudinary.com/dpeijmtb6/image/upload/v1791132164/logo_hunnar_house_b5hefn.png";
    userName.textContent = user.displayName || "Member";
    userEmail.textContent = user.email;

    const isAdmin = ADMIN_EMAILS.includes((user.email || "").toLowerCase());
    if (isAdmin) {
      adminDashboardBtn.style.display = "block";
    } else {
      adminDashboardBtn.style.display = "none";
    }

    // Reveal Member-Only Daily Updates Section
    memberUpdatesSection.style.display = "block";
    loadMemberUpdates();
  } else {
    googleSignInBtn.style.display = "flex";
    userMenuWrapper.style.display = "none";
    userDropdown.classList.remove("open");
    memberUpdatesSection.style.display = "none";
  }
});

// Google Sign-In
googleSignInBtn.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (err) {
    alert("Sign-in error: " + err.message);
  }
});

// Sign-Out
signOutBtn.addEventListener("click", () => {
  auth.signOut();
});

userAvatarBtn.addEventListener("click", () => {
  userDropdown.classList.toggle("open");
});

// 5. NOTIFICATION CENTER
function renderNotifications() {
  notifCountBadge.textContent = notifications.length;
  if (notifications.length === 0) {
    notifListContainer.innerHTML = `<p class="empty-notif" style="padding: 10px; color:#888;">No announcements right now.</p>`;
    return;
  }
  notifListContainer.innerHTML = notifications.map(n => `
    <div class="notif-item">
      <strong>${n.title}</strong>
      <span>${n.text}</span>
    </div>
  `).join("");
}

notifTriggerBtn.addEventListener("click", () => {
  notificationDropdown.classList.toggle("open");
});

markAllReadBtn.addEventListener("click", () => {
  notifications = [];
  renderNotifications();
});

// 6. MEMBER DAILY UPDATES
async function loadMemberUpdates() {
  try {
    const snap = await db.collection("daily_updates").get();
    let updates = [];
    snap.forEach(doc => updates.push({ id: doc.id, ...doc.data() }));

    if (updates.length === 0) {
      updates = [
        {
          title: "Fresh Soy Wax Pours Today",
          content: "Ruchi is making fresh lavender batches for the upcoming gifting season."
        }
      ];
    }

    updatesGrid.innerHTML = updates.map(u => `
      <div class="update-card">
        <h3>${u.title}</h3>
        <p>${u.content}</p>
      </div>
    `).join("");

    // Add into notifications as announcements
    updates.forEach(u => {
      if (!notifications.some(n => n.title === u.title)) {
        notifications.push({ id: u.title, title: u.title, text: u.content });
      }
    });
    renderNotifications();
  } catch (err) {
    console.error("Updates fetch notice:", err);
  }
}

// 7. CATALOG & PRODUCTS
async function loadProducts(category = "all") {
  productsGrid.innerHTML = `<p class="status-msg">Loading handmade collection...</p>`;
  try {
    const snap = await db.collection("products").get();
    currentProducts = [];
    snap.forEach(doc => currentProducts.push({ id: doc.id, ...doc.data() }));

    if (currentProducts.length === 0) {
      currentProducts = SEED_PRODUCTS;
    }
  } catch (err) {
    currentProducts = SEED_PRODUCTS;
  }

  const filtered = category === "all" 
    ? currentProducts 
    : currentProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());

  renderProductGrid(filtered);
}

function renderProductGrid(items) {
  if (items.length === 0) {
    productsGrid.innerHTML = `<p class="status-msg">No products in this category.</p>`;
    return;
  }

  productsGrid.innerHTML = items.map(p => `
    <div class="product-card">
      <div style="overflow:hidden;">
        <img src="${p.img}" alt="${p.title}" class="product-card-img" />
      </div>
      <div class="product-card-info">
        <h3 class="product-card-title">${p.title}</h3>
        <p class="product-card-desc">${p.desc}</p>
        <div class="product-card-footer">
          <span class="product-price">₹${p.price}</span>
          <button class="btn btn-secondary" onclick="addToCart('${p.id}')">
            Add to Bag
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

// Category Filters
categoryFilterBar.addEventListener("click", (e) => {
  if (e.target.classList.contains("filter-btn")) {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    loadProducts(e.target.dataset.category);
  }
});

// 8. CART & CHECKOUT
window.addToCart = function(productId) {
  const item = currentProducts.find(p => p.id === productId);
  if (!item) return;

  const existing = cart.find(ci => ci.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }

  saveCart();
  renderCart();
  cartDrawer.classList.add("open");
};

function saveCart() {
  localStorage.setItem("hh_cart", JSON.stringify(cart));
  cartBadge.textContent = cart.reduce((acc, i) => acc + i.qty, 0);
}

function renderCart() {
  if (cart.length === 0) {
    cartItemsList.innerHTML = `<p class="empty-msg">Your shopping bag is empty.</p>`;
    cartFooterSection.style.display = "none";
    return;
  }

  cartFooterSection.style.display = "block";
  let subtotal = 0;

  cartItemsList.innerHTML = cart.map(item => {
    subtotal += item.price * item.qty;
    return `
      <div class="cart-row">
        <img src="${item.img}" alt="${item.title}" />
        <div class="cart-row-details">
          <strong>${item.title}</strong>
          <div>₹${item.price}</div>
          <div class="cart-qty-ctrl">
            <button onclick="updateQty('${item.id}', -1)">-</button>
            <span>${item.qty}</span>
            <button onclick="updateQty('${item.id}', 1)">+</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  const delivery = 50;
  const total = subtotal + delivery;
  cartSubtotalVal.textContent = `₹${subtotal}`;
  cartTotalVal.textContent = `₹${total}`;
}

window.updateQty = function(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
  renderCart();
};

cartTriggerBtn.addEventListener("click", () => {
  renderCart();
  cartDrawer.classList.add("open");
});
closeCartBtn.addEventListener("click", () => cartDrawer.classList.remove("open"));

proceedCheckoutBtn.addEventListener("click", () => {
  if (!currentUser) {
    alert("Please sign in with Google to proceed with checkout.");
    return;
  }
  cartDrawer.classList.remove("open");
  const total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0) + 50;
  checkoutTotalDisplay.textContent = `₹${total}`;
  checkoutModal.classList.add("open");
});
closeCheckoutBtn.addEventListener("click", () => checkoutModal.classList.remove("open"));

// Form Submit -> UPI Launch & Pending Receipt
checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const total = subtotal + 50;
  const orderId = "HH-" + Math.floor(100000 + Math.random() * 900000);

  const orderData = {
    orderId,
    userId: currentUser ? currentUser.uid : "guest",
    customerName: document.getElementById("custName").value,
    phone: document.getElementById("custPhone").value,
    address: `${document.getElementById("custStreet").value}, ${document.getElementById("custArea").value} - ${document.getElementById("custPin").value}`,
    items: cart,
    subtotal,
    delivery: 50,
    total,
    status: "Confirmed",
    paymentStatus: "Payment Pending Verification",
    createdAt: new Date().toISOString()
  };

  try {
    await db.collection("orders").doc(orderId).set(orderData);
  } catch (err) {
    console.warn("Saved locally due to offline/permission state");
  }

  // Construct official UPI payment intent link
  const upiUrl = `upi://pay?pa=8218498535%40fam&pn=Hunnar%20House&am=${total}&cu=INR&tn=Order%20${orderId}`;
  
  // Open UPI app on compatible devices
  window.open(upiUrl, "_blank");

  // Show receipt
  renderReceipt(orderData);
  checkoutModal.classList.remove("open");
  receiptModal.classList.add("open");

  // Clear cart
  cart = [];
  saveCart();
});

// 9. RECEIPT GENERATOR
function renderReceipt(order) {
  printableReceiptContent.innerHTML = `
    <div class="receipt-head">
      <img src="https://res.cloudinary.com/dpeijmtb6/image/upload/v1791132164/logo_hunnar_house_b5hefn.png" style="height: 50px; margin: 0 auto 10px auto; background:#fff; padding:4px;" alt="Hunnar House" />
      <h2>Hunnar House</h2>
      <p>Handmade Gifts, Chocolates &amp; Candles</p>
      <p>Order No: <strong>#${order.orderId}</strong></p>
      <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
    </div>
    <div style="margin: 16px 0;">
      <p><strong>Customer:</strong> ${order.customerName} (${order.phone})</p>
      <p><strong>Shipping Address:</strong> ${order.address}</p>
    </div>
    <table class="receipt-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(it => `
          <tr>
            <td>${it.title}</td>
            <td>${it.qty}</td>
            <td>₹${it.price * it.qty}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <div style="text-align: right; margin-top: 10px;">
      <p>Subtotal: ₹${order.subtotal}</p>
      <p>Delivery: ₹${order.delivery}</p>
      <h3>Total: ₹${order.total}</h3>
      <p style="margin-top: 8px; color: var(--wine);">Status: <strong>${order.paymentStatus}</strong></p>
    </div>
    <div style="text-align: center; margin-top: 24px; font-size: 0.85rem;">
      <p>Thank you for supporting hand-crafted arts!</p>
      <p>Contact: +91 6396699104 | hunnarhouse19@gmail.com</p>
    </div>
  `;
}

closeReceiptBtn.addEventListener("click", () => receiptModal.classList.remove("open"));
printReceiptBtn.addEventListener("click", () => window.print());

// 10. LIVE SEARCH MODAL
searchTriggerBtn.addEventListener("click", () => {
  searchModal.classList.add("open");
  liveSearchInput.focus();
});
closeSearchBtn.addEventListener("click", () => searchModal.classList.remove("open"));

liveSearchInput.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  if (q.length < 2) {
    searchResultsContainer.innerHTML = `<p class="search-tip">Type at least 2 characters to search...</p>`;
    return;
  }

  const results = currentProducts.filter(p => 
    p.title.toLowerCase().includes(q) || 
    p.desc.toLowerCase().includes(q) || 
    p.category.toLowerCase().includes(q)
  );

  if (results.length === 0) {
    searchResultsContainer.innerHTML = `<p class="search-tip">No handmade items matched your search.</p>`;
    return;
  }

  searchResultsContainer.innerHTML = results.map(p => `
    <div class="search-item" onclick="selectSearchedProduct('${p.id}')">
      <img src="${p.img}" alt="${p.title}" />
      <div>
        <strong>${p.title}</strong>
        <div>₹${p.price}</div>
      </div>
    </div>
  `).join("");
});

window.selectSearchedProduct = function(id) {
  searchModal.classList.remove("open");
  addToCart(id);
};

// 11. ADMIN STUDIO CONTROLS
adminDashboardBtn.addEventListener("click", () => {
  userDropdown.classList.remove("open");
  adminModal.classList.add("open");
  loadAdminProducts();
  loadAdminOrders();
});
closeAdminBtn.addEventListener("click", () => adminModal.classList.remove("open"));

// Admin tabs
document.querySelectorAll(".admin-tabs .tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-tabs .tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".admin-tab-pane").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Admin Add Product
newProductForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newProd = {
    title: document.getElementById("prodTitle").value,
    price: Number(document.getElementById("prodPrice").value),
    category: document.getElementById("prodCategory").value,
    img: document.getElementById("prodImgUrl").value,
    desc: document.getElementById("prodDesc").value
  };

  try {
    await db.collection("products").add(newProd);
    alert("Product added successfully!");
    newProductForm.reset();
    loadAdminProducts();
    loadProducts();
  } catch (err) {
    alert("Error saving: " + err.message);
  }
});

async function loadAdminProducts() {
  try {
    const snap = await db.collection("products").get();
    let prods = [];
    snap.forEach(d => prods.push({ id: d.id, ...d.data() }));
    adminProductsList.innerHTML = prods.map(p => `
      <div class="admin-list-row">
        <span>${p.title} - ₹${p.price}</span>
        <button class="btn btn-secondary" style="padding: 4px 10px;" onclick="deleteProduct('${p.id}')">Delete</button>
      </div>
    `).join("");
  } catch (e) {}
}

window.deleteProduct = async function(id) {
  if (confirm("Delete this product?")) {
    await db.collection("products").doc(id).delete();
    loadAdminProducts();
    loadProducts();
  }
};

// Admin Add Announcement
newUpdateForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const update = {
    title: document.getElementById("updateTitle").value,
    content: document.getElementById("updateContent").value,
    createdAt: new Date().toISOString()
  };
  try {
    await db.collection("daily_updates").add(update);
    alert("Announcement published!");
    newUpdateForm.reset();
    loadMemberUpdates();
  } catch (err) {
    alert(err.message);
  }
});

async function loadAdminOrders() {
  try {
    const snap = await db.collection("orders").get();
    let orders = [];
    snap.forEach(d => orders.push({ id: d.id, ...d.data() }));
    adminOrdersList.innerHTML = orders.map(o => `
      <div class="admin-list-row">
        <span>#${o.orderId} - ₹${o.total} (${o.customerName})</span>
        <span>${o.paymentStatus}</span>
      </div>
    `).join("");
  } catch (e) {}
}

// 12. INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  saveCart();
  renderNotifications();
  loadProducts();
});
