const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/db');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../config/mailer');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

// Helper tạo mã OTP 6 chữ số
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/register
 * Đăng ký tài khoản người dùng mới
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await query.get('SELECT id, is_verified FROM users WHERE email = ?', [normalizedEmail]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc chọn email khác.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const otp = generateOTP();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const tokenPayload = `${verificationToken}:${otp}`;

    const result = await query.run(`
      INSERT INTO users (name, email, password, phone, address, role, is_verified, verification_token, verification_expires)
      VALUES (?, ?, ?, ?, ?, 'user', 0, ?, ?)
    `, [name.trim(), normalizedEmail, hashedPassword, phone || '', address || '', tokenPayload, expires]);

    const clientBaseUrl = `${req.protocol}://${req.get('host')}`;
    const mailResult = await sendVerificationEmail({ email: normalizedEmail, name: name.trim(), token: verificationToken, otp, clientBaseUrl });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Hệ thống đã gửi email xác nhận tài khoản tới ' + normalizedEmail,
      data: {
        userId: result.lastID,
        email: normalizedEmail,
        name: name.trim(),
        devInfo: { otp, token: verificationToken, previewUrl: mailResult.previewUrl, verifyUrl: mailResult.verifyUrl }
      }
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại.' });
  }
});

/**
 * POST /api/auth/verify-email
 * Kích hoạt tài khoản qua OTP hoặc Token
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { email, token, otp } = req.body;

    if (!email || (!token && !otp)) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mã OTP/Token xác thực.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await query.get('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với email này.' });
    if (user.is_verified === 1) return res.json({ success: true, message: 'Tài khoản đã được xác thực. Bạn có thể đăng nhập ngay.' });
    if (!user.verification_token) return res.status(400).json({ success: false, message: 'Mã xác nhận không tồn tại hoặc đã được sử dụng.' });

    if (user.verification_expires && new Date(user.verification_expires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Mã xác nhận đã hết hạn. Vui lòng bấm gửi lại mã xác nhận mới.' });
    }

    const [storedToken, storedOtp] = (user.verification_token || '').split(':');
    const isValid = (token && token === storedToken) || (otp && otp.trim() === storedOtp);

    if (!isValid) return res.status(400).json({ success: false, message: 'Mã OTP hoặc Token xác nhận không chính xác.' });

    await query.run(`UPDATE users SET is_verified = 1, verification_token = NULL, verification_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [user.id]);

    const authToken = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Xác thực tài khoản thành công! Bạn đã có thể sử dụng tất cả tính năng.',
      token: authToken,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, avatar: user.avatar, role: user.role, is_verified: 1 }
    });
  } catch (error) {
    console.error('Lỗi xác thực email:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xác thực email.' });
  }
});

/**
 * POST /api/auth/resend-verification
 * Gửi lại email xác nhận
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email.' });

    const normalizedEmail = email.trim().toLowerCase();
    const user = await query.get('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
    if (user.is_verified === 1) return res.json({ success: true, message: 'Tài khoản này đã được xác thực.' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const otp = generateOTP();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const tokenPayload = `${verificationToken}:${otp}`;

    await query.run(`UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?`, [tokenPayload, expires, user.id]);

    const clientBaseUrl = `${req.protocol}://${req.get('host')}`;
    const mailResult = await sendVerificationEmail({ email: normalizedEmail, name: user.name, token: verificationToken, otp, clientBaseUrl });

    res.json({ success: true, message: 'Đã gửi lại email xác nhận thành công tới ' + normalizedEmail, devInfo: { otp, token: verificationToken, previewUrl: mailResult.previewUrl } });
  } catch (error) {
    console.error('Lỗi gửi lại mã xác nhận:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi gửi lại mã xác nhận.' });
  }
});

/**
 * POST /api/auth/login
 * Đăng nhập người dùng
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ email và mật khẩu.' });

    const normalizedEmail = email.trim().toLowerCase();
    const user = await query.get('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

    if (!user) return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Đăng nhập thành công! Chào mừng ' + user.name,
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, avatar: user.avatar, role: user.role, is_verified: user.is_verified }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ trong quá trình đăng nhập.' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Yêu cầu gửi mã đặt lại mật khẩu
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email đã đăng ký.' });

    const normalizedEmail = email.trim().toLowerCase();
    const user = await query.get('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản nào khớp với email này.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const otp = generateOTP();
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const tokenPayload = `${resetToken}:${otp}`;

    await query.run(`UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?`, [tokenPayload, expires, user.id]);

    const clientBaseUrl = `${req.protocol}://${req.get('host')}`;
    const mailResult = await sendPasswordResetEmail({ email: normalizedEmail, name: user.name, token: resetToken, otp, clientBaseUrl });

    res.json({ success: true, message: 'Hướng dẫn đặt lại mật khẩu đã được gửi tới ' + normalizedEmail, devInfo: { otp, token: resetToken, previewUrl: mailResult.previewUrl } });
  } catch (error) {
    console.error('Lỗi quên mật khẩu:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xử lý yêu cầu quên mật khẩu.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Tạo lại mật khẩu mới
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, otp, newPassword } = req.body;

    if (!email || (!token && !otp) || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email, mã xác nhận và mật khẩu mới.' });
    }

    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });

    const normalizedEmail = email.trim().toLowerCase();
    const user = await query.get('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    if (!user.reset_token) return res.status(400).json({ success: false, message: 'Mã xác nhận không tồn tại hoặc đã được sử dụng.' });

    if (user.reset_token_expires && new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Mã xác nhận đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.' });
    }

    const [storedToken, storedOtp] = (user.reset_token || '').split(':');
    const isValid = (token && token === storedToken) || (otp && otp.trim() === storedOtp);

    if (!isValid) return res.status(400).json({ success: false, message: 'Mã OTP hoặc Token xác nhận không hợp lệ.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query.run(`UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [hashedPassword, user.id]);

    res.json({ success: true, message: 'Mật khẩu của bạn đã được cập nhật thành công! Vui lòng đăng nhập bằng mật khẩu mới.' });
  } catch (error) {
    console.error('Lỗi đặt lại mật khẩu:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đặt lại mật khẩu.' });
  }
});

/**
 * GET /api/auth/me
 * Lấy thông tin người dùng hiện tại
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await query.get(`SELECT id, name, email, phone, address, avatar, role, is_verified, created_at FROM users WHERE id = ?`, [req.user.id]);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản.' });
    res.json({ success: true, user });
  } catch (error) {
    console.error('Lỗi lấy thông tin me:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

