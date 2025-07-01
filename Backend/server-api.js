const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
const port = 3000;
const JWT_SECRET = "kunci-rahasia-jwt-yang-super-aman-dan-panjang";

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dbPath = path.join(__dirname, "kemenpora.db");
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("DB ERROR:", err.message);
        process.exit(1);
    } else {
        console.log("DB connected.");
    }
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
    if (req.user && req.user.peran === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: "Akses ditolak: Hanya untuk Admin." });
    }
};

app.post("/register", (req, res) => {
    const { nama, email, password, peran } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: "Gagal memproses password" });
        const sql = 'INSERT INTO users (nama, email, password_hash, peran) VALUES (?, ?, ?, ?)';
        const params = [nama, email, hash, peran];
        db.run(sql, params, function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: "Email sudah terdaftar." });
                }
                return res.status(400).json({ error: err.message });
            }
            res.status(201).json({ message: "Pendaftaran berhasil", userId: this.lastID });
        });
    });
});

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

app.get("/me", verifyToken, (req, res) => {
    res.json(req.user);
});

app.get("/kategori-olahraga", verifyToken, (req, res) => {
    const { q = '' } = req.query;
    const sql = "SELECT * FROM kategori_olahraga WHERE nama_cabor LIKE ? ORDER BY nama_cabor ASC";
    db.all(sql, [`%${q}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get("/events", verifyToken, (req, res) => {
    const { status = 'aktif' } = req.query;
    const sql = "SELECT * FROM events WHERE status = ? ORDER BY tanggal_mulai DESC";
    db.all(sql, [status], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post("/events", verifyToken, isAdmin, (req, res) => {
    const { nama_event, lokasi, tanggal_mulai, tanggal_selesai, deskripsi, jumlah_peserta, skala_event, kategori_olahraga_id, sponsors = [] } = req.body;
    if (!nama_event || !lokasi || !tanggal_mulai || !tanggal_selesai) {
        return res.status(400).json({ error: "Nama Event, Lokasi, dan Tanggal Mulai/Selesai wajib diisi." });
    }
    db.run('BEGIN TRANSACTION;');
    const sqlEvent = 'INSERT INTO events (nama_event, lokasi, tanggal_mulai, tanggal_selesai, deskripsi, jumlah_peserta, skala_event, kategori_olahraga_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const paramsEvent = [nama_event, lokasi, tanggal_mulai, tanggal_selesai, deskripsi, jumlah_peserta, skala_event, kategori_olahraga_id, 'aktif'];
    db.run(sqlEvent, paramsEvent, function(err) {
        if (err) {
            db.run('ROLLBACK;');
            return res.status(500).json({ error: err.message });
        }
        const eventId = this.lastID;
        const sqlSponsor = 'INSERT INTO sponsors (event_id, nama_sponsor) VALUES (?, ?)';
        if (sponsors.length === 0) {
            db.run('COMMIT;');
            return res.status(201).json({ message: "Event berhasil dibuat", eventId });
        }
        let completed = 0;
        sponsors.forEach(nama_sponsor => {
            db.run(sqlSponsor, [eventId, nama_sponsor], (err) => {
                if (err) {
                    db.run('ROLLBACK;');
                    return res.status(500).json({ error: err.message });
                }
                completed++;
                if (completed === sponsors.length) {
                    db.run('COMMIT;');
                    res.status(201).json({ message: "Event berhasil dibuat", eventId });
                }
            });
        });
    });
});

app.get("/events/:id", verifyToken, (req, res) => {
    const eventId = req.params.id;
    const sqlEvent = `SELECT e.*, ko.nama_cabor FROM events e LEFT JOIN kategori_olahraga ko ON e.kategori_olahraga_id = ko.id WHERE e.id = ?`;
    const sqlSponsors = `SELECT nama_sponsor FROM sponsors WHERE event_id = ?`;
    db.get(sqlEvent, [eventId], (err, event) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!event) return res.status(404).json({ error: "Event tidak ditemukan." });
        db.all(sqlSponsors, [eventId], (err, sponsors) => {
            if (err) return res.status(500).json({ error: err.message });
            event.sponsors = sponsors.map(s => s.nama_sponsor);
            res.json(event);
        });
    });
});

app.put("/events/:id", verifyToken, isAdmin, (req, res) => {
    const eventId = req.params.id;
    const { nama_event, lokasi, tanggal_mulai, tanggal_selesai, deskripsi, jumlah_peserta, skala_event, kategori_olahraga_id, sponsors = [] } = req.body;
    db.run('BEGIN TRANSACTION;');
    const sqlEvent = `UPDATE events SET nama_event = ?, lokasi = ?, tanggal_mulai = ?, tanggal_selesai = ?, deskripsi = ?, jumlah_peserta = ?, skala_event = ?, kategori_olahraga_id = ? WHERE id = ?`;
    const paramsEvent = [nama_event, lokasi, tanggal_mulai, tanggal_selesai, deskripsi, jumlah_peserta, skala_event, kategori_olahraga_id, eventId];
    db.run(sqlEvent, paramsEvent, function(err) {
        if (err) {
            db.run('ROLLBACK;');
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            db.run('ROLLBACK;');
            return res.status(404).json({ error: "Event tidak ditemukan." });
        }
        db.run('DELETE FROM sponsors WHERE event_id = ?', [eventId], (err) => {
            if (err) {
                db.run('ROLLBACK;');
                return res.status(500).json({ error: err.message });
            }
            const sqlSponsor = 'INSERT INTO sponsors (event_id, nama_sponsor) VALUES (?, ?)';
            if (sponsors.length === 0) {
                db.run('COMMIT;');
                return res.json({ message: "Event berhasil diperbarui" });
            }
            let completed = 0;
            sponsors.forEach(nama_sponsor => {
                db.run(sqlSponsor, [eventId, nama_sponsor], (err) => {
                    if (err) {
                        db.run('ROLLBACK;');
                        return res.status(500).json({ error: err.message });
                    }
                    completed++;
                    if (completed === sponsors.length) {
                        db.run('COMMIT;');
                        res.json({ message: "Event berhasil diperbarui" });
                    }
                });
            });
        });
    });
});

app.patch("/events/:id/status", verifyToken, isAdmin, (req, res) => {
    const { status } = req.body;
    const eventId = req.params.id;
    if (!status || !['aktif', 'diarsipkan'].includes(status)) {
        return res.status(400).json({ error: "Status tidak valid." });
    }
    const sql = 'UPDATE events SET status = ? WHERE id = ?';
    db.run(sql, [status, eventId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Event tidak ditemukan." });
        res.json({ message: `Status event berhasil diubah menjadi ${status}` });
    });
});

app.delete("/events/:id", verifyToken, isAdmin, (req, res) => {
    const eventId = req.params.id;
    const sql = 'DELETE FROM events WHERE id = ?';
    db.run(sql, [eventId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Event tidak ditemukan." });
        res.json({ message: "Event berhasil dihapus." });
    });
});

app.listen(port, () => {
    console.log(`API server aktif di http://localhost:${port}`);
});
