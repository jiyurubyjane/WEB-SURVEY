const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
const port = 3000;
const JWT_SECRET = "kunci-rahasia-jwt-yang-super-aman-dan-panjang";

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
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

app.get("/me", verifyToken, (req, res) => res.json(req.user));

app.get("/kategori-olahraga", verifyToken, (req, res) => {
    const { q = '' } = req.query;
    db.all("SELECT * FROM kategori_olahraga WHERE nama_cabor LIKE ? ORDER BY nama_cabor ASC", [`%${q}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get("/events", verifyToken, (req, res) => {
    const { status = 'aktif' } = req.query;
    db.all("SELECT * FROM events WHERE status = ? ORDER BY tanggal_mulai DESC", [status], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

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

// --- Hapus 1 Tipe Responden ---
app.delete("/kuesioner/:id", verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  db.run(
    "DELETE FROM kuesioner WHERE id = ?",
    [id],
    function (err) {
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

app.listen(port, () => {
    console.log(`API server aktif di http://localhost:${port}`);
});
