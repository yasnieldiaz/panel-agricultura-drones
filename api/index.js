require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { Vonage } = require('@vonage/server-sdk');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'drone-panel-secret-key-2024';

// Config file path
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Load or create config
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return {
    vonage: {
      apiKey: process.env.VONAGE_API_KEY || '',
      apiSecret: process.env.VONAGE_API_SECRET || '',
      fromNumber: process.env.VONAGE_FROM_NUMBER || 'Drone Service'
    },
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || '587',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      fromEmail: process.env.FROM_EMAIL || 'noreply@droneservice.com'
    }
  };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Current configuration
let config = loadConfig();

// Create Vonage client
function createVonageClient() {
  if (config.vonage && config.vonage.apiKey && config.vonage.apiSecret) {
    return new Vonage({
      apiKey: config.vonage.apiKey,
      apiSecret: config.vonage.apiSecret
    });
  }
  return null;
}

// Create email transporter
function createEmailTransporter() {
  if (config.smtp && config.smtp.user && config.smtp.pass) {
    return nodemailer.createTransport({
      host: config.smtp.host,
      port: parseInt(config.smtp.port),
      secure: false,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      }
    });
  }
  return null;
}

let vonage = createVonageClient();
let emailTransporter = createEmailTransporter();

function getFromNumber() {
  return config.vonage?.fromNumber || 'Drone Service';
}

function getFromEmail() {
  return config.smtp?.fromEmail || 'noreply@droneservice.com';
}

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

// ==================== CONFIG ENDPOINTS ====================

// Get current config (without secrets)
app.get('/api/config', (req, res) => {
  res.json({
    vonage: {
      apiKey: config.vonage?.apiKey ? config.vonage.apiKey.substring(0, 4) + '****' : '',
      fromNumber: config.vonage?.fromNumber || 'Drone Service'
    },
    smtp: {
      host: config.smtp?.host || 'smtp.gmail.com',
      port: config.smtp?.port || '587',
      user: config.smtp?.user || '',
      fromEmail: config.smtp?.fromEmail || ''
    },
    status: {
      vonage: !!(config.vonage?.apiKey && config.vonage?.apiSecret),
      smtp: !!(config.smtp?.user && config.smtp?.pass)
    }
  });
});

// Update Vonage config
app.post('/api/config/vonage', (req, res) => {
  const { apiKey, apiSecret, fromNumber } = req.body;

  if (!apiKey || !apiSecret) {
    return res.status(400).json({ error: 'API Key and API Secret are required' });
  }

  config.vonage = {
    apiKey,
    apiSecret,
    fromNumber: fromNumber || 'Drone Service'
  };

  saveConfig(config);
  vonage = createVonageClient();

  console.log('Vonage configuration updated');
  res.json({ success: true, message: 'Vonage configuration saved' });
});

// Update SMTP config
app.post('/api/config/smtp', (req, res) => {
  const { host, port, user, pass, fromEmail } = req.body;

  if (!user || !pass) {
    return res.status(400).json({ error: 'SMTP user and password are required' });
  }

  config.smtp = {
    host: host || 'smtp.gmail.com',
    port: port || '587',
    user,
    pass,
    fromEmail: fromEmail || user
  };

  saveConfig(config);
  emailTransporter = createEmailTransporter();

  console.log('SMTP configuration updated');
  res.json({ success: true, message: 'SMTP configuration saved' });
});

// Test Vonage connection
app.post('/api/config/test-vonage', async (req, res) => {
  if (!vonage) {
    return res.status(400).json({ error: 'Vonage not configured' });
  }

  try {
    const response = await fetch(`https://rest.nexmo.com/account/get-balance?api_key=${config.vonage.apiKey}&api_secret=${config.vonage.apiSecret}`);
    const data = await response.json();

    if (data.value !== undefined) {
      res.json({ success: true, balance: data.value });
    } else {
      res.status(400).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test SMTP connection
app.post('/api/config/test-smtp', async (req, res) => {
  if (!emailTransporter) {
    return res.status(400).json({ error: 'SMTP not configured' });
  }

  try {
    await emailTransporter.verify();
    res.json({ success: true, message: 'SMTP connection successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

// ==================== SMS SEND ====================

// Send SMS (admin only or for testing)
app.post('/api/sms/send', async (req, res) => {
  if (!vonage) {
    return res.status(400).json({ error: 'Vonage not configured', success: false });
  }

  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Phone number and message are required', success: false });
  }

  try {
    // Clean the phone number (remove spaces, keep + and digits)
    const cleanPhone = to.replace(/[^\d+]/g, '');

    const response = await vonage.sms.send({
      to: cleanPhone,
      from: getFromNumber(),
      text: message
    });

    console.log('SMS sent:', response);

    if (response.messages && response.messages[0].status === '0') {
      res.json({ success: true, messageId: response.messages[0]['message-id'] });
    } else {
      const errorText = response.messages?.[0]?.['error-text'] || 'Unknown error';
      res.status(400).json({ success: false, error: errorText });
    }
  } catch (error) {
    console.error('SMS send error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to send SMS' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
