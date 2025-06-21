// utils/generateCred.js

// Fungsi untuk generate username dari nama lengkap
exports.generateUsername = (fullName) => {
  const slug = fullName.toLowerCase().replace(/\s+/g, '');
  const rand = Math.floor(100 + Math.random() * 900); // 3 digit acak
  return `${slug}${rand}`;
};

// Fungsi untuk generate password acak 8 karakter
exports.generatePassword = () => {
  return Math.random().toString(36).slice(-8); // contoh: "h2x1k9zq"
};
