// database.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./kemenpora.db');

db.serialize(() => {
  console.log('Membuat tabel pengguna jika belum ada...');
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    peran TEXT NOT NULL CHECK(peran IN ('Admin', 'Analis', 'Surveyor'))
  )`, (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Tabel pengguna siap.');
  });
});

db.close();