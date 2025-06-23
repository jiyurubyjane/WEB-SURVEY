// update_database.js (Versi Perbaikan)
const sqlite3 = require('sqlite3').verbose();

// 1. Buka koneksi ke database
const db = new sqlite3.Database('./kemenpora.db', (err) => {
    if (err) {
        return console.error('Gagal membuka database:', err.message);
    }
    console.log('Berhasil terhubung ke database kemenpora.db.');
});

// 2. Siapkan perintah SQL untuk membuat tabel
const createTableSql = `
CREATE TABLE IF NOT EXISTS survey_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    surveyor_id INTEGER NOT NULL,
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
    FOREIGN KEY (surveyor_id) REFERENCES users (id)
)`;

// 3. Jalankan perintah SQL
db.run(createTableSql, function(err) {
    if (err) {
        // Jika ada error saat menjalankan, tampilkan pesannya
        console.error("Error saat membuat tabel:", err.message);
    } else {
        // Jika berhasil, tampilkan pesan sukses
        console.log("Tabel 'survey_results' berhasil diperiksa/dibuat.");
    }

    // 4. Tutup koneksi HANYA SETELAH perintah selesai dijalankan
    db.close((err) => {
        if (err) {
            return console.error('Error saat menutup database:', err.message);
        }
        console.log('Koneksi database ditutup dengan aman.');
    });
});