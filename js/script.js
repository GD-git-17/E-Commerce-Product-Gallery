// Phase 2: Fetch products from Fake Store API and render them dynamically.

const apiUrl = "https://fakestoreapi.com/products";

document.addEventListener("DOMContentLoaded", () => {
  const productGrid = document.getElementById("productGrid");
  const loadingState = document.getElementById("loadingState");
  const errorState = document.getElementById("errorState");

  async function fetchProducts() {
    if (loadingState) loadingState.classList.remove("d-none");
    if (errorState) errorState.classList.add("d-none");
    if (productGrid) productGrid.setAttribute('aria-busy', 'true');
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
      if (productGrid) productGrid.removeAttribute('aria-busy');
    }
  }

  function displayProducts(products) {
    if (!productGrid) return;
    productGrid.innerHTML = "";

    // cache formatter and conversion rate
    const priceFormatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    const USD_TO_INR = 83;

    const fragment = document.createDocumentFragment();

    products.forEach((product) => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-4 col-xl-3';

      const card = document.createElement('article');
      card.className = 'card product-card h-100 border-0 shadow-sm';

      const img = document.createElement('img');
      img.className = 'card-img-top';
      img.src = product.image;
      img.alt = escapeHtml(product.title) || 'Product image';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', () => {
        img.src = 'https://via.placeholder.com/220?text=Product+Image';
      });

      const body = document.createElement('div');
      body.className = 'card-body d-flex flex-column';

      const category = document.createElement('p');
      category.className = 'product-category';
      category.textContent = product.category;

      const title = document.createElement('h3');
      title.className = 'h6 card-title mb-2';
      title.textContent = product.title;

      const price = document.createElement('p');
      price.className = 'product-price';
      price.textContent = priceFormatter.format(product.price * USD_TO_INR);

      const rating = document.createElement('div');
      rating.className = 'rating mb-3';
      rating.innerHTML = `${product.rating?.rate ?? '-'} ★ <small class="text-muted">(${product.rating?.count ?? 0})</small>`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-outline-primary mt-auto';
      btn.textContent = 'View Details';

      body.appendChild(category);
      body.appendChild(title);
      body.appendChild(price);
      body.appendChild(rating);
      body.appendChild(btn);

      card.appendChild(img);
      card.appendChild(body);
      col.appendChild(card);

      fragment.appendChild(col);
    });

    productGrid.appendChild(fragment);
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
