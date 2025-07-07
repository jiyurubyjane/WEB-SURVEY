require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const runQuery = async (sql, params = []) => {
    const client = await pool.connect();
    try {
        await client.query(sql, params);
        const tableNameMatch = sql.match(/TABLE IF NOT EXISTS (\w+)/);
        if (tableNameMatch) {
            console.log(`Tabel '${tableNameMatch[1]}' berhasil disiapkan.`);
        }
    } catch (err) {
        console.error(`Gagal menjalankan query: ${sql.substring(0, 40)}...`, err.message);
        throw err;
    } finally {
        client.release();
    }
};

const setupDatabase = async () => {
  try {
    console.log("Memulai proses setup database untuk Supabase...");
    
    await runQuery(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, nama TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, peran TEXT NOT NULL)`);
    await runQuery(`CREATE TABLE IF NOT EXISTS kategori_olahraga (id SERIAL PRIMARY KEY, nama_cabor TEXT NOT NULL UNIQUE)`);
    await runQuery(`CREATE TABLE IF NOT EXISTS events (id SERIAL PRIMARY KEY, nama_event TEXT NOT NULL, lokasi TEXT, tanggal_mulai DATE, tanggal_selesai DATE, status TEXT DEFAULT 'aktif', deskripsi TEXT, jumlah_peserta INTEGER, skala_event TEXT, kategori_olahraga_id INTEGER, FOREIGN KEY (kategori_olahraga_id) REFERENCES kategori_olahraga (id))`);
    await runQuery(`CREATE TABLE IF NOT EXISTS sponsors (id SERIAL PRIMARY KEY, event_id INTEGER NOT NULL, nama_sponsor TEXT NOT NULL, FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE)`);
    await runQuery(`CREATE TABLE IF NOT EXISTS kuesioner (id SERIAL PRIMARY KEY, event_id INTEGER NOT NULL, tipe_responden TEXT NOT NULL, nama_kuesioner TEXT, UNIQUE(event_id, tipe_responden), FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE)`);
    await runQuery(`CREATE TABLE IF NOT EXISTS pertanyaan (id SERIAL PRIMARY KEY, kuesioner_id INTEGER NOT NULL, teks_pertanyaan TEXT NOT NULL, tipe_jawaban TEXT NOT NULL, urutan INTEGER, FOREIGN KEY (kuesioner_id) REFERENCES kuesioner (id) ON DELETE CASCADE)`);
    await runQuery(`CREATE TABLE IF NOT EXISTS pilihan_jawaban (id SERIAL PRIMARY KEY, pertanyaan_id INTEGER NOT NULL, teks_pilihan TEXT NOT NULL, FOREIGN KEY (pertanyaan_id) REFERENCES pertanyaan (id) ON DELETE CASCADE)`);
    await runQuery(`CREATE TABLE IF NOT EXISTS survey_sessions (id SERIAL PRIMARY KEY, kuesioner_id INTEGER NOT NULL, surveyor_id INTEGER NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), FOREIGN KEY (kuesioner_id) REFERENCES kuesioner(id) ON DELETE CASCADE, FOREIGN KEY (surveyor_id) REFERENCES users(id))`);
    await runQuery(`CREATE TABLE IF NOT EXISTS jawaban (id SERIAL PRIMARY KEY, session_id INTEGER NOT NULL, pertanyaan_id INTEGER NOT NULL, isi_jawaban TEXT, FOREIGN KEY (session_id) REFERENCES survey_sessions(id) ON DELETE CASCADE, FOREIGN KEY (pertanyaan_id) REFERENCES pertanyaan (id) ON DELETE CASCADE)`);
    
    const cabor = ['Sepak Bola', 'Bulu Tangkis', 'Bola Basket', 'Bola Voli', 'Tenis', 'Atletik', 'Renang', 'Balap Motor', 'Balap Mobil', 'Panahan'];
    const insertCaborSql = `INSERT INTO kategori_olahraga (nama_cabor) VALUES ($1) ON CONFLICT (nama_cabor) DO NOTHING`;
    for (const nama of cabor) {
      await pool.query(insertCaborSql, [nama]);
    }
    console.log("Data awal 'kategori_olahraga' OK.");

  } catch (err) {
    console.error("Terjadi error fatal selama setup.");
  } finally {
    await pool.end();
    console.log("Setup database selesai. Koneksi ditutup.");
  }
};

setupDatabase();
