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
      // render stats and content
      renderProductStats(products);
      if (Array.isArray(products) && products.length === 0) {
        showEmptyState(true);
        renderSkeleton(false);
      } else {
        showEmptyState(false);
        renderSkeleton(false);
        displayProducts(products);
      }
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

  // Render product statistics
  function renderProductStats(products) {
    const statsEl = document.getElementById('productStats');
    if (!statsEl) return;
    const total = products.length;
    const categories = Array.from(new Set(products.map(p => p.category))).length;
    statsEl.textContent = `Products Available: ${total} · Categories: ${categories}`;
  }

  function showEmptyState(show) {
    const empty = document.getElementById('emptyState');
    if (!empty) return;
    if (show) {
      empty.classList.remove('d-none');
      empty.setAttribute('aria-hidden','false');
    } else {
      empty.classList.add('d-none');
      empty.setAttribute('aria-hidden','true');
    }
  }

  // Skeleton placeholders
  function renderSkeleton(show) {
    const skeleton = document.getElementById('skeletonGrid');
    if (!skeleton) return;
    skeleton.innerHTML = '';
    if (!show) {
      skeleton.setAttribute('aria-hidden','true');
      skeleton.classList.add('d-none');
      return;
    }
    skeleton.classList.remove('d-none');
    skeleton.removeAttribute('aria-hidden');
    // create 8 skeleton cards
    for (let i=0;i<8;i++) {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-4 col-xl-3';
      const card = document.createElement('div');
      card.className = 'skeleton-card';
      const img = document.createElement('div');
      img.className = 'skeleton-img';
      const body = document.createElement('div');
      body.className = 'skeleton-body';
      const line1 = document.createElement('div'); line1.className='skeleton-line';
      const line2 = document.createElement('div'); line2.className='skeleton-line';
      const line3 = document.createElement('div'); line3.className='skeleton-line';
      body.appendChild(line1); body.appendChild(line2); body.appendChild(line3);
      card.appendChild(img); card.appendChild(body); col.appendChild(card); skeleton.appendChild(col);
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

  // Active nav highlighting using IntersectionObserver
  const navLinks = document.querySelectorAll('.navbar .nav-link');
  const sections = ['home','products','categories','footer'];
  const observerOptions = { root: null, rootMargin: '0px', threshold: 0.55 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = document.querySelector(`.navbar .nav-link[href='#${id}']`);
      if (link) {
        if (entry.isIntersecting) {
          navLinks.forEach(n => n.classList.remove('active'));
          link.classList.add('active');
        }
      }
    });
  }, observerOptions);
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });

  // Back to top button
  const backBtn = document.createElement('button');
  backBtn.id = 'backToTop';
  backBtn.className = 'btn btn-primary back-to-top';
  backBtn.type = 'button';
  backBtn.setAttribute('aria-label','Back to top');
  backBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8 4.5a.5.5 0 0 1 .374.832l-3.5 3.5a.5.5 0 1 1-.707-.707L7.293 4.5H1.5a.5.5 0 0 1 0-1h6.793L4.167.875a.5.5 0 1 1 .707-.707l3.5 3.5A.5.5 0 0 1 8 4.5z"/></svg>';
  document.body.appendChild(backBtn);

  function handleScroll() {
    const scrolled = window.pageYOffset || document.documentElement.scrollTop;
    if (scrolled > 300) {
      backBtn.classList.add('show');
    } else {
      backBtn.classList.remove('show');
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  backBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    backBtn.blur();
  });

  // Smooth scroll for CTA Browse Products
  const browseBtn = document.querySelector('.hero-section .btn.btn-primary');
  if (browseBtn) {
    browseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('products');
      if (target) {
        const nav = document.querySelector('.navbar');
        const offset = nav ? nav.getBoundingClientRect().height + 12 : 12;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  }

  // Show skeleton while loading
  renderSkeleton(true);
  fetchProducts();
});
