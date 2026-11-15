// Ganti dengan nomor WhatsApp Anda (Format internasional tanpa angka 0 di depan)
const WHATSAPP_NUMBER = "6285156116154";

function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(angka);
}

function getCart() {
  const cart = localStorage.getItem("toko_baru_cart");
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem("toko_baru_cart", JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll(".cart-badge").forEach(badge => {
    badge.textContent = totalItems;
  });
}

// Ambil data produk dari JSON
async function fetchProducts() {
  try {
    const response = await fetch("data/products.json");
    return await response.json();
  } catch (error) {
    console.error("Gagal memuat products.json:", error);
    return [];
  }
}

// Fungsi helper untuk path gambar otomatis jadi "images/nama-file.jpg"
function getImagePath(namaFile) {
  return `images/${namaFile}`;
}

async function addToCart(productId, qty = 1) {
  const products = await fetchProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return;

  let cart = getCart();
  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.qty += qty;
  } else {
    cart.push({
      id: product.id,
      nama: product.nama,
      harga: product.harga,
      gambar: getImagePath(product.gambar),
      qty: qty
    });
  }

  saveCart(cart);
  alert(`"${product.nama}" berhasil ditambahkan ke keranjang!`);
}

// Render Produk Unggulan di index.html
async function loadFeaturedProducts() {
  const container = document.getElementById("featured-products");
  if (!container) return;

  const products = await fetchProducts();
  container.innerHTML = products.slice(0, 4).map(p => createCard(p)).join("");
}

// Render Semua Produk di produk.html
async function loadAllProducts() {
  const container = document.getElementById("all-products");
  const searchInput = document.getElementById("search-input");
  if (!container) return;

  const products = await fetchProducts();
  container.innerHTML = products.map(createCard(p => p)).join(""); // Diperbaiki di bawah
}

async function renderProductsList() {
  const container = document.getElementById("all-products");
  const searchInput = document.getElementById("search-input");
  if (!container) return;

  const products = await fetchProducts();
  
  const displayProducts = (list) => {
    container.innerHTML = list.length ? list.map(createCard).join("") : "<p>Produk tidak ditemukan.</p>";
  };

  displayProducts(products);

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const keyword = e.target.value.toLowerCase();
      const filtered = products.filter(p => p.nama.toLowerCase().includes(keyword) || p.kategori.toLowerCase().includes(keyword));
      displayProducts(filtered);
    });
  }
}

function createCard(product) {
  const imgUrl = getImagePath(product.gambar);
  return `
    <div class="product-card">
      <a href="detail.html?id=${product.id}">
        <img src="${imgUrl}" alt="${product.nama}" onerror="this.src='https://via.placeholder.com/300x200?text=Toko'">
      </a>
      <div class="product-info">
        <span class="product-cat">${product.kategori}</span>
        <a href="detail.html?id=${product.id}"><h3 class="product-title">${product.nama}</h3></a>
        <div class="product-price">${formatRupiah(product.harga)}</div>
        <div class="product-actions">
          <a href="detail.html?id=${product.id}" class="btn btn-outline">Detail</a>
          <button onclick="addToCart(${product.id})" class="btn btn-primary">+ Keranjang</button>
        </div>
      </div>
    </div>
  `;
}

// Render Detail Produk
async function loadProductDetail() {
  const container = document.getElementById("product-detail-container");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const productId = parseInt(params.get("id"));

  const products = await fetchProducts();
  const product = products.find(p => p.id === productId);

  if (!product) {
    container.innerHTML = `<div class="card-box"><p>Produk tidak ditemukan. <a href="produk.html">Kembali</a></p></div>`;
    return;
  }

  const imgUrl = getImagePath(product.gambar);
  container.innerHTML = `
    <div class="detail-box">
      <div><img src="${imgUrl}" alt="${product.nama}" style="width:100%; border-radius:8px;"></div>
      <div class="detail-info">
        <span class="product-cat">${product.kategori}</span>
        <h1>${product.nama}</h1>
        <div class="detail-price">${formatRupiah(product.harga)}</div>
        <p class="detail-desc">${product.deskripsi}</p>
        <button onclick="addToCart(${product.id})" class="btn btn-primary">+ Tambah ke Keranjang</button>
      </div>
    </div>
  `;
}

// Render Keranjang
function renderCartPage() {
  const container = document.getElementById("cart-items");
  const totalElement = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("btn-to-checkout");
  if (!container) return;

  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = `<p style="text-align:center; padding:2rem;">Keranjang masih kosong. <a href="produk.html" style="color:var(--primary); font-weight:bold;">Belanja yuk</a></p>`;
    totalElement.textContent = formatRupiah(0);
    if (checkoutBtn) checkoutBtn.style.display = "none";
    return;
  }

  if (checkoutBtn) checkoutBtn.style.display = "inline-block";
  let html = "", grandTotal = 0;

  cart.forEach((item, index) => {
    let subtotal = item.harga * item.qty;
    grandTotal += subtotal;
    html += `
      <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #ddd;">
        <div>
          <h4>${item.nama}</h4>
          <p>${formatRupiah(item.harga)} x ${item.qty} = <strong>${formatRupiah(subtotal)}</strong></p>
        </div>
        <div>
          <button onclick="changeQty(${index}, -1)" class="qty-btn">-</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${index}, 1)" class="qty-btn">+</button>
          <button onclick="removeItem(${index})" class="btn btn-danger" style="padding:4px 8px; margin-left:5px;">Hapus</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  totalElement.textContent = formatRupiah(grandTotal);
}

function changeQty(index, delta) {
  let cart = getCart();
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart(cart);
  renderCartPage();
}

function removeItem(index) {
  let cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCartPage();
}

// Checkout WhatsApp
function setupCheckoutPage() {
  const summaryEl = document.getElementById("checkout-summary");
  const formEl = document.getElementById("checkout-form");
  if (!summaryEl || !formEl) return;

  const cart = getCart();
  if (cart.length === 0) {
    window.location.href = "keranjang.html";
    return;
  }

  let total = 0, summaryHtml = "<ul>";
  cart.forEach(item => {
    let sub = item.harga * item.qty;
    total += sub;
    summaryHtml += `<li>${item.nama} (${item.qty}x) - ${formatRupiah(sub)}</li>`;
  });
  summaryHtml += `</ul><hr><strong>Total: ${formatRupiah(total)}</strong>`;
  summaryEl.innerHTML = summaryHtml;

  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("cust-name").value;
    const alamat = document.getElementById("cust-address").value;
    const bayar = document.getElementById("cust-payment").value;

    let pesan = `Halo, saya ingin memesan:\n`;
    cart.forEach((i, idx) => { pesan += `${idx + 1}. ${i.nama} (${i.qty}x)\n`; });
    pesan += `\nTotal: ${formatRupiah(total)}\nNama: ${nama}\nAlamat: ${alamat}\nPembayaran: ${bayar}`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(pesan)}`, "_blank");
    localStorage.removeItem("toko_baru_cart");
    window.location.href = "index.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  loadFeaturedProducts();
  renderProductsList();
  loadProductDetail();
  renderCartPage();
  setupCheckoutPage();
});