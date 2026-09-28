
const nodemailer = require('nodemailer');

let transporter = null;
let etherealAccount = null;

async function initTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    console.log('✓ Email service: Sử dụng máy chủ SMTP thực (' + process.env.SMTP_HOST + ')');
  } else {
    try {
      etherealAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: etherealAccount.smtp.host,
        port: etherealAccount.smtp.port,
        secure: etherealAccount.smtp.secure,
        auth: { user: etherealAccount.user, pass: etherealAccount.pass }
      });
      console.log('✓ Email service: Chế độ Test/Demo (Ethereal Mail)');
      console.log('  Tài khoản test:', etherealAccount.user);
    } catch (err) {
      console.warn('! Không thể tạo tài khoản Ethereal, hệ thống sẽ in thông tin email ra console.');
      transporter = {
        sendMail: async (opts) => {
          console.log('\n================ [EMAIL MÔ PHỎNG] ================');
          console.log('Người nhận:', opts.to);
          console.log('Tiêu đề:', opts.subject);
          console.log('===================================================\n');
          return { messageId: 'simulated-' + Date.now() };
        }
      };
    }
  }
}

initTransporter().catch(console.error);

/**
 * Gửi email xác nhận đăng ký tài khoản
 */
async function sendVerificationEmail({ email, name, token, otp, clientBaseUrl }) {
  if (!transporter) await initTransporter();

  const verifyUrl = `${clientBaseUrl}/#verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px;">AURA FASHION</h1>
        <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Thời Trang Phong Cách & Hiện Đại</p>
      </div>
      <div style="padding: 30px 24px; color: #334155;">
        <h2 style="color: #0f172a; margin-top: 0;">Chào mừng ${name}!</h2>
        <p style="line-height: 1.6;">Cảm ơn bạn đã đăng ký tại <strong>AURA FASHION</strong>. Vui lòng xác nhận email để kích hoạt tài khoản.</p>
        <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
          <p style="margin: 0 0 10px; color: #64748b; font-size: 13px; font-weight: 600;">MÃ OTP XÁC NHẬN (hiệu lực 24 giờ):</p>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0284c7;">${otp}</div>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background: #0284c7; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; display: inline-block;">Xác Nhận Tài Khoản Ngay</a>
        </div>
      </div>
      <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
        <p style="margin: 0;">© 2026 AURA FASHION - Nhóm 4 (PTPMMNM). Mọi quyền được bảo lưu.</p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"AURA FASHION" <${process.env.SMTP_FROM || 'no-reply@aurafashion.vn'}>`,
      to: email,
      subject: `[AURA FASHION] Xác nhận kích hoạt tài khoản (${otp})`,
      html
    });

    let previewUrl = null;
    if (etherealAccount && nodemailer.getTestMessageUrl) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('✉ [Email Xác Nhận] Xem trước:', previewUrl);
    }

    return { success: true, messageId: info.messageId, previewUrl, otp, verifyUrl };
  } catch (error) {
    console.error('Lỗi khi gửi email xác nhận:', error);
    return { success: false, error: error.message, otp, verifyUrl };
  }
}

/**
 * Gửi email quên mật khẩu
 */
async function sendPasswordResetEmail({ email, name, token, otp, clientBaseUrl }) {
  if (!transporter) await initTransporter();

  const resetUrl = `${clientBaseUrl}/#reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px;">AURA FASHION</h1>
        <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Yêu Cầu Đặt Lại Mật Khẩu</p>
      </div>
      <div style="padding: 30px 24px; color: #334155;">
        <h2 style="color: #0f172a; margin-top: 0;">Xin chào ${name}!</h2>
        <p style="line-height: 1.6;">Hệ thống nhận được yêu cầu đặt lại mật khẩu. Nếu bạn không thực hiện, vui lòng bỏ qua email này.</p>
        <div style="background: #fef2f2; border: 2px dashed #fca5a5; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
          <p style="margin: 0 0 10px; color: #b91c1c; font-size: 13px; font-weight: 600;">MÃ OTP KHÔI PHỤC (hiệu lực 15 phút):</p>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #dc2626;">${otp}</div>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #dc2626; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; display: inline-block;">Đặt Lại Mật Khẩu Ngay</a>
        </div>
      </div>
      <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
        <p style="margin: 0;">© 2026 AURA FASHION - Nhóm 4 (PTPMMNM). Mọi quyền được bảo lưu.</p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"AURA FASHION" <${process.env.SMTP_FROM || 'no-reply@aurafashion.vn'}>`,
      to: email,
      subject: `[AURA FASHION] Yêu cầu đặt lại mật khẩu (${otp})`,
      html
    });

    let previewUrl = null;
    if (etherealAccount && nodemailer.getTestMessageUrl) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('✉ [Email Reset] Xem trước:', previewUrl);
    }

    return { success: true, messageId: info.messageId, previewUrl, otp, resetUrl };
  } catch (error) {
    console.error('Lỗi khi gửi email đặt lại mật khẩu:', error);
    return { success: false, error: error.message, otp, resetUrl };
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };


