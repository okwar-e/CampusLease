const express = require("express");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const pool = require("./db");
const cors = require("cors");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

require("dotenv").config();

const session = require("express-session");



const app = express(); // ✅ Initialize app

app.use(session({
  secret: process.env.SESSION_SECRET, // 🔒 replace with a strong secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // true if using HTTPS
}));

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


const pendingVerifications = {}; // or use DB table

// ✅ Register Route
app.post("/register", upload.fields([
  { name: "selfie", maxCount: 1 },
  { name: "id_card", maxCount: 1 }
]), async (req, res) => {
  const { full_name, school_email, password } = req.body;

  // 1. Only allow Strathmore emails
  if (!school_email.endsWith("@strathmore.edu")) {
    return res.status(400).json({ error: "Only @strathmore.edu emails allowed" });
  }

    // 2. Check if email already exists in DB
  const [existing] = await pool.query("SELECT id FROM users WHERE school_email = ?", [school_email]);
  if (existing.length > 0) {
    return res.status(400).json({ error: "Email already registered." });
  }


   // 3. Store in pendingVerifications
  const token = crypto.randomBytes(32).toString("hex");
  const password_hash = await bcrypt.hash(password, 10);

  pendingVerifications[token] = {
    full_name,
    school_email,
    password_hash,
    selfie: req.files["selfie"]?.[0]?.buffer,
    id_card: req.files["id_card"]?.[0]?.buffer
  };


  // 4. Send Email
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
    html: `<p>Click below to verify your email address:<br/><a href="${link}">Verify Email</a></p>`
  });

  res.status(200).json({ message: "Verification email sent." });
});


// ✅ Email Verification Route
app.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  const data = pendingVerifications[token];

  if (!data) {
    return res.status(400).send("Invalid or expired token.");
  }

  try {
    await pool.query(`
      INSERT INTO users (full_name, school_email, password_hash, selfie, id_card, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [data.full_name, data.school_email, data.password_hash, data.selfie, data.id_card]);

    delete pendingVerifications[token];
    res.send("Email verified. Your account is pending approval.");
  } catch (err) {
    console.error("DB Insert Error:", err);
    res.status(500).send("Error saving verified user.");
  }
});


// ✅ Login Route with Session Support
app.post("/login", async (req, res) => {
  try {
    const { school_email, password } = req.body;
    const [rows] = await pool.query("SELECT * FROM users WHERE school_email = ?", [school_email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ error: "Account not approved yet. Please wait for admin approval." });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ error: "Your registration was rejected." });
    }

    // ✅ Save user session (no password hash)
    req.session.user = {
      id: user.id,
      full_name: user.full_name,
      school_email: user.school_email,
      role: user.role,
      status: user.status
    };

    // ✅ Respond with user session data
    res.status(200).json({
      message: "Login successful",
      user: req.session.user
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// Get all pending students (for admin approval)
app.get("/admin/students", async (req, res) => {
  try {
    const [students] = await pool.query(
      `SELECT id, full_name, school_email, status, selfie, id_card 
       FROM users 
       WHERE role = 'student' AND status = 'pending'`
    );

    console.log("Fetched pending students:", students);
    res.json(students);
  } catch (err) {
    console.error("Error fetching pending students:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});


// Update approval status (for student only)
app.post("/admin/students/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // expected: 'approved' or 'rejected'

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE users SET status = ? WHERE id = ? AND role = 'student'",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Student not found or not a student" });
    }

    res.json({ message: `Student ${status}` });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ error: "Failed to update student status" });
  }
});

app.post("/admin/register", async (req, res) => {
  const { full_name, school_email, password, role } = req.body;

  // Validate role
  if (!["admin", "student"].includes(role)) {
    return res.status(400).json({ error: "Invalid role. Must be 'admin' or 'student'" });
  }

  try {
    // Check if email already exists
    const [existing] = await pool.query("SELECT id FROM users WHERE school_email = ?", [school_email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (full_name, school_email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)",
      [full_name, school_email, password_hash, role, 'approved'] // Admins register as approved by default
    );

    res.status(201).json({ message: `${role} registered successfully` });
  } catch (err) {
    console.error("Admin registration failed:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// DELETE user by email (from URL param)
app.delete("/admin/users/:email", async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const [result] = await pool.query(
      "DELETE FROM users WHERE school_email = ?",
      [email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Deletion failed" });
  }
});

// ✅ Logout route
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
      return res.status(500).json({ error: "Failed to log out" });
    }
    res.clearCookie("connect.sid"); // default cookie name
    res.json({ message: "Logged out successfully" });
  });
});

// GET /items/available
app.get("/items/available", async (req, res) => {
  const [items] = await pool.query("SELECT * FROM items WHERE availability = 1");
  res.json(items);
});

// POST /items (requires session & image upload)
app.post("/items", upload.single("image"), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { title, description, category, condition, price_per_day } = req.body;
  const image = req.file?.buffer;

  if (!image) {
    return res.status(400).json({ error: "Image is required" });
  }

  try {
    await pool.query(
      `INSERT INTO items (owner_id, title, description, category, condition, price_per_day, image)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.session.user.id,
        title,
        description,
        category,
        condition,
        price_per_day,
        image,
      ]
    );

    res.status(201).json({ message: "Item listed successfully" });
  } catch (err) {
    console.error("Error inserting item:", err);
    res.status(500).json({ error: "Failed to list item" });
  }
});



// ✅ Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
