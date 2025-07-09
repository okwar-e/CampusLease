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
  const { full_name, school_email, password, phone_number } = req.body;

  if (!school_email.endsWith("@strathmore.edu")) {
    return res.status(400).json({ error: "Only @strathmore.edu emails allowed" });
  }

  const [existing] = await pool.query("SELECT id FROM users WHERE school_email = ?", [school_email]);
  if (existing.length > 0) {
    return res.status(400).json({ error: "Email already registered." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const password_hash = await bcrypt.hash(password, 10);

  pendingVerifications[token] = {
    full_name,
    school_email,
    phone_number,
    password_hash,
    selfie: req.files["selfie"]?.[0]?.buffer,
    id_card: req.files["id_card"]?.[0]?.buffer
  };

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "collins.okware@strathmore.edu",
      pass: "dsju bliy jwbd yzyn" // Your app-specific password
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
      INSERT INTO users (full_name, school_email, phone_number, password_hash, selfie, id_card, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `, [
      data.full_name,
      data.school_email,
      data.phone_number,
      data.password_hash,
      data.selfie,
      data.id_card
    ]);

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

app.post("/items", upload.single("image"), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { title, description, category, condition, price_per_day } = req.body;
  const image = req.file?.buffer;

  console.log("Form Data:", req.body); // ✅ Debug form input
  console.log("Uploaded File:", req.file); // ✅ Debug uploaded image

  if (!image) {
    return res.status(400).json({ error: "Image is required" });
  }

  try {
    await pool.query(
      `INSERT INTO items (owner_id, title, description, category, quality, price_per_day, image)
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
    console.error("Error inserting item:", err); // ✅ Log the actual error
    res.status(500).json({ error: "Failed to list item" });
  }
});



  app.get("/student/leases", async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const [leases] = await pool.query(`
      SELECT 
        l.*, 
        i.title AS item_title, 
        i.price_per_day,
        u.full_name AS owner_name,
        u.phone AS owner_phone
      FROM leases l
      JOIN items i ON l.item_id = i.id
      JOIN users u ON i.owner_id = u.id
      WHERE l.renter_id = ?
    `, [req.session.user.id]);

    res.json(leases);
  } catch (err) {
    console.error("Error fetching leases:", err);
    res.status(500).json({ error: "Failed to fetch leases" });
  }
});


  // GET /student/lent
app.get("/student/lent", async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const [rows] = await pool.query(`
      SELECT 
        l.*,
        i.title AS item_title,
        u.full_name AS renter_name,
        u.phone AS renter_phone
      FROM leases l
      JOIN items i ON l.item_id = i.id
      JOIN users u ON l.renter_id = u.id
      WHERE i.owner_id = ?
    `, [req.session.user.id]);

    res.json(rows);
  } catch (err) {
    console.error("Error fetching lent items:", err);
    res.status(500).json({ error: "Failed to fetch lent items." });
  }
});



// 🧪 Session checker
app.get("/me", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.status(401).json({ loggedIn: false, error: "No session" });
  }
});


// Updated Get one item by id
app.get("/items/:id", async (req, res) => {
  try {
    const user = req.session.user;
    const itemId = req.params.id;

    // Base query
    let query = "SELECT * FROM items WHERE id = ?";
    const params = [itemId];

    // If not logged in or not the owner, only show available items
    if (!user) {
      query += " AND availability = 1";
    } else {
      // Show item even if unavailable to owner
      query += " AND (availability = 1 OR owner_id = ?)";
      params.push(user.id);
    }

    const [rows] = await pool.query(query, params);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Item not found or unavailable" });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching item by ID:", err);
    res.status(500).json({ error: "Failed to load item" });
  }
});

const { stkPush } = require('./mpesa'); // 👈 Import only
require('dotenv').config();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret', // ✅ Load from .env
  resave: false,
  saveUninitialized: false, // 🔒 Better for privacy/security
  cookie: {
    httpOnly: true,
    secure: false, // 🔁 Set to true if using HTTPS in production
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));

// /pay/lease

app.post("/pay/lease", express.json(), async (req, res) => {
  const user = req.session.user;

  if (!user || user.role !== "student") {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  const { item_id, start_date, end_date, total_price } = req.body;

  if (!item_id || !start_date || !end_date || !total_price) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    // 🔍 Get item details
    const [[item]] = await conn.query(
      "SELECT * FROM items WHERE id = ? AND availability = 1",
      [item_id]
    );

    if (!item) {
      throw new Error("Item not found or unavailable");
    }

    const price = parseFloat(total_price);
    const renterId = user.id;
    const ownerId = item.owner_id;

    if (ownerId === renterId) {
      throw new Error("You cannot rent your own item");
    }

    // 💸 Check renter's wallet balance
    const [[renterWallet]] = await conn.query(
      "SELECT balance FROM wallets WHERE user_id = ?",
      [renterId]
    );

    if (!renterWallet || renterWallet.balance < price) {
      throw new Error("Insufficient balance in wallet");
    }

    // 🔻 Deduct from renter
    await conn.query(
      "UPDATE wallets SET balance = balance - ? WHERE user_id = ?",
      [price, renterId]
    );

    // 🔺 Credit to owner
    await conn.query(
      `INSERT INTO wallets (user_id, balance)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE balance = balance + ?`,
      [ownerId, price, price]
    );

    // 📝 Create lease
    const [leaseResult] = await conn.query(
      `INSERT INTO leases (item_id, renter_id, start_date, end_date, total_price, status)
       VALUES (?, ?, ?, ?, ?, 'approved')`,
      [item_id, renterId, start_date, end_date, price]
    );
    const leaseId = leaseResult.insertId;

    // 💳 Record payment
    await conn.query(
      `INSERT INTO payments (lease_id, lender_id, leaser_id, amount)
       VALUES (?, ?, ?, ?)`,
      [leaseId, ownerId, renterId, price]
    );

    // 🚫 Mark item unavailable
    await conn.query(
      "UPDATE items SET availability = 0 WHERE id = ?",
      [item_id]
    );

    await conn.commit();
    res.json({ success: true, message: "Lease created, wallet updated, and payment recorded." });

  } catch (err) {
    await conn.rollback();
    console.error("❌ Lease wallet error:", err.message);
    res.status(500).json({ error: err.message || "Transaction failed" });
  } finally {
    conn.release();
  }
});



app.post("/mpesa/callback", express.json(), async (req, res) => {
  const callback = req.body;
  console.log("📦 Callback received:", JSON.stringify(callback, null, 2));

  try {
    const stkCallback = callback?.Body?.stkCallback;
    if (!stkCallback) {
      return res.status(400).json({ error: "Invalid callback structure" });
    }

    const resultCode = stkCallback.ResultCode;
    const checkoutRequestId = stkCallback.CheckoutRequestID;

    if (!checkoutRequestId) {
      return res.status(400).json({ error: "Missing CheckoutRequestID" });
    }

    const metadata = stkCallback.CallbackMetadata?.Item || [];

    let amount = null;
    let phone = null;
    let mpesaReceipt = null;

    metadata.forEach((item) => {
      if (item.Name === "Amount") amount = item.Value;
      if (item.Name === "PhoneNumber") phone = item.Value;
      if (item.Name === "MpesaReceiptNumber") mpesaReceipt = item.Value;
    });

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      if (resultCode !== 0) {
        // ❌ Payment failed → mark transaction as FAILED
        await conn.query(`
          UPDATE wallet_transactions
          SET status = 'FAILED'
          WHERE checkout_request_id = ?
        `, [checkoutRequestId]);

        await conn.commit();
        return res.status(200).json({ message: "Transaction failed. Marked as FAILED." });
      }

      // ✅ Payment success — find transaction and user
      const [[tx]] = await conn.query(`
        SELECT * FROM wallet_transactions
        WHERE checkout_request_id = ?
      `, [checkoutRequestId]);

      if (!tx) throw new Error("Transaction not found.");

      // ✅ Update transaction row with receipt and status
      await conn.query(`
        UPDATE wallet_transactions
        SET status = 'SUCCESS',
            mpesa_receipt = ?,
            phone = ?
        WHERE id = ?
      `, [mpesaReceipt, phone, tx.id]);

      // ✅ Credit the user's wallet
      await conn.query(`
        INSERT INTO wallets (user_id, balance)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE balance = balance + ?
      `, [tx.user_id, tx.amount, tx.amount]);

      await conn.commit();
      console.log(`✅ Wallet updated: User ${tx.user_id}, Amount: KES ${tx.amount}`);
      res.status(200).json({ message: "Wallet top-up successful" });

    } catch (err) {
      await conn.rollback();
      console.error("❌ Transaction processing error:", err);
      res.status(500).json({ error: "Callback processing failed" });
    } finally {
      conn.release();
    }

  } catch (err) {
    console.error("❌ Top-level callback error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Add this to your existing backend (likely in index.js or routes.js)

app.get("/student/payments", async (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== "student") {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id,
        p.amount,
        p.transaction_time,
        i.title AS item_title,
        l.start_date,
        l.end_date
      FROM payments p
      JOIN leases l ON p.lease_id = l.id
      JOIN items i ON l.item_id = i.id
      WHERE p.leaser_id = ?
      ORDER BY p.transaction_time DESC
    `, [user.id]);

    res.json(rows);
  } catch (err) {
    console.error("❌ Failed to fetch payments:", err);
    res.status(500).json({ error: "Failed to fetch payment history." });
  }
});


// Add this to your existing backend (likely in index.js or routes.js)
// GET /student/profile - Get profile data for logged-in student
app.get("/student/profile", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const [rows] = await pool.query(`
      SELECT 
        full_name,
        school_email,
        status,
        phone,               -- ✅ must be here
        selfie,
        id_card
      FROM users
      WHERE id = ?
    `, [req.session.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const profile = rows[0];

    console.log("📦 Loaded profile:", profile); // ✅ Add this for debugging

    const formattedProfile = {
      full_name: profile.full_name,
      school_email: profile.school_email,
      phone: profile.phone || "", // ✅ Include phone
      status: profile.status,
      selfie: profile.selfie ? profile.selfie.toString('base64') : null,
      id_card: profile.id_card ? profile.id_card.toString('base64') : null,
    };

    res.status(200).json(formattedProfile);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Failed to fetch profile data" });
  }
});





// GET /admin/items
app.get('/admin/items', async (req, res) => {
  try {
    const { filter } = req.query;

    let query = 'SELECT * FROM items';
    const params = [];

    if (filter === 'recent') {
      query += ' WHERE date_listed >= ? ORDER BY date_listed DESC';
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      params.push(oneWeekAgo);
    } else {
      query += ' ORDER BY date_listed DESC';
    }

    const [rows] = await pool.query(query, params);

    const items = rows.map(row => ({
      ...row,
      image: row.image ? row.image.toString('base64') : null
    }));

    res.status(200).json(items);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ error: 'Failed to load items' });
  }
});


// DELETE /admin/items/:id
app.delete('/admin/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM items WHERE id = ?', [id]);
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});



// --- ITEM REQUEST ROUTES ---
app.get('/requests/all', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.id, r.item_name AS title, r.description, r.category, r.urgency, r.created_at, u.full_name, u.phone
      FROM item_requests r
      JOIN users u ON r.student_id = u.id
      ORDER BY r.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Error fetching all requests:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});


app.post("/student/requests", async (req, res) => {
 if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
    const user = req.session.user;


  const { item_name, description, category, desired_price, urgency } = req.body;

  try {
    await pool.query(
      `INSERT INTO item_requests 
        (student_id, item_name, description, category, desired_price, urgency) 
        VALUES (?, ?, ?, ?, ?, ?)`,
      [user.id, item_name, description, category, desired_price, urgency]
    );

    res.status(201).json({ message: "Request submitted successfully" });
  } catch (err) {
    console.error("Request Insert Error:", err);
    res.status(500).json({ error: "Failed to submit request" });
  }
});
app.get("/student/requests", async (req, res) => {
  const user = req.session.user;

  // 🔒 Check if user is logged in and is a student
  if (!user || user.role !== 'student') {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, item_name AS title, description, category, desired_price, urgency, created_at 
       FROM item_requests 
       WHERE student_id = ? 
       ORDER BY created_at DESC`,
      [user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Request Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});



app.delete("/student/requests/:id", async (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'student') {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const requestId = req.params.id;

  try {
    const [result] = await pool.query(
      "DELETE FROM item_requests WHERE id = ? AND student_id = ?",
      [requestId, user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Request not found or not yours" });
    }

    res.json({ message: "Request deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete request" });
  }
});
app.put("/student/profile", upload.fields([
  { name: 'selfie' },
  { name: 'id_card' }
]), async (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'student') {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const { full_name, phone } = req.body;

  try {
    const updates = [];
    const params = [];

    if (full_name) {
      updates.push("full_name = ?");
      params.push(full_name);
    }

    if (phone) {
      updates.push("phone = ?");
      params.push(phone); // ✅ Corrected from `phone_number` to `phone`
    }

    // Handle file updates
    if (req.files?.selfie?.[0]) {
      updates.push("selfie = ?");
      params.push(req.files.selfie[0].buffer);
    }

    if (req.files?.id_card?.[0]) {
      updates.push("id_card = ?");
      params.push(req.files.id_card[0].buffer);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Nothing to update." });
    }

    params.push(user.id);

    await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    res.json({ message: "Profile updated" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});


// ✅ Get all requests (admin only)
app.get('/admin/requests', async (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const [rows] = await pool.query(`
      SELECT 
        ir.*, 
        u.full_name AS student_name, 
        u.school_email AS student_email
      FROM item_requests ir
      JOIN users u ON ir.student_id = u.id
      ORDER BY ir.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching requests' });
  }
});


// ✅ Delete a request by ID (admin only)
app.delete('/admin/requests/:id', async (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const requestId = req.params.id;

  try {
    await db.query(`DELETE FROM item_requests WHERE id = ?`, [requestId]);
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

app.get('/admin/stats', async (req, res) => {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const [[{ pendingUsers }]] = await pool.query(`
      SELECT COUNT(*) AS pendingUsers FROM users WHERE status = 'pending'
    `);

    const [[{ totalItems }]] = await pool.query(`
  SELECT COUNT(*) AS totalItems FROM items WHERE availability = 1
`);

    const [[{ totalRevenue }]] = await pool.query(`
      SELECT SUM(amount) AS totalRevenue FROM payments
    `);

    const [[{ weeklyRevenue }]] = await pool.query(`
      SELECT SUM(amount) AS weeklyRevenue
      FROM payments
      WHERE transaction_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    const [dailyRevenue] = await pool.query(`
      SELECT 
        DATE(transaction_time) AS date, 
        SUM(amount) AS amount
      FROM payments
      WHERE transaction_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(transaction_time)
      ORDER BY DATE(transaction_time)
    `);

    res.json({
      pendingUsers: pendingUsers || 0,
      totalItems: totalItems || 0,
      totalRevenue: totalRevenue || 0,
      weeklyRevenue: weeklyRevenue || 0,
      dailyRevenue: dailyRevenue || []
    });

  } catch (err) {
    console.error('Admin Stats Error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});




app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store"); // Prevent caching
  next();
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid"); // Replace with your session cookie name if different
    res.json({ message: "Logged out" });
  });
});
app.get("/wallet/balance", async (req, res) => {
  const user = req.session.user;

  // 🔒 Check if user is logged in and is a student
  if (!user || user.role !== 'student') {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  try {
    // ✅ Check for wallet
    const [[wallet]] = await pool.query(
      "SELECT balance FROM wallets WHERE user_id = ?",
      [user.id]
    );

    // ❌ Wallet not found — create with 0.00 balance
    if (!wallet) {
      await pool.query(
        "INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)",
        [user.id]
      );
      return res.json({ balance: 0.00 });
    }

    // ✅ Return current balance
    const balance = wallet.balance !== null ? parseFloat(wallet.balance) : 0.00;
    res.json({ balance });
    
  } catch (err) {
    console.error("❌ Error fetching wallet balance:", err);
    res.status(500).json({ error: "Failed to fetch wallet balance" });
  }
});
app.post("/wallet/deposit", async (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(403).json({ error: "Unauthorized" });

  const { amount, phone } = req.body;

  // ✅ Validate amount
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  // ✅ Validate Safaricom phone number (must start with 2547...)
  if (!/^2547\d{8}$/.test(phone)) {
    return res.status(400).json({ error: "Invalid Safaricom phone number" });
  }

  try {
    // ✅ 1. Trigger STK Push
    const mpesaRes = await stkPush({
      phone,
      amount,
      accountReference: "CampusLease",
      transactionDesc: `Wallet top-up for ${user.full_name}`
    });

    // ✅ 2. Log full response for debugging
    console.log("📲 STK Push response:", JSON.stringify(mpesaRes, null, 2));

    const checkoutRequestId = mpesaRes.CheckoutRequestID;

    if (!checkoutRequestId) {
      throw new Error("Invalid STK response — CheckoutRequestID missing.");
    }

    // ✅ 3. Store transaction as pending in wallet_transactions
    await pool.query(`
      INSERT INTO wallet_transactions (user_id, amount, phone, checkout_request_id, status)
      VALUES (?, ?, ?, ?, 'PENDING')
    `, [user.id, amount, phone, checkoutRequestId]);

    // ✅ 4. Respond to frontend
    res.json({
      success: true,
      message: "STK Push sent. Awaiting confirmation.",
      checkoutRequestId
    });

  } catch (err) {
    console.error("❌ Deposit error:", err);
    res.status(500).json({ error: "Failed to initiate deposit" });
  }
});

app.get("/admin/refund-requests", async (req, res) => {
  try {
    const [refunds] = await pool.query(`
      SELECT r.*, u.full_name AS user_name, p.amount AS paid_amount, i.title AS item_title
      FROM refunds r
      JOIN payments p ON r.payment_id = p.id
      JOIN leases l ON p.lease_id = l.id
      JOIN items i ON l.item_id = i.id
      JOIN users u ON r.user_id = u.id
      WHERE r.approved_by IS NULL
      ORDER BY r.refunded_at DESC
    `);
    res.json(refunds);
  } catch (err) {
    console.error("Failed to fetch refunds:", err);
    res.status(500).json({ error: "Failed to fetch refund requests" });
  }
});

app.post("/admin/refund/:id/approve", async (req, res) => {
  const refundId = req.params.id;
  const admin = req.session.user;
  if (!admin || admin.role !== 'admin') {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const [[refund]] = await conn.query("SELECT * FROM refunds WHERE id = ?", [refundId]);

    if (!refund) throw new Error("Refund not found");
    if (refund.approved_by) throw new Error("Refund already processed");

    // credit user wallet
    await conn.query("UPDATE wallets SET balance = balance + ? WHERE user_id = ?", [refund.amount, refund.user_id]);

    // mark refund as approved
    await conn.query("UPDATE refunds SET approved_by = ? WHERE id = ?", [admin.id, refundId]);

    await conn.commit();
    res.json({ success: true, message: "Refund approved" });
  } catch (err) {
    await conn.rollback();
    console.error("Refund approval error:", err);
    res.status(500).json({ error: err.message || "Refund failed" });
  } finally {
    conn.release();
  }
});

app.post("/student/request-refund", express.json(), async (req, res) => {
  const user = req.session.user;
  const { payment_id, reason } = req.body;

  if (!user || user.role !== "student") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!payment_id || !reason) {
    return res.status(400).json({ error: "Missing payment ID or reason" });
  }

  try {
    // Check if already requested
    const [existing] = await pool.query(
      "SELECT * FROM refunds WHERE payment_id = ? AND user_id = ?",
      [payment_id, user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Refund already requested" });
    }

    await pool.query(
      "INSERT INTO refunds (payment_id, user_id, amount, reason) SELECT id, leaser_id, amount, ? FROM payments WHERE id = ? AND leaser_id = ?",
      [reason, payment_id, user.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Refund request error:", err);
    res.status(500).json({ error: "Failed to request refund" });
  }
});



// ✅ Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
