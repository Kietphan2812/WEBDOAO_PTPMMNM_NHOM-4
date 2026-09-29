const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

/**
 * GET /api/stats/dashboard
 * Thống kê tổng quan hệ thống cho Admin
 */
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const userCount = await query.get('SELECT COUNT(*) as count FROM users');
    const productCount = await query.get('SELECT COUNT(*) as count FROM products');
    const postCount = await query.get('SELECT COUNT(*) as count FROM posts');
    const orderCount = await query.get('SELECT COUNT(*) as count FROM orders');
    const revenue = await query.get('SELECT SUM(total_amount) as total FROM orders WHERE order_status != "cancelled"');

    const recentOrders = await query.all('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
    const recentPosts = await query.all('SELECT * FROM posts ORDER BY created_at DESC LIMIT 5');
    const recentUsers = await query.all('SELECT id, name, email, role, is_verified, created_at FROM users ORDER BY created_at DESC LIMIT 5');

    res.json({
      success: true,
      stats: {
        totalUsers: userCount.count,
        totalProducts: productCount.count,
        totalPosts: postCount.count,
        totalOrders: orderCount.count,
        totalRevenue: revenue.total || 0
      },
      recentOrders,
      recentPosts,
      recentUsers
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

module.exports = router;