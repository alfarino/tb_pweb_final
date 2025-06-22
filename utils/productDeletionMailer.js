// utils/productDeletionMailer.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sisteminformasiunand23@gmail.com',
    pass: 'dplf ffdi ecup tgjl' 
  }
});

export const sendProductDeletedEmail = async (email, productTitle) => {
  const mailOptions = {
    from: 'CampusExchange <sisteminformasiunand23@gmail.com>',
    to: email,
    subject: 'Produk Telah Dihapus dari CampusExchange',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #005aa7;">Produk Dihapus</h2>
        <p>Produk <strong>${productTitle}</strong> yang sebelumnya Anda simpan, beli, atau tambahkan ke keranjang telah <b>dihapus oleh pemiliknya</b>.</p>
        <p>Silakan kunjungi platform CampusExchange untuk melihat produk serupa lainnya.</p>
        <br>
        <small>Email ini dikirim otomatis. Jangan balas ke email ini.</small>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email berhasil dikirim ke ${email}`);
  } catch (err) {
    console.error(`❌ Gagal kirim email ke ${email}:`, err);
  }
};
