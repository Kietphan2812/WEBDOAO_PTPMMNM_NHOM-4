const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Helper for slug
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * GET /api/products/categories/all
 * Lấy danh sách danh mục
 */
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await query.all('SELECT * FROM categories ORDER BY id ASC');
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Lỗi lấy danh mục:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải danh mục sản phẩm.' });
  }
});

/**
 * GET /api/products
 * Lấy danh sách sản phẩm có bộ lọc (danh mục, từ khóa, khoảng giá, sắp xếp)
 */
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, featured, limit = 50, page = 1 } = req.query;

    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'all') {
      if (!isNaN(category)) {
        sql += ` AND p.category_id = ?`;
        params.push(parseInt(category));
      } else {
        sql += ` AND c.slug = ?`;
        params.push(category);
      }
    }

    if (search && search.trim()) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (minPrice && !isNaN(minPrice)) {
      sql += ` AND p.price >= ?`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice && !isNaN(maxPrice)) {
      sql += ` AND p.price <= ?`;
      params.push(parseFloat(maxPrice));
    }

    if (featured === 'true' || featured === '1') {
      sql += ` AND p.is_featured = 1`;
    }

    // Sorting
    if (sort === 'price_asc') {
      sql += ` ORDER BY p.price ASC`;
    } else if (sort === 'price_desc') {
      sql += ` ORDER BY p.price DESC`;
    } else if (sort === 'name_asc') {
      sql += ` ORDER BY p.name ASC`;
    } else {
      sql += ` ORDER BY p.created_at DESC`;
    }

    const products = await query.all(sql, params);

    // Parse JSON sizes and colors
    const formatted = products.map(p => {
      let sizes = [];
      let colors = [];
      try { sizes = JSON.parse(p.sizes); } catch (e) { sizes = (p.sizes || '').split(',').map(s => s.trim()).filter(Boolean); }
      try { colors = JSON.parse(p.colors); } catch (e) { colors = (p.colors || '').split(',').map(c => c.trim()).filter(Boolean); }
      return { ...p, sizes, colors };
    });

    res.json({
      success: true,
      products: formatted,
      total: formatted.length
    });
  } catch (error) {
    console.error('Lỗi lấy sản phẩm:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tải danh sách sản phẩm.' });
  }
});

/**
 * GET /api/products/:id
 * Chi tiết sản phẩm
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const p = await query.get(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? OR p.slug = ?
    `, [id, id]);

    if (!p) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }

    let sizes = [];
    let colors = [];
    try { sizes = JSON.parse(p.sizes); } catch (e) { sizes = (p.sizes || '').split(','); }
    try { colors = JSON.parse(p.colors); } catch (e) { colors = (p.colors || '').split(','); }

    // Get related products from same category
    const related = await query.all(`
      SELECT * FROM products WHERE category_id = ? AND id != ? LIMIT 4
    `, [p.category_id, p.id]);

    res.json({
      success: true,
      product: { ...p, sizes, colors },
      related
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết sản phẩm:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

/**
 * POST /api/products
 * Tạo sản phẩm mới (Chỉ Admin)
 */
router.post('/', requireAdmin, upload.single('imageFile'), async (req, res) => {
  try {
    const { name, category_id, description, price, original_price, imageUrl, sizes, colors, stock, is_featured } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Tên và giá sản phẩm là bắt buộc.' });
    }

    let image = imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80';
    if (req.file) {
      image = '/uploads/' + req.file.filename;
    }

    const slug = slugify(name) + '-' + Date.now().toString().slice(-4);
    const sizesStr = typeof sizes === 'string' && (sizes.startsWith('[') ? sizes : JSON.stringify(sizes.split(',').map(s => s.trim())));
    const colorsStr = typeof colors === 'string' && (colors.startsWith('[') ? colors : JSON.stringify(colors.split(',').map(c => c.trim())));

    const result = await query.run(`
      INSERT INTO products (name, slug, category_id, description, price, original_price, image, sizes, colors, stock, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      slug,
      category_id || 1,
      description || '',
      parseFloat(price),
      original_price ? parseFloat(original_price) : null,
      image,
      sizesStr || JSON.stringify(['S', 'M', 'L', 'XL']),
      colorsStr || JSON.stringify(['Đen', 'Trắng']),
      stock ? parseInt(stock) : 50,
      is_featured ? 1 : 0
    ]);

    const newProd = await query.get('SELECT * FROM products WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Thêm sản phẩm thành công!',
      product: newProd
    });
  } catch (error) {
    console.error('Lỗi thêm sản phẩm:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi thêm sản phẩm.' });
  }
});

/**
 * PUT /api/products/:id
 * Cập nhật sản phẩm (Chỉ Admin)
 */
router.put('/:id', requireAdmin, upload.single('imageFile'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, description, price, original_price, imageUrl, sizes, colors, stock, is_featured } = req.body;

    const prod = await query.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }

    let image = prod.image;
    if (req.file) {
      image = '/uploads/' + req.file.filename;
    } else if (imageUrl && imageUrl.trim()) {
      image = imageUrl.trim();
    }

    const sizesStr = sizes ? (typeof sizes === 'string' && sizes.startsWith('[') ? sizes : JSON.stringify(sizes.split(',').map(s => s.trim()))) : prod.sizes;
    const colorsStr = colors ? (typeof colors === 'string' && colors.startsWith('[') ? colors : JSON.stringify(colors.split(',').map(c => c.trim()))) : prod.colors;

    await query.run(`
      UPDATE products 
      SET name = ?, category_id = ?, description = ?, price = ?, original_price = ?, image = ?, sizes = ?, colors = ?, stock = ?, is_featured = ?
      WHERE id = ?
    `, [
      name ? name.trim() : prod.name,
      category_id || prod.category_id,
      description !== undefined ? description : prod.description,
      price ? parseFloat(price) : prod.price,
      original_price !== undefined ? (original_price ? parseFloat(original_price) : null) : prod.original_price,
      image,
      sizesStr,
      colorsStr,
      stock !== undefined ? parseInt(stock) : prod.stock,
      is_featured !== undefined ? (is_featured ? 1 : 0) : prod.is_featured,
      id
    ]);

    const updated = await query.get('SELECT * FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Cập nhật thông tin sản phẩm thành công!',
      product: updated
    });
  } catch (error) {
    console.error('Lỗi cập nhật sản phẩm:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật sản phẩm.' });
  }
});

/**
 * DELETE /api/products/:id
 * Xóa sản phẩm (Chỉ Admin)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await query.run('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true, message: 'Xóa sản phẩm thành công!' });
  } catch (error) {
    console.error('Lỗi xóa sản phẩm:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xóa sản phẩm.' });
  }
});

module.exports = router;

