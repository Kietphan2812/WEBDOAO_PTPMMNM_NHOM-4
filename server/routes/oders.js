const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../config/db');
const { verifyToken, optionalAuth, requireAdmin } = require('../middleware/auth');

/**
 * POST /api/orders
 * Đặt hàng mới
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, shipping_address, payment_method, notes, items } = req.body;

    if (!customer_name || !customer_email || !customer_phone || !shipping_address) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin giao hàng.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng của bạn đang trống.' });
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += (item.price || 0) * (item.quantity || 1);
    }

    const orderCode = 'ORD-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);
    const userId = req.user ? req.user.id : null;

    const result = await query.run(`
      INSERT INTO orders (order_code, user_id, customer_name, customer_email, customer_phone, shipping_address, payment_method, payment_status, order_status, total_amount, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, ?)
    `, [
      orderCode,
      userId,
      customer_name.trim(),
      customer_email.trim(),
      customer_phone.trim(),
      shipping_address.trim(),
      payment_method || 'cod',
      totalAmount,
      notes ? notes.trim() : ''
    ]);

    const orderId = result.lastID;

    // Insert order items
    for (const item of items) {
      await query.run(`
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity, size, color, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId,
        item.id || item.product_id || null,
        item.name || item.product_name,
        item.price,
        item.quantity || 1,
        item.size || 'M',
        item.color || 'Mặc định',
        item.image || ''
      ]);
    }

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công! Mã đơn hàng của bạn là: ' + orderCode,
      order: {
        id: orderId,
        order_code: orderCode,
        total_amount: totalAmount,
        payment_method: payment_method || 'cod'
      }
    });
  } catch (error) {
    console.error('Lỗi đặt hàng:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo đơn hàng.' });
  }
});

/**
 * GET /api/orders/my-orders
 * Lấy danh sách đơn hàng của người dùng hiện tại
 */
router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const orders = await query.all(`
      SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
    `, [req.user.id]);

    for (const order of orders) {
      order.items = await query.all(`SELECT * FROM order_items WHERE order_id = ?`, [order.id]);
    }

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Lỗi lấy đơn hàng:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

/**
 * GET /api/orders/all
 * Lấy tất cả đơn hàng (Admin)
 */
router.get('/all', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT * FROM orders WHERE 1=1`;
    const params = [];

    if (status && status !== 'all') {
      sql += ` AND order_status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC`;
    const orders = await query.all(sql, params);

    for (const order of orders) {
      order.items = await query.all(`SELECT * FROM order_items WHERE order_id = ?`, [order.id]);
    }

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Lỗi lấy tất cả đơn hàng:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

/**
 * PUT /api/orders/:id/status
 * Cập nhật trạng thái đơn hàng (Admin)
 */
router.put('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status, payment_status } = req.body;

    await query.run(`
      UPDATE orders 
      SET order_status = COALESCE(?, order_status),
          payment_status = COALESCE(?, payment_status)
      WHERE id = ?
    `, [order_status, payment_status, id]);

    res.json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công!' });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái đơn:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

module.exports = router;