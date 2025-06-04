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
const crypto = require("crypto");
const pendingVerifications = {}; // or use DB table

app.post("/register", upload.fields([
  { name: "selfie", maxCount: 1 },
  { name: "id_card", maxCount: 1 }
]), async (req, res) => {
  const { full_name, school_email, password } = req.body;

  if (!school_email.endsWith("@strathmore.edu")) {
    return res.status(400).json({ error: "Only @strathmore.edu emails allowed" });
  }

  const token = crypto.randomBytes(32).toString("hex");

  const password_hash = await bcrypt.hash(password, 10);
  pendingVerifications[token] = {
    full_name,
    school_email,
    password_hash,
    selfie: req.files["selfie"][0].buffer,
    id_card: req.files["id_card"][0].buffer,
  };

  // Send email
 const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "collins.okware@strathmore.edu", // Sender email
    pass: "dsju bliy jwbd yzyn"     // App password (NOT your Gmail password)
  }
});


  const link = `http://localhost:5050/verify-email?token=${token}`;
  await transporter.sendMail({
    from: '"CampusLease" <noreply@campuslease.com>',
    to: school_email,
    subject: "Verify your email",
    html: `<p>Click to verify: <a href="${link}">Verify Email</a></p>`
  });

  res.status(200).json({ message: "Verification email sent" });
});

app.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  const data = pendingVerifications[token];

  if (!data) return res.status(400).send("Invalid or expired token");

  try {
    await pool.query(
      "INSERT INTO students (full_name, school_email, password_hash, selfie, id_card, status) VALUES (?, ?, ?, ?, ?, ?)",
      [data.full_name, data.school_email, data.password_hash, data.selfie, data.id_card, 'pending']
    );
    delete pendingVerifications[token];
    res.send("Email verified! Your account is now pending approval.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving verified user");
  }
});


app.post("/login", async (req, res) => {
  try {
    const { school_email, password } = req.body;
    console.log("Login attempt:", school_email, password);

    const [rows] = await pool.query(
      "SELECT * FROM students WHERE school_email = ?",
      [school_email]
    );
    console.log("DB query result:", rows);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        full_name: user.full_name,
        school_email: user.school_email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all students (for admin)
app.get("/admin/students", async (req, res) => {
  try {
    const [students] = await pool.query(
      "SELECT id, full_name, school_email, status, selfie, id_card FROM students"
    );
    console.log("Fetched students:", students);
    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Update approval status
app.post("/admin/students/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // expected: 'approved' or 'rejected'

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE students SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ message: `Student ${status}` });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ error: "Failed to update student status" });
  }
});



// ✅ Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
