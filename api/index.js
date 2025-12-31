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

// ==================== EMAIL TEMPLATES ====================

const SERVICE_NAMES = {
  'fumigation': 'Fumigación con Drones',
  'mapping': 'Mapeo y Análisis Aéreo',
  'painting': 'Pintura Industrial con Drones',
  'rental': 'Alquiler de Drones'
};

const STATUS_NAMES = {
  'pending': 'Pendiente',
  'confirmed': 'Confirmado',
  'in_progress': 'En Progreso',
  'completed': 'Completado',
  'cancelled': 'Cancelado'
};

// Base email template
function getEmailTemplate(title, content, footerText = '') {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; border: 1px solid rgba(16, 185, 129, 0.2); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">🚁 Drone Service</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Servicios Profesionales de Drones</p>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 30px 30px 10px;">
              <h2 style="margin: 0; color: #10b981; font-size: 22px; font-weight: 600;">${title}</h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 10px 30px 30px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: rgba(16, 185, 129, 0.1); padding: 20px 30px; border-top: 1px solid rgba(16, 185, 129, 0.2);">
              <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 12px; text-align: center;">
                ${footerText || 'Este email fue enviado automáticamente por Drone Service.'}
              </p>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.4); font-size: 11px; text-align: center;">
                © ${new Date().getFullYear()} Drone Service - Todos los derechos reservados
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// Welcome email for new users
function getWelcomeEmailTemplate(userName) {
  const content = `
    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Hola <strong style="color: white;">${userName || 'Usuario'}</strong>,
    </p>
    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      ¡Bienvenido/a a <strong style="color: #10b981;">Drone Service</strong>! Tu cuenta ha sido creada exitosamente.
    </p>
    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Ahora puedes acceder a todos nuestros servicios profesionales de drones:
    </p>
    <ul style="color: rgba(255,255,255,0.8); font-size: 15px; line-height: 1.8; margin: 0 0 20px; padding-left: 20px;">
      <li>🌾 <strong>Fumigación Agrícola</strong> - Aplicación precisa de productos fitosanitarios</li>
      <li>📍 <strong>Mapeo y Análisis</strong> - Cartografía aérea de alta resolución</li>
      <li>🎨 <strong>Pintura Industrial</strong> - Recubrimientos en estructuras de difícil acceso</li>
      <li>🚁 <strong>Alquiler de Drones</strong> - Equipos profesionales para tus proyectos</li>
    </ul>
    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Para solicitar un servicio, simplemente inicia sesión en nuestra plataforma y haz clic en "Solicitar Servicio".
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://cieniowanie.droneagri.pl" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
        Ir a la Plataforma
      </a>
    </div>
    <p style="color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6; margin: 0;">
      Si tienes alguna pregunta, no dudes en contactarnos.
    </p>
  `;
  return getEmailTemplate('¡Bienvenido/a a Drone Service!', content, 'Gracias por unirte a nuestra plataforma.');
}

// Admin notification for new registration
function getAdminNewUserEmailTemplate(userEmail, userName) {
  const content = `
    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Se ha registrado un nuevo usuario en la plataforma:
    </p>
    <div style="background-color: rgba(16, 185, 129, 0.1); border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
      <p style="margin: 0 0 10px; color: rgba(255,255,255,0.6); font-size: 14px;">Nombre:</p>
      <p style="margin: 0 0 15px; color: white; font-size: 18px; font-weight: bold;">${userName || 'No especificado'}</p>
      <p style="margin: 0 0 10px; color: rgba(255,255,255,0.6); font-size: 14px;">Email:</p>
      <p style="margin: 0; color: #10b981; font-size: 18px; font-weight: bold;">${userEmail}</p>
    </div>
    <p style="color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
      Fecha de registro: ${new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
    </p>
  `;
  return getEmailTemplate('🆕 Nuevo Usuario Registrado', content);
}

// Client notification for service request created
function getClientServiceRequestEmailTemplate(request) {
  const serviceName = SERVICE_NAMES[request.service] || request.service;
  const content = `
    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Hola <strong style="color: white;">${request.name}</strong>,
    </p>
    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Hemos recibido tu solicitud de servicio. A continuación los detalles:
    </p>
    <div style="background-color: rgba(16, 185, 129, 0.1); border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
      <table width="100%" cellpadding="5" cellspacing="0">
        <tr>
          <td style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 10px;">Servicio:</td>
          <td style="color: #10b981; font-size: 16px; font-weight: bold; padding-bottom: 10px;">${serviceName}</td>
        </tr>
        <tr>
          <td style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 10px;">Fecha programada:</td>
          <td style="color: white; font-size: 16px; font-weight: bold; padding-bottom: 10px;">${request.scheduledDate}</td>
        </tr>
        <tr>
          <td style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 10px;">Hora:</td>
          <td style="color: white; font-size: 16px; padding-bottom: 10px;">${request.scheduledTime}</td>
        </tr>
        <tr>
          <td style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 10px;">Ubicación:</td>
          <td style="color: white; font-size: 16px; padding-bottom: 10px;">${request.location}</td>
        </tr>
        ${request.area ? `
        <tr>
          <td style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 10px;">Área:</td>
          <td style="color: white; font-size: 16px; padding-bottom: 10px;">${request.area} hectáreas</td>
        </tr>
        ` : ''}
        <tr>
          <td style="color: rgba(255,255,255,0.6); font-size: 14px;">Estado:</td>
          <td style="color: #fbbf24; font-size: 16px; font-weight: bold;">⏳ Pendiente de confirmación</td>
        </tr>
      </table>
    </div>
    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Nuestro equipo revisará tu solicitud y te contactaremos pronto para confirmar los detalles.
    </p>
    <p style="color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6; margin: 0;">
      Si tienes alguna pregunta, puedes responder a este email o contactarnos directamente.
    </p>
  `;
  return getEmailTemplate('📋 Solicitud de Servicio Recibida', content, 'Te notificaremos cuando tu solicitud sea confirmada.');
}

// Admin notification for new service request
function getAdminServiceRequestEmailTemplate(request) {
  const serviceName = SERVICE_NAMES[request.service] || request.service;
  const content = `
    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Se ha recibido una nueva solicitud de servicio:
    </p>
    <div style="background-color: rgba(251, 191, 36, 0.1); border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #fbbf24;">
      <h3 style="margin: 0 0 15px; color: #fbbf24; font-size: 20px;">${serviceName}</h3>
      <table width="100%" cellpadding="5" cellspacing="0">
        <tr>
          <td style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 10px; width: 120px;">Cliente:</td>
          <td style="color: white; font-size: 16px; font-weight: bold; padding-bottom: 10px;">${request.name}</td>
        </tr>
        <tr>
          <td style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 10px;">Email:</td>
          <td style="color: #10b981; font-size: 16px; padding-bottom: 10px;">${request.email}</td>
        </tr>
        <tr>
          <td style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 10px;">Teléfono:</td>
          <td style="color: white; font-size: 16px; padding-bottom: 10px;">${request.phone}</td>
        </tr>
        <tr>
          <td style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 10px;">Fecha:</td>
          <td style="color: white; font-size: 16px; font-weight: bold; padding-bottom: 10px;">📅 ${request.scheduledDate} a las ${request.scheduledTime}</td>
        </tr>
        <tr>
          <td style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 10px;">Ubicación:</td>
          <td style="color: white; font-size: 16px; padding-bottom: 10px;">📍 ${request.location}</td>
        </tr>
        ${request.area ? `
        <tr>
          <td style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 10px;">Área:</td>
          <td style="color: white; font-size: 16px; padding-bottom: 10px;">${request.area} hectáreas</td>
        </tr>
        ` : ''}
        ${request.notes ? `
        <tr>
          <td style="color: rgba(255,255,255,0.6); font-size: 14px; vertical-align: top;">Notas:</td>
          <td style="color: rgba(255,255,255,0.8); font-size: 14px; font-style: italic;">${request.notes}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://cieniowanie.droneagri.pl/admin" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
        Ver en Panel de Admin
      </a>
    </div>
  `;
  return getEmailTemplate('🆕 Nueva Solicitud de Servicio', content, 'Acción requerida: Revisar y confirmar solicitud.');
}

// Client notification for status change
function getClientStatusChangeEmailTemplate(request, newStatus) {
  const serviceName = SERVICE_NAMES[request.service] || request.service;
  const statusName = STATUS_NAMES[newStatus] || newStatus;

  const statusConfig = {
    'confirmed': { color: '#10b981', icon: '✅', message: '¡Tu solicitud ha sido confirmada! Nuestro equipo estará en la ubicación indicada en la fecha programada.' },
    'in_progress': { color: '#3b82f6', icon: '🔄', message: 'Nuestro equipo está trabajando en tu servicio. Te mantendremos informado del progreso.' },
    'completed': { color: '#10b981', icon: '🎉', message: '¡El servicio ha sido completado exitosamente! Gracias por confiar en Drone Service.' },
    'cancelled': { color: '#ef4444', icon: '❌', message: 'Tu solicitud ha sido cancelada. Si tienes preguntas, no dudes en contactarnos.' }
  };

  const config = statusConfig[newStatus] || { color: '#fbbf24', icon: '📋', message: 'El estado de tu solicitud ha sido actualizado.' };

  const content = `
    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Hola <strong style="color: white;">${request.name}</strong>,
    </p>
    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      El estado de tu solicitud de servicio ha sido actualizado:
    </p>
    <div style="background-color: rgba(16, 185, 129, 0.1); border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 10px; font-size: 40px;">${config.icon}</p>
      <p style="margin: 0; color: ${config.color}; font-size: 24px; font-weight: bold;">${statusName}</p>
    </div>
    <div style="background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table width="100%" cellpadding="5" cellspacing="0">
        <tr>
          <td style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 10px;">Servicio:</td>
          <td style="color: white; font-size: 16px; font-weight: bold; padding-bottom: 10px;">${serviceName}</td>
        </tr>
        <tr>
          <td style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 10px;">Fecha:</td>
          <td style="color: white; font-size: 16px; padding-bottom: 10px;">${request.scheduled_date} a las ${request.scheduled_time}</td>
        </tr>
        <tr>
          <td style="color: rgba(255,255,255,0.6); font-size: 14px;">Ubicación:</td>
          <td style="color: white; font-size: 16px;">${request.location}</td>
        </tr>
      </table>
    </div>
    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      ${config.message}
    </p>
    <p style="color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6; margin: 0;">
      Si tienes alguna pregunta, puedes responder a este email o contactarnos directamente.
    </p>
  `;
  return getEmailTemplate(`${config.icon} Actualización de tu Solicitud`, content);
}

// Send notification email (non-blocking)
async function sendNotificationEmail(to, subject, htmlContent) {
  if (!emailTransporter) {
    console.log('Email not configured, skipping notification to:', to);
    return;
  }

  try {
    await emailTransporter.sendMail({
      from: `"Drone Service" <${getFromEmail()}>`,
      to: to,
      subject: subject,
      html: htmlContent
    });
    console.log('Notification email sent to:', to);
  } catch (error) {
    console.error('Failed to send notification email:', error.message);
  }
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

    // Send welcome email to user (non-blocking)
    sendNotificationEmail(
      email.toLowerCase(),
      '🚁 ¡Bienvenido/a a Drone Service!',
      getWelcomeEmailTemplate(name)
    );

    // Send notification to admin about new registration (non-blocking)
    sendNotificationEmail(
      ADMIN_EMAILS[0],
      '🆕 Nuevo Usuario Registrado - Drone Service',
      getAdminNewUserEmailTemplate(email.toLowerCase(), name)
    );

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

  // Initialize vonage config if it doesn't exist
  if (!config.vonage) {
    config.vonage = {};
  }

  // Only update apiKey if provided and not a masked value
  if (apiKey && !apiKey.includes('****')) {
    config.vonage.apiKey = apiKey;
  }

  // Only update apiSecret if provided (not empty)
  if (apiSecret && apiSecret.trim() !== '') {
    config.vonage.apiSecret = apiSecret;
  }

  // Always update fromNumber if provided
  if (fromNumber) {
    config.vonage.fromNumber = fromNumber;
  }

  // Check if we have valid credentials
  if (!config.vonage.apiKey || !config.vonage.apiSecret) {
    return res.status(400).json({ error: 'API Key and API Secret are required' });
  }

  saveConfig(config);
  vonage = createVonageClient();

  console.log('Vonage configuration updated');
  res.json({ success: true, message: 'Vonage configuration saved' });
});

// Update SMTP config
app.post('/api/config/smtp', (req, res) => {
  const { host, port, user, pass, fromEmail } = req.body;

  // Initialize smtp config if it doesn't exist
  if (!config.smtp) {
    config.smtp = {};
  }

  // Update host and port if provided
  if (host) {
    config.smtp.host = host;
  }
  if (port) {
    config.smtp.port = port;
  }

  // Only update user if provided
  if (user && user.trim() !== '') {
    config.smtp.user = user;
  }

  // Only update password if provided (not empty)
  if (pass && pass.trim() !== '') {
    config.smtp.pass = pass;
  }

  // Update fromEmail if provided
  if (fromEmail) {
    config.smtp.fromEmail = fromEmail;
  }

  // Check if we have valid credentials
  if (!config.smtp.user || !config.smtp.pass) {
    return res.status(400).json({ error: 'SMTP user and password are required' });
  }

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

    // Prepare request data for emails
    const requestData = {
      service,
      scheduledDate,
      scheduledTime,
      name,
      email,
      phone,
      location,
      area,
      notes
    };

    // Send confirmation email to client (non-blocking)
    sendNotificationEmail(
      email,
      '📋 Solicitud de Servicio Recibida - Drone Service',
      getClientServiceRequestEmailTemplate(requestData)
    );

    // Send notification to admin (non-blocking)
    sendNotificationEmail(
      ADMIN_EMAILS[0],
      `🆕 Nueva Solicitud: ${SERVICE_NAMES[service] || service} - ${name}`,
      getAdminServiceRequestEmailTemplate(requestData)
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

    // Get the service request details before updating
    const [requests] = await pool.execute(
      'SELECT * FROM service_requests WHERE id = ?',
      [req.params.id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const request = requests[0];

    // Update the status
    await pool.execute(
      'UPDATE service_requests SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    // Send status change notification to client (non-blocking)
    // Don't send for 'pending' status as it's the initial state
    if (status !== 'pending' && request.email) {
      const statusEmoji = {
        'confirmed': '✅',
        'in_progress': '🔄',
        'completed': '🎉',
        'cancelled': '❌'
      };

      sendNotificationEmail(
        request.email,
        `${statusEmoji[status] || '📋'} Actualización de tu Solicitud - Drone Service`,
        getClientStatusChangeEmailTemplate(request, status)
      );
    }

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

// ==================== EMAIL SEND ====================

// Send Email (for testing)
app.post('/api/email/send', async (req, res) => {
  if (!emailTransporter) {
    return res.status(400).json({ error: 'SMTP not configured', success: false });
  }

  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Email address, subject and message are required', success: false });
  }

  try {
    const info = await emailTransporter.sendMail({
      from: `"Drone Service" <${getFromEmail()}>`,
      to: to,
      subject: subject,
      text: message,
      html: message.replace(/\n/g, '<br>')
    });

    console.log('Email sent:', info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to send email' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
