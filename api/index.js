require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'drone-panel-secret-key-2024';

// Allowed origins for CORS
const allowedOrigins = [
  'https://cieniowanie.droneagri.pl',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now
  },
  credentials: true
}));
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'panel_drones',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Admin emails
const ADMIN_EMAILS = ['admin@drone-partss.com'];

const isAdminEmail = (email) => {
  return ADMIN_EMAILS.includes(email?.toLowerCase());
};

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await pool.execute('SELECT id, email, role, name FROM users WHERE id = ?', [decoded.userId]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Check if user exists
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = isAdminEmail(email) ? 'admin' : 'user';

    // Insert user
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)',
      [email.toLowerCase(), hashedPassword, role, name || null]
    );

    // Generate token
    const token = jwt.sign({ userId: result.insertId }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      user: {
        id: result.insertId,
        email: email.toLowerCase(),
        role,
        name
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Find user
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Logout (client-side, just return success)
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// ==================== SERVICE REQUESTS ====================

// Create service request (requires auth)
app.post('/api/service-requests', authenticateToken, async (req, res) => {
  try {
    const { service, scheduledDate, scheduledTime, name, email, phone, location, area, notes } = req.body;

    if (!service || !scheduledDate || !scheduledTime || !name || !email || !phone || !location) {
      return res.status(400).json({ error: 'Todos los campos requeridos deben completarse' });
    }

    const [result] = await pool.execute(
      `INSERT INTO service_requests (user_id, service, scheduled_date, scheduled_time, name, email, phone, location, area, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, service, scheduledDate, scheduledTime, name, email, phone, location, area || null, notes || null]
    );

    res.status(201).json({
      id: result.insertId,
      service,
      scheduledDate,
      scheduledTime,
      name,
      email,
      phone,
      location,
      area,
      notes,
      status: 'pending',
      message: 'Solicitud creada exitosamente'
    });
  } catch (error) {
    console.error('Create service request error:', error);
    res.status(500).json({ error: 'Error al crear la solicitud' });
  }
});

// Get user's service requests (requires auth)
app.get('/api/service-requests', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM service_requests WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
});

// Get all service requests (admin only)
app.get('/api/admin/service-requests', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const [rows] = await pool.execute(
      `SELECT sr.*, u.email as user_email
       FROM service_requests sr
       LEFT JOIN users u ON sr.user_id = u.id
       ORDER BY sr.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Get all service requests error:', error);
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
});

// Update service request status (admin only)
app.put('/api/admin/service-requests/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    await pool.execute(
      'UPDATE service_requests SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    res.json({ success: true, message: 'Estado actualizado' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
