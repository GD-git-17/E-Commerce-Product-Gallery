// Phase 2 + SECTION 1: Fetch products, then apply live search/category filtering + details modal.

const apiUrl = "https://fakestoreapi.com/products";

document.addEventListener("DOMContentLoaded", () => {
  // Single source of truth for filters
  let allProducts = [];
  let currentSearch = "";
  let currentCategory = "all";

  const productGrid = document.getElementById("productGrid");
  const loadingState = document.getElementById("loadingState");
  const errorState = document.getElementById("errorState");

  const emptyStateEl = document.getElementById("emptyState");
  const productStatsEl = document.getElementById("productStats");
  const skeletonGridEl = document.getElementById("skeletonGrid");

  const searchInput = document.getElementById("productSearchInput");
  const categoryButtons = document.querySelectorAll("#categories [data-category]");

  // Track last focused button for modal focus return
  let lastModalTriggerButton = null;


  // Modal elements
  const modalEl = document.getElementById("productDetailsModal");
  const modalImageEl = document.getElementById("modalProductImage");
  const modalTitleEl = document.getElementById("modalProductTitle");
  const modalDescriptionEl = document.getElementById("modalProductDescription");
  const modalPriceEl = document.getElementById("modalProductPrice");
  const modalCategoryEl = document.getElementById("modalProductCategory");
  const modalRatingEl = document.getElementById("modalProductRating");
  const modalReviewCountEl = document.getElementById("modalProductReviewCount");

  const priceFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  const USD_TO_INR = 83;

  function normalizeText(value) {
    return String(value ?? "").trim().toLowerCase();
  }

  function setEmptyStateVisible(visible) {
    if (!emptyStateEl) return;
    if (visible) {
      emptyStateEl.classList.remove('d-none');
      emptyStateEl.setAttribute('aria-hidden','false');
    } else {
      emptyStateEl.classList.add('d-none');
      emptyStateEl.setAttribute('aria-hidden','true');
    }
  }


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
      allProducts = Array.isArray(products) ? products : [];

      // Initial render via applyFilters (single source of truth)
      setEmptyStateVisible(false);
      renderSkeleton(false);
      applyFilters();
    } catch (error) {
      if (errorState) {
        errorState.textContent = "Unable to load products. Please try again later.";
        errorState.classList.remove("d-none");
      }
      if (productGrid) productGrid.innerHTML = "";
      setEmptyStateVisible(false);
      renderSkeleton(false);
      console.error(error);
    } finally {
      if (loadingState) loadingState.classList.add("d-none");
      if (productGrid) productGrid.removeAttribute('aria-busy');
    }
  }


  // Render product statistics (based on filtered products)
  function renderProductStats(products) {
    if (!productStatsEl) return;
    const total = products.length;
    const categories = Array.from(new Set(products.map(p => p.category))).length;
    productStatsEl.textContent = `Products Available: ${total} · Categories: ${categories}`;
  }

  // Wire UI filters to single source of truth
  if (searchInput) {
    // Real-time, case-insensitive search with trim
    searchInput.addEventListener('input', (e) => {
      currentSearch = String(e.target.value ?? '');
      applyFilters();
    });
  }

  if (categoryButtons && categoryButtons.length) {
    categoryButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        // Update active state UI
        categoryButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        currentCategory = btn.getAttribute('data-category') || 'all';
        applyFilters();
      });
    });
  }

  // SECTION 1 required architecture: applyFilters() is the ONLY combined filtering logic.
  function applyFilters() {

    // 1. Start from allProducts
    let filtered = Array.isArray(allProducts) ? allProducts.slice() : [];

    // 2. Apply search filtering
    const search = normalizeText(currentSearch);
    if (search) {
      filtered = filtered.filter((p) => {
        const titleText = normalizeText(p.title);
        const categoryText = normalizeText(p.category);
        return titleText.includes(search) || categoryText.includes(search);
      });
    }

    // 3. Apply category filtering
    const category = String(currentCategory ?? 'all').trim().toLowerCase();
    if (category !== 'all') {
      filtered = filtered.filter((p) => normalizeText(p.category) === category);
    }

    // 4. Update statistics
    renderProductStats(filtered);

    // 5. Render once + handle no-results state (hide grid)
    const hasResults = filtered.length > 0;
    setEmptyStateVisible(!hasResults);

    if (!productGrid) return;
    if (!hasResults) {
      productGrid.innerHTML = '';
      return;
    }

    renderProducts(filtered);
  }

  function renderProducts(products) {
    if (!productGrid) return;
    productGrid.innerHTML = '';

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
      btn.addEventListener('click', (e) => {
        // Store trigger for accessibility focus restoration
        lastModalTriggerButton = e.currentTarget;
        populateAndShowModal(product);
      });


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

  function populateAndShowModal(product) {
    if (!modalEl) return;

    const title = product?.title ?? '—';
    const description = product?.description ?? '—';
    const category = product?.category ?? '—';
    const rating = product?.rating?.rate ?? '-';
    const reviewCount = product?.rating?.count ?? 0;

    modalTitleEl.textContent = title;
    modalDescriptionEl.textContent = description;
    modalCategoryEl.textContent = category;
    modalRatingEl.textContent = `${rating} ★`;
    modalReviewCountEl.textContent = `${reviewCount}`;

    modalPriceEl.textContent = priceFormatter.format((product?.price ?? 0) * USD_TO_INR);

    modalImageEl.src = product?.image ?? 'https://via.placeholder.com/600x400?text=Product';
    modalImageEl.alt = escapeHtml(title) || 'Product image';

    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl, {
      backdrop: true,
      keyboard: true,
      focus: true
    });
    modalInstance.show();
  }

  // Modal: restore focus to the triggering element on close
  if (modalEl) {
    modalEl.addEventListener('hidden.bs.modal', () => {
      if (lastModalTriggerButton && typeof lastModalTriggerButton.focus === 'function') {
        lastModalTriggerButton.focus();
      }
      lastModalTriggerButton = null;
    });
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
