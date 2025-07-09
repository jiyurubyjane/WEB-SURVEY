require('dotenv').config();
const { Pool } = require('pg');

// --- KONFIGURASI ---
// Ganti angka 1 di bawah ini dengan ID event yang ingin Anda tambahkan datanya.
const TARGET_EVENT_ID = 1; 
const JUMLAH_DATA_PER_KUESIONER = 20;
// --------------------

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const generateDummyAnswer = (questionText) => {
    const text = questionText.toLowerCase();

    // Logika untuk pertanyaan spesifik
    if (text.includes('total anggaran')) {
        return (Math.floor(Math.random() * 50) * 10000000 + 50000000).toString(); // Angka besar untuk total
    }
    if (text.includes('omset') || text.includes('pengeluaran') || text.includes('biaya') || text.includes('upah')) {
        return (Math.floor(Math.random() * 20) * 500000 + 500000).toString();
    }
    if (text.includes('jumlah') || text.includes('tenaga kerja')) {
        return (Math.floor(Math.random() * 10) + 1).toString();
    }
    if (text.includes('puas') || text.includes('fasilitas') || text.includes('apakah')) {
        return Math.random() > 0.3 ? 'Ya' : 'Tidak';
    }
    if (text.includes('jenis usaha')) {
        const usaha = ['Makanan', 'Minuman', 'Pakaian', 'Aksesoris', 'Jasa', 'Percetakan', 'Souvenir'];
        return usaha[Math.floor(Math.random() * usaha.length)];
    }
    if (text.includes('nama')) {
        const namaDepan = ['Budi', 'Ani', 'Citra', 'Dewi', 'Eko', 'Fajar', 'Gita'];
        const namaBelakang = ['Santoso', 'Wijaya', 'Lestari', 'Permata', 'Nugroho', 'Pratama'];
        return `${namaDepan[Math.floor(Math.random() * namaDepan.length)]} ${namaBelakang[Math.floor(Math.random() * namaBelakang.length)]}`;
    }
    if (text.includes('domisili')) {
        const kota = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Makassar', 'Yogyakarta', 'Semarang'];
        return kota[Math.floor(Math.random() * kota.length)];
    }
    if (text.includes('transportasi')) {
        const transport = ['Kendaraan Pribadi', 'Transportasi Online', 'Angkutan Umum', 'Pesawat'];
        return transport[Math.floor(Math.random() * transport.length)];
    }
     if (text.includes('umur')) {
        return (Math.floor(Math.random() * 30) + 18).toString();
    }
    
    return 'Jawaban Lainnya';
};

const run = async () => {
    const client = await pool.connect();
    console.log("Memulai proses penambahan data dummy...");

    try {
        await client.query('BEGIN');

        const eventCheck = await client.query('SELECT id FROM events WHERE id = $1', [TARGET_EVENT_ID]);
        if (eventCheck.rowCount === 0) {
            throw new Error(`Event dengan ID ${TARGET_EVENT_ID} tidak ditemukan.`);
        }

        const surveyorRes = await client.query("SELECT id FROM users WHERE peran = 'Surveyor' LIMIT 1");
        if (surveyorRes.rowCount === 0) {
            throw new Error("Tidak ada user dengan peran 'Surveyor' untuk dijadikan penginput data.");
        }
        const surveyorId = surveyorRes.rows[0].id;

        const kuesionerRes = await client.query('SELECT id, tipe_responden FROM kuesioner WHERE event_id = $1', [TARGET_EVENT_ID]);
        const kuesioners = kuesionerRes.rows;

        if (kuesioners.length === 0) {
            console.log(`Tidak ada kuesioner yang ditemukan untuk Event ID ${TARGET_EVENT_ID}. Tidak ada data yang ditambahkan.`);
        } else {
            console.log("Menghapus data survei lama untuk event ini...");
            const kuesionerIds = kuesioners.map(k => k.id);
            await client.query(`DELETE FROM survey_sessions WHERE kuesioner_id = ANY($1::int[])`, [kuesionerIds]);
            console.log("Data survei lama berhasil dihapus.");
        }

        for (const kuesioner of kuesioners) {
            console.log(`Menambahkan data untuk kuesioner: ${kuesioner.tipe_responden} (ID: ${kuesioner.id})`);
            
            const pertanyaanRes = await client.query('SELECT id, teks_pertanyaan FROM pertanyaan WHERE kuesioner_id = $1', [kuesioner.id]);
            const pertanyaans = pertanyaanRes.rows;

            if (pertanyaans.length === 0) {
                console.log(` -> Kuesioner ini tidak memiliki pertanyaan, dilewati.`);
                continue;
            }

            for (let i = 0; i < JUMLAH_DATA_PER_KUESIONER; i++) {
                const sessionRes = await client.query(`INSERT INTO survey_sessions (kuesioner_id, surveyor_id) VALUES ($1, $2) RETURNING id`, [kuesioner.id, surveyorId]);
                const sessionId = sessionRes.rows[0].id;

                for (const p of pertanyaans) {
                    const dummyAnswer = generateDummyAnswer(p.teks_pertanyaan);
                    await client.query(`INSERT INTO jawaban (session_id, pertanyaan_id, isi_jawaban) VALUES ($1, $2, $3)`, [sessionId, p.id, dummyAnswer]);
                }
            }
            console.log(` -> Berhasil menambahkan ${JUMLAH_DATA_PER_KUESIONER} baris data jawaban.`);
        }

        await client.query('COMMIT');
        console.log("Proses penambahan data berhasil diselesaikan.");

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Terjadi error saat menambah data:", err.message);
    } finally {
        client.release();
        await pool.end();
        console.log("Koneksi ke database ditutup.");
    }
};

run();
