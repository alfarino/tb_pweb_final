const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

const itemRoutes = require('./routes/itemRoutes'); // ✅ ditambahkan

const users = [
  { username: 'admin', password: '1234' }
];

let isLoggedIn = false;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ⬇️ Register route /items/:id
app.use('/items', itemRoutes); // ✅ INI YANG TADI KURANG

// Middleware login manual
function requireLogin(req, res, next) {
  if (!isLoggedIn) {
    return res.redirect('/login');
  }
  next();
}

// Route login
app.get('/login', (req, res) => {
  res.render('auth/login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    isLoggedIn = true;
    res.render('index', { user });
  } else {
    res.render('auth/login', { error: 'Username atau password salah!' });
  }
});

// Beranda
app.get('/', requireLogin, (req, res) => {
  res.render('index', { user: { username: 'admin' } });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
