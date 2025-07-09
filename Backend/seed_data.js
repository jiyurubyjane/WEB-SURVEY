require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const run = async () => {
    const client = await pool.connect();
    console.log("Memulai proses seeding data dummy...");

    try {
        await client.query('BEGIN');

        console.log("Membersihkan data dummy lama (jika ada)...");
        await client.query(`DELETE FROM events WHERE nama_event IN ('Pekan Olahraga Nasional 2025', 'Festival Sepak Bola U-17')`);
        console.log("Pembersihan data lama selesai.");

        console.log("Membuat Event 1: Pekan Olahraga Nasional 2025");
        const event1Res = await client.query(
            `INSERT INTO events (nama_event, lokasi, tanggal_mulai, tanggal_selesai, status, deskripsi, jumlah_peserta, skala_event, kategori_olahraga_id)
             VALUES ($1, $2, $3, $4, 'diarsipkan', $5, $6, $7, $8) RETURNING id`,
            ['Pekan Olahraga Nasional 2025', 'Jakarta', '2025-08-01', '2025-08-15', 'Acara olahraga multi-cabang tingkat nasional.', 5000, 'Nasional', 6]
        );
        const event1Id = event1Res.rows[0].id;

        const kuesionerPenonton1Res = await client.query(
            `INSERT INTO kuesioner (event_id, tipe_responden, nama_kuesioner) VALUES ($1, $2, $3) RETURNING id`,
            [event1Id, 'Penonton', 'Kuesioner Penonton PON 2025']
        );
        const kuesionerPenonton1Id = kuesionerPenonton1Res.rows[0].id;

        const pertanyaanPenonton = [
            { teks: 'Dari mana asal Anda?', tipe: 'teks', urutan: 1 },
            { teks: 'Apakah Anda puas dengan penyelenggaraan acara?', tipe: 'ya_tidak', urutan: 2 },
            { teks: 'Berapa pengeluaran Anda selama acara (Rp)?', tipe: 'nominal', urutan: 3 }
        ];
        for (const p of pertanyaanPenonton) {
            await client.query(
                `INSERT INTO pertanyaan (kuesioner_id, teks_pertanyaan, tipe_jawaban, urutan) VALUES ($1, $2, $3, $4)`,
                [kuesionerPenonton1Id, p.teks, p.tipe, p.urutan]
            );
        }

        const kuesionerUmkm1Res = await client.query(
            `INSERT INTO kuesioner (event_id, tipe_responden, nama_kuesioner) VALUES ($1, $2, $3) RETURNING id`,
            [event1Id, 'UMKM', 'Kuesioner UMKM PON 2025']
        );
        const kuesionerUmkm1Id = kuesionerUmkm1Res.rows[0].id;

        const pertanyaanUmkm = [
            { teks: 'Jenis Usaha', tipe: 'teks', urutan: 1 },
            { teks: 'Jumlah tenaga kerja yang terlibat', tipe: 'angka', urutan: 2 },
            { teks: 'Omset selama acara (Rp)', tipe: 'nominal', urutan: 3 },
            { teks: 'Omset hari biasa (Rp)', tipe: 'nominal', urutan: 4 }
        ];
        for (const p of pertanyaanUmkm) {
            await client.query(
                `INSERT INTO pertanyaan (kuesioner_id, teks_pertanyaan, tipe_jawaban, urutan) VALUES ($1, $2, $3, $4)`,
                [kuesionerUmkm1Id, p.teks, p.tipe, p.urutan]
            );
        }
        console.log("Kuesioner dan Pertanyaan untuk Event 1 berhasil dibuat.");

        console.log("Membuat Event 2: Festival Sepak Bola U-17");
        const event2Res = await client.query(
            `INSERT INTO events (nama_event, lokasi, tanggal_mulai, tanggal_selesai, status, deskripsi, jumlah_peserta, skala_event, kategori_olahraga_id)
             VALUES ($1, $2, $3, $4, 'diarsipkan', $5, $6, $7, $8) RETURNING id`,
            ['Festival Sepak Bola U-17', 'Bandung', '2025-09-10', '2025-09-12', 'Turnamen sepak bola usia muda tingkat regional.', 1500, 'Lokal', 1]
        );
        const event2Id = event2Res.rows[0].id;

        const kuesionerPeserta2Res = await client.query(
            `INSERT INTO kuesioner (event_id, tipe_responden, nama_kuesioner) VALUES ($1, $2, $3) RETURNING id`,
            [event2Id, 'Peserta', 'Kuesioner Peserta Festival U-17']
        );
        const kuesionerPeserta2Id = kuesionerPeserta2Res.rows[0].id;

        const pertanyaanPeserta = [
            { teks: 'Nama Klub / Sekolah Sepak Bola', tipe: 'teks', urutan: 1 },
            { teks: 'Apakah fasilitas pertandingan memadai?', tipe: 'ya_tidak', urutan: 2 }
        ];
        for (const p of pertanyaanPeserta) {
            await client.query(
                `INSERT INTO pertanyaan (kuesioner_id, teks_pertanyaan, tipe_jawaban, urutan) VALUES ($1, $2, $3, $4)`,
                [kuesionerPeserta2Id, p.teks, p.tipe, p.urutan]
            );
        }
        console.log("Kuesioner dan Pertanyaan untuk Event 2 berhasil dibuat.");

        console.log("Membuat jawaban dummy...");
        const surveyorIds = (await client.query("SELECT id FROM users WHERE peran = 'Surveyor'")).rows.map(r => r.id);
        if (surveyorIds.length === 0) {
            console.warn("Tidak ada user dengan peran 'Surveyor'. Jawaban dummy tidak bisa dibuat.");
        } else {
            const umkmPertanyaan = (await client.query(`SELECT id, teks_pertanyaan FROM pertanyaan WHERE kuesioner_id = ${kuesionerUmkm1Id}`)).rows;
            const penontonPertanyaan = (await client.query(`SELECT id, teks_pertanyaan FROM pertanyaan WHERE kuesioner_id = ${kuesionerPenonton1Id}`)).rows;
            const pesertaPertanyaan = (await client.query(`SELECT id, teks_pertanyaan FROM pertanyaan WHERE kuesioner_id = ${kuesionerPeserta2Id}`)).rows;

            const umkmData = [
                { 'Jenis Usaha': 'Makanan', 'Jumlah tenaga kerja yang terlibat': '5', 'Omset selama acara (Rp)': '7500000', 'Omset hari biasa (Rp)': '2000000' }, { 'Jenis Usaha': 'Pakaian', 'Jumlah tenaga kerja yang terlibat': '3', 'Omset selama acara (Rp)': '5000000', 'Omset hari biasa (Rp)': '1500000' }, { 'Jenis Usaha': 'Aksesoris', 'Jumlah tenaga kerja yang terlibat': '2', 'Omset selama acara (Rp)': '3000000', 'Omset hari biasa (Rp)': '800000' }, { 'Jenis Usaha': 'Minuman', 'Jumlah tenaga kerja yang terlibat': '4', 'Omset selama acara (Rp)': '6000000', 'Omset hari biasa (Rp)': '1800000' }, { 'Jenis Usaha': 'Souvenir', 'Jumlah tenaga kerja yang terlibat': '2', 'Omset selama acara (Rp)': '4500000', 'Omset hari biasa (Rp)': '1000000' }, { 'Jenis Usaha': 'Jasa Parkir', 'Jumlah tenaga kerja yang terlibat': '10', 'Omset selama acara (Rp)': '12000000', 'Omset hari biasa (Rp)': '3000000' }, { 'Jenis Usaha': 'Merchandise Resmi', 'Jumlah tenaga kerja yang terlibat': '8', 'Omset selama acara (Rp)': '15000000', 'Omset hari biasa (Rp)': '0' }, { 'Jenis Usaha': 'Kerajinan Tangan', 'Jumlah tenaga kerja yang terlibat': '3', 'Omset selama acara (Rp)': '2500000', 'Omset hari biasa (Rp)': '600000' }, { 'Jenis Usaha': 'Fotografi', 'Jumlah tenaga kerja yang terlibat': '2', 'Omset selama acara (Rp)': '4000000', 'Omset hari biasa (Rp)': '1200000' }, { 'Jenis Usaha': 'Percetakan', 'Jumlah tenaga kerja yang terlibat': '4', 'Omset selama acara (Rp)': '3500000', 'Omset hari biasa (Rp)': '900000' }, { 'Jenis Usaha': 'Mainan Anak', 'Jumlah tenaga kerja yang terlibat': '2', 'Omset selama acara (Rp)': '1800000', 'Omset hari biasa (Rp)': '400000' }, { 'Jenis Usaha': 'Kopi', 'Jumlah tenaga kerja yang terlibat': '3', 'Omset selama acara (Rp)': '5500000', 'Omset hari biasa (Rp)': '2200000' }, { 'Jenis Usaha': 'Es Krim', 'Jumlah tenaga kerja yang terlibat': '2', 'Omset selama acara (Rp)': '4800000', 'Omset hari biasa (Rp)': '1300000' }, { 'Jenis Usaha': 'Makanan Ringan', 'Jumlah tenaga kerja yang terlibat': '4', 'Omset selama acara (Rp)': '6200000', 'Omset hari biasa (Rp)': '1900000' }, { 'Jenis Usaha': 'Topi & Kacamata', 'Jumlah tenaga kerja yang terlibat': '1', 'Omset selama acara (Rp)': '2200000', 'Omset hari biasa (Rp)': '500000' }, { 'Jenis Usaha': 'Layanan Pijat', 'Jumlah tenaga kerja yang terlibat': '5', 'Omset selama acara (Rp)': '3800000', 'Omset hari biasa (Rp)': '700000' }, { 'Jenis Usaha': 'Produk Herbal', 'Jumlah tenaga kerja yang terlibat': '2', 'Omset selama acara (Rp)': '1900000', 'Omset hari biasa (Rp)': '650000' }, { 'Jenis Usaha': 'Kosmetik', 'Jumlah tenaga kerja yang terlibat': '3', 'Omset selama acara (Rp)': '2800000', 'Omset hari biasa (Rp)': '1100000' }, { 'Jenis Usaha': 'Jasa Titip', 'Jumlah tenaga kerja yang terlibat': '1', 'Omset selama acara (Rp)': '1500000', 'Omset hari biasa (Rp)': '300000' }, { 'Jenis Usaha': 'Tiket Box', 'Jumlah tenaga kerja yang terlibat': '6', 'Omset selama acara (Rp)': '25000000', 'Omset hari biasa (Rp)': '0' }
            ];
            for (const data of umkmData) {
                const sessionRes = await client.query(`INSERT INTO survey_sessions (kuesioner_id, surveyor_id) VALUES ($1, $2) RETURNING id`, [kuesionerUmkm1Id, surveyorIds[0]]);
                const sessionId = sessionRes.rows[0].id;
                for (const p of umkmPertanyaan) {
                    await client.query(`INSERT INTO jawaban (session_id, pertanyaan_id, isi_jawaban) VALUES ($1, $2, $3)`, [sessionId, p.id, data[p.teks_pertanyaan]]);
                }
            }
             console.log("Data dummy untuk UMKM (Event 1) berhasil dibuat.");

            const penontonData = [
                { 'Dari mana asal Anda?': 'Jakarta', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Ya', 'Berapa pengeluaran Anda selama acara (Rp)?': '500000' }, { 'Dari mana asal Anda?': 'Bogor', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Ya', 'Berapa pengeluaran Anda selama acara (Rp)?': '350000' }, { 'Dari mana asal Anda?': 'Jakarta', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Tidak', 'Berapa pengeluaran Anda selama acara (Rp)?': '200000' }, { 'Dari mana asal Anda?': 'Bekasi', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Ya', 'Berapa pengeluaran Anda selama acara (Rp)?': '700000' }, { 'Dari mana asal Anda?': 'Tangerang', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Ya', 'Berapa pengeluaran Anda selama acara (Rp)?': '450000' }, { 'Dari mana asal Anda?': 'Bandung', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Ya', 'Berapa pengeluaran Anda selama acara (Rp)?': '800000' }, { 'Dari mana asal Anda?': 'Surabaya', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Ya', 'Berapa pengeluaran Anda selama acara (Rp)?': '1200000' }, { 'Dari mana asal Anda?': 'Depok', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Tidak', 'Berapa pengeluaran Anda selama acara (Rp)?': '150000' }, { 'Dari mana asal Anda?': 'Jakarta', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Ya', 'Berapa pengeluaran Anda selama acara (Rp)?': '650000' }, { 'Dari mana asal Anda?': 'Yogyakarta', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Ya', 'Berapa pengeluaran Anda selama acara (Rp)?': '900000' }, { 'Dari mana asal Anda?': 'Semarang', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Ya', 'Berapa pengeluaran Anda selama acara (Rp)?': '750000' }, { 'Dari mana asal Anda?': 'Medan', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Ya', 'Berapa pengeluaran Anda selama acara (Rp)?': '1500000' }, { 'Dari mana asal Anda?': 'Makassar', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Tidak', 'Berapa pengeluaran Anda selama acara (Rp)?': '400000' }, { 'Dari mana asal Anda?': 'Palembang', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Ya', 'Berapa pengeluaran Anda selama acara (Rp)?': '600000' }, { 'Dari mana asal Anda?': 'Denpasar', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Ya', 'Berapa pengeluaran Anda selama acara (Rp)?': '1100000' }, { 'Dari mana asal Anda?': 'Malang', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Ya', 'Berapa pengeluaran Anda selama acara (Rp)?': '550000' }, { 'Dari mana asal Anda?': 'Solo', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Ya', 'Berapa pengeluaran Anda selama acara (Rp)?': '400000' }, { 'Dari mana asal Anda?': 'Cirebon', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Tidak', 'Berapa pengeluaran Anda selama acara (Rp)?': '250000' }, { 'Dari mana asal Anda?': 'Serang', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Ya', 'Berapa pengeluaran Anda selama acara (Rp)?': '300000' }, { 'Dari mana asal Anda?': 'Karawang', 'Apakah Anda puas dengan penyelenggaraan acara?': 'Ya', 'Berapa pengeluaran Anda selama acara (Rp)?': '320000' }
            ];
            for (const data of penontonData) {
                const sessionRes = await client.query(`INSERT INTO survey_sessions (kuesioner_id, surveyor_id) VALUES ($1, $2) RETURNING id`, [kuesionerPenonton1Id, surveyorIds[0]]);
                const sessionId = sessionRes.rows[0].id;
                for (const p of penontonPertanyaan) {
                    await client.query(`INSERT INTO jawaban (session_id, pertanyaan_id, isi_jawaban) VALUES ($1, $2, $3)`, [sessionId, p.id, data[p.teks_pertanyaan]]);
                }
            }
            console.log("Data dummy untuk Penonton (Event 1) berhasil dibuat.");

            const pesertaData = [
                { 'Nama Klub / Sekolah Sepak Bola': 'SSB Macan Kemayoran', 'Apakah fasilitas pertandingan memadai?': 'Ya' }, { 'Nama Klub / Sekolah Sepak Bola': 'Akademi Persib', 'Apakah fasilitas pertandingan memadai?': 'Ya' }, { 'Nama Klub / Sekolah Sepak Bola': 'SSB Villa 2000', 'Apakah fasilitas pertandingan memadai?': 'Tidak' }, { 'Nama Klub / Sekolah Sepak Bola': 'Bina Taruna', 'Apakah fasilitas pertandingan memadai?': 'Ya' }, { 'Nama Klub / Sekolah Sepak Bola': 'ASIOP Apacinti', 'Apakah fasilitas pertandingan memadai?': 'Ya' }, { 'Nama Klub / Sekolah Sepak Bola': 'Pelita Jaya Soccer School', 'Apakah fasilitas pertandingan memadai?': 'Ya' }, { 'Nama Klub / Sekolah Sepak Bola': 'Diklat Ragunan', 'Apakah fasilitas pertandingan memadai?': 'Ya' }, { 'Nama Klub / Sekolah Sepak Bola': 'Tunas Cipta', 'Apakah fasilitas pertandingan memadai?': 'Tidak' }, { 'Nama Klub / Sekolah Sepak Bola': 'Jakarta Football Academy', 'Apakah fasilitas pertandingan memadai?': 'Ya' }, { 'Nama Klub / Sekolah Sepak Bola': 'Bandung Pro United', 'Apakah fasilitas pertandingan memadai?': 'Ya' }, { 'Nama Klub / Sekolah Sepak Bola': 'ISA Trisakti', 'Apakah fasilitas pertandingan memadai?': 'Ya' }, { 'Nama Klub / Sekolah Sepak Bola': 'Garuda Muda', 'Apakah fasilitas pertandingan memadai?': 'Ya' }, { 'Nama Klub / Sekolah Sepak Bola': 'Rajawali FC', 'Apakah fasilitas pertandingan memadai?': 'Tidak' }, { 'Nama Klub / Sekolah Sepak Bola': 'Benteng Muda', 'Apakah fasilitas pertandingan memadai?': 'Ya' }, { 'Nama Klub / Sekolah Sepak Bola': 'Bintang Timur', 'Apakah fasilitas pertandingan memadai?': 'Ya' }, { 'Nama Klub / Sekolah Sepak Bola': 'PSJS Jakarta Selatan', 'Apakah fasilitas pertandingan memadai?': 'Ya' }, { 'Nama Klub / Sekolah Sepak Bola': 'Farmel FC', 'Apakah fasilitas pertandingan memadai?': 'Ya' }, { 'Nama Klub / Sekolah Sepak Bola': 'UNI Bandung', 'Apakah fasilitas pertandingan memadai?': 'Ya' }, { 'Nama Klub / Sekolah Sepak Bola': 'Saint Prima', 'Apakah fasilitas pertandingan memadai?': 'Tidak' }, { 'Nama Klub / Sekolah Sepak Bola': 'Saswco', 'Apakah fasilitas pertandingan memadai?': 'Ya' }
            ];
            for (const data of pesertaData) {
                const sessionRes = await client.query(`INSERT INTO survey_sessions (kuesioner_id, surveyor_id) VALUES ($1, $2) RETURNING id`, [kuesionerPeserta2Id, surveyorIds[0]]);
                const sessionId = sessionRes.rows[0].id;
                for (const p of pesertaPertanyaan) {
                    await client.query(`INSERT INTO jawaban (session_id, pertanyaan_id, isi_jawaban) VALUES ($1, $2, $3)`, [sessionId, p.id, data[p.teks_pertanyaan]]);
                }
            }
            console.log("Data dummy untuk Peserta (Event 2) berhasil dibuat.");
        }

        await client.query('COMMIT');
        console.log("Proses seeding data berhasil diselesaikan.");

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Terjadi error saat seeding data:", err);
    } finally {
        client.release();
        await pool.end();
        console.log("Koneksi ke database ditutup.");
    }
};

run();
