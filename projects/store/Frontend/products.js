AOS.init();

const token = localStorage.getItem("token");
if (!token) {
  alert("Access denied");
  window.location.href = "login.html";
}

document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const category = document.getElementById("category").value;
  const price = parseFloat(document.getElementById("price").value);
  const stock = parseInt(document.getElementById("stock").value);
  const description = document.getElementById("description").value;
  const imageFile = document.getElementById("image").files[0];

  if (!name || !category || isNaN(price) || isNaN(stock) || !imageFile) {
    alert("Please fill all required fields and select an image.");
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("category", category);
  formData.append("price", price);
  formData.append("stock", stock);
  formData.append("description", description);
  formData.append("image", imageFile);

  try {
    const res = await fetch("http://localhost:5000/api/products", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg);
    alert("Product added!");
    loadProducts();
  } catch (err) {
    alert("Error adding product: " + err.message);
  }
});

async function loadProducts() {
  const res = await fetch("http://localhost:5000/api/products");
  const products = await res.json();

  const list = document.getElementById("productList");
  list.innerHTML = "";

  products.forEach(p => {
    const item = document.createElement("div");
    item.className = "product-card";
    item.innerHTML = `
      <img src="http://localhost:5000/${p.image}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p>${p.category} • ₹${p.price}</p>
      <button onclick="deleteProduct('${p._id}')">Delete</button>
    `;
    list.appendChild(item);
  });
}

async function deleteProduct(id) {
  const res = await fetch(`http://localhost:5000/api/products/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.ok) {
    alert("Deleted.");
    loadProducts();
  } else {
    alert("Failed to delete.");
  }
}

loadProducts();
