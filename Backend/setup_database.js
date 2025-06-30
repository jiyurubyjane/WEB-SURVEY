const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "kemenpora.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error("Gagal terhubung ke database:", err.message);
  }
  console.log("Berhasil terhubung ke database untuk setup.");
});

const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
};

const setupDatabase = async () => {
  try {
    console.log("Memulai proses setup database...");
    
    await runQuery(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, nama TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, peran TEXT NOT NULL)`);
    await runQuery(`CREATE TABLE IF NOT EXISTS kategori_olahraga (id INTEGER PRIMARY KEY AUTOINCREMENT, nama_cabor TEXT NOT NULL UNIQUE)`);
    await runQuery(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, nama_event TEXT NOT NULL, lokasi TEXT, tanggal_mulai DATE, tanggal_selesai DATE, status TEXT DEFAULT 'aktif', deskripsi TEXT, jumlah_peserta INTEGER, skala_event TEXT, kategori_olahraga_id INTEGER, FOREIGN KEY (kategori_olahraga_id) REFERENCES kategori_olahraga (id))`);
    await runQuery(`CREATE TABLE IF NOT EXISTS sponsors (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, nama_sponsor TEXT NOT NULL, FOREIGN KEY (event_id) REFERENCES events (id))`);
    await runQuery(`CREATE TABLE IF NOT EXISTS kuesioner (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, tipe_responden TEXT NOT NULL, nama_kuesioner TEXT, UNIQUE(event_id, tipe_responden), FOREIGN KEY (event_id) REFERENCES events (id))`);
    await runQuery(`CREATE TABLE IF NOT EXISTS pertanyaan (id INTEGER PRIMARY KEY AUTOINCREMENT, kuesioner_id INTEGER NOT NULL, teks_pertanyaan TEXT NOT NULL, tipe_jawaban TEXT NOT NULL, urutan INTEGER, FOREIGN KEY (kuesioner_id) REFERENCES kuesioner (id))`);
    await runQuery(`CREATE TABLE IF NOT EXISTS pilihan_jawaban (id INTEGER PRIMARY KEY AUTOINCREMENT, pertanyaan_id INTEGER NOT NULL, teks_pilihan TEXT NOT NULL, FOREIGN KEY (pertanyaan_id) REFERENCES pertanyaan (id))`);
    await runQuery(`CREATE TABLE IF NOT EXISTS survey_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, kuesioner_id INTEGER NOT NULL, surveyor_id INTEGER NOT NULL, FOREIGN KEY (kuesioner_id) REFERENCES kuesioner(id), FOREIGN KEY (surveyor_id) REFERENCES users(id))`);
    await runQuery(`CREATE TABLE IF NOT EXISTS jawaban (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id INTEGER NOT NULL, pertanyaan_id INTEGER NOT NULL, isi_jawaban TEXT, FOREIGN KEY (session_id) REFERENCES survey_sessions(id), FOREIGN KEY (pertanyaan_id) REFERENCES pertanyaan (id))`);
    console.log("Semua tabel berhasil disiapkan.");

    const cabor = ['Sepak Bola', 'Bulu Tangkis', 'Bola Basket', 'Bola Voli', 'Tenis', 'Atletik', 'Renang', 'Balap Motor', 'Balap Mobil', 'Panahan'];
    const insertCaborSql = `INSERT OR IGNORE INTO kategori_olahraga (nama_cabor) VALUES (?)`;
    for (const nama of cabor) {
      await runQuery(insertCaborSql, [nama]);
    }
    console.log("Data awal 'kategori_olahraga' OK.");

  } catch (err) {
    console.error("Terjadi error selama setup:", err.message);
  } finally {
    db.close((err) => {
      if (err) console.error("Gagal menutup koneksi database:", err.message);
      else console.log("Setup database selesai.");
    });
  }
};

setupDatabase();
