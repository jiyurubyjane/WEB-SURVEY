const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const jwt = require("jsonwebtoken");
const ExcelJS = require('exceljs');

const app = express();
const port = 3001;
const JWT_SECRET = "kunci-rahasia-jwt-yang-super-aman-dan-panjang";

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());

const dbPath = path.join(__dirname, "kemenpora.db");
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error("DB ERROR:", err.message); process.exit(1); }
    else { console.log("DB connected."); }
});

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

// Endpoint untuk Login
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err || !user) return res.status(401).json({ message: "Email atau password salah" });
        bcrypt.compare(password, user.password_hash, (err, result) => {
            if (result) {
                const userPayload = { id: user.id, nama: user.nama, email: user.email, peran: user.peran };
                const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });
                res.json({ message: "Login berhasil", token, user: userPayload });
            } else {
                res.status(401).json({ message: "Email atau password salah" });
            }
        });
    });
});

// Endpoint untuk mendapatkan data user yang sedang login
app.get("/me", verifyToken, (req, res) => res.json(req.user));

// Endpoint untuk kategori olahraga
app.get("/kategori-olahraga", verifyToken, (req, res) => {
    const { q = '' } = req.query;
    db.all("SELECT * FROM kategori_olahraga WHERE nama_cabor LIKE ? ORDER BY nama_cabor ASC", [`%${q}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Endpoint untuk mendapatkan daftar event
app.get("/events", verifyToken, (req, res) => {
    const { status = 'aktif' } = req.query;
    db.all("SELECT * FROM events WHERE status = ? ORDER BY tanggal_mulai DESC", [status], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Endpoint untuk membuat event baru
app.post("/events", verifyToken, isAdmin, (req, res) => {
    const { nama_event, lokasi, tanggal_mulai, tanggal_selesai, deskripsi, jumlah_peserta, skala_event, kategori_olahraga_id, sponsors = [] } = req.body;
    db.run('BEGIN TRANSACTION;');
    const sqlEvent = 'INSERT INTO events (nama_event, lokasi, tanggal_mulai, tanggal_selesai, deskripsi, jumlah_peserta, skala_event, kategori_olahraga_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.run(sqlEvent, [nama_event, lokasi, tanggal_mulai, tanggal_selesai, deskripsi, jumlah_peserta, skala_event, kategori_olahraga_id, 'aktif'], function(err) {
        if (err) { db.run('ROLLBACK;'); return res.status(500).json({ error: err.message }); }
        const eventId = this.lastID;
        if (sponsors.length === 0) { db.run('COMMIT;'); return res.status(201).json({ eventId }); }
        
        let completed = 0;
        const sqlSponsor = 'INSERT INTO sponsors (event_id, nama_sponsor) VALUES (?, ?)';
        sponsors.forEach(nama => {
            db.run(sqlSponsor, [eventId, nama], (err) => {
                if (err) { db.run('ROLLBACK;'); return res.status(500).json({ error: err.message }); }
                completed++;
                if (completed === sponsors.length) { db.run('COMMIT;'); res.status(201).json({ eventId }); }
            });
        });
    });
});

// Endpoint untuk mendapatkan detail satu event
app.get("/events/:id", verifyToken, (req, res) => {
    const sqlEvent = `SELECT e.*, ko.nama_cabor FROM events e LEFT JOIN kategori_olahraga ko ON e.kategori_olahraga_id = ko.id WHERE e.id = ?`;
    const sqlSponsors = `SELECT nama_sponsor FROM sponsors WHERE event_id = ?`;
    db.get(sqlEvent, [req.params.id], (err, event) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!event) return res.status(404).json({ error: "Event tidak ditemukan." });
        db.all(sqlSponsors, [req.params.id], (err, sponsors) => {
            if (err) return res.status(500).json({ error: err.message });
            event.sponsors = sponsors.map(s => s.nama_sponsor);
            res.json(event);
        });
    });
});

// Endpoint untuk update event
app.put("/events/:id", verifyToken, isAdmin, (req, res) => {
    const { nama_event, lokasi, tanggal_mulai, tanggal_selesai, deskripsi, jumlah_peserta, skala_event, kategori_olahraga_id, sponsors = [] } = req.body;
    db.run('BEGIN TRANSACTION;');
    const sqlEvent = `UPDATE events SET nama_event = ?, lokasi = ?, tanggal_mulai = ?, tanggal_selesai = ?, deskripsi = ?, jumlah_peserta = ?, skala_event = ?, kategori_olahraga_id = ? WHERE id = ?`;
    db.run(sqlEvent, [nama_event, lokasi, tanggal_mulai, tanggal_selesai, deskripsi, jumlah_peserta, skala_event, kategori_olahraga_id, req.params.id], function(err) {
        if (err) { db.run('ROLLBACK;'); return res.status(500).json({ error: err.message }); }
        db.run('DELETE FROM sponsors WHERE event_id = ?', [req.params.id], (err) => {
            if (err) { db.run('ROLLBACK;'); return res.status(500).json({ error: err.message }); }
            if (sponsors.length === 0) { db.run('COMMIT;'); return res.json({ message: "Event diperbarui" }); }
            
            let completed = 0;
            const sqlSponsor = 'INSERT INTO sponsors (event_id, nama_sponsor) VALUES (?, ?)';
            sponsors.forEach(nama => {
                db.run(sqlSponsor, [req.params.id, nama], (err) => {
                    if (err) { db.run('ROLLBACK;'); return res.status(500).json({ error: err.message }); }
                    completed++;
                    if (completed === sponsors.length) { db.run('COMMIT;'); res.json({ message: "Event diperbarui" }); }
                });
            });
        });
    });
});

// Endpoint untuk kuesioner
app.get("/events/:eventId/kuesioner", verifyToken, (req, res) => {
    db.all("SELECT * FROM kuesioner WHERE event_id = ?", [req.params.eventId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post("/kuesioner", verifyToken, isAdmin, (req, res) => {
    const { event_id, tipe_responden, nama_kuesioner } = req.body;
    db.run("INSERT INTO kuesioner (event_id, tipe_responden, nama_kuesioner) VALUES (?, ?, ?)", [event_id, tipe_responden, nama_kuesioner], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ kuesionerId: this.lastID });
    });
});

app.delete("/kuesioner/:id", verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM kuesioner WHERE id = ?", [id], function (err) {
      if (err) {
        console.error("Error hapus tipe responden:", err);
        return res.status(500).json({ error: "Gagal menghapus tipe responden." });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Tipe responden tidak ditemukan." });
      }
      res.json({ message: "Tipe responden berhasil dihapus." });
    }
  );
});

// Endpoint untuk pertanyaan
app.get("/kuesioner/:kuesionerId/pertanyaan", verifyToken, (req, res) => {
    db.all("SELECT * FROM pertanyaan WHERE kuesioner_id = ? ORDER BY urutan ASC", [req.params.kuesionerId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post("/pertanyaan", verifyToken, isAdmin, (req, res) => {
    const { kuesioner_id, teks_pertanyaan, tipe_jawaban, urutan } = req.body;
    db.run("INSERT INTO pertanyaan (kuesioner_id, teks_pertanyaan, tipe_jawaban, urutan) VALUES (?, ?, ?, ?)", [kuesioner_id, teks_pertanyaan, tipe_jawaban, urutan], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ pertanyaanId: this.lastID });
    });
});

app.delete("/pertanyaan/:id", verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM pertanyaan WHERE id = ?", [id], function(err) {
        if (err) {
            console.error("Gagal menghapus pertanyaan:", err.message);
            return res.status(500).json({ error: "Gagal menghapus pertanyaan." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Pertanyaan tidak ditemukan." });
        }
        res.json({ message: "Pertanyaan berhasil dihapus." });
    });
});

// =================================================================
// === API UNTUK MANAJEMEN PENGGUNA (CRUD) ===
// =================================================================

// GET: Mengambil semua pengguna
app.get("/users", verifyToken, isAdmin, (req, res) => {
    const sql = "SELECT id, nama, email, peran FROM users ORDER BY nama ASC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Gagal mengambil data pengguna." });
        }
        res.json(rows);
    });
});

// POST: Menambah pengguna baru
app.post("/users", verifyToken, isAdmin, async (req, res) => {
    const { nama, email, password, peran } = req.body;
    if (!nama || !email || !password || !peran) {
        return res.status(400).json({ message: "Semua field wajib diisi." });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (nama, email, password_hash, peran) VALUES (?, ?, ?, ?)";
        db.run(sql, [nama, email, hashedPassword, peran], function(err) {
            if (err) {
                if (err.message.includes("UNIQUE constraint failed")) {
                    return res.status(409).json({ message: "Email sudah terdaftar." });
                }
                return res.status(500).json({ message: "Gagal menyimpan pengguna ke database.", error: err.message });
            }
            res.status(201).json({ message: "Pengguna berhasil ditambahkan.", userId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

// PUT: Mengedit pengguna
app.put("/users/:id", verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { nama, email, peran, password } = req.body;
     if (!nama || !email || !peran) {
        return res.status(400).json({ message: "Nama, email, dan peran wajib diisi." });
    }

    try {
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const sql = "UPDATE users SET nama = ?, email = ?, peran = ?, password_hash = ? WHERE id = ?";
            db.run(sql, [nama, email, peran, hashedPassword, id], function(err) {
                if (err) return res.status(500).json({ message: "Gagal update pengguna.", error: err.message });
                res.json({ message: "Pengguna berhasil diperbarui (dengan password baru)." });
            });
        } else {
            const sql = "UPDATE users SET nama = ?, email = ?, peran = ? WHERE id = ?";
            db.run(sql, [nama, email, peran, id], function(err) {
                if (err) return res.status(500).json({ message: "Gagal update pengguna.", error: err.message });
                res.json({ message: "Pengguna berhasil diperbarui." });
            });
        }
    } catch (error) {
       res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

// DELETE: Menghapus pengguna
app.delete("/users/:id", verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    if (parseInt(id, 10) === req.user.id) {
        return res.status(403).json({ message: "Anda tidak bisa menghapus akun Anda sendiri." });
    }
    const sql = "DELETE FROM users WHERE id = ?";
    db.run(sql, id, function(err) {
        if (err) return res.status(500).json({ message: "Gagal menghapus pengguna.", error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        res.json({ message: "Pengguna berhasil dihapus." });
    });
});

// =================================================================
// === ENDPOINT SUBMIT SURVEI ===
// =================================================================
app.post("/jawaban", verifyToken, (req, res) => {
    const { kuesionerId, jawaban } = req.body;
    const surveyorId = req.user.id; 

    if (!kuesionerId || !jawaban || !Array.isArray(jawaban) || jawaban.length === 0) {
        return res.status(400).json({ message: "Data yang dikirim tidak lengkap." });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;', (err) => {
            if (err) { return res.status(500).json({ message: "Gagal memulai transaksi database." }); }

            const sqlSubmission = `INSERT INTO submissions (kuesioner_id, surveyor_id) VALUES (?, ?)`;
            db.run(sqlSubmission, [kuesionerId, surveyorId], function(err) {
                if (err) {
                    db.run('ROLLBACK;');
                    return res.status(500).json({ message: "Gagal membuat entri survei.", error: err.message });
                }

                const submissionId = this.lastID;
                const sqlJawaban = `INSERT INTO jawaban (isi_jawaban, pertanyaan_id, submission_id, session_id) VALUES (?, ?, ?, ?)`;
                const stmt = db.prepare(sqlJawaban, (err) => {
                    if (err) {
                        db.run('ROLLBACK;');
                        return res.status(500).json({ message: "Gagal mempersiapkan statement database." });
                    }
                });

                let completed = 0;
                let errorOccurred = false;

                jawaban.forEach(j => {
                    stmt.run(j.jawaban_teks, j.pertanyaan_id, submissionId, submissionId, function(err) {
                        if (err) {
                            if (!errorOccurred) {
                                errorOccurred = true;
                                db.run('ROLLBACK;');
                                if (!res.headersSent) {
                                    res.status(500).json({ message: "Gagal menyimpan jawaban.", error: err.message });
                                }
                            }
                            return;
                        }
                        
                        completed++;
                        if (completed === jawaban.length && !errorOccurred) {
                            stmt.finalize((err) => {
                                if (err) {
                                    db.run('ROLLBACK;');
                                    if (!res.headersSent) {
                                        res.status(500).json({ message: "Gagal menyelesaikan proses.", error: err.message });
                                    }
                                    return;
                                }
                                db.run('COMMIT;', (err) => {
                                    if (err) {
                                        if (!res.headersSent) {
                                            res.status(500).json({ message: "Gagal menyimpan perubahan." });
                                        }
                                        return;
                                    }
                                    if (!res.headersSent) {
                                        res.status(201).json({ message: "Survei berhasil disubmit!" });
                                    }
                                });
                            });
                        }
                    });
                });
            });
        });
    });
});


// =================================================================
// === ENDPOINT DOWNLOAD (VERSI BARU DENGAN SHEET TERPISAH) ===
// =================================================================
app.get("/events/:eventId/hasil-survei/download", verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    // 1. Ambil data survei seperti sebelumnya
    const query = `
      SELECT
        s.id AS submission_id,
        s.created_at AS tanggal_submit,
        u.nama AS nama_surveyor,
        k.tipe_responden,
        p.teks_pertanyaan,
        j.isi_jawaban AS jawaban_teks
      FROM jawaban j
      JOIN submissions s ON j.submission_id = s.id
      JOIN users u ON s.surveyor_id = u.id
      JOIN pertanyaan p ON j.pertanyaan_id = p.id
      JOIN kuesioner k ON p.kuesioner_id = k.id
      WHERE k.event_id = ?
      ORDER BY k.tipe_responden, s.id, p.urutan;
    `;

    db.all(query, [eventId], async (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      if (!rows.length) return res.status(404).json({ message: "Tidak ada data survei." });

      // 2. Buat workbook dan sheet per tipe responden
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Survey App";
      workbook.created = new Date();

      // Group data
      const byType = rows.reduce((acc, r) => {
        acc[r.tipe_responden] = acc[r.tipe_responden] || [];
        acc[r.tipe_responden].push(r);
        return acc;
      }, {});

      for (const tipe of Object.keys(byType)) {
        const data = byType[tipe];
        const safeName = tipe.replace(/[\\\/*?\[\]]/g, "_").slice(0, 31);
        const sheet = workbook.addWorksheet(safeName);

        // Pivot untuk header dinamis
        const pivot = {}, questions = new Set();
        data.forEach(r => {
          questions.add(r.teks_pertanyaan);
          if (!pivot[r.submission_id]) {
            pivot[r.submission_id] = {
              "ID Pengisian": r.submission_id,
              "Tanggal Submit": r.tanggal_submit,
              "Nama Surveyor": r.nama_surveyor
            };
          }
          pivot[r.submission_id][r.teks_pertanyaan] = r.jawaban_teks;
        });

        const headers = ["ID Pengisian","Tanggal Submit","Nama Surveyor", ...Array.from(questions)];
        sheet.columns = headers.map(h => ({ header: h, key: h, width: 25 }));
        Object.values(pivot).forEach(row => sheet.addRow(row));
      }

      // 3. Kirim respons XLSX
      // … setelah pivoting data …
    const fileName = `hasil_survei_event_${eventId}.xlsx`;

    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
    );

await workbook.xlsx.write(res);
res.end();

    });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// Menjalankan server
app.listen(port, () => {
    console.log(`API server aktif di http://localhost:${port}`);
});