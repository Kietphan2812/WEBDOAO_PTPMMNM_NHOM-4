
/**
 * Shop & Cart Module
 */

const shop = {
  state: {
    products: [],
    categories: [],
    currentCategory: 'all',
    searchQuery: '',
    sortBy: 'newest',
    cart: JSON.parse(localStorage.getItem('aura_cart') || '[]'),
    activeProduct: null
  },

  init: async () => {
    await shop.loadCategories();
    await shop.loadProducts();
    shop.updateCartUI();
  },

  // 1. Tải danh mục
  loadCategories: async () => {
    try {
      const res = await api.get('/products/categories/all');
      if (res.success) {
        shop.state.categories = res.categories;
        shop.renderCategoryPills();
      }
    } catch (e) {
      console.error('Lỗi tải danh mục:', e);
    }
  },

  renderCategoryPills: () => {
    const container = document.getElementById('category-pills-container');
    if (!container) return;

    let html = `
      <button class="category-pill ${shop.state.currentCategory === 'all' ? 'active' : ''}" 
              onclick="shop.filterByCategory('all')">
        Tất Cả Sản Phẩm
      </button>
    `;

    shop.state.categories.forEach(cat => {
      html += `
        <button class="category-pill ${shop.state.currentCategory === cat.slug ? 'active' : ''}" 
                onclick="shop.filterByCategory('${cat.slug}')">
          ${cat.name}
        </button>
      `;
    });

    container.innerHTML = html;
  },

  filterByCategory: (slug) => {
    shop.state.currentCategory = slug;
    shop.renderCategoryPills();
    shop.loadProducts();
  },

  // 2. Tải danh sách sản phẩm
  loadProducts: async () => {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Đang tải sản phẩm thời trang...</div>';

    try {
      const params = {};
      if (shop.state.currentCategory !== 'all') {
        params.category = shop.state.currentCategory;
      }
      if (shop.state.searchQuery) {
        params.search = shop.state.searchQuery;
      }
      if (shop.state.sortBy) {
        params.sort = shop.state.sortBy;
      }

      const res = await api.get('/products', params);
      if (res.success) {
        shop.state.products = res.products;
        shop.renderProducts();
      }
    } catch (e) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--danger);">Lỗi tải sản phẩm: ${e.message}</div>`;
    }
  },

  renderProducts: () => {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    if (shop.state.products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <div style="font-size: 3rem; margin-bottom: 12px;">🛍️</div>
          <h3>Không tìm thấy sản phẩm nào phù hợp</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">Vui lòng thử từ khóa tìm kiếm hoặc bộ lọc danh mục khác.</p>
        </div>
      `;
      return;
    }

    const productCardsHtml = shop.state.products.map(p => {
      const discountPercent = p.original_price && p.original_price > p.price
        ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
        : null;

      return `
        <div class="product-card" data-id="${p.id}">
          <div class="product-thumb-container">
            <img src="${p.image}" alt="${p.name}" class="product-thumb" loading="lazy">
            <div class="product-badge-group">
              ${discountPercent ? `<span class="discount-tag">-${discountPercent}%</span>` : ''}
              ${p.is_featured ? `<span class="badge badge-accent">HOT</span>` : ''}
            </div>
            <div class="product-quick-actions">
              <button class="quick-action-btn" onclick="shop.openProductModal(${p.id})">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>Xem Nhanh</span>
              </button>
            </div>
          </div>
          <div class="product-info">
            <span class="product-cat">${p.category_name || 'Thời Trang'}</span>
            <a href="javascript:void(0)" onclick="shop.openProductModal(${p.id})" class="product-name" title="${p.name}">
              ${p.name}
            </a>
            <div class="product-price-row">
              <span class="current-price">${formatCurrency(p.price)}</span>
              ${p.original_price ? `<span class="old-price">${formatCurrency(p.original_price)}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    grid.innerHTML = productCardsHtml;

    // Also populate home featured grid (top 4 products)
    const homeGrid = document.getElementById('home-featured-grid');
    if (homeGrid) {
      const featured = shop.state.products.filter(p => p.is_featured).slice(0, 4);
      const displayProds = featured.length >= 4 ? featured : shop.state.products.slice(0, 4);
      homeGrid.innerHTML = displayProds.map(p => {
        const discountPercent = p.original_price && p.original_price > p.price
          ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
          : null;

        return `
          <div class="product-card" data-id="${p.id}">
            <div class="product-thumb-container">
              <img src="${p.image}" alt="${p.name}" class="product-thumb" loading="lazy">
              <div class="product-badge-group">
                ${discountPercent ? `<span class="discount-tag">-${discountPercent}%</span>` : ''}
                <span class="badge badge-accent">HOT</span>
              </div>
              <div class="product-quick-actions">
                <button class="quick-action-btn" onclick="shop.openProductModal(${p.id})">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <span>Xem Nhanh</span>
                </button>
              </div>
            </div>
            <div class="product-info">
              <span class="product-cat">${p.category_name || 'Thời Trang'}</span>
              <a href="javascript:void(0)" onclick="shop.openProductModal(${p.id})" class="product-name" title="${p.name}">
                ${p.name}
              </a>
              <div class="product-price-row">
                <span class="current-price">${formatCurrency(p.price)}</span>
                ${p.original_price ? `<span class="old-price">${formatCurrency(p.original_price)}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  // 3. Mở Modal Chi tiết sản phẩm
  openProductModal: async (id) => {
    try {
      const res = await api.get(`/products/${id}`);
      if (res.success && res.product) {
        const p = res.product;
        shop.state.activeProduct = {
          ...p,
          selectedSize: p.sizes && p.sizes.length ? p.sizes[0] : 'Free',
          selectedColor: p.colors && p.colors.length ? p.colors[0] : 'Tiêu chuẩn',
          quantity: 1
        };

        const modalBody = document.getElementById('product-modal-content');
        if (!modalBody) return;

        modalBody.innerHTML = `
          <div class="product-modal-grid">
            <div class="product-modal-image">
              <img src="${p.image}" alt="${p.name}">
            </div>
            <div class="product-modal-details">
              <span class="badge badge-accent" style="width: fit-content; margin-bottom: 8px;">${p.category_name || 'Thời Trang'}</span>
              <h2 style="font-size: 1.5rem; margin-bottom: 12px;">${p.name}</h2>
              <div class="product-price-row" style="margin-bottom: 18px;">
                <span class="current-price" style="font-size: 1.6rem;">${formatCurrency(p.price)}</span>
                ${p.original_price ? `<span class="old-price" style="font-size: 1.1rem;">${formatCurrency(p.original_price)}</span>` : ''}
              </div>
              
              <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px;">
                ${p.description || 'Sản phẩm thời trang cao cấp với chất liệu thoáng mát, bền đẹp và giữ form tốt.'}
              </p>

              <!-- Size selector -->
              <div class="selector-label">
                <span>Chọn Kích Cỡ (Size):</span>
                <span id="active-size-label" style="color: var(--accent);">${shop.state.activeProduct.selectedSize}</span>
              </div>
              <div class="option-pills" id="modal-size-pills">
                ${(p.sizes || []).map((s, idx) => `
                  <button class="option-pill ${idx === 0 ? 'active' : ''}" onclick="shop.selectSize('${s}', this)">${s}</button>
                `).join('')}
              </div>

              <!-- Color selector -->
              <div class="selector-label">
                <span>Chọn Màu Sắc:</span>
                <span id="active-color-label" style="color: var(--accent);">${shop.state.activeProduct.selectedColor}</span>
              </div>
              <div class="option-pills" id="modal-color-pills">
                ${(p.colors || []).map((c, idx) => `
                  <button class="option-pill ${idx === 0 ? 'active' : ''}" onclick="shop.selectColor('${c}', this)">${c}</button>
                `).join('')}
              </div>

              <!-- Quantity selector -->
              <div class="selector-label"><span>Số Lượng:</span></div>
              <div class="qty-control">
                <button class="qty-btn" onclick="shop.changeActiveQty(-1)">−</button>
                <input type="text" class="qty-input" id="modal-product-qty" value="1" readonly>
                <button class="qty-btn" onclick="shop.changeActiveQty(1)">+</button>
              </div>

              <!-- Action buttons -->
              <div style="display: flex; gap: 12px; margin-top: auto;">
                <button class="btn btn-accent btn-lg" style="flex: 1;" onclick="shop.addToCartFromModal()">
                  🛒 Thêm Vào Giỏ Hàng
                </button>
              </div>
            </div>
          </div>
        `;

        app.openModal('modal-product-detail');
      }
    } catch (e) {
      showToast(e.message, 'error', 'Không thể xem sản phẩm');
    }
  },

  selectSize: (size, btn) => {
    if (!shop.state.activeProduct) return;
    shop.state.activeProduct.selectedSize = size;
    document.querySelectorAll('#modal-size-pills .option-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const label = document.getElementById('active-size-label');
    if (label) label.textContent = size;
  },

  selectColor: (color, btn) => {
    if (!shop.state.activeProduct) return;
    shop.state.activeProduct.selectedColor = color;
    document.querySelectorAll('#modal-color-pills .option-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const label = document.getElementById('active-color-label');
    if (label) label.textContent = color;
  },

  changeActiveQty: (delta) => {
    if (!shop.state.activeProduct) return;
    let newQty = (shop.state.activeProduct.quantity || 1) + delta;
    if (newQty < 1) newQty = 1;
    if (newQty > 99) newQty = 99;
    shop.state.activeProduct.quantity = newQty;
    const input = document.getElementById('modal-product-qty');
    if (input) input.value = newQty;
  },

  // 4. Quản lý Giỏ hàng
  addToCartFromModal: () => {
    if (!shop.state.activeProduct) return;
    const item = {
      product_id: shop.state.activeProduct.id,
      name: shop.state.activeProduct.name,
      price: shop.state.activeProduct.price,
      image: shop.state.activeProduct.image,
      size: shop.state.activeProduct.selectedSize,
      color: shop.state.activeProduct.selectedColor,
      quantity: shop.state.activeProduct.quantity || 1
    };

    shop.addToCart(item);
    app.closeModal('modal-product-detail');
  },

  addToCart: (item) => {
    const existingIndex = shop.state.cart.findIndex(
      i => i.product_id === item.product_id && i.size === item.size && i.color === item.color
    );

    if (existingIndex > -1) {
      shop.state.cart[existingIndex].quantity += item.quantity;
    } else {
      shop.state.cart.push(item);
    }

    shop.saveCart();
    shop.updateCartUI();
    showToast(`Đã thêm "${item.name}" vào giỏ hàng`, 'success', 'Giỏ hàng');
  },

  updateCartQty: (index, delta) => {
    if (!shop.state.cart[index]) return;
    shop.state.cart[index].quantity += delta;
    if (shop.state.cart[index].quantity <= 0) {
      shop.state.cart.splice(index, 1);
    }
    shop.saveCart();
    shop.updateCartUI();
    shop.renderCartDrawer();
  },

  removeFromCart: (index) => {
    if (!shop.state.cart[index]) return;
    shop.state.cart.splice(index, 1);
    shop.saveCart();
    shop.updateCartUI();
    shop.renderCartDrawer();
  },

  clearCart: () => {
    shop.state.cart = [];
    shop.saveCart();
    shop.updateCartUI();
    shop.renderCartDrawer();
  },

  saveCart: () => {
    localStorage.setItem('aura_cart', JSON.stringify(shop.state.cart));
  },

  updateCartUI: () => {
    const countBadge = document.getElementById('cart-badge-count');
    const totalCount = shop.state.cart.reduce((sum, item) => sum + item.quantity, 0);
    if (countBadge) {
      countBadge.textContent = totalCount;
      countBadge.style.display = totalCount > 0 ? 'flex' : 'none';
    }
  },

  // 5. Hiển thị giỏ hàng
  renderCartDrawer: () => {
    const container = document.getElementById('cart-items-container');
    const totalElement = document.getElementById('cart-total-amount');
    const checkoutBtn = document.getElementById('cart-checkout-btn');
    if (!container) return;

    if (shop.state.cart.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 10px;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🛒</div>
          <p style="color: var(--text-muted);">Giỏ hàng của bạn đang trống.</p>
        </div>
      `;
      if (totalElement) totalElement.textContent = '0 ₫';
      if (checkoutBtn) checkoutBtn.disabled = true;
      return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    let total = 0;
    container.innerHTML = shop.state.cart.map((item, idx) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;

      return `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-meta">Phân loại: Size ${item.size} • Màu ${item.color}</div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span class="cart-item-price">${formatCurrency(item.price)}</span>
              <div class="qty-control" style="margin-bottom: 0;">
                <button class="qty-btn" style="width: 28px; height: 28px;" onclick="shop.updateCartQty(${idx}, -1)">−</button>
                <input type="text" class="qty-input" style="width: 34px; height: 28px;" value="${item.quantity}" readonly>
                <button class="qty-btn" style="width: 28px; height: 28px;" onclick="shop.updateCartQty(${idx}, 1)">+</button>
              </div>
            </div>
          </div>
          <button class="cart-item-remove" onclick="shop.removeFromCart(${idx})" title="Xóa khỏi giỏ">&times;</button>
        </div>
      `;
    }).join('');

    if (totalElement) totalElement.textContent = formatCurrency(total);
  },

  openCart: () => {
    shop.renderCartDrawer();
    app.openModal('modal-cart');
  },

  // 6. Quy trình Đặt hàng (Checkout)
  openCheckout: () => {
    if (shop.state.cart.length === 0) {
      showToast('Giỏ hàng trống!', 'warning');
      return;
    }

    app.closeModal('modal-cart');

    // Pre-fill user information if logged in
    const user = auth.state.user;
    if (user) {
      const nameInput = document.getElementById('checkout-name');
      const emailInput = document.getElementById('checkout-email');
      const phoneInput = document.getElementById('checkout-phone');
      const addressInput = document.getElementById('checkout-address');

      if (nameInput && !nameInput.value) nameInput.value = user.name || '';
      if (emailInput && !emailInput.value) emailInput.value = user.email || '';
      if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
      if (addressInput && !addressInput.value) addressInput.value = user.address || '';
    }

    // Calculate total
    const total = shop.state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const checkoutTotalEl = document.getElementById('checkout-total-amount');
    if (checkoutTotalEl) checkoutTotalEl.textContent = formatCurrency(total);

    app.openModal('modal-checkout');
  },

  submitOrder: async (e) => {
    e.preventDefault();
    if (shop.state.cart.length === 0) return;

    const name = document.getElementById('checkout-name').value.trim();
    const email = document.getElementById('checkout-email').value.trim();
    const phone = document.getElementById('checkout-phone').value.trim();
    const address = document.getElementById('checkout-address').value.trim();
    const notes = document.getElementById('checkout-notes').value.trim();
    const paymentMethodEl = document.querySelector('input[name="payment_method"]:checked');
    const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'cod';

    if (!name || !email || !phone || !address) {
      showToast('Vui lòng điền đầy đủ họ tên, email, số điện thoại và địa chỉ giao hàng.', 'warning');
      return;
    }

    try {
      const payload = {
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        shipping_address: address,
        notes: notes,
        payment_method: paymentMethod,
        items: shop.state.cart
      };

      const res = await api.post('/orders', payload);

      if (res.success) {
        shop.clearCart();
        app.closeModal('modal-checkout');

        // Show success modal or toast
        showToast(res.message, 'success', 'Đặt hàng thành công');

        // If user is on profile page, refresh orders
        if (window.profile && window.location.hash === '#profile') {
          window.profile.loadProfile();
        }
      }
    } catch (err) {
      showToast(err.message, 'error', 'Đặt hàng thất bại');
    }
  }
};
