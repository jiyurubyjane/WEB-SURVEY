// ==========================================================
// KODE SERVER FINAL APLIKASI KEMENPORA - VERSI INI PASTI BENAR
// ==========================================================

// Tahap 1: Memuat modul-modul penting
const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');

// Inisialisasi aplikasi Express
const app = express();
const port = 4000;
const saltRounds = 10;

// Tahap 2: Setup Middleware dan Konfigurasi
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'kunci-rahasia-super-aman-untuk-proyek-kemenpora',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Tahap 3: Koneksi ke Database
const dbPath = path.join(__dirname, 'kemenpora.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('FATAL ERROR: Gagal terhubung ke database di:', dbPath);
        console.error(err.message);
        process.exit(1);
    } else {
        console.log('Berhasil terhubung ke database.');
    }
});

// Middleware Keamanan untuk melindungi rute
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// ==========================================================
// Tahap 4: Definisi Rute (Routes)
// ==========================================================

// Halaman Utama
app.get('/', (req, res) => {
    res.send('Selamat Datang di Website Kemenpora! Silakan ke <a href="/register">Registrasi</a> atau <a href="/login">Login</a>');
});

// --- Rute Otentikasi ---
app.get('/register', (req, res) => {
    res.render('register');
});

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

app.get('/login', (req, res) => {
    res.render('login');
});

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

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.redirect('/dashboard');
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});


// --- Rute Aplikasi (Halaman setelah login) ---
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

app.get('/input-survei', isAuthenticated, (req, res) => {
    if (req.session.user.peran !== 'Surveyor' && req.session.user.peran !== 'Admin') {
        return res.status(403).send('Akses ditolak: Anda tidak memiliki izin.');
    }
    db.all("SELECT id, nama_event FROM events ORDER BY id DESC", [], (err, events) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Gagal memuat daftar event.');
        }
        res.render('input-survei', { user: req.session.user, events: events });
    });
});

app.post('/submit-survei', isAuthenticated, (req, res) => {
    if (req.session.user.peran !== 'Surveyor' && req.session.user.peran !== 'Admin') {
        return res.status(403).send('Akses ditolak.');
    }
    const surveyorId = req.session.user.id;
    const { 
        event_id, asal_kota, tujuan_utama, lama_tinggal, jumlah_rombongan,
        belanja_akomodasi, belanja_makan_minum, belanja_transportasi,
        belanja_oleh_oleh, belanja_tiket, belanja_lainnya 
    } = req.body;
    const sql = `INSERT INTO survey_results (
        event_id, surveyor_id, asal_kota, tujuan_utama, lama_tinggal, jumlah_rombongan,
        belanja_akomodasi, belanja_makan_minum, belanja_transportasi,
        belanja_oleh_oleh, belanja_tiket, belanja_lainnya
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        event_id, surveyorId, asal_kota, tujuan_utama, lama_tinggal, jumlah_rombongan,
        belanja_akomodasi, belanja_makan_minum, belanja_transportasi,
        belanja_oleh_oleh, belanja_tiket, belanja_lainnya
    ];
    db.run(sql, params, function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Gagal menyimpan data ke database.');
        }
        console.log(`Data survei baru untuk event ID ${event_id} telah disimpan dengan ID: ${this.lastID}`);
        res.redirect('/input-survei');
    });
});


// --- Rute untuk Manajemen Event (CRUD) ---
app.get('/events', isAuthenticated, (req, res) => {
    if (req.session.user.peran !== 'Admin' && req.session.user.peran !== 'Analis') {
        return res.status(403).send('Akses ditolak.');
    }
    const sql = "SELECT * FROM events ORDER BY tanggal_mulai DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error mengambil data event:", err.message);
            return res.status(500).send('Gagal mengambil data event.');
        }
        // PERBAIKANNYA DI SINI: Pastikan me-render file 'list-event'
        res.render('list-event', { events: rows });
    });
});

// --- Rute untuk Manajemen Pengguna ---
app.get('/kelola-pengguna', isAuthenticated, (req, res) => {
    if (req.session.user.peran !== 'Admin') {
        return res.status(403).send('Akses ditolak. Anda bukan Admin.');
    }
    const sql = "SELECT id, nama, email, peran FROM users ORDER BY id";
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error mengambil data pengguna:", err.message);
            return res.status(500).send('Gagal mengambil data pengguna.');
        }
        res.render('list-pengguna', { users: rows });
    });
});

app.post('/users/delete/:id', isAuthenticated, (req, res) => {
    if (req.session.user.peran !== 'Admin') {
        return res.status(403).send('Akses ditolak.');
    }
    const userIdToDelete = req.params.id;
    if (userIdToDelete == req.session.user.id) {
        return res.status(400).send('Anda tidak dapat menghapus akun Anda sendiri.');
    }
    const sql = 'DELETE FROM users WHERE id = ?';
    db.run(sql, [userIdToDelete], function(err) {
        if (err) {
            console.error("Error menghapus pengguna:", err.message);
            return res.status(500).send('Gagal menghapus pengguna.');
        }
        console.log(`Pengguna dengan ID ${userIdToDelete} telah dihapus.`);
        res.redirect('/kelola-pengguna');
    });
});

// Rute untuk MENAMPILKAN semua hasil survei untuk satu event
app.get('/events/:id/surveys', isAuthenticated, (req, res) => {
    const eventId = req.params.id;
    let eventData;

    // Pertama, ambil detail event untuk ditampilkan di judul
    const eventSql = "SELECT * FROM events WHERE id = ?";
    db.get(eventSql, [eventId], (err, eventRow) => {
        if (err) return res.status(500).send('Gagal mengambil data event.');
        if (!eventRow) return res.status(404).send('Event tidak ditemukan.');
        
        eventData = eventRow;

        // Kedua, ambil semua data survei yang cocok dengan eventId
        const surveySql = "SELECT * FROM survey_results WHERE event_id = ?";
        db.all(surveySql, [eventId], (err, surveyRows) => {
            if (err) return res.status(500).send('Gagal mengambil data survei.');
            
            // Render halaman list-hasil-survei dan kirim kedua data tersebut
            res.render('list-hasil-survei', {
                event: eventData,
                surveys: surveyRows
            });
        });
    });
});

// ==========================================================
// Tahap 5: Menjalankan Server
// ==========================================================
app.listen(port, () => {
    console.log(`================================================`);
    console.log(`   SERVER APLIKASI LENGKAP BERJALAN`);
    console.log(`   di http://localhost:${port}`);
    console.log(`================================================`);
});