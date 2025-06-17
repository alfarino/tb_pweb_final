const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Route tampilan login
app.get('/', (req, res) => {
  res.render('auth/login');
});

// Handle form login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validasi sederhana
  if (username === 'admin' && password === '1234') {
    res.send('Login berhasil!');
  } else {
    res.send('Login gagal! Username atau password salah.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
