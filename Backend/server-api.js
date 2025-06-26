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

app.post("/register", (req, res) => {
    const { nama, email, password, peran } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: "Gagal memproses password" });
        }

        const sql = 'INSERT INTO users (nama, email, password_hash, peran) VALUES (?, ?, ?, ?)';
        const params = [nama, email, hash, peran];

        db.run(sql, params, function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: "Email sudah terdaftar." });
                }
                return res.status(400).json({ error: err.message });
            }
            res.status(201).json({
                message: "Pendaftaran berhasil",
                userId: this.lastID
            });
        });
    });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err || !user) return res.status(401).json({ message: "Email tidak ditemukan" });

        bcrypt.compare(password, user.password_hash, (err, result) => {
            if (result) {
                const userPayload = {
                    id: user.id,
                    nama: user.nama,
                    email: user.email,
                    peran: user.peran
                };
                const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });
                res.json({ message: "Login berhasil", token, user: userPayload });
            } else {
                res.status(401).json({ message: "Password salah" });
            }
        });
    });
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

app.get("/me", verifyToken, (req, res) => {
    res.json(req.user);
});

app.listen(port, () => {
    console.log(`API server aktif di http://localhost:${port}`);
});