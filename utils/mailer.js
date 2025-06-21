const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sisteminformasiunand23@gmail.com',
    pass: 'dplf ffdi ecup tgjl'
  }
});

exports.sendAccountEmailToUser = async (to, name, username, password) => {
  const html = `
    <div style="font-family:sans-serif;padding:20px">
      <h2>Halo, ${name}</h2>
      <p>Akun Anda di <strong>CampusExchange</strong> telah disetujui oleh admin.</p>
      <p>Berikut adalah detail login Anda:</p>
      <ul>
        <li><strong>Username:</strong> ${username}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>Silakan login di <a href="http://localhost:3000/login">sini</a>.</p>
    </div>
  `;
  await transporter.sendMail({
    from: '"CampusExchange" <sisteminformasiunand23@gmail.com>',
    to,
    subject: 'Akun Anda Telah Disetujui!',
    html
  });
};

exports.sendRejectionEmail = async (to, name) => {
  const html = `
    <div style="font-family:sans-serif;padding:20px">
      <h2>Hai, ${name}</h2>
      <p>Terima kasih telah mendaftar di <strong>CampusExchange</strong>.</p>
      <p>Namun, setelah ditinjau oleh admin, pendaftaran Anda tidak dapat kami terima saat ini.</p>
      <p>Silakan hubungi admin jika Anda merasa ini kesalahan.</p>
    </div>
  `;
  await transporter.sendMail({
    from: '"CampusExchange" <sisteminformasiunand23@gmail.com>',
    to,
    subject: 'Pendaftaran Anda Ditolak',
    html
  });
};
