// backend/setup_database.js
// Skrip ini akan membuat ulang seluruh struktur database dari awal.
// Jalankan skrip ini hanya sekali.

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'kemenpora.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error('Gagal membuka database:', err.message);
    console.log('Berhasil terhubung ke database untuk setup.');
});

console.log('Memulai proses setup database...');

db.serialize(() => {
    // 1. Membuat tabel 'users'
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        peran TEXT NOT NULL CHECK(peran IN ('Admin', 'Analis', 'Surveyor'))
    )`, (err) => {
        if (err) return console.error("Error saat membuat tabel users:", err.message);
        console.log("-> Tabel 'users' berhasil diperiksa/dibuat.");
    });

    // 2. Membuat tabel 'events'
    db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_event TEXT NOT NULL,
        lokasi TEXT,
        tanggal_mulai DATE,
        tanggal_selesai DATE
    )`, (err) => {
        if (err) return console.error("Error saat membuat tabel events:", err.message);
        console.log("-> Tabel 'events' berhasil diperiksa/dibuat.");
    });

    // 3. Membuat tabel 'survey_results'
    db.run(`CREATE TABLE IF NOT EXISTS survey_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surveyor_id INTEGER NOT NULL,
        event_id INTEGER NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        asal_kota TEXT,
        tujuan_utama TEXT,
        lama_tinggal INTEGER,
        jumlah_rombongan INTEGER,
        belanja_akomodasi INTEGER,
        belanja_makan_minum INTEGER,
        belanja_transportasi INTEGER,
        belanja_oleh_oleh INTEGER,
        belanja_tiket INTEGER,
        belanja_lainnya INTEGER,
        FOREIGN KEY (surveyor_id) REFERENCES users (id),
        FOREIGN KEY (event_id) REFERENCES events (id)
    )`, (err) => {
        if (err) return console.error("Error saat membuat tabel survey_results:", err.message);
        console.log("-> Tabel 'survey_results' berhasil diperiksa/dibuat.");
    });
});

db.close((err) => {
    if (err) return console.error('Error saat menutup database:', err.message);
    console.log('Setup database selesai. Koneksi ditutup.');
});
