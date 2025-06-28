const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "kemenpora.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error("Gagal terhubung ke database:", err.message);
  }
  console.log("Berhasil terhubung ke database untuk setup.");
});

const runQuery = (sql) => {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

const setupDatabase = async () => {
  try {
    console.log("Memulai proses setup database... Menghapus dan membuat ulang tabel.");

    await runQuery(`DROP TABLE IF EXISTS sponsors`);
    await runQuery(`DROP TABLE IF EXISTS survey_results`);
    await runQuery(`DROP TABLE IF EXISTS events`);
    await runQuery(`DROP TABLE IF EXISTS kategori_olahraga`);

    await runQuery(`CREATE TABLE kategori_olahraga (id INTEGER PRIMARY KEY AUTOINCREMENT, nama_cabor TEXT NOT NULL UNIQUE)`);
    console.log("Tabel 'kategori_olahraga' berhasil dibuat.");
    
    const cabor = ['Sepak Bola', 'Bulu Tangkis', 'Bola Basket', 'Bola Voli', 'Tenis', 'Atletik', 'Renang', 'Balap Motor', 'Balap Mobil', 'Panahan'];
    const insertCaborSql = `INSERT OR IGNORE INTO kategori_olahraga (nama_cabor) VALUES (?)`;
    for (const nama of cabor) {
      await runQuery(insertCaborSql, [nama]);
    }
    console.log("Data awal untuk kategori olahraga berhasil ditambahkan.");

    await runQuery(`CREATE TABLE events (id INTEGER PRIMARY KEY AUTOINCREMENT, nama_event TEXT NOT NULL, lokasi TEXT, tanggal_mulai DATE, tanggal_selesai DATE, status TEXT DEFAULT 'aktif', deskripsi TEXT, jumlah_peserta INTEGER, skala_event TEXT, kategori_olahraga_id INTEGER, FOREIGN KEY (kategori_olahraga_id) REFERENCES kategori_olahraga (id))`);
    console.log("Tabel 'events' berhasil dibuat.");

    await runQuery(`CREATE TABLE sponsors (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, nama_sponsor TEXT NOT NULL, FOREIGN KEY (event_id) REFERENCES events (id))`);
    console.log("Tabel 'sponsors' berhasil dibuat.");
    
    await runQuery(`CREATE TABLE survey_results (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER, surveyor_id INTEGER, asal_kota TEXT, tujuan_utama TEXT, lama_tinggal INTEGER, jumlah_rombongan INTEGER, belanja_akomodasi INTEGER, belanja_makan_minum INTEGER, belanja_transportasi INTEGER, belanja_oleh_oleh INTEGER, belanja_tiket INTEGER, belanja_lainnya INTEGER, FOREIGN KEY (event_id) REFERENCES events (id), FOREIGN KEY (surveyor_id) REFERENCES users (id))`);
    console.log("Tabel 'survey_results' berhasil dibuat.");

  } catch (err) {
    console.error("Terjadi error selama setup:", err.message);
  } finally {
    db.close((err) => {
      if (err) {
        console.error("Gagal menutup koneksi database:", err.message);
      } else {
        console.log("Setup database selesai. Koneksi ditutup.");
      }
    });
  }
};

setupDatabase();
