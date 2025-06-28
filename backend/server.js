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
        SELECT l.*, i.title AS item_title, i.price_per_day
  FROM leases l
  JOIN items i ON l.item_id = i.id
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
    if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

    const userId = req.session.user.id;

    try {
      const [rows] = await pool.query(`
        SELECT l.*, u.full_name AS renter_name, i.title AS item_title, i.price_per_day
        FROM leases l
        JOIN items i ON l.item_id = i.id
        JOIN users u ON l.renter_id = u.id
        WHERE i.owner_id = ?
        ORDER BY l.created_at DESC
      `, [userId]);

      res.json(rows);
    } catch (err) {
      console.error("Error fetching lent items:", err);
      res.status(500).json({ error: "Failed to fetch lent items" });
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

/*app.post("/leases", async (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { item_id, start_date, end_date, total_price } = req.body;

  try {
    const [itemRows] = await pool.query("SELECT owner_id, availability FROM items WHERE id = ?", [item_id]);
    if (!itemRows.length || !itemRows[0].availability) {
      return res.status(400).json({ error: "Item not available" });
    }

    if (itemRows[0].owner_id === user.id) {
      return res.status(403).json({ error: "You cannot rent your own item" });
    }

    await pool.query(
      `INSERT INTO leases (item_id, renter_id, start_date, end_date, total_price)
       VALUES (?, ?, ?, ?, ?)`,
      [item_id, user.id, start_date, end_date, total_price]
    );

    await pool.query("UPDATE items SET availability = 0 WHERE id = ?", [item_id]);

    res.json({ message: "Lease created successfully" });
  } catch (err) {
    console.error("Lease creation error:", err); // 💥 Add this
    res.status(500).json({ error: "Failed to lease item" }); // Keep this generic
  }
});*/ 

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

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(session({
  secret: 'campuslease-secret',
  resave: false,
  saveUninitialized: true
}));


//pay/lease
app.post("/pay/lease", express.json(), async (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'student') {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const { item_id, start_date, end_date, total_price, phone } = req.body;

  // NEW: Proper date comparison (timezone-safe)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Remove time component
  
  const startDate = new Date(req.body.start_date);
  const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  if (normalizedStartDate < today) {
    return res.status(400).json({ 
      error: "Start date cannot be in the past. Please select today or a future date." 
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Check item availability (with lock for concurrent requests)
    const [[item]] = await conn.query(
      "SELECT owner_id, availability FROM items WHERE id = ? FOR UPDATE",
      [item_id]
    );
    
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    if (item.availability !== 1) {
      return res.status(400).json({ error: "Item is not available" });
    }
    if (item.owner_id === user.id) {
      return res.status(400).json({ error: "Cannot rent your own item" });
    }

    // 2. Create lease
    const [leaseResult] = await conn.query(
      `INSERT INTO leases (item_id, renter_id, start_date, end_date, total_price, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [item_id, user.id, start_date, end_date, total_price]
    );
    const lease_id = leaseResult.insertId;

    // 3. Initiate M-Pesa payment
    const mpesaRes = await stkPush({
      phone,
      amount: total_price,
      accountReference: "CampusLease",
      transactionDesc: `Lease ${lease_id}`
    });

    // 4. Create payment record
    await conn.query(
      `INSERT INTO payments 
       (lease_id, lender_id, leaser_id, amount, phone, status, checkout_request_id)
       VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
      [lease_id, item.owner_id, user.id, total_price, phone, mpesaRes.CheckoutRequestID]
    );

    // 5. Mark item as temporarily reserved
    await conn.query(
      "UPDATE items SET availability = 0 WHERE id = ?",
      [item_id]
    );

    await conn.commit();
    
    res.json({ 
      success: true, 
      message: "Lease created. Awaiting payment confirmation.", 
      lease_id,
      checkoutRequestId: mpesaRes.CheckoutRequestID
    });

  } catch (err) {
    await conn.rollback();
    console.error("Lease/payment error:", err);
    res.status(500).json({ error: "Lease/payment failed" });
  } finally {
    conn.release();
  }
});


//mpesa/callback
 app.post("/mpesa/callback", express.json(), async (req, res) => {
  const callback = req.body;
  console.log("📦 Callback received:", JSON.stringify(callback, null, 2));

  try {
    const stkCallback = callback?.Body?.stkCallback;
    if (!stkCallback) return res.status(400).json({ error: "Invalid callback structure" });

    const resultCode = stkCallback.ResultCode;
    const checkoutRequestID = stkCallback.CheckoutRequestID;

    // Get database connection from pool
    const conn = await pool.getConnection();
    await conn.beginTransaction(); // Start transaction

    try {
      if (resultCode === 0) {
        // ✅ Payment was successful
        const metadata = stkCallback.CallbackMetadata?.Item || [];
        let amount, phone, mpesaReceipt;

        metadata.forEach(item => {
          if (item.Name === "Amount") amount = item.Value;
          if (item.Name === "PhoneNumber") phone = item.Value;
          if (item.Name === "MpesaReceiptNumber") mpesaReceipt = item.Value;
        });

        // 1. Update payment record
        const [paymentUpdate] = await conn.query(`
          UPDATE payments 
          SET 
            status = 'SUCCESS',
            mpesa_receipt_no = ?,
            transaction_time = NOW(),
            amount = ?,
            phone = ?
          WHERE checkout_request_id = ?
        `, [mpesaReceipt, amount, phone, checkoutRequestID]);

        if (paymentUpdate.affectedRows === 0) {
          throw new Error("Payment record not found");
        }

        // 2. Get the associated lease_id
        const [[payment]] = await conn.query(`
          SELECT lease_id FROM payments 
          WHERE checkout_request_id = ?
        `, [checkoutRequestID]);

        // 3. Update lease status to 'approved'
        await conn.query(`
          UPDATE leases 
          SET status = 'approved' 
          WHERE id = ?
        `, [payment.lease_id]);

        // 4. Get the item_id from the lease
        const [[lease]] = await conn.query(`
          SELECT item_id FROM leases 
          WHERE id = ?
        `, [payment.lease_id]);

        // 5. Mark item as unavailable
        await conn.query(`
          UPDATE items 
          SET availability = 0 
          WHERE id = ?
        `, [lease.item_id]);

        await conn.commit(); // Commit all changes
        console.log(`✅ Payment ${mpesaReceipt} processed. Lease ${payment.lease_id} approved.`);
        
      } else {
        // ❌ Payment failed - only update payment status
        await conn.query(`
          UPDATE payments 
          SET status = 'FAILED', 
              transaction_time = NOW() 
          WHERE checkout_request_id = ?
        `, [checkoutRequestID]);
        
        await conn.commit();
        console.warn(`⚠️ Payment failed: ${stkCallback.ResultDesc}`);
      }

      res.status(200).json({ message: "Callback handled" });
      
    } catch (err) {
      await conn.rollback();
      console.error("❌ Transaction failed:", err);
      res.status(500).json({ error: "Callback processing failed" });
    } finally {
      conn.release();
    }

  } catch (err) {
    console.error("❌ Error in M-Pesa callback:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Add this to your existing backend (likely in index.js or routes.js)

// GET /student/payments - Get all payment records for logged-in student
app.get("/student/payments", async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const [payments] = await pool.query(`
      SELECT 
        p.id,
        p.amount,
        p.status,
        p.transaction_time AS payment_date,
        p.mpesa_receipt_no,
        l.start_date,
        l.end_date,
        i.title AS item_title
      FROM 
        payments p
      JOIN 
        leases l ON p.lease_id = l.id
      JOIN 
        items i ON l.item_id = i.id
      WHERE 
        p.leaser_id = ?
      ORDER BY 
        p.transaction_time DESC
    `, [req.session.user.id]);

    // Format dates and amounts for frontend
    const formattedPayments = payments.map(payment => ({
      ...payment,
      payment_date: payment.payment_date || null, // Handle NULL dates
      amount: parseFloat(payment.amount).toFixed(2) // Ensure 2 decimal places
    }));

    res.status(200).json(formattedPayments);
  } catch (err) {
    console.error("Error fetching payments:", err);
    res.status(500).json({ error: "Failed to fetch payment records" });
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
        selfie,
        id_card
      FROM users
      WHERE id = ?
    `, [req.session.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const profile = rows[0];

    // Convert BLOBs to base64
    const formattedProfile = {
      full_name: profile.full_name,
      school_email: profile.school_email,
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
    await pool.query(
      `UPDATE users SET full_name = ?, phone_number = ?
       WHERE id = ?`,
      [full_name, phone, user.id]
    );
    res.json({ message: "Profile updated" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});


// ✅ Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
