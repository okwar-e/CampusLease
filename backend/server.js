const express = require("express");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const pool = require("./db");
const cors = require("cors");
require("dotenv").config();

const app = express(); // ✅ Initialize app

// ✅ Enable CORS middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// ✅ Parse incoming JSON
app.use(express.json());

// ✅ Multer config (store files in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// ✅ Register route
app.post("/register", upload.fields([
  { name: "selfie", maxCount: 1 },
  { name: "id_card", maxCount: 1 }
]), async (req, res) => {
  try {
    const { full_name, school_email, password } = req.body;

    if (!req.files["selfie"] || !req.files["id_card"]) {
      return res.status(400).json({ error: "Selfie and ID card are required." });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const selfieBuffer = req.files["selfie"][0].buffer;
    const idCardBuffer = req.files["id_card"][0].buffer;

    const [existing] = await pool.query(
      "SELECT id FROM students WHERE school_email = ?",
      [school_email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    await pool.query(
      "INSERT INTO students (full_name, school_email, password_hash, selfie, id_card) VALUES (?, ?, ?, ?, ?)",
      [full_name, school_email, password_hash, selfieBuffer, idCardBuffer]
    );

    res.status(200).json({ message: "Student registered successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
