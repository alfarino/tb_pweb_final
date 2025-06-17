document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const usernameInput = form.querySelector('input[type="text"]');
  const passwordInput = form.querySelector('input[type="password"]');

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // Mencegah reload halaman

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Validasi sederhana
    if (username === '' || password === '') {
      alert('Username dan password tidak boleh kosong!');
      return;
    }

    // Simulasi login (bisa diganti dengan fetch ke backend)
    if (username === 'admin' && password === '1234') {
      alert('Login berhasil!');
      // Redirect atau aksi lainnya
      // window.location.href = '/dashboard.html';
    } else {
      alert('Login gagal. Username atau password salah.');
    }
  });
});