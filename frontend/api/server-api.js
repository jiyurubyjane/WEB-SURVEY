require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require('pg');
const ExcelJS = require('exceljs');

const app = express();
const port = 3001;
const JWT_SECRET = process.env.JWT_SECRET;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.peran === 'Admin') next();
    else res.status(403).json({ message: "Akses ditolak: Hanya untuk Admin." });
};

app.post("/register", async (req, res) => {
    const { nama, email, password } = req.body;

    if (!nama || !email || !password) {
        return res.status(400).json({ message: "Nama, email, dan password wajib diisi." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await pool.query(
            "INSERT INTO users (nama, email, password_hash, peran) VALUES ($1, $2, $3, $4) RETURNING id",
            [nama, email, hashedPassword, 'Surveyor']
        );

        res.status(201).json({ message: "Registrasi berhasil! Silakan login." });

    } catch (error) {
        if (error.code === '23505') { 
            return res.status(409).json({ message: "Email ini sudah terdaftar." });
        }
        
        console.error("Register Error:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];
        if (!user) return res.status(401).json({ message: "Email atau password salah" });
        const match = await bcrypt.compare(password, user.password_hash);
        if (match) {
            const userPayload = { id: user.id, nama: user.nama, email: user.email, peran: user.peran };
            const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });
            res.json({ message: "Login berhasil", token, user: userPayload });
        } else {
            res.status(401).json({ message: "Email atau password salah" });
        }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/me", verifyToken, (req, res) => res.json(req.user));

app.put("/me", verifyToken, async (req, res) => {
    const { nama, email } = req.body;
    const userId = req.user.id;
    try {
        const result = await pool.query("UPDATE users SET nama = $1, email = $2 WHERE id = $3 RETURNING id, nama, email, peran", [nama, email, userId]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Update Profile Error:", err);
        res.status(500).json({ error: "Gagal memperbarui profil." });
    }
});

app.put("/me/password", verifyToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Password lama dan baru wajib diisi." });
    }
    try {
        const result = await pool.query("SELECT password_hash FROM users WHERE id = $1", [userId]);
        const user = result.rows[0];
        if (!user) return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        const match = await bcrypt.compare(oldPassword, user.password_hash);
        if (!match) return res.status(403).json({ message: "Password lama salah." });
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHashedPassword, userId]);
        res.json({ message: "Password berhasil diperbarui." });
    } catch (err) {
        console.error("Change Password Error:", err);
        res.status(500).json({ error: "Gagal memperbarui password." });
    }
});

app.get("/me/stats", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.peran;
        let stats = {};

        if (userRole === 'Admin') {
            const totalUsersRes = await pool.query("SELECT COUNT(*) FROM users");
            const totalEventsRes = await pool.query("SELECT COUNT(*) FROM events WHERE status = 'aktif'");
            const totalSurveysRes = await pool.query("SELECT COUNT(*) FROM survey_sessions");
            stats = {
                total_pengguna: parseInt(totalUsersRes.rows[0].count, 10),
                total_event_aktif: parseInt(totalEventsRes.rows[0].count, 10),
                total_data_survei: parseInt(totalSurveysRes.rows[0].count, 10)
            };
        } else if (userRole === 'Surveyor') {
            const totalSurveiRes = await pool.query("SELECT COUNT(*) AS total_survei FROM survey_sessions WHERE surveyor_id = $1", [userId]);
            const totalEventRes = await pool.query("SELECT COUNT(DISTINCT kuesioner.event_id) AS total_event FROM survey_sessions JOIN kuesioner ON survey_sessions.kuesioner_id = kuesioner.id WHERE survey_sessions.surveyor_id = $1", [userId]);
            stats = {
                total_survei: parseInt(totalSurveiRes.rows[0].total_survei, 10) || 0,
                total_event: parseInt(totalEventRes.rows[0].total_event, 10) || 0
            };
        }
        res.json(stats);
    } catch (err) {
        console.error("Get Stats Error:", err);
        res.status(500).json({ error: "Gagal mengambil data statistik." });
    }
});

app.get("/users", verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query("SELECT id, nama, email, peran FROM users ORDER BY nama ASC");
        res.json(result.rows);
    } catch (err) {
        console.error("Get Users Error:", err);
        res.status(500).json({ error: "Gagal mengambil data pengguna." });
    }
});

app.post("/users", verifyToken, isAdmin, async (req, res) => {
    const { nama, email, password, peran } = req.body;
    if (!nama || !email || !password || !peran) return res.status(400).json({ message: "Semua field wajib diisi." });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query("INSERT INTO users (nama, email, password_hash, peran) VALUES ($1, $2, $3, $4) RETURNING id", [nama, email, hashedPassword, peran]);
        res.status(201).json({ message: "Pengguna berhasil ditambahkan.", userId: result.rows[0].id });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ message: "Email sudah terdaftar." });
        console.error("Create User Error:", error);
        res.status(500).json({ message: "Gagal menyimpan pengguna." });
    }
});

app.put("/users/:id", verifyToken, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "ID Pengguna tidak valid." });

    const { nama, email, peran, password } = req.body;
    if (!nama || !email || !peran) return res.status(400).json({ message: "Nama, email, dan peran wajib diisi." });
    try {
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query("UPDATE users SET nama = $1, email = $2, peran = $3, password_hash = $4 WHERE id = $5", [nama, email, peran, hashedPassword, id]);
            res.json({ message: "Pengguna diperbarui (dengan password baru)." });
        } else {
            await pool.query("UPDATE users SET nama = $1, email = $2, peran = $3 WHERE id = $4", [nama, email, peran, id]);
            res.json({ message: "Pengguna berhasil diperbarui." });
        }
    } catch (error) {
        console.error("Update User Error:", error);
        res.status(500).json({ message: "Gagal update pengguna." });
    }
});

app.delete("/users/:id", verifyToken, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "ID Pengguna tidak valid." });

    if (id === req.user.id) return res.status(403).json({ message: "Anda tidak bisa menghapus akun Anda sendiri." });
    try {
        const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        res.json({ message: "Pengguna berhasil dihapus." });
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ message: "Gagal menghapus pengguna." });
    }
});

app.get("/kategori-olahraga", verifyToken, async (req, res) => {
    const { q = '' } = req.query;
    try {
        const result = await pool.query("SELECT * FROM kategori_olahraga WHERE nama_cabor ILIKE $1 ORDER BY nama_cabor ASC", [`%${q}%`]);
        res.json(result.rows);
    } catch (err) {
        console.error("Kategori Olahraga Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/events", verifyToken, async (req, res) => {
    const { status = 'aktif' } = req.query;
    try {
        const result = await pool.query("SELECT * FROM events WHERE status = $1 ORDER BY tanggal_mulai DESC", [status]);
        res.json(result.rows);
    } catch (err) {
        console.error("Get Events Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/events", verifyToken, isAdmin, async (req, res) => {
    let { 
        nama_event, lokasi, tanggal_mulai, tanggal_selesai, deskripsi, 
        jumlah_peserta, skala_event, kategori_olahraga_id, 
        sponsors = [], nama_kategori_baru 
    } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        if (nama_kategori_baru && !kategori_olahraga_id) {
            const newKategoriResult = await client.query(
                'INSERT INTO kategori_olahraga (nama_cabor) VALUES ($1) ON CONFLICT (nama_cabor) DO UPDATE SET nama_cabor = EXCLUDED.nama_cabor RETURNING id',
                [nama_kategori_baru]
            );
            kategori_olahraga_id = newKategoriResult.rows[0].id;
        }

        const sqlEvent = 'INSERT INTO events (nama_event, lokasi, tanggal_mulai, tanggal_selesai, deskripsi, jumlah_peserta, skala_event, kategori_olahraga_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id';
        const eventResult = await client.query(sqlEvent, [nama_event, lokasi, tanggal_mulai, tanggal_selesai, deskripsi, jumlah_peserta, skala_event, kategori_olahraga_id, 'aktif']);
        const eventId = eventResult.rows[0].id;

        if (sponsors.length > 0) {
            const sqlSponsor = 'INSERT INTO sponsors (event_id, nama_sponsor) VALUES ($1, $2)';
            for (const nama of sponsors) {
                await client.query(sqlSponsor, [eventId, nama]);
            }
        }
        
        await client.query('COMMIT');
        res.status(201).json({ eventId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Post Event Error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.get("/events/:id", verifyToken, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "ID tidak valid." });

    try {
        const sqlEvent = `SELECT e.*, ko.nama_cabor FROM events e LEFT JOIN kategori_olahraga ko ON e.kategori_olahraga_id = ko.id WHERE e.id = $1`;
        const eventResult = await pool.query(sqlEvent, [id]);
        const event = eventResult.rows[0];

        if (!event) return res.status(404).json({ error: "Event tidak ditemukan." });

        const sqlSponsors = `SELECT nama_sponsor FROM sponsors WHERE event_id = $1`;
        const sponsorsResult = await pool.query(sqlSponsors, [id]);
        event.sponsors = sponsorsResult.rows.map(s => s.nama_sponsor);

        res.json(event);
    } catch (err) {
        console.error("Get Event Detail Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.put("/events/:id", verifyToken, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "ID Event tidak valid." });

    let { 
        nama_event, lokasi, tanggal_mulai, tanggal_selesai, deskripsi, 
        jumlah_peserta, skala_event, kategori_olahraga_id, 
        sponsors = [], nama_kategori_baru 
    } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        if (nama_kategori_baru && !kategori_olahraga_id) {
            const newKategoriResult = await client.query(
                'INSERT INTO kategori_olahraga (nama_cabor) VALUES ($1) ON CONFLICT (nama_cabor) DO UPDATE SET nama_cabor = EXCLUDED.nama_cabor RETURNING id',
                [nama_kategori_baru]
            );
            kategori_olahraga_id = newKategoriResult.rows[0].id;
        }

        const sqlEvent = `UPDATE events SET nama_event = $1, lokasi = $2, tanggal_mulai = $3, tanggal_selesai = $4, deskripsi = $5, jumlah_peserta = $6, skala_event = $7, kategori_olahraga_id = $8 WHERE id = $9`;
        await client.query(sqlEvent, [nama_event, lokasi, tanggal_mulai, tanggal_selesai, deskripsi, jumlah_peserta, skala_event, kategori_olahraga_id, id]);
        
        await client.query('DELETE FROM sponsors WHERE event_id = $1', [id]);
        if (sponsors.length > 0) {
            const sqlSponsor = 'INSERT INTO sponsors (event_id, nama_sponsor) VALUES ($1, $2)';
            for (const nama of sponsors) {
                await client.query(sqlSponsor, [id, nama]);
            }
        }
        
        await client.query('COMMIT');
        res.json({ message: "Event berhasil diperbarui" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Update Event Error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.patch("/events/:id/status", verifyToken, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "ID Event tidak valid." });

    const { status } = req.body;
    if (!status || !['aktif', 'diarsipkan'].includes(status)) {
        return res.status(400).json({ message: "Status tidak valid." });
    }

    try {
        const result = await pool.query(
            "UPDATE events SET status = $1 WHERE id = $2 RETURNING id",
            [status, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Event tidak ditemukan." });
        }
        res.json({ message: `Status event berhasil diubah menjadi ${status}.` });
    } catch (err) {
        console.error("Update Event Status Error:", err);
        res.status(500).json({ error: "Gagal memperbarui status event." });
    }
});

app.delete("/events/:id", verifyToken, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "ID Event tidak valid." });

    try {
        const result = await pool.query("DELETE FROM events WHERE id = $1", [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Event tidak ditemukan." });
        res.json({ message: "Event berhasil dihapus." });
    } catch (err) {
        console.error("Delete Event Error:", err);
        res.status(500).json({ message: "Gagal menghapus event." });
    }
});

app.get("/events/:eventId/kuesioner", verifyToken, async (req, res) => {
    const eventId = parseInt(req.params.eventId, 10);
    if (isNaN(eventId)) return res.status(400).json({ message: "ID Event tidak valid." });

    try {
        const result = await pool.query("SELECT * FROM kuesioner WHERE event_id = $1", [eventId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Get Kuesioner Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/kuesioner", verifyToken, isAdmin, async (req, res) => {
    const { event_id, tipe_responden, nama_kuesioner } = req.body;
    try {
        const result = await pool.query("INSERT INTO kuesioner (event_id, tipe_responden, nama_kuesioner) VALUES ($1, $2, $3) RETURNING id", [event_id, tipe_responden, nama_kuesioner]);
        res.status(201).json({ kuesionerId: result.rows[0].id });
    } catch (err) {
        console.error("Post Kuesioner Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete("/kuesioner/:id", verifyToken, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "ID Kuesioner tidak valid." });

    try {
        await pool.query("DELETE FROM kuesioner WHERE id = $1", [id]);
        res.json({ message: "Kuesioner berhasil dihapus" });
    } catch (err) {
        console.error("Delete Kuesioner Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/kuesioner/:kuesionerId/pertanyaan", verifyToken, async (req, res) => {
    const kuesionerId = parseInt(req.params.kuesionerId, 10);
    if (isNaN(kuesionerId)) return res.status(400).json({ message: "ID Kuesioner tidak valid." });

    try {
        const result = await pool.query("SELECT * FROM pertanyaan WHERE kuesioner_id = $1 ORDER BY urutan ASC", [kuesionerId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Get Pertanyaan Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/pertanyaan", verifyToken, isAdmin, async (req, res) => {
    const { kuesioner_id, teks_pertanyaan, tipe_jawaban, urutan } = req.body;
    try {
        const result = await pool.query("INSERT INTO pertanyaan (kuesioner_id, teks_pertanyaan, tipe_jawaban, urutan) VALUES ($1, $2, $3, $4) RETURNING id", [kuesioner_id, teks_pertanyaan, tipe_jawaban, urutan]);
        res.status(201).json({ pertanyaanId: result.rows[0].id });
    } catch (err) {
        console.error("Post Pertanyaan Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete("/pertanyaan/:id", verifyToken, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "ID Pertanyaan tidak valid." });

    try {
        await pool.query("DELETE FROM pertanyaan WHERE id = $1", [id]);
        res.json({ message: "Pertanyaan berhasil dihapus" });
    } catch (err) {
        console.error("Delete Pertanyaan Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/jawaban", verifyToken, async (req, res) => {
    const { kuesionerId, jawaban } = req.body;
    const surveyorId = req.user.id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const submissionResult = await client.query("INSERT INTO survey_sessions (kuesioner_id, surveyor_id) VALUES ($1, $2) RETURNING id", [kuesionerId, surveyorId]);
        const submissionId = submissionResult.rows[0].id;
        const sqlJawaban = `INSERT INTO jawaban (isi_jawaban, pertanyaan_id, session_id) VALUES ($1, $2, $3)`;
        for (const j of jawaban) {
            await client.query(sqlJawaban, [j.isi_jawaban, j.pertanyaan_id, submissionId]);
        }
        await client.query('COMMIT');
        res.status(201).json({ message: "Survei berhasil disubmit!" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Submit Jawaban Error:", err);
        res.status(500).json({ message: "Gagal menyimpan jawaban.", error: err.message });
    } finally {
        client.release();
    }
});

app.get("/events/:eventId/analisis", verifyToken, async (req, res) => {
    const eventId = parseInt(req.params.eventId, 10);
    if (isNaN(eventId)) return res.status(400).json({ message: "ID Event tidak valid." });

    try {
        const query = `
            SELECT 
                k.tipe_responden,
                p.teks_pertanyaan,
                p.tipe_jawaban,
                j.isi_jawaban
            FROM jawaban j
            JOIN pertanyaan p ON j.pertanyaan_id = p.id
            JOIN survey_sessions s ON j.session_id = s.id
            JOIN kuesioner k ON s.kuesioner_id = k.id
            WHERE k.event_id = $1;
        `;
        const result = await pool.query(query, [eventId]);
        const rows = result.rows;

        if (rows.length === 0) {
            return res.status(404).json({ message: "Belum ada data survei untuk dianalisis." });
        }

        const analysis = {};

        rows.forEach(row => {
            const { tipe_responden, teks_pertanyaan, tipe_jawaban, isi_jawaban } = row;

            if (!analysis[tipe_responden]) {
                analysis[tipe_responden] = {
                    total_responden: 0,
                    pertanyaan: {}
                };
            }

            if (!analysis[tipe_responden].pertanyaan[teks_pertanyaan]) {
                analysis[tipe_responden].pertanyaan[teks_pertanyaan] = {
                    tipe_jawaban: tipe_jawaban,
                    jawaban: {},
                    total: 0,
                    sum: 0,
                };
            }

            const currentQuestion = analysis[tipe_responden].pertanyaan[teks_pertanyaan];
            
            if (currentQuestion.jawaban[isi_jawaban]) {
                currentQuestion.jawaban[isi_jawaban]++;
            } else {
                currentQuestion.jawaban[isi_jawaban] = 1;
            }

            if (tipe_jawaban === 'nominal' || tipe_jawaban === 'angka') {
                const numericValue = parseFloat(isi_jawaban) || 0;
                currentQuestion.sum += numericValue;
            }
        });
        
        const sessionCounts = await pool.query(`
            SELECT k.tipe_responden, COUNT(DISTINCT s.id) as count
            FROM survey_sessions s
            JOIN kuesioner k ON s.kuesioner_id = k.id
            WHERE k.event_id = $1
            GROUP BY k.tipe_responden;
        `, [eventId]);

        sessionCounts.rows.forEach(row => {
            if (analysis[row.tipe_responden]) {
                analysis[row.tipe_responden].total_responden = parseInt(row.count, 10);
            }
        });

        res.json(analysis);

    } catch (e) {
        console.error("Analysis Endpoint Error:", e);
        res.status(500).json({ message: "Server error saat memproses analisis.", error: e.message });
    }
});

app.get("/events/:eventId/hasil-survei/download", verifyToken, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId, 10);
        if (isNaN(eventId)) return res.status(400).json({ message: "ID Event tidak valid." });

        const answersQuery = `
            SELECT 
                s.id AS submission_id, 
                s.created_at AS tanggal_submit, 
                u.nama AS nama_surveyor, 
                k.tipe_responden, 
                p.teks_pertanyaan,
                j.isi_jawaban 
            FROM jawaban j 
            JOIN survey_sessions s ON j.session_id = s.id 
            JOIN users u ON s.surveyor_id = u.id 
            JOIN pertanyaan p ON j.pertanyaan_id = p.id 
            JOIN kuesioner k ON p.kuesioner_id = k.id 
            WHERE k.event_id = $1;
        `;
        const answersResult = await pool.query(answersQuery, [eventId]);
        const rows = answersResult.rows;

        if (!rows.length) return res.status(404).send('Tidak ada data survei untuk diunduh.');

        const questionsQuery = `
            SELECT k.tipe_responden, p.teks_pertanyaan, p.urutan
            FROM pertanyaan p
            JOIN kuesioner k ON p.kuesioner_id = k.id
            WHERE k.event_id = $1
            ORDER BY k.tipe_responden, p.urutan;
        `;
        const questionsResult = await pool.query(questionsQuery, [eventId]);
        
        const allQuestionsMap = questionsResult.rows.reduce((acc, q) => {
            acc[q.tipe_responden] = acc[q.tipe_responden] || [];
            acc[q.tipe_responden].push(q.teks_pertanyaan);
            return acc;
        }, {});

        const workbook = new ExcelJS.Workbook();
        
        const byType = rows.reduce((acc, r) => {
            acc[r.tipe_responden] = acc[r.tipe_responden] || [];
            acc[r.tipe_responden].push(r);
            return acc;
        }, {});

        for (const tipe of Object.keys(byType)) {
            const data = byType[tipe];
            const safeName = tipe.replace(/[\\\/*?\[\]]/g, "_").slice(0, 31);
            const sheet = workbook.addWorksheet(safeName);

            const questionHeaders = allQuestionsMap[tipe] || [];

            const pivot = {};
            data.forEach(r => {
                if (!pivot[r.submission_id]) {
                    pivot[r.submission_id] = { 
                        "ID Pengisian": r.submission_id, 
                        "Tanggal Submit": r.tanggal_submit, 
                        "Nama Surveyor": r.nama_surveyor 
                    };
                    questionHeaders.forEach(header => {
                        pivot[r.submission_id][header] = ''; 
                    });
                }
                pivot[r.submission_id][r.teks_pertanyaan] = r.isi_jawaban;
            });

            const headers = ["ID Pengisian", "Tanggal Submit", "Nama Surveyor", ...questionHeaders];
            sheet.columns = headers.map(h => ({ header: h, key: h, width: 25 }));
            Object.values(pivot).forEach(row => sheet.addRow(row));
        }

        const fileName = `hasil_survei_event_${eventId}.xlsx`;
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (e) {
        console.error("Download Error:", e);
        res.status(500).json({ message: "Server error", error: e.message });
    }
});

export default app;