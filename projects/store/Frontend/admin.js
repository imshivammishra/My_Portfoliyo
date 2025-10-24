AOS.init();

const token = localStorage.getItem("token");
if (!token) {
  alert("Access denied");
  window.location.href = "login.html";
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

function switchTab(tabId) {
  document.querySelectorAll(".tab").forEach(tab => tab.classList.add("hidden"));
  document.getElementById(tabId).classList.remove("hidden");
}

// ---------------- Dashboard ----------------
fetch("http://localhost:5000/api/admin/dashboard", {
  headers: { Authorization: `Bearer ${token}` },
})
  .then(res => res.json())
  .then(data => {
    document.getElementById("total-products").textContent = `Products: ${data.totalProducts}`;
    document.getElementById("total-users").textContent = `Users: ${data.totalUsers}`;
    document.getElementById("total-orders").textContent = `Orders: ${data.totalOrders}`;
    renderSalesChart(data.salesData);
  })
  .catch(err => {
    alert("Dashboard fetch failed");
    console.error(err);
  });

function renderSalesChart(salesData) {
  const ctx = document.getElementById("salesChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: salesData.labels,
      datasets: [{
        label: "Sales",
        data: salesData.values,
        borderColor: "#4b5563",
        backgroundColor: "rgba(75, 85, 99, 0.1)",
        borderWidth: 2,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}



// Admin laerts
function fetchAlerts() {
  fetch("http://localhost:5000/api/admin/alerts", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((alerts) => {
      renderAlerts(alerts);
    })
    .catch((err) => console.error("⚠️ Alert fetch error", err));
}

function renderAlerts({ lowStock, recentOrders }) {
  const alertBox = document.getElementById("alertList");
  if (!alertBox) return;

  alertBox.innerHTML = "";

  lowStock.forEach(p => {
    const div = document.createElement("div");
    div.className = "alert-card warning";
    div.innerHTML = `⚠️ Low Stock: ${p.name} (${p.stock} left)`;
    alertBox.appendChild(div);
  });

  recentOrders.forEach(o => {
    const div = document.createElement("div");
    div.className = "alert-card info";
    div.innerHTML = `🛒 New Order by ${o.user?.name || "Unknown"} - ₹${o.totalAmount}`;
    alertBox.appendChild(div);
  });
}

fetchAlerts();



// ---------------- Products ----------------
const productForm = document.getElementById("productForm");
const productList = document.getElementById("productList");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const toast = document.getElementById("toast");

let editProductId = null;

function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

// Live image preview
imageInput?.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    imagePreview.src = URL.createObjectURL(file);
    imagePreview.classList.remove("hidden");
  }
});

document.getElementById("cancelEditBtn").onclick = () => {
  productForm.reset();
  imagePreview.src = "";
  imagePreview.classList.add("hidden");
  editProductId = null;
  document.getElementById("submitBtn").textContent = "Add Product";
  document.getElementById("cancelEditBtn").classList.add("hidden");
};

















productForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(productForm);
  const method = editProductId ? "PUT" : "POST";
  const url = editProductId
    ? `http://localhost:5000/api/products/${editProductId}`
    : `http://localhost:5000/api/products`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        // Note: DO NOT set Content-Type manually here
      },
      body: formData,
    });

    const result = await res.json();
    console.log("🛠️ Result:", result);

    if (!res.ok) throw new Error(result.msg || "Unknown error");

    showToast(editProductId ? "✅ Product updated!" : "✅ Product added!");
    productForm.reset();
    imagePreview.classList.add("hidden");
    editProductId = null;
    document.getElementById("submitBtn").textContent = "Add Product";
    document.getElementById("cancelEditBtn").classList.add("hidden");
    fetchProducts();
  } catch (err) {
    console.error("❌ Save error:", err);
    showToast("❌ Failed to save product", "error");
  }
});




















function deleteProduct(id) {
  if (!confirm("Are you sure?")) return;
  fetch(`http://localhost:5000/api/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then(() => {
      showToast("🗑️ Deleted!");
      fetchProducts();
    })
    .catch(() => showToast("❌ Delete failed", "error"));
}

function fillEditForm(p) {
  editProductId = p._id;
  productForm.name.value = p.name;
  productForm.price.value = p.price;
  productForm.category.value = p.category;
  productForm.stock.value = p.stock;
  imagePreview.src = `http://localhost:5000/${p.image}`;
  imagePreview.classList.remove("hidden");
  document.getElementById("submitBtn").textContent = "Update Product";
  document.getElementById("cancelEditBtn").classList.remove("hidden");
}

function fetchProducts() {
  fetch("http://localhost:5000/api/products")
    .then((res) => res.json())
    .then((data) => {
      const keyword = searchInput.value.toLowerCase();
      const selectedCat = categoryFilter.value;

      const filtered = data.filter(p =>
        p.name.toLowerCase().includes(keyword) &&
        (selectedCat ? p.category === selectedCat : true)
      );

      productList.innerHTML = filtered.map(p => `
        <div class="product-card" data-aos="fade-up">
          <img src="http://localhost:5000/${p.image}" alt="${p.name}" />
          <h3>${p.name}</h3>
          <p>${p.category} • ₹${p.price}</p>
          <span class="stock ${p.stock < 5 ? 'low' : 'ok'}">Stock: ${p.stock}</span>
          <div class="actions">
            <button onclick='fillEditForm(${JSON.stringify(p)})'>✏️</button>
            <button onclick='deleteProduct("${p._id}")'>🗑️</button>
          </div>
        </div>
      `).join("");
    });
}

searchInput.addEventListener("input", fetchProducts);
categoryFilter.addEventListener("change", fetchProducts);
fetchProducts();


















// ---------------- Users ----------------
function fetchUsers() {
  fetch("http://localhost:5000/api/admin/users", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => res.json())
    .then(users => {
      document.getElementById("userList").innerHTML = users.map(user => `
        <div class="user-card" data-aos="fade-up">
          <div class="user-info">
            <i class="lucide lucide-user-round"></i>
            <div>
              <h3>${user.name || 'No Name'}</h3>
              <p>${user.email}</p>
            </div>
          </div>
          <div class="user-meta">
            <span class="role-badge ${user.role === 'admin' ? 'admin' : 'user'}">${user.role}</span>
            <button onclick="deleteUser('${user._id}')">
              <i class="lucide lucide-trash-2"></i>
            </button>
          </div>
        </div>
      `).join("");
    })
    .catch(err => {
      console.error("User fetch error", err);
      showToast("❌ Failed to load users", "error");
    });
}

function deleteUser(id) {
  if (!confirm("Are you sure to delete this user?")) return;

  fetch(`http://localhost:5000/api/admin/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => res.json())
    .then(() => {
      showToast("🗑️ User deleted");
      fetchUsers();
    })
    .catch(() => showToast("❌ Delete failed", "error"));
}

fetchUsers();


// ---------------- Analytics ----------------
function fetchAnalytics() {
  fetch("http://localhost:5000/api/admin/analytics", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => res.json())
    .then(data => {
      const ctx = document.getElementById("analyticsChart").getContext("2d");
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: data.labels,
          datasets: [{
            label: "Sales",
            data: data.values,
            backgroundColor: "#000",
          }]
        }
      });
    });
}

// Initial calls
fetchProducts();
fetchUsers();
fetchAnalytics();








// Analytical
function fetchAnalytics() {
  fetch("http://localhost:5000/api/admin/analytics", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((data) => {
      // Sales Chart
      new Chart(document.getElementById("analyticsChart").getContext("2d"), {
        type: "bar",
        data: {
          labels: data.sales.labels,
          datasets: [{
            label: "Sales (₹)",
            data: data.sales.values,
            backgroundColor: "#000",
          }],
        },
        options: { responsive: true }
      });

      // Upload Chart
      new Chart(document.getElementById("uploadChart").getContext("2d"), {
        type: "line",
        data: {
          labels: data.uploads.labels,
          datasets: [{
            label: "Products Added",
            data: data.uploads.values,
            borderColor: "#333",
            backgroundColor: "rgba(0,0,0,0.05)",
            borderWidth: 2,
          }],
        },
        options: { responsive: true }
      });

      // Category Chart
      new Chart(document.getElementById("categoryChart").getContext("2d"), {
        type: "doughnut",
        data: {
          labels: data.categories.labels,
          datasets: [{
            data: data.categories.values,
            backgroundColor: ["#000", "#888", "#ccc"],
          }],
        },
        options: { responsive: true }
      });
    })
    .catch((err) => {
      console.error("Analytics error", err);
      showToast("❌ Analytics fetch failed", "error");
    });
}

fetchAnalytics();






// Orders
function fetchOrders() {
  fetch("http://localhost:5000/api/orders", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((orders) => {
      const orderList = document.getElementById("orderList");
      orderList.innerHTML = orders.map((o) => `
        <div class="card">
          <p><strong>User:</strong> ${o.user.name} (${o.user.email})</p>
          <p><strong>Total:</strong> ₹${o.totalAmount}</p>
          <p><strong>Status:</strong>
            <select onchange="updateOrderStatus('${o._id}', this.value)">
              ${["Pending", "Shipped", "Delivered", "Cancelled"].map(
                s => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`
              ).join("")}
            </select>
          </p>
          <p><strong>Items:</strong></p>
          <ul>${o.products.map(p => `<li>${p.quantity} × ${p.productId}</li>`).join("")}</ul>
        </div>
      `).join("");
    });
}

function updateOrderStatus(id, status) {
  fetch(`http://localhost:5000/api/orders/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  })
    .then((res) => res.json())
    .then(() => fetchOrders());
}

fetchOrders();










// ---------------- Settings ----------------
async function loadAdminSettings() {
  try {
    const res = await fetch("http://localhost:5000/api/admin/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    document.getElementById("adminName").value = data.name;
    document.getElementById("adminEmail").value = data.email;
  } catch (err) {
    console.error("Failed to load admin info", err);
  }
}

document.getElementById("settingsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("adminName").value;
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;

  try {
    const res = await fetch("http://localhost:5000/api/admin/settings", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, currentPassword, newPassword }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.msg || "Error updating settings");
    alert("Settings updated successfully!");
    document.getElementById("settingsForm").reset();
    loadAdminSettings();
  } catch (err) {
    alert("Settings update failed: " + err.message);
  }
});

loadAdminSettings();
