// Phase 2: Fetch products from Fake Store API and render them dynamically.

const apiUrl = "https://fakestoreapi.com/products";
const productGrid = document.getElementById("productGrid");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");

async function fetchProducts() {
  loadingState.classList.remove("d-none");
  errorState.classList.add("d-none");
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    const products = await response.json();
    displayProducts(products);
  } catch (error) {
    errorState.textContent = "Unable to load products. Please try again later.";
    errorState.classList.remove("d-none");
    productGrid.innerHTML = "";
    console.error(error);
  } finally {
    loadingState.classList.add("d-none");
  }
}

function displayProducts(products) {
  productGrid.innerHTML = "";
  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "col-12 col-sm-6 col-lg-4 col-xl-3";
    card.innerHTML = `
      <article class="card product-card h-100 border-0 shadow-sm">
        <img src="${product.image}" class="card-img-top" alt="${product.title}" />
        <div class="card-body d-flex flex-column">
          <p class="product-category">${product.category}</p>
          <h3 class="h5 card-title">${product.title}</h3>
          <p class="product-price">$${product.price.toFixed(2)}</p>
          <div class="rating mb-3">${product.rating?.rate ?? "-"} ★ (${product.rating?.count ?? 0})</div>
          <button class="btn btn-outline-primary mt-auto">View Details</button>
        </div>
      </article>
    `;
    productGrid.appendChild(card);
  });
}

fetchProducts();
