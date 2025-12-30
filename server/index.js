import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Vonage } from '@vonage/server-sdk'
import nodemailer from 'nodemailer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Config file path
const CONFIG_FILE = path.join(__dirname, 'config.json')

// Load or create config
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
    }
  } catch (error) {
    console.error('Error loading config:', error)
  }
  return {
    vonage: {
      apiKey: process.env.VONAGE_API_KEY || '',
      apiSecret: process.env.VONAGE_API_SECRET || '',
      fromNumber: process.env.VONAGE_FROM_NUMBER || 'DroneGarden'
    },
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || '587',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      fromEmail: process.env.FROM_EMAIL || 'noreply@dronegarden.com'
    }
  }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

// Current configuration
let config = loadConfig()

// Create Vonage client
function createVonageClient() {
  if (config.vonage.apiKey && config.vonage.apiSecret) {
    return new Vonage({
      apiKey: config.vonage.apiKey,
      apiSecret: config.vonage.apiSecret
    })
  }
  return null
}

// Create email transporter
function createEmailTransporter() {
  if (config.smtp.user && config.smtp.pass) {
    return nodemailer.createTransport({
      host: config.smtp.host,
      port: parseInt(config.smtp.port),
      secure: false,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      }
    })
  }
  return null
}

let vonage = createVonageClient()
let emailTransporter = createEmailTransporter()

// Helper to get current from values
function getFromNumber() {
  return config.vonage.fromNumber || 'DroneGarden'
}

function getFromEmail() {
  return config.smtp.fromEmail || 'noreply@dronegarden.com'
}

// ============ CONFIG ENDPOINTS ============

// Get current config (without secrets)
app.get('/api/config', (req, res) => {
  res.json({
    vonage: {
      apiKey: config.vonage.apiKey ? config.vonage.apiKey.substring(0, 4) + '****' : '',
      fromNumber: config.vonage.fromNumber
    },
    smtp: {
      host: config.smtp.host,
      port: config.smtp.port,
      user: config.smtp.user,
      fromEmail: config.smtp.fromEmail
    },
    status: {
      vonage: !!(config.vonage.apiKey && config.vonage.apiSecret),
      smtp: !!(config.smtp.user && config.smtp.pass)
    }
  })
})

// Update Vonage config
app.post('/api/config/vonage', (req, res) => {
  const { apiKey, apiSecret, fromNumber } = req.body

  if (!apiKey || !apiSecret) {
    return res.status(400).json({ error: 'API Key and API Secret are required' })
  }

  config.vonage = {
    apiKey,
    apiSecret,
    fromNumber: fromNumber || 'DroneGarden'
  }

  saveConfig(config)
  vonage = createVonageClient()

  console.log('Vonage configuration updated')
  res.json({ success: true, message: 'Vonage configuration saved' })
})

// Update SMTP config
app.post('/api/config/smtp', (req, res) => {
  const { host, port, user, pass, fromEmail } = req.body

  if (!user || !pass) {
    return res.status(400).json({ error: 'SMTP user and password are required' })
  }

  config.smtp = {
    host: host || 'smtp.gmail.com',
    port: port || '587',
    user,
    pass,
    fromEmail: fromEmail || user
  }

  saveConfig(config)
  emailTransporter = createEmailTransporter()

  console.log('SMTP configuration updated')
  res.json({ success: true, message: 'SMTP configuration saved' })
})

// Test Vonage connection
app.post('/api/config/test-vonage', async (req, res) => {
  if (!vonage) {
    return res.status(400).json({ error: 'Vonage not configured' })
  }

  try {
    // Just verify the credentials are valid by checking account balance
    const response = await fetch(`https://rest.nexmo.com/account/get-balance?api_key=${config.vonage.apiKey}&api_secret=${config.vonage.apiSecret}`)
    const data = await response.json()

    if (data.value !== undefined) {
      res.json({ success: true, balance: data.value })
    } else {
      res.status(400).json({ error: 'Invalid credentials' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Test SMTP connection
app.post('/api/config/test-smtp', async (req, res) => {
  if (!emailTransporter) {
    return res.status(400).json({ error: 'SMTP not configured' })
  }

  try {
    await emailTransporter.verify()
    res.json({ success: true, message: 'SMTP connection successful' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============ SMS ENDPOINTS ============

// SMS endpoint
app.post('/api/sms/send', async (req, res) => {
  const { to, message, clientName, service, date, time } = req.body

  if (!to || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, message' })
  }

  // Clean phone number (remove spaces, ensure format)
  const cleanPhone = to.replace(/\s+/g, '').replace(/^\+/, '')

  if (!vonage) {
    return res.status(400).json({ error: 'Vonage SMS not configured' })
  }

  try {
    const response = await vonage.sms.send({
      to: cleanPhone,
      from: getFromNumber(),
      text: message
    })

    const messageResponse = response.messages[0]

    if (messageResponse.status === '0') {
      console.log(`SMS sent successfully to ${to}`)
      res.json({
        success: true,
        messageId: messageResponse['message-id'],
        to: to
      })
    } else {
      console.error(`SMS failed: ${messageResponse['error-text']}`)
      res.status(400).json({
        error: messageResponse['error-text'],
        status: messageResponse.status
      })
    }
  } catch (error) {
    console.error('Vonage SMS error:', error)
    res.status(500).json({ error: 'Failed to send SMS', details: error.message })
  }
})

// Send confirmation SMS
app.post('/api/sms/confirm-service', async (req, res) => {
  const { phone, clientName, service, date, time, location, language = 'es' } = req.body

  if (!phone || !clientName || !service || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Message templates by language
  const messages = {
    es: `¡Hola ${clientName}! Tu servicio de ${service} ha sido confirmado para el ${date} a las ${time}. Ubicación: ${location}. - DroneGarden`,
    en: `Hi ${clientName}! Your ${service} service has been confirmed for ${date} at ${time}. Location: ${location}. - DroneGarden`,
    pl: `Cześć ${clientName}! Twoja usługa ${service} została potwierdzona na ${date} o ${time}. Lokalizacja: ${location}. - DroneGarden`
  }

  const message = messages[language] || messages.es
  const cleanPhone = phone.replace(/\s+/g, '').replace(/^\+/, '')

  if (!vonage) {
    return res.status(400).json({ error: 'Vonage SMS not configured' })
  }

  try {
    const response = await vonage.sms.send({
      to: cleanPhone,
      from: getFromNumber(),
      text: message
    })

    const messageResponse = response.messages[0]

    if (messageResponse.status === '0') {
      console.log(`Confirmation SMS sent to ${phone} for ${clientName}`)
      res.json({
        success: true,
        messageId: messageResponse['message-id']
      })
    } else {
      console.error(`SMS failed: ${messageResponse['error-text']}`)
      res.status(400).json({ error: messageResponse['error-text'] })
    }
  } catch (error) {
    console.error('Vonage SMS error:', error)
    res.status(500).json({ error: 'Failed to send SMS', details: error.message })
  }
})

// Send completion SMS
app.post('/api/sms/complete-service', async (req, res) => {
  const { phone, clientName, service, language = 'es' } = req.body

  if (!phone || !clientName || !service) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const messages = {
    es: `¡Hola ${clientName}! Tu servicio de ${service} ha sido completado con éxito. ¡Gracias por confiar en DroneGarden! Si tienes alguna pregunta, no dudes en contactarnos.`,
    en: `Hi ${clientName}! Your ${service} service has been successfully completed. Thank you for trusting DroneGarden! If you have any questions, don't hesitate to contact us.`,
    pl: `Cześć ${clientName}! Twoja usługa ${service} została pomyślnie zakończona. Dziękujemy za zaufanie DroneGarden! Jeśli masz pytania, skontaktuj się z nami.`
  }

  const message = messages[language] || messages.es
  const cleanPhone = phone.replace(/\s+/g, '').replace(/^\+/, '')

  if (!vonage) {
    return res.status(400).json({ error: 'Vonage SMS not configured' })
  }

  try {
    const response = await vonage.sms.send({
      to: cleanPhone,
      from: getFromNumber(),
      text: message
    })

    const messageResponse = response.messages[0]

    if (messageResponse.status === '0') {
      console.log(`Completion SMS sent to ${phone} for ${clientName}`)
      res.json({
        success: true,
        messageId: messageResponse['message-id']
      })
    } else {
      res.status(400).json({ error: messageResponse['error-text'] })
    }
  } catch (error) {
    console.error('Vonage SMS error:', error)
    res.status(500).json({ error: 'Failed to send SMS', details: error.message })
  }
})

// Email confirmation endpoint
app.post('/api/email/confirm-service', async (req, res) => {
  const { email, clientName, service, date, time, location, area, language = 'es' } = req.body

  if (!email || !clientName || !service || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Email templates by language
  const subjects = {
    es: `✅ Confirmación de Servicio - DroneGarden`,
    en: `✅ Service Confirmation - DroneGarden`,
    pl: `✅ Potwierdzenie Usługi - DroneGarden`
  }

  const htmlTemplates = {
    es: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 40px; border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="background: linear-gradient(90deg, #10b981, #14b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">🚁 DroneGarden</h1>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; margin-bottom: 20px;">
          <h2 style="color: #10b981; margin-top: 0;">¡Hola ${clientName}!</h2>
          <p style="font-size: 16px; line-height: 1.6;">Tu servicio ha sido <strong style="color: #10b981;">confirmado</strong>. Aquí están los detalles:</p>
          <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <tr><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">Servicio:</td><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right; font-weight: bold;">${service}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">Fecha:</td><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right; font-weight: bold;">${date}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">Hora:</td><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right; font-weight: bold;">${time}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">Ubicación:</td><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right; font-weight: bold;">${location}</td></tr>
            ${area ? `<tr><td style="padding: 10px 0; color: #94a3b8;">Área:</td><td style="padding: 10px 0; text-align: right; font-weight: bold;">${area} hectáreas</td></tr>` : ''}
          </table>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 14px;">Si tienes alguna pregunta, no dudes en contactarnos.</p>
        <p style="text-align: center; color: #10b981; font-weight: bold;">¡Gracias por confiar en DroneGarden!</p>
      </div>
    `,
    en: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 40px; border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="background: linear-gradient(90deg, #10b981, #14b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">🚁 DroneGarden</h1>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; margin-bottom: 20px;">
          <h2 style="color: #10b981; margin-top: 0;">Hello ${clientName}!</h2>
          <p style="font-size: 16px; line-height: 1.6;">Your service has been <strong style="color: #10b981;">confirmed</strong>. Here are the details:</p>
          <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <tr><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">Service:</td><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right; font-weight: bold;">${service}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">Date:</td><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right; font-weight: bold;">${date}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">Time:</td><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right; font-weight: bold;">${time}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">Location:</td><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right; font-weight: bold;">${location}</td></tr>
            ${area ? `<tr><td style="padding: 10px 0; color: #94a3b8;">Area:</td><td style="padding: 10px 0; text-align: right; font-weight: bold;">${area} hectares</td></tr>` : ''}
          </table>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 14px;">If you have any questions, feel free to contact us.</p>
        <p style="text-align: center; color: #10b981; font-weight: bold;">Thank you for trusting DroneGarden!</p>
      </div>
    `,
    pl: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 40px; border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="background: linear-gradient(90deg, #10b981, #14b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">🚁 DroneGarden</h1>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; margin-bottom: 20px;">
          <h2 style="color: #10b981; margin-top: 0;">Cześć ${clientName}!</h2>
          <p style="font-size: 16px; line-height: 1.6;">Twoja usługa została <strong style="color: #10b981;">potwierdzona</strong>. Oto szczegóły:</p>
          <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <tr><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">Usługa:</td><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right; font-weight: bold;">${service}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">Data:</td><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right; font-weight: bold;">${date}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">Godzina:</td><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right; font-weight: bold;">${time}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">Lokalizacja:</td><td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right; font-weight: bold;">${location}</td></tr>
            ${area ? `<tr><td style="padding: 10px 0; color: #94a3b8;">Powierzchnia:</td><td style="padding: 10px 0; text-align: right; font-weight: bold;">${area} hektarów</td></tr>` : ''}
          </table>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 14px;">Jeśli masz pytania, skontaktuj się z nami.</p>
        <p style="text-align: center; color: #10b981; font-weight: bold;">Dziękujemy za zaufanie DroneGarden!</p>
      </div>
    `
  }

  if (!emailTransporter) {
    return res.status(400).json({ error: 'Email SMTP not configured' })
  }

  try {
    const info = await emailTransporter.sendMail({
      from: `"DroneGarden" <${getFromEmail()}>`,
      to: email,
      subject: subjects[language] || subjects.es,
      html: htmlTemplates[language] || htmlTemplates.es
    })

    console.log(`Confirmation email sent to ${email}`)
    res.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error('Email error:', error)
    res.status(500).json({ error: 'Failed to send email', details: error.message })
  }
})

// Email completion endpoint
app.post('/api/email/complete-service', async (req, res) => {
  const { email, clientName, service, language = 'es' } = req.body

  if (!email || !clientName || !service) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const subjects = {
    es: `✅ Servicio Completado - DroneGarden`,
    en: `✅ Service Completed - DroneGarden`,
    pl: `✅ Usługa Zakończona - DroneGarden`
  }

  const htmlTemplates = {
    es: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 40px; border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="background: linear-gradient(90deg, #10b981, #14b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">🚁 DroneGarden</h1>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; margin-bottom: 20px; text-align: center;">
          <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
          <h2 style="color: #10b981; margin-top: 0;">¡Servicio Completado!</h2>
          <p style="font-size: 16px; line-height: 1.6;">Hola <strong>${clientName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">Nos complace informarte que tu servicio de <strong style="color: #10b981;">${service}</strong> ha sido completado con éxito.</p>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 14px;">Si tienes alguna pregunta sobre el servicio realizado, no dudes en contactarnos.</p>
        <p style="text-align: center; color: #10b981; font-weight: bold; font-size: 18px;">¡Gracias por confiar en DroneGarden!</p>
      </div>
    `,
    en: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 40px; border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="background: linear-gradient(90deg, #10b981, #14b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">🚁 DroneGarden</h1>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; margin-bottom: 20px; text-align: center;">
          <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
          <h2 style="color: #10b981; margin-top: 0;">Service Completed!</h2>
          <p style="font-size: 16px; line-height: 1.6;">Hello <strong>${clientName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">We are pleased to inform you that your <strong style="color: #10b981;">${service}</strong> service has been successfully completed.</p>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 14px;">If you have any questions about the service, feel free to contact us.</p>
        <p style="text-align: center; color: #10b981; font-weight: bold; font-size: 18px;">Thank you for trusting DroneGarden!</p>
      </div>
    `,
    pl: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 40px; border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="background: linear-gradient(90deg, #10b981, #14b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">🚁 DroneGarden</h1>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; margin-bottom: 20px; text-align: center;">
          <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
          <h2 style="color: #10b981; margin-top: 0;">Usługa Zakończona!</h2>
          <p style="font-size: 16px; line-height: 1.6;">Cześć <strong>${clientName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">Z przyjemnością informujemy, że Twoja usługa <strong style="color: #10b981;">${service}</strong> została pomyślnie zakończona.</p>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 14px;">Jeśli masz pytania dotyczące wykonanej usługi, skontaktuj się z nami.</p>
        <p style="text-align: center; color: #10b981; font-weight: bold; font-size: 18px;">Dziękujemy za zaufanie DroneGarden!</p>
      </div>
    `
  }

  if (!emailTransporter) {
    return res.status(400).json({ error: 'Email SMTP not configured' })
  }

  try {
    const info = await emailTransporter.sendMail({
      from: `"DroneGarden" <${getFromEmail()}>`,
      to: email,
      subject: subjects[language] || subjects.es,
      html: htmlTemplates[language] || htmlTemplates.es
    })

    console.log(`Completion email sent to ${email}`)
    res.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error('Email error:', error)
    res.status(500).json({ error: 'Failed to send email', details: error.message })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'DroneGarden SMS & Email API' })
})

app.listen(PORT, () => {
  console.log(`🚀 SMS & Email Server running on http://localhost:${PORT}`)
  console.log(`📱 Vonage API configured: ${vonage ? 'Yes' : 'No - Configure via API or .env'}`)
  console.log(`📧 Email SMTP configured: ${emailTransporter ? 'Yes' : 'No - Configure via API or .env'}`)
})
