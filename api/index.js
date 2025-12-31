require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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

// Multi-language service names
const SERVICE_NAMES = {
  es: {
    'fumigation': 'Fumigación con Drones',
    'mapping': 'Mapeo y Análisis Aéreo',
    'painting': 'Pintura Industrial con Drones',
    'rental': 'Alquiler de Drones'
  },
  en: {
    'fumigation': 'Drone Fumigation',
    'mapping': 'Aerial Mapping & Analysis',
    'painting': 'Industrial Drone Painting',
    'rental': 'Drone Rental'
  },
  pl: {
    'fumigation': 'Fumigacja Dronami',
    'mapping': 'Mapowanie i Analiza Lotnicza',
    'painting': 'Malowanie Przemysłowe Dronami',
    'rental': 'Wynajem Dronów'
  },
  cs: {
    'fumigation': 'Fumigace Drony',
    'mapping': 'Letecké Mapování a Analýza',
    'painting': 'Průmyslové Malování Drony',
    'rental': 'Pronájem Dronů'
  },
  sk: {
    'fumigation': 'Fumigácia Dronmi',
    'mapping': 'Letecké Mapovanie a Analýza',
    'painting': 'Priemyselné Maľovanie Dronmi',
    'rental': 'Prenájom Dronov'
  }
};

// Multi-language status names
const STATUS_NAMES = {
  es: {
    'pending': 'Pendiente',
    'confirmed': 'Confirmado',
    'in_progress': 'En Progreso',
    'completed': 'Completado',
    'cancelled': 'Cancelado'
  },
  en: {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  },
  pl: {
    'pending': 'Oczekujące',
    'confirmed': 'Potwierdzone',
    'in_progress': 'W Trakcie',
    'completed': 'Zakończone',
    'cancelled': 'Anulowane'
  },
  cs: {
    'pending': 'Čeká',
    'confirmed': 'Potvrzeno',
    'in_progress': 'Probíhá',
    'completed': 'Dokončeno',
    'cancelled': 'Zrušeno'
  },
  sk: {
    'pending': 'Čaká',
    'confirmed': 'Potvrdené',
    'in_progress': 'Prebieha',
    'completed': 'Dokončené',
    'cancelled': 'Zrušené'
  }
};

// Multi-language email texts
const EMAIL_TEXTS = {
  es: {
    welcome: {
      subject: '¡Bienvenido/a a Drone Service!',
      title: '¡Bienvenido/a a Drone Service!',
      greeting: 'Hola',
      welcomeMsg: '¡Tu cuenta ha sido creada exitosamente!',
      servicesIntro: 'Ahora puedes acceder a todos nuestros servicios profesionales de drones:',
      fumigationDesc: 'Aplicación precisa de productos fitosanitarios',
      mappingDesc: 'Cartografía aérea de alta resolución',
      paintingDesc: 'Recubrimientos en estructuras de difícil acceso',
      rentalDesc: 'Equipos profesionales para tus proyectos',
      howTo: 'Para solicitar un servicio, simplemente inicia sesión en nuestra plataforma y haz clic en "Solicitar Servicio".',
      button: 'Ir a la Plataforma',
      questions: 'Si tienes alguna pregunta, no dudes en contactarnos.',
      footer: 'Gracias por unirte a nuestra plataforma.'
    },
    serviceRequest: {
      subject: 'Solicitud de Servicio Recibida',
      title: 'Solicitud de Servicio Recibida',
      greeting: 'Hola',
      received: 'Hemos recibido tu solicitud de servicio. A continuación los detalles:',
      service: 'Servicio',
      scheduledDate: 'Fecha programada',
      time: 'Hora',
      location: 'Ubicación',
      area: 'Área',
      hectares: 'hectáreas',
      status: 'Estado',
      pending: 'Pendiente de confirmación',
      willContact: 'Nuestro equipo revisará tu solicitud y te contactaremos pronto para confirmar los detalles.',
      questions: 'Si tienes alguna pregunta, puedes responder a este email o contactarnos directamente.',
      footer: 'Te notificaremos cuando tu solicitud sea confirmada.'
    },
    statusChange: {
      subject: 'Actualización de tu Solicitud',
      title: 'Actualización de tu Solicitud',
      greeting: 'Hola',
      updated: 'El estado de tu solicitud de servicio ha sido actualizado:',
      service: 'Servicio',
      date: 'Fecha',
      location: 'Ubicación',
      questions: 'Si tienes alguna pregunta, puedes responder a este email o contactarnos directamente.',
      messages: {
        confirmed: '¡Tu solicitud ha sido confirmada! Nuestro equipo estará en la ubicación indicada en la fecha programada.',
        in_progress: 'Nuestro equipo está trabajando en tu servicio. Te mantendremos informado del progreso.',
        completed: '¡El servicio ha sido completado exitosamente! Gracias por confiar en Drone Service.',
        cancelled: 'Tu solicitud ha sido cancelada. Si tienes preguntas, no dudes en contactarnos.'
      }
    },
    footer: {
      autoEmail: 'Este email fue enviado automáticamente por Drone Service.',
      rights: 'Todos los derechos reservados'
    }
  },
  en: {
    welcome: {
      subject: 'Welcome to Drone Service!',
      title: 'Welcome to Drone Service!',
      greeting: 'Hello',
      welcomeMsg: 'Your account has been created successfully!',
      servicesIntro: 'Now you can access all our professional drone services:',
      fumigationDesc: 'Precise application of phytosanitary products',
      mappingDesc: 'High-resolution aerial cartography',
      paintingDesc: 'Coatings on hard-to-reach structures',
      rentalDesc: 'Professional equipment for your projects',
      howTo: 'To request a service, simply log in to our platform and click on "Request Service".',
      button: 'Go to Platform',
      questions: 'If you have any questions, feel free to contact us.',
      footer: 'Thank you for joining our platform.'
    },
    serviceRequest: {
      subject: 'Service Request Received',
      title: 'Service Request Received',
      greeting: 'Hello',
      received: 'We have received your service request. Here are the details:',
      service: 'Service',
      scheduledDate: 'Scheduled date',
      time: 'Time',
      location: 'Location',
      area: 'Area',
      hectares: 'hectares',
      status: 'Status',
      pending: 'Pending confirmation',
      willContact: 'Our team will review your request and contact you soon to confirm the details.',
      questions: 'If you have any questions, you can reply to this email or contact us directly.',
      footer: 'We will notify you when your request is confirmed.'
    },
    statusChange: {
      subject: 'Request Update',
      title: 'Request Update',
      greeting: 'Hello',
      updated: 'The status of your service request has been updated:',
      service: 'Service',
      date: 'Date',
      location: 'Location',
      questions: 'If you have any questions, you can reply to this email or contact us directly.',
      messages: {
        confirmed: 'Your request has been confirmed! Our team will be at the indicated location on the scheduled date.',
        in_progress: 'Our team is working on your service. We will keep you informed of the progress.',
        completed: 'The service has been completed successfully! Thank you for trusting Drone Service.',
        cancelled: 'Your request has been cancelled. If you have questions, feel free to contact us.'
      }
    },
    footer: {
      autoEmail: 'This email was sent automatically by Drone Service.',
      rights: 'All rights reserved'
    }
  },
  pl: {
    welcome: {
      subject: 'Witamy w Drone Service!',
      title: 'Witamy w Drone Service!',
      greeting: 'Witaj',
      welcomeMsg: 'Twoje konto zostało pomyślnie utworzone!',
      servicesIntro: 'Teraz masz dostęp do wszystkich naszych profesjonalnych usług dronowych:',
      fumigationDesc: 'Precyzyjne stosowanie środków fitosanitarnych',
      mappingDesc: 'Kartografia lotnicza wysokiej rozdzielczości',
      paintingDesc: 'Powłoki na trudno dostępnych konstrukcjach',
      rentalDesc: 'Profesjonalny sprzęt do Twoich projektów',
      howTo: 'Aby zamówić usługę, po prostu zaloguj się na naszą platformę i kliknij "Zamów usługę".',
      button: 'Przejdź do Platformy',
      questions: 'Jeśli masz pytania, skontaktuj się z nami.',
      footer: 'Dziękujemy za dołączenie do naszej platformy.'
    },
    serviceRequest: {
      subject: 'Otrzymano Zamówienie Usługi',
      title: 'Otrzymano Zamówienie Usługi',
      greeting: 'Witaj',
      received: 'Otrzymaliśmy Twoje zamówienie usługi. Oto szczegóły:',
      service: 'Usługa',
      scheduledDate: 'Zaplanowana data',
      time: 'Godzina',
      location: 'Lokalizacja',
      area: 'Powierzchnia',
      hectares: 'hektarów',
      status: 'Status',
      pending: 'Oczekuje na potwierdzenie',
      willContact: 'Nasz zespół przejrzy Twoje zamówienie i wkrótce skontaktuje się z Tobą w celu potwierdzenia szczegółów.',
      questions: 'Jeśli masz pytania, możesz odpowiedzieć na ten email lub skontaktować się z nami bezpośrednio.',
      footer: 'Powiadomimy Cię, gdy Twoje zamówienie zostanie potwierdzone.'
    },
    statusChange: {
      subject: 'Aktualizacja Zamówienia',
      title: 'Aktualizacja Zamówienia',
      greeting: 'Witaj',
      updated: 'Status Twojego zamówienia usługi został zaktualizowany:',
      service: 'Usługa',
      date: 'Data',
      location: 'Lokalizacja',
      questions: 'Jeśli masz pytania, możesz odpowiedzieć na ten email lub skontaktować się z nami bezpośrednio.',
      messages: {
        confirmed: 'Twoje zamówienie zostało potwierdzone! Nasz zespół będzie na wskazanej lokalizacji w zaplanowanym terminie.',
        in_progress: 'Nasz zespół pracuje nad Twoją usługą. Będziemy Cię informować o postępach.',
        completed: 'Usługa została pomyślnie zakończona! Dziękujemy za zaufanie Drone Service.',
        cancelled: 'Twoje zamówienie zostało anulowane. Jeśli masz pytania, skontaktuj się z nami.'
      }
    },
    footer: {
      autoEmail: 'Ten email został wysłany automatycznie przez Drone Service.',
      rights: 'Wszelkie prawa zastrzeżone'
    }
  },
  cs: {
    welcome: {
      subject: 'Vítejte v Drone Service!',
      title: 'Vítejte v Drone Service!',
      greeting: 'Ahoj',
      welcomeMsg: 'Váš účet byl úspěšně vytvořen!',
      servicesIntro: 'Nyní máte přístup ke všem našim profesionálním dronovým službám:',
      fumigationDesc: 'Přesná aplikace fytosanitárních přípravků',
      mappingDesc: 'Letecká kartografie ve vysokém rozlišení',
      paintingDesc: 'Nátěry na těžko přístupných konstrukcích',
      rentalDesc: 'Profesionální vybavení pro vaše projekty',
      howTo: 'Pro objednání služby se jednoduše přihlaste na naši platformu a klikněte na "Objednat službu".',
      button: 'Přejít na Platformu',
      questions: 'Pokud máte dotazy, neváhejte nás kontaktovat.',
      footer: 'Děkujeme za připojení k naší platformě.'
    },
    serviceRequest: {
      subject: 'Objednávka Služby Přijata',
      title: 'Objednávka Služby Přijata',
      greeting: 'Ahoj',
      received: 'Přijali jsme vaši objednávku služby. Zde jsou podrobnosti:',
      service: 'Služba',
      scheduledDate: 'Naplánované datum',
      time: 'Čas',
      location: 'Místo',
      area: 'Plocha',
      hectares: 'hektarů',
      status: 'Stav',
      pending: 'Čeká na potvrzení',
      willContact: 'Náš tým zkontroluje vaši objednávku a brzy vás kontaktuje pro potvrzení detailů.',
      questions: 'Pokud máte dotazy, můžete odpovědět na tento email nebo nás kontaktovat přímo.',
      footer: 'Budeme vás informovat, až bude vaše objednávka potvrzena.'
    },
    statusChange: {
      subject: 'Aktualizace Objednávky',
      title: 'Aktualizace Objednávky',
      greeting: 'Ahoj',
      updated: 'Stav vaší objednávky služby byl aktualizován:',
      service: 'Služba',
      date: 'Datum',
      location: 'Místo',
      questions: 'Pokud máte dotazy, můžete odpovědět na tento email nebo nás kontaktovat přímo.',
      messages: {
        confirmed: 'Vaše objednávka byla potvrzena! Náš tým bude na uvedeném místě v naplánovaném termínu.',
        in_progress: 'Náš tým pracuje na vaší službě. Budeme vás informovat o průběhu.',
        completed: 'Služba byla úspěšně dokončena! Děkujeme za důvěru v Drone Service.',
        cancelled: 'Vaše objednávka byla zrušena. Pokud máte dotazy, neváhejte nás kontaktovat.'
      }
    },
    footer: {
      autoEmail: 'Tento email byl automaticky odeslán Drone Service.',
      rights: 'Všechna práva vyhrazena'
    }
  },
  sk: {
    welcome: {
      subject: 'Vitajte v Drone Service!',
      title: 'Vitajte v Drone Service!',
      greeting: 'Ahoj',
      welcomeMsg: 'Váš účet bol úspešne vytvorený!',
      servicesIntro: 'Teraz máte prístup ku všetkým našim profesionálnym dronovým službám:',
      fumigationDesc: 'Presná aplikácia fytosanitárnych prípravkov',
      mappingDesc: 'Letecká kartografia vo vysokom rozlíšení',
      paintingDesc: 'Nátery na ťažko prístupných konštrukciách',
      rentalDesc: 'Profesionálne vybavenie pre vaše projekty',
      howTo: 'Pre objednanie služby sa jednoducho prihláste na našu platformu a kliknite na "Objednať službu".',
      button: 'Prejsť na Platformu',
      questions: 'Ak máte otázky, neváhajte nás kontaktovať.',
      footer: 'Ďakujeme za pripojenie k našej platforme.'
    },
    serviceRequest: {
      subject: 'Objednávka Služby Prijatá',
      title: 'Objednávka Služby Prijatá',
      greeting: 'Ahoj',
      received: 'Prijali sme vašu objednávku služby. Tu sú podrobnosti:',
      service: 'Služba',
      scheduledDate: 'Naplánovaný dátum',
      time: 'Čas',
      location: 'Miesto',
      area: 'Plocha',
      hectares: 'hektárov',
      status: 'Stav',
      pending: 'Čaká na potvrdenie',
      willContact: 'Náš tím skontroluje vašu objednávku a čoskoro vás kontaktuje pre potvrdenie detailov.',
      questions: 'Ak máte otázky, môžete odpovedať na tento email alebo nás kontaktovať priamo.',
      footer: 'Budeme vás informovať, keď bude vaša objednávka potvrdená.'
    },
    statusChange: {
      subject: 'Aktualizácia Objednávky',
      title: 'Aktualizácia Objednávky',
      greeting: 'Ahoj',
      updated: 'Stav vašej objednávky služby bol aktualizovaný:',
      service: 'Služba',
      date: 'Dátum',
      location: 'Miesto',
      questions: 'Ak máte otázky, môžete odpovedať na tento email alebo nás kontaktovať priamo.',
      messages: {
        confirmed: 'Vaša objednávka bola potvrdená! Náš tím bude na uvedenom mieste v naplánovanom termíne.',
        in_progress: 'Náš tím pracuje na vašej službe. Budeme vás informovať o priebehu.',
        completed: 'Služba bola úspešne dokončená! Ďakujeme za dôveru v Drone Service.',
        cancelled: 'Vaša objednávka bola zrušená. Ak máte otázky, neváhajte nás kontaktovať.'
      }
    },
    footer: {
      autoEmail: 'Tento email bol automaticky odoslaný Drone Service.',
      rights: 'Všetky práva vyhradené'
    }
  }
};

// Get language helper
function getLang(lang) {
  return EMAIL_TEXTS[lang] || EMAIL_TEXTS['es'];
}

function getServiceName(service, lang) {
  const names = SERVICE_NAMES[lang] || SERVICE_NAMES['es'];
  return names[service] || service;
}

function getStatusName(status, lang) {
  const names = STATUS_NAMES[lang] || STATUS_NAMES['es'];
  return names[status] || status;
}

// Base email template - Light theme
function getEmailTemplate(title, content, lang = 'es', footerText = '') {
  const texts = getLang(lang);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">🚁 Drone Service</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Professional Drone Services</p>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 30px 30px 10px; background-color: #ffffff;">
              <h2 style="margin: 0; color: #059669; font-size: 22px; font-weight: 600;">${title}</h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 10px 30px 30px; background-color: #ffffff;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                ${footerText || texts.footer.autoEmail}
              </p>
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 11px; text-align: center;">
                © ${new Date().getFullYear()} Drone Service - ${texts.footer.rights}
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
function getWelcomeEmailTemplate(userName, lang = 'es') {
  const texts = getLang(lang).welcome;
  const serviceNames = SERVICE_NAMES[lang] || SERVICE_NAMES['es'];

  const content = `
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      ${texts.greeting} <strong style="color: #111827;">${userName || 'Usuario'}</strong>,
    </p>
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      ${texts.welcomeMsg}
    </p>
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      ${texts.servicesIntro}
    </p>
    <ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 20px; padding-left: 20px;">
      <li>🌾 <strong>${serviceNames['fumigation']}</strong> - ${texts.fumigationDesc}</li>
      <li>📍 <strong>${serviceNames['mapping']}</strong> - ${texts.mappingDesc}</li>
      <li>🎨 <strong>${serviceNames['painting']}</strong> - ${texts.paintingDesc}</li>
      <li>🚁 <strong>${serviceNames['rental']}</strong> - ${texts.rentalDesc}</li>
    </ul>
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      ${texts.howTo}
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://cieniowanie.droneagri.pl" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
        ${texts.button}
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
      ${texts.questions}
    </p>
  `;
  return getEmailTemplate(texts.title, content, lang, texts.footer);
}

// Admin notification for new registration
function getAdminNewUserEmailTemplate(userEmail, userName) {
  const content = `
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Se ha registrado un nuevo usuario en la plataforma:
    </p>
    <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
      <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Nombre:</p>
      <p style="margin: 0 0 15px; color: #111827; font-size: 18px; font-weight: bold;">${userName || 'No especificado'}</p>
      <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Email:</p>
      <p style="margin: 0; color: #059669; font-size: 18px; font-weight: bold;">${userEmail}</p>
    </div>
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
      Fecha de registro: ${new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
    </p>
  `;
  return getEmailTemplate('🆕 Nuevo Usuario Registrado', content, 'es');
}

// Client notification for service request created
function getClientServiceRequestEmailTemplate(request, lang = 'es') {
  const texts = getLang(lang).serviceRequest;
  const serviceName = getServiceName(request.service, lang);

  const content = `
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      ${texts.greeting} <strong style="color: #111827;">${request.name}</strong>,
    </p>
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      ${texts.received}
    </p>
    <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
      <table width="100%" cellpadding="5" cellspacing="0">
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding-bottom: 10px;">${texts.service}:</td>
          <td style="color: #059669; font-size: 16px; font-weight: bold; padding-bottom: 10px;">${serviceName}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding-bottom: 10px;">${texts.scheduledDate}:</td>
          <td style="color: #111827; font-size: 16px; font-weight: bold; padding-bottom: 10px;">${request.scheduledDate}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding-bottom: 10px;">${texts.time}:</td>
          <td style="color: #111827; font-size: 16px; padding-bottom: 10px;">${request.scheduledTime}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding-bottom: 10px;">${texts.location}:</td>
          <td style="color: #111827; font-size: 16px; padding-bottom: 10px;">${request.location}</td>
        </tr>
        ${request.area ? `
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding-bottom: 10px;">${texts.area}:</td>
          <td style="color: #111827; font-size: 16px; padding-bottom: 10px;">${request.area} ${texts.hectares}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="color: #6b7280; font-size: 14px;">${texts.status}:</td>
          <td style="color: #d97706; font-size: 16px; font-weight: bold;">⏳ ${texts.pending}</td>
        </tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      ${texts.willContact}
    </p>
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
      ${texts.questions}
    </p>
  `;
  return getEmailTemplate(texts.title, content, lang, texts.footer);
}

// Admin notification for new service request
function getAdminServiceRequestEmailTemplate(request) {
  const serviceName = getServiceName(request.service, 'es');
  const content = `
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Se ha recibido una nueva solicitud de servicio:
    </p>
    <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin: 0 0 15px; color: #b45309; font-size: 20px;">${serviceName}</h3>
      <table width="100%" cellpadding="5" cellspacing="0">
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding-bottom: 10px; width: 120px;">Cliente:</td>
          <td style="color: #111827; font-size: 16px; font-weight: bold; padding-bottom: 10px;">${request.name}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding-bottom: 10px;">Email:</td>
          <td style="color: #059669; font-size: 16px; padding-bottom: 10px;">${request.email}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding-bottom: 10px;">Teléfono:</td>
          <td style="color: #111827; font-size: 16px; padding-bottom: 10px;">${request.phone}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding-bottom: 10px;">Fecha:</td>
          <td style="color: #111827; font-size: 16px; font-weight: bold; padding-bottom: 10px;">📅 ${request.scheduledDate} a las ${request.scheduledTime}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding-bottom: 10px;">Ubicación:</td>
          <td style="color: #111827; font-size: 16px; padding-bottom: 10px;">📍 ${request.location}</td>
        </tr>
        ${request.area ? `
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding-bottom: 10px;">Área:</td>
          <td style="color: #111827; font-size: 16px; padding-bottom: 10px;">${request.area} hectáreas</td>
        </tr>
        ` : ''}
        ${request.notes ? `
        <tr>
          <td style="color: #6b7280; font-size: 14px; vertical-align: top;">Notas:</td>
          <td style="color: #374151; font-size: 14px; font-style: italic;">${request.notes}</td>
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
  return getEmailTemplate('🆕 Nueva Solicitud de Servicio', content, 'es', 'Acción requerida: Revisar y confirmar solicitud.');
}

// Client notification for status change
function getClientStatusChangeEmailTemplate(request, newStatus, lang = 'es') {
  const texts = getLang(lang).statusChange;
  const serviceName = getServiceName(request.service, lang);
  const statusName = getStatusName(newStatus, lang);

  const statusConfig = {
    'confirmed': { color: '#059669', bgColor: '#ecfdf5', icon: '✅' },
    'in_progress': { color: '#2563eb', bgColor: '#eff6ff', icon: '🔄' },
    'completed': { color: '#059669', bgColor: '#ecfdf5', icon: '🎉' },
    'cancelled': { color: '#dc2626', bgColor: '#fef2f2', icon: '❌' }
  };

  const config = statusConfig[newStatus] || { color: '#d97706', bgColor: '#fef3c7', icon: '📋' };
  const message = texts.messages[newStatus] || texts.updated;

  const content = `
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      ${texts.greeting} <strong style="color: #111827;">${request.name}</strong>,
    </p>
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      ${texts.updated}
    </p>
    <div style="background-color: ${config.bgColor}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 10px; font-size: 40px;">${config.icon}</p>
      <p style="margin: 0; color: ${config.color}; font-size: 24px; font-weight: bold;">${statusName}</p>
    </div>
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table width="100%" cellpadding="5" cellspacing="0">
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding-bottom: 10px;">${texts.service}:</td>
          <td style="color: #111827; font-size: 16px; font-weight: bold; padding-bottom: 10px;">${serviceName}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding-bottom: 10px;">${texts.date}:</td>
          <td style="color: #111827; font-size: 16px; padding-bottom: 10px;">${request.scheduled_date} - ${request.scheduled_time}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px;">${texts.location}:</td>
          <td style="color: #111827; font-size: 16px;">${request.location}</td>
        </tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      ${message}
    </p>
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
      ${texts.questions}
    </p>
  `;
  return getEmailTemplate(`${config.icon} ${texts.title}`, content, lang);
}

// Password reset email template
function getPasswordResetEmailTemplate(resetUrl, lang = 'es') {
  const texts = {
    es: {
      title: 'Recuperar Contraseña',
      greeting: 'Hola',
      message: 'Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña:',
      button: 'Restablecer Contraseña',
      expires: 'Este enlace expirará en 1 hora.',
      ignore: 'Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña no será modificada.',
      footer: 'Este enlace es de un solo uso.'
    },
    en: {
      title: 'Reset Password',
      greeting: 'Hello',
      message: 'We received a request to reset your password. Click the button below to create a new password:',
      button: 'Reset Password',
      expires: 'This link will expire in 1 hour.',
      ignore: 'If you did not request this change, you can ignore this email. Your password will not be changed.',
      footer: 'This is a single-use link.'
    },
    pl: {
      title: 'Zresetuj Hasło',
      greeting: 'Witaj',
      message: 'Otrzymaliśmy prośbę o zresetowanie hasła. Kliknij poniższy przycisk, aby utworzyć nowe hasło:',
      button: 'Zresetuj Hasło',
      expires: 'Ten link wygaśnie za 1 godzinę.',
      ignore: 'Jeśli nie prosiłeś o tę zmianę, możesz zignorować ten email. Twoje hasło nie zostanie zmienione.',
      footer: 'To jest jednorazowy link.'
    },
    cs: {
      title: 'Obnovit Heslo',
      greeting: 'Ahoj',
      message: 'Obdrželi jsme žádost o obnovení vašeho hesla. Klikněte na tlačítko níže pro vytvoření nového hesla:',
      button: 'Obnovit Heslo',
      expires: 'Tento odkaz vyprší za 1 hodinu.',
      ignore: 'Pokud jste o tuto změnu nežádali, můžete tento email ignorovat. Vaše heslo nebude změněno.',
      footer: 'Toto je jednorázový odkaz.'
    },
    sk: {
      title: 'Obnoviť Heslo',
      greeting: 'Ahoj',
      message: 'Dostali sme žiadosť o obnovenie vášho hesla. Kliknite na tlačidlo nižšie pre vytvorenie nového hesla:',
      button: 'Obnoviť Heslo',
      expires: 'Tento odkaz vyprší za 1 hodinu.',
      ignore: 'Ak ste o túto zmenu nežiadali, môžete tento email ignorovať. Vaše heslo nebude zmenené.',
      footer: 'Toto je jednorazový odkaz.'
    }
  };

  const t = texts[lang] || texts['es'];

  const content = `
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      ${t.greeting},
    </p>
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      ${t.message}
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
        ${t.button}
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px;">
      ${t.expires}
    </p>
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
      ${t.ignore}
    </p>
  `;
  return getEmailTemplate(t.title, content, lang, t.footer);
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

// Change own password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Se requieren la contraseña actual y la nueva' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Get user with password
    const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
});

// Forgot password - send reset email
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    // Find user
    const [rows] = await pool.execute('SELECT id, email, language FROM users WHERE email = ?', [email.toLowerCase()]);

    // Always return success to prevent email enumeration
    if (rows.length === 0) {
      return res.json({ success: true, message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' });
    }

    const user = rows[0];
    const lang = user.language || 'es';

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Save token to database
    await pool.execute(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
      [resetToken, resetExpires, user.id]
    );

    // Send reset email
    const resetUrl = `https://cieniowanie.droneagri.pl/reset-password?token=${resetToken}`;

    const subjectByLang = {
      es: '🔐 Restablecer tu Contraseña - Drone Service',
      en: '🔐 Reset Your Password - Drone Service',
      pl: '🔐 Zresetuj Hasło - Drone Service',
      cs: '🔐 Obnovit Heslo - Drone Service',
      sk: '🔐 Obnoviť Heslo - Drone Service'
    };

    sendNotificationEmail(
      user.email,
      subjectByLang[lang] || subjectByLang['es'],
      getPasswordResetEmailTemplate(resetUrl, lang)
    );

    res.json({ success: true, message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Reset password with token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Find user with valid token
    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const userId = rows[0].id;

    // Hash and update password, clear reset token
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({ success: true, message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
});

// ==================== ADMIN USER MANAGEMENT ====================

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const [rows] = await pool.execute(
      'SELECT id, email, role, name, language, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Admin change user password
app.put('/api/admin/users/:id/password', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { newPassword } = req.body;
    const userId = req.params.id;

    if (!newPassword) {
      return res.status(400).json({ error: 'Nueva contraseña requerida' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Check if user exists
    const [rows] = await pool.execute('SELECT id FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Admin change password error:', error);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
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

// Delete service request (admin only)
app.delete('/api/admin/service-requests/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const [result] = await pool.execute(
      'DELETE FROM service_requests WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    res.json({ success: true, message: 'Solicitud eliminada' });
  } catch (error) {
    console.error('Delete service request error:', error);
    res.status(500).json({ error: 'Error al eliminar solicitud' });
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
