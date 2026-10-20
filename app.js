/**
 * Hunnar House | Crafted by Heart
 * Complete Single-Module Application Logic
 */

(function () {
  "use strict";

  // 1. Unified Configuration
  const CONFIG = {
    firebase: {
      apiKey: "AIzaSyCd-7tTPQXGU8SaSpZrs9Ct5aWv0jXbtU4",
      authDomain: "hunnar-house.firebaseapp.com",
      projectId: "hunnar-house",
      storageBucket: "hunnar-house.firebasestorage.app",
      messagingSenderId: "312766139472",
      appId: "1:312766139472:web:1a48c6fab5689e2d6a5555",
      measurementId: "G-XXDRDDKPFP"
    },
    emailJs: {
      serviceId: "hunnarhouse",
      publicKey: "66SDByOxsHd8RK6d_",
      welcomeTemplateId: "template_v9s3zbh"
    },
    cloudinary: {
      cloudName: "uxvgni3y",
      uploadPreset: "ml_default"
    },
    adminEmails: ["hunnarhouse19@gmail.com", "daksh0413+hh@gmail.com"],
    upiId: "8218498535@fam",
    shippingCharge: 0 // Free or flat shipping
  };

  // 2. Local State Store
  const State = {
    user: null,
    isAdmin: false,
    isBlocked: false,
    profile: null,
    products: [],
    cart: JSON.parse(localStorage.getItem("hh_cart") || "[]"),
    activeCategory: "all",
    modalProduct: null,
    modalQty: 1,
    pendingAddress: null
  };

  // 3. Fallback Initial Inventory
  const DEFAULT_PRODUCTS = [
    {
      id: "prod_candle_lavender",
      title: "Calming Lavender Soy Candle",
      category: "Candles",
      price: 499,
      stock: "in_stock",
      description: "Hand-poured pure soy candle with soothing natural lavender oil. Lead-free wick for a 35-hour clean burn.",
      image: "https://res.cloudinary.com/dpeijmtb6/image/upload/v1791720629/Hunnar_House_wvvnud.jpg"
    },
    {
      id: "prod_choco_truffle",
      title: "Artisanal Cocoa Truffle Box",
      category: "Chocolates",
      price: 599,
      stock: "in_stock",
      description: "A fresh box of 12 artisan chocolate truffles with roasted nuts and pure cocoa butter.",
      image: "https://res.cloudinary.com/dpeijmtb6/image/upload/v1791720629/Hunnar_House_wvvnud.jpg"
    },
    {
      id: "prod_gift_festive",
      title: "Signature Celebration Hamper",
      category: "Gifts",
      price: 1299,
      stock: "in_stock",
      description: "Bespoke gift box with two hand-poured aroma candles, fresh chocolate treats, and keepsake greeting cards.",
      image: "https://res.cloudinary.com/dpeijmtb6/image/upload/v1791720629/Hunnar_House_wvvnud.jpg"
    }
  ];

  // 4. Initialize Firebase & Services
  let auth, db;
  try {
    firebase.initializeApp(CONFIG.firebase);
    auth = firebase.auth();
    db = firebase.firestore();
    emailjs.init(CONFIG.emailJs.publicKey);
  } catch (err) {
    console.warn("Notice: Initializing with local operational storage.");
  }

  // 5. Core Application Engine
  const App = {
    init: function () {
      this.bindEvents();
      this.bindAuthObserver();
      this.loadCatalog();
      this.renderCartUI();
    },

    // ---------------- UI Navigation ----------------
    navigateTo: function (tabId) {
      document.querySelectorAll(".app-tab").forEach(tab => tab.classList.remove("active"));
      const target = document.getElementById(tabId);
      if (target) target.classList.add("active");

      document.querySelectorAll(".nav-item, .mob-btn").forEach(btn => {
        if (btn.dataset.tab === tabId) btn.classList.add("active");
        else btn.classList.remove("active");
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    },

    switchCategory: function (category) {
      State.activeCategory = category;
      this.navigateTo("tabShop");
      
      document.querySelectorAll(".tag-btn").forEach(btn => {
        if (btn.dataset.cat === category) btn.classList.add("active");
        else btn.classList.remove("active");
      });

      this.renderCatalogGrid();
    },

    // ---------------- Auth Management ----------------
    bindAuthObserver: function () {
      if (!auth) return;
      auth.onAuthStateChanged(async (user) => {
        State.user = user;
        if (user) {
          State.isAdmin = CONFIG.adminEmails.includes((user.email || "").toLowerCase());
          await this.loadUserProfile(user.uid);
          this.updateAuthUI(true);

          if (State.isAdmin) {
            this.loadAdminData();
          }
          this.loadDailyUpdates();
        } else {
          State.isAdmin = false;
          State.isBlocked = false;
          State.profile = null;
          this.updateAuthUI(false);
        }
      });
    },

    updateAuthUI: function (isLoggedIn) {
      const slot = document.getElementById("authSlot");
      const mobLabel = document.getElementById("mobAccountLabel");

      if (isLoggedIn) {
        const displayName = (State.user.displayName || State.user.email.split("@")[0]);
        slot.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px;">
            <button class="btn btn-outline btn-sm" onclick="App.navigateTo('${State.isAdmin ? "tabAdmin" : "tabAccount"}')">
              ${State.isAdmin ? "Admin Portal" : "Hi, " + displayName}
            </button>
            <button class="btn btn-outline btn-sm" onclick="App.logout()">Logout</button>
          </div>
        `;
        if (mobLabel) mobLabel.textContent = State.isAdmin ? "Admin" : "Account";

        document.getElementById("userNameDisplay").textContent = displayName;
        document.getElementById("userEmailDisplay").textContent = State.user.email;
        document.getElementById("userAvatarText").textContent = displayName[0].toUpperCase();
      } else {
        slot.innerHTML = `<button class="btn btn-outline" onclick="App.openLoginModal()">Sign In</button>`;
        if (mobLabel) mobLabel.textContent = "Sign In";
      }
    },

    loadUserProfile: async function (uid) {
      if (!db) return;
      try {
        const doc = await db.collection("customers").doc(uid).get();
        if (doc.exists) {
          State.profile = doc.data();
          State.isBlocked = !!State.profile.blocked;
          if (State.isBlocked) {
            this.showBanner("Your account has ordering restrictions. Please contact our studio team for assistance.");
          }
          // Populate profile fields
          if (State.profile.address) {
            document.getElementById("profName").value = State.profile.name || "";
            document.getElementById("profPhone").value = State.profile.phone || "";
            document.getElementById("profStreet").value = State.profile.address.street || "";
            document.getElementById("profArea").value = State.profile.address.area || "";
            document.getElementById("profCity").value = State.profile.address.city || "";
            document.getElementById("profState").value = State.profile.address.state || "";
            document.getElementById("profPin").value = State.profile.address.pin || "";
          }
        }
      } catch (err) {
        console.error("Profile load:", err);
      }
    },

    openLoginModal: function () {
      document.getElementById("loginModal").classList.remove("hidden");
    },

    closeLoginModal: function () {
      document.getElementById("loginModal").classList.add("hidden");
    },

    toggleAuthTab: function (tab) {
      const isLogin = tab === "login";
      document.getElementById("tabHeadLogin").classList.toggle("active", isLogin);
      document.getElementById("tabHeadSignup").classList.toggle("active", !isLogin);
      document.getElementById("signInForm").classList.toggle("hidden", !isLogin);
      document.getElementById("signUpForm").classList.toggle("hidden", isLogin);
    },

    loginGoogle: async function () {
      if (!auth) return;
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
        this.closeLoginModal();
      } catch (err) {
        alert("Google sign-in could not be completed. Please try again.");
      }
    },

    logout: async function () {
      if (auth) await auth.signOut();
      this.navigateTo("tabHome");
    },

    triggerForgotPassword: async function () {
      const email = prompt("Please enter your registered email address:");
      if (!email || !auth) return;
      try {
        await auth.sendPasswordResetEmail(email);
        alert("A password reset link has been sent to your email.");
      } catch (err) {
        alert("Could not send reset email. Please verify your address.");
      }
    },

    // ---------------- Catalog & Data Management ----------------
    loadCatalog: async function () {
      if (db) {
        try {
          const snapshot = await db.collection("products").get();
          if (!snapshot.empty) {
            State.products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          } else {
            State.products = [...DEFAULT_PRODUCTS];
          }
        } catch (err) {
          State.products = [...DEFAULT_PRODUCTS];
        }
      } else {
        State.products = [...DEFAULT_PRODUCTS];
      }

      this.renderCatalogGrid();
      this.renderFeaturedGrid();
    },

    renderCatalogGrid: function () {
      const container = document.getElementById("shopCatalogList");
      if (!container) return;

      const filtered = State.products.filter(p => {
        if (State.activeCategory === "all") return true;
        return p.category === State.activeCategory;
      });

      if (!filtered.length) {
        container.innerHTML = `<p class="muted-text" style="grid-column: 1/-1; text-align:center;">No items found in this collection right now.</p>`;
        return;
      }

      container.innerHTML = filtered.map(prod => `
        <div class="product-item">
          <div class="prod-thumb-wrap" onclick="App.openProductModal('${prod.id}')">
            <img src="${prod.image}" alt="${prod.title}" class="prod-thumb" />
          </div>
          <div class="prod-body">
            <span class="prod-category">${prod.category}</span>
            <h4 class="prod-name">${prod.title}</h4>
            <p class="prod-desc-preview">${prod.description}</p>
            <div class="prod-foot">
              <span class="prod-price">₹${prod.price}</span>
              <button class="btn btn-outline btn-sm" onclick="App.quickAddToCart('${prod.id}')">Add to Bag</button>
            </div>
          </div>
        </div>
      `).join("");
    },

    renderFeaturedGrid: function () {
      const container = document.getElementById("homeFeaturedList");
      if (!container) return;
      const featured = State.products.slice(0, 3);
      container.innerHTML = featured.map(prod => `
        <div class="product-item">
          <div class="prod-thumb-wrap" onclick="App.openProductModal('${prod.id}')">
            <img src="${prod.image}" alt="${prod.title}" class="prod-thumb" />
          </div>
          <div class="prod-body">
            <span class="prod-category">${prod.category}</span>
            <h4 class="prod-name">${prod.title}</h4>
            <div class="prod-foot">
              <span class="prod-price">₹${prod.price}</span>
              <button class="btn btn-primary btn-sm" onclick="App.quickAddToCart('${prod.id}')">Add to Bag</button>
            </div>
          </div>
        </div>
      `).join("");
    },

    // ---------------- Product Modal ----------------
    openProductModal: function (prodId) {
      const prod = State.products.find(p => p.id === prodId);
      if (!prod) return;
      State.modalProduct = prod;
      State.modalQty = 1;

      document.getElementById("modalProductImg").src = prod.image;
      document.getElementById("modalProductCat").textContent = prod.category;
      document.getElementById("modalProductTitle").textContent = prod.title;
      document.getElementById("modalProductPrice").textContent = `₹${prod.price}`;
      document.getElementById("modalProductDesc").textContent = prod.description;
      document.getElementById("modalProductStock").textContent = prod.stock === "in_stock" ? "Available in Stock" : "Out of Stock";
      document.getElementById("modalQtyVal").textContent = "1";

      const addBtn = document.getElementById("modalAddCartBtn");
      addBtn.disabled = prod.stock !== "in_stock";

      document.getElementById("productDetailModal").classList.remove("hidden");
    },

    closeProductModal: function () {
      document.getElementById("productDetailModal").classList.add("hidden");
      State.modalProduct = null;
    },

    adjustModalQty: function (delta) {
      State.modalQty = Math.max(1, State.modalQty + delta);
      document.getElementById("modalQtyVal").textContent = State.modalQty;
    },

    addModalToCart: function () {
      if (!State.modalProduct) return;
      this.addToCart(State.modalProduct.id, State.modalQty);
      this.closeProductModal();
      this.toggleCartDrawer(true);
    },

    quickAddToCart: function (prodId) {
      this.addToCart(prodId, 1);
      this.toggleCartDrawer(true);
    },

    // ---------------- Cart & Checkout ----------------
    addToCart: function (prodId, qty) {
      const prod = State.products.find(p => p.id === prodId);
      if (!prod || prod.stock !== "in_stock") return;

      const existing = State.cart.find(i => i.id === prodId);
      if (existing) {
        existing.qty += qty;
      } else {
        State.cart.push({
          id: prod.id,
          title: prod.title,
          price: prod.price,
          image: prod.image,
          qty: qty
        });
      }
      this.persistCart();
    },

    adjustCartQty: function (prodId, delta) {
      const item = State.cart.find(i => i.id === prodId);
      if (!item) return;
      item.qty += delta;
      if (item.qty <= 0) {
        State.cart = State.cart.filter(i => i.id !== prodId);
      }
      this.persistCart();
    },

    persistCart: function () {
      localStorage.setItem("hh_cart", JSON.stringify(State.cart));
      this.renderCartUI();
    },

    renderCartUI: function () {
      const countBadge = document.getElementById("cartCountBadge");
      const list = document.getElementById("cartItemsList");
      const subtotalEl = document.getElementById("cartSubtotalVal");
      const totalEl = document.getElementById("cartTotalVal");

      const totalItems = State.cart.reduce((sum, item) => sum + item.qty, 0);
      if (countBadge) countBadge.textContent = totalItems;

      if (!State.cart.length) {
        list.innerHTML = `<p class="empty-state">Your bag is currently empty.</p>`;
        subtotalEl.textContent = "₹0";
        totalEl.textContent = "₹0";
        return;
      }

      const subtotal = State.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      const total = subtotal + CONFIG.shippingCharge;

      list.innerHTML = State.cart.map(item => `
        <div style="display:flex; gap:12px; margin-bottom:14px; align-items:center; border-bottom:1px solid #F0EAE1; padding-bottom:10px;">
          <img src="${item.image}" style="width:48px; height:48px; border-radius:4px; object-fit:cover;" />
          <div style="flex-grow:1;">
            <div style="font-weight:600; font-size:0.9rem;">${item.title}</div>
            <div style="color:var(--accent-maroon); font-size:0.85rem;">₹${item.price} &times; ${item.qty}</div>
          </div>
          <div class="qty-stepper">
            <button onclick="App.adjustCartQty('${item.id}', -1)">-</button>
            <span>${item.qty}</span>
            <button onclick="App.adjustCartQty('${item.id}', 1)">+</button>
          </div>
        </div>
      `).join("");

      subtotalEl.textContent = `₹${subtotal}`;
      totalEl.textContent = `₹${total}`;
    },

    toggleCartDrawer: function (open) {
      const drawer = document.getElementById("cartDrawer");
      if (open) drawer.classList.remove("hidden");
      else drawer.classList.add("hidden");
    },

    openCheckoutModal: function () {
      if (!State.user) {
        this.openLoginModal();
        return;
      }
      if (State.isBlocked) {
        alert("Your account has ordering restrictions. Please contact our team.");
        return;
      }
      if (!State.cart.length) {
        alert("Your bag is empty.");
        return;
      }

      this.toggleCartDrawer(false);
      this.populateCheckoutForm();
      document.getElementById("checkoutStepAddress").classList.remove("hidden");
      document.getElementById("checkoutStepReview").classList.add("hidden");
      document.getElementById("checkoutModal").classList.remove("hidden");
    },

    closeCheckoutModal: function () {
      document.getElementById("checkoutModal").classList.add("hidden");
    },

    populateCheckoutForm: function () {
      if (State.profile && State.profile.address) {
        document.getElementById("coName").value = State.profile.name || "";
        document.getElementById("coPhone").value = State.profile.phone || "";
        document.getElementById("coStreet").value = State.profile.address.street || "";
        document.getElementById("coArea").value = State.profile.address.area || "";
        document.getElementById("coCity").value = State.profile.address.city || "";
        document.getElementById("coState").value = State.profile.address.state || "";
        document.getElementById("coPin").value = State.profile.address.pin || "";
      }
    },

    returnToAddressStep: function () {
      document.getElementById("checkoutStepAddress").classList.remove("hidden");
      document.getElementById("checkoutStepReview").classList.add("hidden");
    },

    handleAddressReview: function (e) {
      e.preventDefault();
      State.pendingAddress = {
        name: document.getElementById("coName").value.trim(),
        phone: document.getElementById("coPhone").value.trim(),
        street: document.getElementById("coStreet").value.trim(),
        area: document.getElementById("coArea").value.trim(),
        city: document.getElementById("coCity").value.trim(),
        state: document.getElementById("coState").value.trim(),
        pin: document.getElementById("coPin").value.trim()
      };

      const subtotal = State.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      const total = subtotal + CONFIG.shippingCharge;

      // Construct verified UPI link
      const upiLink = `upi://pay?pa=${encodeURIComponent(CONFIG.upiId)}&pn=Hunnar%20House&am=${total}&cu=INR`;
      const upiBtn = document.getElementById("upiIntentLink");
      if (upiBtn) upiBtn.href = upiLink;

      const summaryHtml = `
        <div style="font-size:0.9rem; line-height:1.6; margin-bottom:14px;">
          <strong>Deliver to:</strong><br />
          ${State.pendingAddress.name} &bull; ${State.pendingAddress.phone}<br />
          ${State.pendingAddress.street}, ${State.pendingAddress.area}<br />
          ${State.pendingAddress.city}, ${State.pendingAddress.state} - ${State.pendingAddress.pin}
        </div>
        <hr style="margin:10px 0; border:0; border-top:1px solid #EEE;" />
        <div style="font-size:0.92rem;">
          <strong>Items (${State.cart.length}):</strong>
          ${State.cart.map(i => `<div>${i.title} &times; ${i.qty} — ₹${i.price * i.qty}</div>`).join("")}
          <div style="margin-top:8px; font-weight:700;">Payable Amount: ₹${total}</div>
        </div>
      `;
      document.getElementById("checkoutReviewSummary").innerHTML = summaryHtml;

      document.getElementById("checkoutStepAddress").classList.add("hidden");
      document.getElementById("checkoutStepReview").classList.remove("hidden");
    },

    submitFinalOrder: async function () {
      const subtotal = State.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      const total = subtotal + CONFIG.shippingCharge;
      const orderId = "HH-" + Date.now().toString().slice(-6);

      const orderRecord = {
        orderId: orderId,
        customerId: State.user.uid,
        customerEmail: State.user.email,
        address: State.pendingAddress,
        items: [...State.cart],
        subtotal: subtotal,
        shipping: CONFIG.shippingCharge,
        total: total,
        paymentMethod: "UPI",
        paymentStatus: "Pending Verification",
        orderStatus: "Confirmed",
        createdAt: new Date().toISOString()
      };

      if (db) {
        try {
          await db.collection("orders").doc(orderId).set(orderRecord);
        } catch (err) {
          console.error("Database save fallback:", err);
        }
      }

      // Save order in local history
      const localOrders = JSON.parse(localStorage.getItem("hh_orders") || "[]");
      localOrders.unshift(orderRecord);
      localStorage.setItem("hh_orders", JSON.stringify(localOrders));

      // Clear Cart
      State.cart = [];
      this.persistCart();
      this.closeCheckoutModal();

      // Show Receipt
      this.displayReceipt(orderRecord);
    },

    displayReceipt: function (order) {
      const container = document.getElementById("printableInvoice");
      container.innerHTML = `
        <div class="receipt-head">
          <div>
            <h2 style="margin:0; font-size:1.6rem;">Hunnar House</h2>
            <div style="font-style:italic; color:#6B1D2F;">Crafted by Heart</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;">Order: ${order.orderId}</div>
            <div style="font-size:0.85rem;">Date: ${new Date(order.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div class="receipt-meta-grid">
          <div>
            <strong>Delivery Address:</strong><br />
            ${order.address.name}<br />
            ${order.address.street}, ${order.address.area}<br />
            ${order.address.city}, ${order.address.state} - ${order.address.pin}<br />
            Phone: ${order.address.phone}
          </div>
          <div style="text-align:right;">
            <strong>Payment Method:</strong> ${order.paymentMethod}<br />
            <strong>Payment Status:</strong> ${order.paymentStatus}<br />
            <strong>Order Status:</strong> ${order.orderStatus}
          </div>
        </div>

        <table class="receipt-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.title}</td>
                <td>${item.qty}</td>
                <td>₹${item.price}</td>
                <td>₹${item.price * item.qty}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div style="text-align:right; font-size:1.05rem; font-weight:700; margin-bottom:20px;">
          Final Amount Payable: ₹${order.total}
        </div>

        <div style="text-align:center; font-family:'Cormorant Garamond', Georgia, serif; font-style:italic; font-size:1.15rem; color:#4D101E;">
          Thank you for choosing handmade treasures. Crafted with love.
        </div>
      `;

      document.getElementById("receiptModal").classList.remove("hidden");
    },

    closeReceiptModal: function () {
      document.getElementById("receiptModal").classList.add("hidden");
    },

    // ---------------- Daily Updates ----------------
    loadDailyUpdates: async function () {
      const container = document.getElementById("updatesContainer");
      if (!container) return;

      let updates = [];
      if (db) {
        try {
          const snap = await db.collection("daily_updates").orderBy("createdAt", "desc").get();
          updates = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
          updates = [];
        }
      }

      if (!updates.length) {
        container.innerHTML = `<p class="muted-text" style="text-align:center;">No new updates posted today. Please check back soon!</p>`;
        return;
      }

      container.innerHTML = updates.map(u => `
        <div class="update-card">
          <div class="update-date">${new Date(u.createdAt).toLocaleDateString()}</div>
          <h3>${u.title}</h3>
          ${u.image ? `<img src="${u.image}" class="update-img" />` : ""}
          <p>${u.content}</p>
        </div>
      `).join("");
    },

    // ---------------- Search Pop-Up ----------------
    openSearchModal: function () {
      document.getElementById("searchModal").classList.remove("hidden");
      document.getElementById("liveSearchInput").focus();
    },

    closeSearchModal: function () {
      document.getElementById("searchModal").classList.add("hidden");
    },

    handleLiveSearch: function (term) {
      const resultsEl = document.getElementById("liveSearchResults");
      term = term.trim().toLowerCase();
      if (!term) {
        resultsEl.innerHTML = `<p class="empty-state">Type a word to search our collection.</p>`;
        return;
      }

      const matches = State.products.filter(p => 
        p.title.toLowerCase().includes(term) || 
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );

      if (!matches.length) {
        resultsEl.innerHTML = `<p class="empty-state">No matching items found for "${term}".</p>`;
        return;
      }

      resultsEl.innerHTML = matches.map(prod => `
        <div style="display:flex; align-items:center; gap:12px; padding:10px; border-bottom:1px solid #EEE; cursor:pointer;" onclick="App.openProductModal('${prod.id}'); App.closeSearchModal();">
          <img src="${prod.image}" style="width:40px; height:40px; border-radius:4px; object-fit:cover;" />
          <div>
            <div style="font-weight:600; font-size:0.9rem;">${prod.title}</div>
            <div style="color:var(--accent-maroon); font-size:0.82rem;">${prod.category} &bull; ₹${prod.price}</div>
          </div>
        </div>
      `).join("");
    },

    // ---------------- Cloudinary Image Upload ----------------
    uploadImage: async function (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CONFIG.cloudinary.uploadPreset);

      const endpoint = `https://api.cloudinary.com/v1_1/${CONFIG.cloudinary.cloudName}/image/upload`;
      const res = await fetch(endpoint, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Image upload could not be completed.");
      const data = await res.json();
      return data.secure_url;
    },

    // ---------------- Studio Admin Dashboard ----------------
    showAdminPane: function (paneId) {
      document.querySelectorAll(".admin-pane").forEach(p => p.classList.remove("active"));
      document.querySelectorAll(".adm-btn").forEach(b => b.classList.remove("active"));
      document.getElementById(paneId).classList.add("active");
      
      const targetBtn = Array.from(document.querySelectorAll(".adm-btn")).find(b => b.getAttribute("onclick").includes(paneId));
      if (targetBtn) targetBtn.classList.add("active");
    },

    loadAdminData: async function () {
      this.renderAdminProducts();
      this.renderAdminOrders();
      this.renderAdminCustomers();
    },

    renderAdminProducts: function () {
      const table = document.getElementById("adminProductsTable");
      if (!table) return;
      table.innerHTML = `
        <table class="admin-table">
          <thead>
            <tr><th>Item</th><th>Category</th><th>Price</th><th>Stock</th><th>Action</th></tr>
          </thead>
          <tbody>
            ${State.products.map(p => `
              <tr>
                <td><strong>${p.title}</strong></td>
                <td>${p.category}</td>
                <td>₹${p.price}</td>
                <td>${p.stock}</td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="App.deleteProduct('${p.id}')">Delete</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    },

    deleteProduct: async function (prodId) {
      if (!confirm("Are you sure you want to remove this item?")) return;
      if (db) {
        await db.collection("products").doc(prodId).delete();
      }
      State.products = State.products.filter(p => p.id !== prodId);
      this.renderAdminProducts();
      this.renderCatalogGrid();
    },

    renderAdminOrders: async function () {
      const table = document.getElementById("adminOrdersTable");
      if (!table) return;

      let orders = [];
      if (db) {
        try {
          const snap = await db.collection("orders").orderBy("createdAt", "desc").get();
          orders = snap.docs.map(d => d.data());
        } catch (e) {
          orders = JSON.parse(localStorage.getItem("hh_orders") || "[]");
        }
      } else {
        orders = JSON.parse(localStorage.getItem("hh_orders") || "[]");
      }

      table.innerHTML = `
        <table class="admin-table">
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Update</th></tr>
          </thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td><strong>${o.orderId}</strong></td>
                <td>${o.address.name} (${o.address.phone})</td>
                <td>₹${o.total}</td>
                <td>${o.paymentStatus}</td>
                <td>${o.orderStatus}</td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="App.toggleOrderStatus('${o.orderId}', '${o.orderStatus}')">Next Step</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    },

    toggleOrderStatus: async function (orderId, currentStatus) {
      const nextMap = {
        "Confirmed": "Preparing",
        "Preparing": "Dispatched",
        "Dispatched": "Delivered"
      };
      const next = nextMap[currentStatus] || "Confirmed";
      if (db) {
        await db.collection("orders").doc(orderId).update({ orderStatus: next });
      }
      this.renderAdminOrders();
    },

    renderAdminCustomers: async function () {
      const table = document.getElementById("adminCustomersTable");
      if (!table || !db) return;

      try {
        const snap = await db.collection("customers").get();
        const customers = snap.docs.map(d => ({ uid: d.id, ...d.data() }));

        table.innerHTML = `
          <table class="admin-table">
            <thead>
              <tr><th>Customer Name</th><th>Email</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${customers.map(c => `
                <tr>
                  <td>${c.name || "Member"}</td>
                  <td>${c.email}</td>
                  <td>${c.blocked ? "<span style='color:red;'>Blocked</span>" : "Active"}</td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick="App.toggleBlockCustomer('${c.uid}',${!c.blocked})">
                      ${c.blocked ? "Unblock" : "Block"}
                    </button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
      } catch (err) {
        table.innerHTML = `<p class="muted-text">Customer records will appear here as accounts register.</p>`;
      }
    },

    toggleBlockCustomer: async function (uid, block) {
      if (!confirm(`Are you sure you want to ${block ? "block" : "unblock"} this customer?`)) return;
      if (db) {
        await db.collection("customers").doc(uid).set({ blocked: block }, { merge: true });
        this.renderAdminCustomers();
      }
    },

    uploadFounderPhoto: async function () {
      const fileInput = document.getElementById("admFounderFile");
      const file = fileInput.files[0];
      if (!file) return;

      const spinner = document.getElementById("founderSpinner");
      spinner.classList.remove("hidden");

      try {
        const url = await this.uploadImage(file);
        document.getElementById("founderImageElem").src = url;
        if (db) {
          await db.collection("settings").doc("homepage").set({ founderPhoto: url }, { merge: true });
        }
        alert("Artisan photo updated successfully.");
      } catch (err) {
        alert("Photo upload failed. Please try again.");
      } finally {
        spinner.classList.add("hidden");
      }
    },

    // ---------------- Event Listeners ----------------
    bindEvents: function () {
      const self = this;

      // Brand Home Link
      document.getElementById("brandHomeLink").addEventListener("click", (e) => {
        e.preventDefault();
        self.navigateTo("tabHome");
      });

      // Navigation Items
      document.querySelectorAll(".nav-item, .mob-btn").forEach(btn => {
        btn.addEventListener("click", function () {
          const tab = this.dataset.tab;
          const cat = this.dataset.category;
          if (cat) self.switchCategory(cat);
          else if (tab) self.navigateTo(tab);
        });
      });

      // Cart Buttons
      document.getElementById("headerCartBtn").addEventListener("click", () => self.toggleCartDrawer(true));
      document.getElementById("openSearchBtn").addEventListener("click", () => self.openSearchModal());

      // Search Inputs
      const searchBox = document.getElementById("liveSearchInput");
      if (searchBox) {
        searchBox.addEventListener("input", (e) => self.handleLiveSearch(e.target.value));
      }

      const inlineSearch = document.getElementById("inlineSearchInput");
      if (inlineSearch) {
        inlineSearch.addEventListener("input", (e) => {
          const val = e.target.value.toLowerCase();
          document.querySelectorAll(".product-item").forEach(card => {
            const title = card.querySelector(".prod-name").textContent.toLowerCase();
            card.style.display = title.includes(val) ? "" : "none";
          });
        });
      }

      // Checkout form address progression
      const coForm = document.getElementById("checkoutDeliveryForm");
      if (coForm) coForm.addEventListener("submit", (e) => self.handleAddressReview(e));

      // Inquiry Form
      const inqForm = document.getElementById("inquiryForm");
      if (inqForm) {
        inqForm.addEventListener("submit", (e) => {
          e.preventDefault();
          alert("Thank you for your message! Our team will get back to you shortly.");
          inqForm.reset();
        });
      }

      // Sign In / Sign Up Forms
      const signIn = document.getElementById("signInForm");
      if (signIn) {
        signIn.addEventListener("submit", async (e) => {
          e.preventDefault();
          const email = document.getElementById("loginEmail").value.trim();
          const pass = document.getElementById("loginPass").value.trim();
          try {
            await auth.signInWithEmailAndPassword(email, pass);
            self.closeLoginModal();
          } catch (err) {
            alert("Could not sign in. Please verify your email and password.");
          }
        });
      }

      const signUp = document.getElementById("signUpForm");
      if (signUp) {
        signUp.addEventListener("submit", async (e) => {
          e.preventDefault();
          const name = document.getElementById("regName").value.trim();
          const email = document.getElementById("regEmail").value.trim();
          const pass = document.getElementById("regPass").value.trim();

          try {
            const cred = await auth.createUserWithEmailAndPassword(email, pass);
            await cred.user.updateProfile({ displayName: name });
            if (db) {
              await db.collection("customers").doc(cred.user.uid).set({
                name: name,
                email: email,
                createdAt: new Date().toISOString()
              });
            }
            // Silent welcome email
            emailjs.send(CONFIG.emailJs.serviceId, CONFIG.emailJs.welcomeTemplateId, {
              to_name: name,
              to_email: email
            }).catch(() => {});

            self.closeLoginModal();
          } catch (err) {
            alert("Could not create account: " + err.message);
          }
        });
      }

      // Admin Add Product Form
      const admProdForm = document.getElementById("adminProductForm");
      if (admProdForm) {
        admProdForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const title = document.getElementById("admProdTitle").value.trim();
          const cat = document.getElementById("admProdCat").value;
          const price = parseFloat(document.getElementById("admProdPrice").value);
          const stock = document.getElementById("admProdStock").value;
          const desc = document.getElementById("admProdDesc").value.trim();
          const file = document.getElementById("admProdFile").files[0];
          let imgUrl = "https://res.cloudinary.com/dpeijmtb6/image/upload/v1791720629/Hunnar_House_wvvnud.jpg";

          if (file) {
            const spinner = document.getElementById("prodUploadSpinner");
            spinner.classList.remove("hidden");
            try {
              imgUrl = await self.uploadImage(file);
            } catch (err) {
              alert("Image upload failed. Using standard card image.");
            } finally {
              spinner.classList.add("hidden");
            }
          }

          const newProd = {
            title: title,
            category: cat,
            price: price,
            stock: stock,
            description: desc,
            image: imgUrl
          };

          if (db) {
            const docRef = await db.collection("products").add(newProd);
            newProd.id = docRef.id;
          } else {
            newProd.id = "prod_" + Date.now();
          }

          State.products.push(newProd);
          self.renderAdminProducts();
          self.renderCatalogGrid();
          admProdForm.reset();
          alert("Product added successfully.");
        });
      }

      // Admin Daily Update Form
      const admUpForm = document.getElementById("adminUpdateForm");
      if (admUpForm) {
        admUpForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const title = document.getElementById("admUpTitle").value.trim();
          const content = document.getElementById("admUpContent").value.trim();
          const file = document.getElementById("admUpFile").files[0];
          let imgUrl = "";

          if (file) {
            const spinner = document.getElementById("upUploadSpinner");
            spinner.classList.remove("hidden");
            try {
              imgUrl = await self.uploadImage(file);
            } catch (err) {
              alert("Photo upload failed.");
            } finally {
              spinner.classList.add("hidden");
            }
          }

          const updateObj = {
            title: title,
            content: content,
            image: imgUrl,
            createdAt: new Date().toISOString()
          };

          if (db) {
            await db.collection("daily_updates").add(updateObj);
          }

          admUpForm.reset();
          alert("Daily update posted.");
          self.loadDailyUpdates();
        });
      }

      // Admin Password Change
      const passForm = document.getElementById("adminPassChangeForm");
      if (passForm) {
        passForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const newPass = document.getElementById("admNewPass").value;
          if (!auth.currentUser) return;
          try {
            await auth.currentUser.updatePassword(newPass);
            alert("Admin password updated successfully.");
            passForm.reset();
          } catch (err) {
            alert("Could not update password: " + err.message);
          }
        });
      }

      // Close modals with Escape key
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          self.closeLoginModal();
          self.closeSearchModal();
          self.closeProductModal();
          self.closeCheckoutModal();
          self.closeReceiptModal();
          self.toggleCartDrawer(false);
        }
      });
    },

    showBanner: function (msg) {
      const banner = document.getElementById("bannerNotice");
      if (banner) {
        banner.textContent = msg;
        banner.classList.remove("hidden");
      }
    }
  };

  // Run on DOM Ready
  document.addEventListener("DOMContentLoaded", () => {
    window.App = App;
    App.init();
  });
})();
