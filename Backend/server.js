// server.js (Versi Final dengan Rute Baru)

console.log('--- Memulai server.js ---');

// Tahap 1: Memuat modul
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');

console.log('[OK] 1. Semua modul berhasil di-load.');

const app = express();
const port = 3000;
const saltRounds = 10;

// Tahap 2: Setup Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'kunci-rahasia-kemenpora-yang-sangat-aman',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
console.log('[OK] 2. Middleware berhasil di-setup.');

// Tahap 3: Koneksi ke Database
console.log('[...] 3. Mencoba membuka koneksi database...');
const db = new sqlite3.Database('./kemenpora.db', (err) => {
    if (err) {
        return console.error('GAGAL KONEK KE DATABASE:', err.message);
    }
    console.log('[OK] 4. Koneksi ke database berhasil.');
});

// Middleware untuk melindungi rute
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// Tahap 4: Definisi Rute
app.get('/', (req, res) => {
    res.send('Selamat Datang di Website Kemenpora! Silakan ke <a href="/register">Registrasi</a> atau <a href="/login">Login</a>');
});

app.get('/register', (req, res) => res.render('register'));

app.post('/register', (req, res) => {
    const { nama, email, password, peran } = req.body;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) return res.status(500).send('Error saat hashing password.');
        const sql = `INSERT INTO users (nama, email, password_hash, peran) VALUES (?, ?, ?, ?)`;
        db.run(sql, [nama, email, hash, peran], function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Email mungkin sudah terdaftar.');
            }
            console.log(`User baru telah dibuat dengan ID: ${this.lastID}`);
            res.redirect('/login');
        });
    });
});

app.get('/login', (req, res) => res.render('login'));

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], (err, user) => {
        if (err || !user) return res.send('Kombinasi email dan password salah.');
        bcrypt.compare(password, user.password_hash, (err, result) => {
            if (result) {
                req.session.user = { id: user.id, nama: user.nama, email: user.email, peran: user.peran };
                res.redirect('/dashboard');
            } else {
                res.send('Kombinasi email dan password salah.');
            }
        });
    });
});

app.get('/dashboard', isAuthenticated, (req, res) => res.render('dashboard', { user: req.session.user }));

// Rute untuk menampilkan halaman form input survei
app.get('/input-survei', isAuthenticated, (req, res) => {
    if (req.session.user.peran === 'Surveyor' || req.session.user.peran === 'Admin') {
        res.render('input-survei', { user: req.session.user });
    } else {
        res.status(403).send('Akses ditolak: Anda tidak memiliki izin untuk mengakses halaman ini.');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.redirect('/dashboard');
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

console.log('[OK] 5. Semua rute (routes) berhasil didefinisikan.');

// Tahap 5: Menjalankan Server
console.log('[...] 6. Mencoba menyalakan server...');
app.listen(port, () => {
    console.log(`================================================`);
    console.log(`   SERVER BERJALAN DI http://localhost:${port}`);
    console.log(`================================================`);
});