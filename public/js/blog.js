
/**
 * Blog & Articles Module: Full CRUD + Search
 * - Tạo bài viết (Create)
 * - Xem bài viết & chi tiết (Read)
 * - Tìm kiếm bài viết (Search)
 * - Cập nhật bài viết (Update)
 * - Xóa bài viết (Delete)
 */

const blog = {
  state: {
    posts: [],
    categories: [],
    currentCategory: 'all',
    searchQuery: '',
    editingPostId: null
  },

  init: async () => {
    await blog.loadPosts();
  },

  // 1. Xem danh sách bài viết & Tìm kiếm
  loadPosts: async () => {
    const grid = document.getElementById('posts-grid');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Đang tải bài viết thời trang...</div>';

    try {
      const params = {};
      if (blog.state.searchQuery) {
        params.q = blog.state.searchQuery;
      }
      if (blog.state.currentCategory && blog.state.currentCategory !== 'all') {
        params.category = blog.state.currentCategory;
      }

      const res = await api.get('/posts', params);
      if (res.success) {
        blog.state.posts = res.posts;
        blog.state.categories = res.categories || [];
        blog.renderPosts();
        blog.renderCategories();
      }
    } catch (err) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--danger);">Lỗi tải bài viết: ${err.message}</div>`;
    }
  },

  renderCategories: () => {
    const container = document.getElementById('blog-category-filter');
    if (!container) return;

    let html = `
      <option value="all" ${blog.state.currentCategory === 'all' ? 'selected' : ''}>Tất cả chủ đề</option>
    `;

    blog.state.categories.forEach(cat => {
      html += `<option value="${cat}" ${blog.state.currentCategory === cat ? 'selected' : ''}>${cat}</option>`;
    });

    container.innerHTML = html;
  },

  filterByCategory: (cat) => {
    blog.state.currentCategory = cat;
    blog.loadPosts();
  },

  search: (query) => {
    blog.state.searchQuery = query;
    blog.loadPosts();
  },

  renderPosts: () => {
    const grid = document.getElementById('posts-grid');
    if (!grid) return;

    if (blog.state.posts.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <div style="font-size: 3rem; margin-bottom: 12px;">📰</div>
          <h3>Không tìm thấy bài viết nào phù hợp</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">Hãy thử tìm kiếm với từ khóa khác hoặc chuyển sang chủ đề khác.</p>
        </div>
      `;
      return;
    }

    const currentUser = auth.state.user;

    grid.innerHTML = blog.state.posts.map(p => {
      const isOwnerOrAdmin = currentUser && (currentUser.id === p.author_id || currentUser.role === 'admin');

      return `
        <article class="post-card" data-id="${p.id}">
          <a href="javascript:void(0)" onclick="blog.openPostDetail(${p.id})" class="post-card-thumb-link">
            <img src="${p.thumbnail || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80'}" alt="${p.title}" class="post-card-thumb" loading="lazy">
            <span class="post-card-category">${p.category || 'Xu hướng'}</span>
          </a>
          <div class="post-card-body">
            <div class="post-card-meta">
              <span>📅 ${formatDate(p.created_at)}</span>
              <span>👁 ${p.views || 0} lượt xem</span>
            </div>
            <h3 class="post-card-title">
              <a href="javascript:void(0)" onclick="blog.openPostDetail(${p.id})" title="${p.title}">
                ${p.title}
              </a>
            </h3>
            <p class="post-card-summary">${p.summary || ''}</p>
            <div class="post-card-footer">
              <div class="post-card-author">
                <img src="${p.author_avatar || '/uploads/default-avatar.png'}" alt="${p.author_name || 'Tác giả'}" class="post-card-author-img">
                <span>${p.author_name || 'Ban Biên Tập'}</span>
              </div>
              <div class="post-card-actions">
                ${isOwnerOrAdmin ? `
                  <button class="post-action-btn" onclick="blog.openEditModal(${p.id})" title="Chỉnh sửa bài viết">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="post-action-btn btn-delete" onclick="blog.confirmDeletePost(${p.id})" title="Xóa bài viết">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                ` : ''}
                <button class="btn btn-sm btn-outline" onclick="blog.openPostDetail(${p.id})">Đọc tiếp →</button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  },

  // 2. Xem chi tiết bài viết (Read single post)
  openPostDetail: async (id) => {
    try {
      const res = await api.get(`/posts/${id}`);
      if (res.success && res.post) {
        const p = res.post;
        const currentUser = auth.state.user;
        const isOwnerOrAdmin = currentUser && (currentUser.id === p.author_id || currentUser.role === 'admin');

        const container = document.getElementById('post-reader-content');
        if (!container) return;

        container.innerHTML = `
          <div class="post-detail-container">
            <div class="post-detail-hero">
              <img src="${p.thumbnail || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80'}" alt="${p.title}">
            </div>
            <div class="post-detail-content">
              <div class="post-detail-header">
                <span class="badge badge-accent" style="margin-bottom: 12px;">${p.category || 'Xu hướng'}</span>
                <h1 class="post-detail-title">${p.title}</h1>
                <div class="post-detail-meta">
                  <div class="post-detail-author-info">
                    <img src="${p.author_avatar || '/uploads/default-avatar.png'}" alt="${p.author_name}" class="post-detail-author-avatar">
                    <div>
                      <div style="font-weight: 700;">${p.author_name || 'Ban Biên Tập'}</div>
                      <div style="font-size: 0.8rem; color: var(--text-muted);">${formatDate(p.created_at)} • 👁 ${p.views} lượt xem</div>
                    </div>
                  </div>
                  ${isOwnerOrAdmin ? `
                    <div style="display: flex; gap: 8px;">
                      <button class="btn btn-sm btn-outline" onclick="blog.openEditModal(${p.id})" style="display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Sửa bài viết
                      </button>
                      <button class="btn btn-sm btn-danger" onclick="blog.confirmDeletePost(${p.id})" style="display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Xóa
                      </button>
                    </div>
                  ` : ''}
                </div>
              </div>

              ${p.summary ? `
                <div style="background: var(--bg-alt); border-left: 4px solid var(--accent); padding: 16px 20px; border-radius: var(--radius-sm); font-style: italic; font-weight: 500; margin-bottom: 28px; line-height: 1.6;">
                  ${p.summary}
                </div>
              ` : ''}

              <div class="post-body-text">${p.content}</div>

              <!-- Related posts -->
              ${res.related && res.related.length > 0 ? `
                <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid var(--border);">
                  <h3 style="margin-bottom: 20px;">Bài Viết Cùng Chủ Đề</h3>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
                    ${res.related.map(r => `
                      <div style="cursor: pointer;" onclick="blog.openPostDetail(${r.id})">
                        <img src="${r.thumbnail}" style="border-radius: 8px; width: 100%; height: 120px; object-fit: cover; margin-bottom: 8px;">
                        <h4 style="font-size: 0.95rem; line-height: 1.4;">${r.title}</h4>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <div class="post-detail-actions">
                <button class="btn btn-outline" onclick="window.location.hash = '#blog'">← Trở lại danh sách bài viết</button>
              </div>
            </div>
          </div>
        `;

        window.location.hash = '#blog-detail';
      }
    } catch (e) {
      showToast(e.message, 'error', 'Không thể tải bài viết');
    }
  },

  // 3. Mở Modal Tạo bài viết mới (Create)
  openCreateModal: () => {
    if (!auth.state.isLoggedIn) {
      showToast('Vui lòng đăng nhập để viết bài.', 'warning');
      app.openModal('modal-login');
      return;
    }

    blog.state.editingPostId = null;
    document.getElementById('post-modal-title').textContent = 'Tạo Bài Viết Thời Trang Mới';
    document.getElementById('post-form-title').value = '';
    document.getElementById('post-form-category').value = 'Xu hướng thời trang';
    document.getElementById('post-form-summary').value = '';
    document.getElementById('post-form-content').value = '';
    document.getElementById('post-form-thumbnail-url').value = '';
    document.getElementById('post-form-thumbnail-file').value = '';

    app.openModal('modal-post-editor');
  },

  // 4. Mở Modal Chỉnh sửa bài viết (Update)
  openEditModal: async (id) => {
    try {
      const res = await api.get(`/posts/${id}`);
      if (res.success && res.post) {
        const p = res.post;
        blog.state.editingPostId = p.id;

        document.getElementById('post-modal-title').textContent = 'Cập Nhật Bài Viết';
        document.getElementById('post-form-title').value = p.title || '';
        document.getElementById('post-form-category').value = p.category || 'Xu hướng thời trang';
        document.getElementById('post-form-summary').value = p.summary || '';
        document.getElementById('post-form-content').value = p.content || '';
        document.getElementById('post-form-thumbnail-url').value = p.thumbnail || '';
        document.getElementById('post-form-thumbnail-file').value = '';

        app.openModal('modal-post-editor');
      }
    } catch (e) {
      showToast(e.message, 'error', 'Lỗi tải bài viết để chỉnh sửa');
    }
  },

  // 5. Lưu bài viết (Tạo mới hoặc Cập nhật)
  savePost: async (e) => {
    e.preventDefault();

    const title = document.getElementById('post-form-title').value.trim();
    const category = document.getElementById('post-form-category').value.trim();
    const summary = document.getElementById('post-form-summary').value.trim();
    const content = document.getElementById('post-form-content').value.trim();
    const thumbnailUrl = document.getElementById('post-form-thumbnail-url').value.trim();
    const fileInput = document.getElementById('post-form-thumbnail-file');

    if (!title || !content) {
      showToast('Vui lòng nhập tiêu đề và nội dung bài viết.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('summary', summary);
    formData.append('content', content);
    if (thumbnailUrl) formData.append('thumbnailUrl', thumbnailUrl);
    if (fileInput.files.length > 0) {
      formData.append('thumbnailFile', fileInput.files[0]);
    }

    try {
      let res;
      if (blog.state.editingPostId) {
        // Update existing
        res = await api.put(`/posts/${blog.state.editingPostId}`, formData, true);
        showToast('Đã cập nhật bài viết thành công!', 'success');
      } else {
        // Create new
        res = await api.post('/posts', formData, true);
        showToast('Đã tạo bài viết mới thành công!', 'success');
      }

      app.closeModal('modal-post-editor');
      await blog.loadPosts();

      // If user profile is active, refresh my posts
      if (window.profile && window.location.hash === '#profile') {
        window.profile.loadProfile();
      }

      // If admin panel is active, refresh admin posts
      if (window.admin && window.location.hash === '#admin') {
        window.admin.loadPosts();
      }

      // If editing in reader view, reopen it
      if (window.location.hash === '#blog-detail' && res.post) {
        blog.openPostDetail(res.post.id);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Lỗi lưu bài viết');
    }
  },

  // 6. Xóa bài viết (Delete)
  confirmDeletePost: (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác!')) {
      blog.deletePost(id);
    }
  },

  deletePost: async (id) => {
    try {
      const res = await api.delete(`/posts/${id}`);
      showToast(res.message, 'success', 'Đã xóa bài viết');

      // Refresh list
      await blog.loadPosts();

      // If inside post reader view, return to blog list
      if (window.location.hash === '#blog-detail') {
        window.location.hash = '#blog';
      }

      // If in profile
      if (window.profile && window.location.hash === '#profile') {
        window.profile.loadProfile();
      }

      // If in admin
      if (window.admin && window.location.hash === '#admin') {
        window.admin.loadPosts();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Lỗi khi xóa bài viết');
    }
  }
};
