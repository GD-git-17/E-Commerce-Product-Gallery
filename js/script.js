// Phase 2: Fetch products from Fake Store API and render them dynamically.

const apiUrl = "https://fakestoreapi.com/products";

document.addEventListener("DOMContentLoaded", () => {
  const productGrid = document.getElementById("productGrid");
  const loadingState = document.getElementById("loadingState");
  const errorState = document.getElementById("errorState");

  async function fetchProducts() {
    if (loadingState) loadingState.classList.remove("d-none");
    if (errorState) errorState.classList.add("d-none");
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      const products = await response.json();
      displayProducts(products);
    } catch (error) {
      if (errorState) {
        errorState.textContent = "Unable to load products. Please try again later.";
        errorState.classList.remove("d-none");
      }
      if (productGrid) productGrid.innerHTML = "";
      console.error(error);
    } finally {
      if (loadingState) loadingState.classList.add("d-none");
    }
  }

  function displayProducts(products) {
    if (!productGrid) return;
    productGrid.innerHTML = "";
    products.forEach((product) => {
      const card = document.createElement("div");
      card.className = "col-12 col-md-6 col-lg-4 col-xl-3";
      card.innerHTML = `
        <article class="card product-card h-100 border-0 shadow-sm">
          <img src="${product.image}" class="card-img-top" alt="${escapeHtml(product.title)}" />
          <div class="card-body d-flex flex-column">
            <p class="product-category">${escapeHtml(product.category)}</p>
            <h3 class="h6 card-title mb-2">${escapeHtml(product.title)}</h3>
            <p class="product-price">$${product.price.toFixed(2)}</p>
            <div class="rating mb-3">${product.rating?.rate ?? "-"} ★ <small class="text-muted">(${product.rating?.count ?? 0})</small></div>
            <button class="btn btn-outline-primary mt-auto">View Details</button>
          </div>
        </article>
      `;
      productGrid.appendChild(card);
    });
  }

  // small helper to avoid injection when inserting product text
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, function (m) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[m];
    });
  }

  fetchProducts();
});
