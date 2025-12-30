import { createContext, useContext, useState, type ReactNode } from 'react'

export type Language = 'es' | 'pl' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translations
const translations: Record<Language, Record<string, string>> = {
  es: {
    // Navigation
    'nav.services': 'Servicios',
    'nav.about': 'Nosotros',
    'nav.contact': 'Contacto',
    'nav.start': 'Comenzar',

    // Hero
    'hero.badge': 'Agricultura del Futuro',
    'hero.title1': 'Transforma tu',
    'hero.title2': 'Agricultura con Drones',
    'hero.description': 'Servicios de precisión agrícola con tecnología de vanguardia. Maximiza el rendimiento de tus cultivos con soluciones inteligentes.',
    'hero.cta': 'Solicitar Servicio',
    'hero.viewServices': 'Ver Servicios',

    // Stats
    'stats.hectares': 'Hectáreas Tratadas',
    'stats.precision': 'Precisión',
    'stats.response': 'Respuesta',
    'stats.clients': 'Clientes',

    // Services
    'services.title': 'Nuestros Servicios',
    'services.subtitle': 'Soluciones',
    'services.subtitleHighlight': 'Agrícolas',
    'service.fumigation.title': 'Fumigación con Drones',
    'service.fumigation.desc': 'Aplicación precisa de tratamientos fitosanitarios con tecnología de última generación.',
    'service.painting.title': 'Pintura de Invernaderos',
    'service.painting.desc': 'Protección UV y control climático para optimizar el crecimiento de tus cultivos.',
    'service.mapping.title': 'Mapeo Aéreo',
    'service.mapping.desc': 'Análisis detallado de terrenos con imágenes de alta resolución y datos precisos.',
    'service.elevation.title': 'Modelos de Elevación',
    'service.elevation.desc': 'Planificación de riego y drenaje con modelos topográficos 3D de alta precisión.',

    // About
    'about.title': 'Sobre Nosotros',
    'about.subtitle': 'Innovación al servicio del',
    'about.subtitleHighlight': 'campo',
    'about.description': 'Somos pioneros en la aplicación de tecnología de drones para la agricultura. Nuestro equipo de expertos combina conocimiento agrícola con tecnología de vanguardia para ofrecer soluciones que transforman la productividad de tu campo.',
    'about.feature1': 'Tecnología de última generación',
    'about.feature2': 'Equipo de expertos certificados',
    'about.feature3': 'Compromiso con el medio ambiente',
    'about.feature4': 'Resultados garantizados',
    'about.years': 'Años de Experiencia',
    'about.drones': 'Drones en Flota',
    'about.support': 'Soporte Técnico',
    'about.satisfaction': 'Satisfacción',

    // CTA
    'cta.title': '¿Listo para',
    'cta.titleHighlight': 'transformar',
    'cta.titleEnd': 'tu agricultura?',
    'cta.description': 'Únete a cientos de agricultores que ya están aprovechando el poder de los drones. Solicita tu primera consulta gratuita hoy.',
    'cta.button': 'Comenzar Ahora',

    // Contact
    'contact.title': 'Contacto',
    'contact.subtitle': 'Hablemos de tu',
    'contact.subtitleHighlight': 'proyecto',
    'contact.description': 'Estamos aquí para ayudarte. Contáctanos y te responderemos en menos de 24 horas.',
    'contact.phone': 'Teléfono',
    'contact.email': 'Email',
    'contact.address': 'Dirección',
    'contact.form.name': 'Nombre',
    'contact.form.email': 'Email',
    'contact.form.subject': 'Asunto',
    'contact.form.message': 'Mensaje',
    'contact.form.send': 'Enviar Mensaje',

    // Footer
    'footer.rights': 'Todos los derechos reservados.',

    // Auth
    'auth.login': 'Iniciar Sesión',
    'auth.signup': 'Registrarse',
    'auth.back': 'Volver',
    'auth.name': 'Nombre completo',
    'auth.phone': 'Teléfono',
    'auth.email': 'Email',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar contraseña',
    'auth.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.loginButton': 'Iniciar Sesión',
    'auth.signupButton': 'Crear Cuenta',
    'auth.loggingIn': 'Iniciando sesión...',
    'auth.signingUp': 'Registrando...',
    'auth.continueWith': 'o continúa con',
    'auth.terms': 'Al registrarte, aceptas nuestros',
    'auth.termsLink': 'Términos de Servicio',
    'auth.and': 'y',
    'auth.privacyLink': 'Política de Privacidad',
    'auth.passwordMismatch': 'Las contraseñas no coinciden',

    // Dashboard
    'dashboard.title': 'Panel de Cliente',
    'dashboard.welcome': 'Bienvenido',
    'dashboard.logout': 'Cerrar Sesión',
    'dashboard.calendar': 'Calendario',
    'dashboard.jobs': 'Trabajos',
    'dashboard.completed': 'Completados',
    'dashboard.scheduled': 'Programados',
    'dashboard.pending': 'Pendientes',
    'dashboard.all': 'Todos',
    'dashboard.noJobs': 'No hay trabajos registrados',
    'dashboard.requestService': 'Solicitar Servicio',
    'dashboard.status.completed': 'Completado',
    'dashboard.status.scheduled': 'Programado',
    'dashboard.status.pending': 'Pendiente',
    'dashboard.status.inProgress': 'En Progreso',
    'dashboard.jobDetails': 'Detalles del Trabajo',
    'dashboard.date': 'Fecha',
    'dashboard.service': 'Servicio',
    'dashboard.location': 'Ubicación',
    'dashboard.area': 'Área',
    'dashboard.hectares': 'hectáreas',
    'dashboard.today': 'Hoy',
    'dashboard.thisMonth': 'Este Mes',
    'dashboard.upcoming': 'Próximos',
    'dashboard.past': 'Pasados',

    // Service Request Modal
    'serviceRequest.title': 'Solicitar Servicio',
    'serviceRequest.step': 'Paso',
    'serviceRequest.of': 'de',
    'serviceRequest.selectService': '¿Qué servicio necesitas?',
    'serviceRequest.selectDate': 'Selecciona una fecha',
    'serviceRequest.selectTime': 'Selecciona una hora',
    'serviceRequest.form.name': 'Nombre',
    'serviceRequest.form.email': 'Email',
    'serviceRequest.form.phone': 'Teléfono',
    'serviceRequest.form.location': 'Ubicación del terreno',
    'serviceRequest.form.locationPlaceholder': 'Dirección o coordenadas',
    'serviceRequest.form.area': 'Área (hectáreas)',
    'serviceRequest.form.areaPlaceholder': 'Ej: 5',
    'serviceRequest.form.notes': 'Notas adicionales',
    'serviceRequest.form.notesPlaceholder': 'Información adicional sobre el servicio...',
    'serviceRequest.summary': 'Resumen de la solicitud',
    'serviceRequest.summaryService': 'Servicio',
    'serviceRequest.summaryDate': 'Fecha',
    'serviceRequest.summaryTime': 'Hora',
    'serviceRequest.back': 'Atrás',
    'serviceRequest.next': 'Siguiente',
    'serviceRequest.submit': 'Enviar Solicitud',
    'serviceRequest.success.title': '¡Solicitud Enviada!',
    'serviceRequest.success.message': 'Hemos recibido tu solicitud. Te contactaremos en menos de 24 horas para confirmar los detalles.',
    'serviceRequest.success.close': 'Cerrar',

    // Admin Dashboard
    'admin.title': 'Panel de Administración',
    'admin.subtitle': 'Gestiona todas las solicitudes de servicio',
    'admin.requests': 'Solicitudes de Servicio',
    'admin.noRequests': 'No hay solicitudes',
    'admin.confirm': 'Confirmar',
    'admin.complete': 'Completar',
    'admin.viewDetails': 'Ver Detalles',
    'admin.smsSent': 'SMS enviado al cliente',
    'admin.smsError': 'Error al enviar SMS',
    'admin.sendingSms': 'Enviando SMS...',
    'admin.notificationsSent': 'SMS y Email enviados',
    'admin.notificationsError': 'Error al enviar notificaciones',

    // Settings
    'settings.title': 'Configuración',
    'settings.subtitle': 'Configura las APIs de SMS y Email',
    'settings.backToAdmin': 'Volver al Panel',
    'settings.vonageTitle': 'Configuración de Vonage SMS',
    'settings.vonageSubtitle': 'Configura las credenciales de la API de Vonage para enviar SMS.',
    'settings.smtpTitle': 'Configuración de Email SMTP',
    'settings.smtpSubtitle': 'Configura el servidor SMTP para enviar emails de confirmación.',
    'settings.smtpHost': 'Servidor SMTP',
    'settings.smtpPort': 'Puerto',
    'settings.smtpUser': 'Usuario SMTP',
    'settings.smtpPass': 'Contraseña',
    'settings.smtpPassHint': 'Para Gmail, usa una contraseña de aplicación',
    'settings.fromNumber': 'Nombre/Número del remitente',
    'settings.fromEmail': 'Email del remitente',
    'settings.configured': 'Configurado',
    'settings.notConfigured': 'No configurado',
    'settings.save': 'Guardar',
    'settings.test': 'Probar',
    'settings.vonageSaved': 'Configuración de Vonage guardada',
    'settings.smtpSaved': 'Configuración SMTP guardada',
    'settings.saveError': 'Error al guardar',
    'settings.vonageTestSuccess': 'Conexión con Vonage exitosa',
    'settings.vonageTestError': 'Error al conectar con Vonage',
    'settings.smtpTestSuccess': 'Conexión SMTP exitosa',
    'settings.smtpTestError': 'Error al conectar con SMTP',
  },
  pl: {
    // Navigation
    'nav.services': 'Usługi',
    'nav.about': 'O nas',
    'nav.contact': 'Kontakt',
    'nav.start': 'Rozpocznij',

    // Hero
    'hero.badge': 'Rolnictwo Przyszłości',
    'hero.title1': 'Przekształć swoje',
    'hero.title2': 'Rolnictwo z Dronami',
    'hero.description': 'Usługi precyzyjnego rolnictwa z najnowocześniejszą technologią. Zmaksymalizuj wydajność swoich upraw dzięki inteligentnym rozwiązaniom.',
    'hero.cta': 'Zamów Usługę',
    'hero.viewServices': 'Zobacz Usługi',

    // Stats
    'stats.hectares': 'Hektarów Obsłużonych',
    'stats.precision': 'Precyzja',
    'stats.response': 'Czas Odpowiedzi',
    'stats.clients': 'Klientów',

    // Services
    'services.title': 'Nasze Usługi',
    'services.subtitle': 'Rozwiązania',
    'services.subtitleHighlight': 'Rolnicze',
    'service.fumigation.title': 'Opryski Dronem',
    'service.fumigation.desc': 'Precyzyjne stosowanie środków ochrony roślin z wykorzystaniem najnowszej technologii.',
    'service.painting.title': 'Malowanie Szklarni',
    'service.painting.desc': 'Ochrona UV i kontrola klimatu dla optymalizacji wzrostu upraw.',
    'service.mapping.title': 'Mapowanie Lotnicze',
    'service.mapping.desc': 'Szczegółowa analiza terenu z obrazami wysokiej rozdzielczości i precyzyjnymi danymi.',
    'service.elevation.title': 'Modele Wysokościowe',
    'service.elevation.desc': 'Planowanie nawadniania i drenażu z precyzyjnymi modelami topograficznymi 3D.',

    // About
    'about.title': 'O Nas',
    'about.subtitle': 'Innowacja w służbie',
    'about.subtitleHighlight': 'rolnictwa',
    'about.description': 'Jesteśmy pionierami w stosowaniu technologii dronów w rolnictwie. Nasz zespół ekspertów łączy wiedzę rolniczą z najnowocześniejszą technologią, oferując rozwiązania transformujące produktywność Twojego pola.',
    'about.feature1': 'Najnowocześniejsza technologia',
    'about.feature2': 'Certyfikowany zespół ekspertów',
    'about.feature3': 'Zaangażowanie w ochronę środowiska',
    'about.feature4': 'Gwarantowane rezultaty',
    'about.years': 'Lat Doświadczenia',
    'about.drones': 'Dronów we Flocie',
    'about.support': 'Wsparcie Techniczne',
    'about.satisfaction': 'Satysfakcja',

    // CTA
    'cta.title': 'Gotowy na',
    'cta.titleHighlight': 'transformację',
    'cta.titleEnd': 'swojego rolnictwa?',
    'cta.description': 'Dołącz do setek rolników, którzy już korzystają z mocy dronów. Zamów bezpłatną pierwszą konsultację już dziś.',
    'cta.button': 'Rozpocznij Teraz',

    // Contact
    'contact.title': 'Kontakt',
    'contact.subtitle': 'Porozmawiajmy o Twoim',
    'contact.subtitleHighlight': 'projekcie',
    'contact.description': 'Jesteśmy tutaj, aby Ci pomóc. Skontaktuj się z nami, a odpowiemy w ciągu 24 godzin.',
    'contact.phone': 'Telefon',
    'contact.email': 'Email',
    'contact.address': 'Adres',
    'contact.form.name': 'Imię',
    'contact.form.email': 'Email',
    'contact.form.subject': 'Temat',
    'contact.form.message': 'Wiadomość',
    'contact.form.send': 'Wyślij Wiadomość',

    // Footer
    'footer.rights': 'Wszelkie prawa zastrzeżone.',

    // Auth
    'auth.login': 'Zaloguj się',
    'auth.signup': 'Zarejestruj się',
    'auth.back': 'Wróć',
    'auth.name': 'Pełne imię i nazwisko',
    'auth.phone': 'Telefon',
    'auth.email': 'Email',
    'auth.password': 'Hasło',
    'auth.confirmPassword': 'Potwierdź hasło',
    'auth.forgotPassword': 'Zapomniałeś hasła?',
    'auth.loginButton': 'Zaloguj się',
    'auth.signupButton': 'Utwórz Konto',
    'auth.loggingIn': 'Logowanie...',
    'auth.signingUp': 'Rejestracja...',
    'auth.continueWith': 'lub kontynuuj z',
    'auth.terms': 'Rejestrując się, akceptujesz nasze',
    'auth.termsLink': 'Warunki Usługi',
    'auth.and': 'i',
    'auth.privacyLink': 'Politykę Prywatności',
    'auth.passwordMismatch': 'Hasła nie pasują do siebie',

    // Dashboard
    'dashboard.title': 'Panel Klienta',
    'dashboard.welcome': 'Witaj',
    'dashboard.logout': 'Wyloguj się',
    'dashboard.calendar': 'Kalendarz',
    'dashboard.jobs': 'Prace',
    'dashboard.completed': 'Zakończone',
    'dashboard.scheduled': 'Zaplanowane',
    'dashboard.pending': 'Oczekujące',
    'dashboard.all': 'Wszystkie',
    'dashboard.noJobs': 'Brak zarejestrowanych prac',
    'dashboard.requestService': 'Zamów Usługę',
    'dashboard.status.completed': 'Zakończone',
    'dashboard.status.scheduled': 'Zaplanowane',
    'dashboard.status.pending': 'Oczekujące',
    'dashboard.status.inProgress': 'W Trakcie',
    'dashboard.jobDetails': 'Szczegóły Pracy',
    'dashboard.date': 'Data',
    'dashboard.service': 'Usługa',
    'dashboard.location': 'Lokalizacja',
    'dashboard.area': 'Powierzchnia',
    'dashboard.hectares': 'hektarów',
    'dashboard.today': 'Dziś',
    'dashboard.thisMonth': 'Ten Miesiąc',
    'dashboard.upcoming': 'Nadchodzące',
    'dashboard.past': 'Przeszłe',

    // Service Request Modal
    'serviceRequest.title': 'Zamów Usługę',
    'serviceRequest.step': 'Krok',
    'serviceRequest.of': 'z',
    'serviceRequest.selectService': 'Jakiej usługi potrzebujesz?',
    'serviceRequest.selectDate': 'Wybierz datę',
    'serviceRequest.selectTime': 'Wybierz godzinę',
    'serviceRequest.form.name': 'Imię',
    'serviceRequest.form.email': 'Email',
    'serviceRequest.form.phone': 'Telefon',
    'serviceRequest.form.location': 'Lokalizacja terenu',
    'serviceRequest.form.locationPlaceholder': 'Adres lub współrzędne',
    'serviceRequest.form.area': 'Powierzchnia (hektary)',
    'serviceRequest.form.areaPlaceholder': 'Np: 5',
    'serviceRequest.form.notes': 'Dodatkowe uwagi',
    'serviceRequest.form.notesPlaceholder': 'Dodatkowe informacje o usłudze...',
    'serviceRequest.summary': 'Podsumowanie zamówienia',
    'serviceRequest.summaryService': 'Usługa',
    'serviceRequest.summaryDate': 'Data',
    'serviceRequest.summaryTime': 'Godzina',
    'serviceRequest.back': 'Wstecz',
    'serviceRequest.next': 'Dalej',
    'serviceRequest.submit': 'Wyślij Zamówienie',
    'serviceRequest.success.title': 'Zamówienie Wysłane!',
    'serviceRequest.success.message': 'Otrzymaliśmy Twoje zamówienie. Skontaktujemy się z Tobą w ciągu 24 godzin, aby potwierdzić szczegóły.',
    'serviceRequest.success.close': 'Zamknij',

    // Admin Dashboard
    'admin.title': 'Panel Administracyjny',
    'admin.subtitle': 'Zarządzaj wszystkimi zamówieniami usług',
    'admin.requests': 'Zamówienia Usług',
    'admin.noRequests': 'Brak zamówień',
    'admin.confirm': 'Potwierdź',
    'admin.complete': 'Zakończ',
    'admin.viewDetails': 'Zobacz Szczegóły',
    'admin.smsSent': 'SMS wysłany do klienta',
    'admin.smsError': 'Błąd wysyłania SMS',
    'admin.sendingSms': 'Wysyłanie SMS...',
    'admin.notificationsSent': 'SMS i Email wysłane',
    'admin.notificationsError': 'Błąd wysyłania powiadomień',

    // Settings
    'settings.title': 'Ustawienia',
    'settings.subtitle': 'Skonfiguruj API SMS i Email',
    'settings.backToAdmin': 'Powrót do Panelu',
    'settings.vonageTitle': 'Konfiguracja Vonage SMS',
    'settings.vonageSubtitle': 'Skonfiguruj dane uwierzytelniające API Vonage do wysyłania SMS.',
    'settings.smtpTitle': 'Konfiguracja Email SMTP',
    'settings.smtpSubtitle': 'Skonfiguruj serwer SMTP do wysyłania emaili potwierdzających.',
    'settings.smtpHost': 'Serwer SMTP',
    'settings.smtpPort': 'Port',
    'settings.smtpUser': 'Użytkownik SMTP',
    'settings.smtpPass': 'Hasło',
    'settings.smtpPassHint': 'Dla Gmail użyj hasła aplikacji',
    'settings.fromNumber': 'Nazwa/Numer nadawcy',
    'settings.fromEmail': 'Email nadawcy',
    'settings.configured': 'Skonfigurowany',
    'settings.notConfigured': 'Nie skonfigurowany',
    'settings.save': 'Zapisz',
    'settings.test': 'Testuj',
    'settings.vonageSaved': 'Konfiguracja Vonage zapisana',
    'settings.smtpSaved': 'Konfiguracja SMTP zapisana',
    'settings.saveError': 'Błąd zapisu',
    'settings.vonageTestSuccess': 'Połączenie z Vonage udane',
    'settings.vonageTestError': 'Błąd połączenia z Vonage',
    'settings.smtpTestSuccess': 'Połączenie SMTP udane',
    'settings.smtpTestError': 'Błąd połączenia SMTP',
  },
  en: {
    // Navigation
    'nav.services': 'Services',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.start': 'Get Started',

    // Hero
    'hero.badge': 'Agriculture of the Future',
    'hero.title1': 'Transform your',
    'hero.title2': 'Agriculture with Drones',
    'hero.description': 'Precision agriculture services with cutting-edge technology. Maximize your crop yields with smart solutions.',
    'hero.cta': 'Request Service',
    'hero.viewServices': 'View Services',

    // Stats
    'stats.hectares': 'Hectares Treated',
    'stats.precision': 'Precision',
    'stats.response': 'Response',
    'stats.clients': 'Clients',

    // Services
    'services.title': 'Our Services',
    'services.subtitle': 'Agricultural',
    'services.subtitleHighlight': 'Solutions',
    'service.fumigation.title': 'Drone Fumigation',
    'service.fumigation.desc': 'Precise application of phytosanitary treatments with state-of-the-art technology.',
    'service.painting.title': 'Greenhouse Painting',
    'service.painting.desc': 'UV protection and climate control to optimize your crop growth.',
    'service.mapping.title': 'Aerial Mapping',
    'service.mapping.desc': 'Detailed terrain analysis with high-resolution images and precise data.',
    'service.elevation.title': 'Elevation Models',
    'service.elevation.desc': 'Irrigation and drainage planning with high-precision 3D topographic models.',

    // About
    'about.title': 'About Us',
    'about.subtitle': 'Innovation at the service of',
    'about.subtitleHighlight': 'farming',
    'about.description': 'We are pioneers in applying drone technology to agriculture. Our team of experts combines agricultural knowledge with cutting-edge technology to offer solutions that transform your field productivity.',
    'about.feature1': 'State-of-the-art technology',
    'about.feature2': 'Certified expert team',
    'about.feature3': 'Environmental commitment',
    'about.feature4': 'Guaranteed results',
    'about.years': 'Years of Experience',
    'about.drones': 'Drones in Fleet',
    'about.support': 'Technical Support',
    'about.satisfaction': 'Satisfaction',

    // CTA
    'cta.title': 'Ready to',
    'cta.titleHighlight': 'transform',
    'cta.titleEnd': 'your agriculture?',
    'cta.description': 'Join hundreds of farmers who are already harnessing the power of drones. Request your free first consultation today.',
    'cta.button': 'Start Now',

    // Contact
    'contact.title': 'Contact',
    'contact.subtitle': "Let's talk about your",
    'contact.subtitleHighlight': 'project',
    'contact.description': "We're here to help. Contact us and we'll respond within 24 hours.",
    'contact.phone': 'Phone',
    'contact.email': 'Email',
    'contact.address': 'Address',
    'contact.form.name': 'Name',
    'contact.form.email': 'Email',
    'contact.form.subject': 'Subject',
    'contact.form.message': 'Message',
    'contact.form.send': 'Send Message',

    // Footer
    'footer.rights': 'All rights reserved.',

    // Auth
    'auth.login': 'Log In',
    'auth.signup': 'Sign Up',
    'auth.back': 'Back',
    'auth.name': 'Full name',
    'auth.phone': 'Phone',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm password',
    'auth.forgotPassword': 'Forgot your password?',
    'auth.loginButton': 'Log In',
    'auth.signupButton': 'Create Account',
    'auth.loggingIn': 'Logging in...',
    'auth.signingUp': 'Signing up...',
    'auth.continueWith': 'or continue with',
    'auth.terms': 'By signing up, you agree to our',
    'auth.termsLink': 'Terms of Service',
    'auth.and': 'and',
    'auth.privacyLink': 'Privacy Policy',
    'auth.passwordMismatch': 'Passwords do not match',

    // Dashboard
    'dashboard.title': 'Client Dashboard',
    'dashboard.welcome': 'Welcome',
    'dashboard.logout': 'Log Out',
    'dashboard.calendar': 'Calendar',
    'dashboard.jobs': 'Jobs',
    'dashboard.completed': 'Completed',
    'dashboard.scheduled': 'Scheduled',
    'dashboard.pending': 'Pending',
    'dashboard.all': 'All',
    'dashboard.noJobs': 'No jobs registered',
    'dashboard.requestService': 'Request Service',
    'dashboard.status.completed': 'Completed',
    'dashboard.status.scheduled': 'Scheduled',
    'dashboard.status.pending': 'Pending',
    'dashboard.status.inProgress': 'In Progress',
    'dashboard.jobDetails': 'Job Details',
    'dashboard.date': 'Date',
    'dashboard.service': 'Service',
    'dashboard.location': 'Location',
    'dashboard.area': 'Area',
    'dashboard.hectares': 'hectares',
    'dashboard.today': 'Today',
    'dashboard.thisMonth': 'This Month',
    'dashboard.upcoming': 'Upcoming',
    'dashboard.past': 'Past',

    // Service Request Modal
    'serviceRequest.title': 'Request Service',
    'serviceRequest.step': 'Step',
    'serviceRequest.of': 'of',
    'serviceRequest.selectService': 'What service do you need?',
    'serviceRequest.selectDate': 'Select a date',
    'serviceRequest.selectTime': 'Select a time',
    'serviceRequest.form.name': 'Name',
    'serviceRequest.form.email': 'Email',
    'serviceRequest.form.phone': 'Phone',
    'serviceRequest.form.location': 'Field location',
    'serviceRequest.form.locationPlaceholder': 'Address or coordinates',
    'serviceRequest.form.area': 'Area (hectares)',
    'serviceRequest.form.areaPlaceholder': 'E.g.: 5',
    'serviceRequest.form.notes': 'Additional notes',
    'serviceRequest.form.notesPlaceholder': 'Additional information about the service...',
    'serviceRequest.summary': 'Request summary',
    'serviceRequest.summaryService': 'Service',
    'serviceRequest.summaryDate': 'Date',
    'serviceRequest.summaryTime': 'Time',
    'serviceRequest.back': 'Back',
    'serviceRequest.next': 'Next',
    'serviceRequest.submit': 'Submit Request',
    'serviceRequest.success.title': 'Request Sent!',
    'serviceRequest.success.message': 'We have received your request. We will contact you within 24 hours to confirm the details.',
    'serviceRequest.success.close': 'Close',

    // Admin Dashboard
    'admin.title': 'Admin Dashboard',
    'admin.subtitle': 'Manage all service requests',
    'admin.requests': 'Service Requests',
    'admin.noRequests': 'No requests',
    'admin.confirm': 'Confirm',
    'admin.complete': 'Complete',
    'admin.viewDetails': 'View Details',
    'admin.smsSent': 'SMS sent to client',
    'admin.smsError': 'Error sending SMS',
    'admin.sendingSms': 'Sending SMS...',
    'admin.notificationsSent': 'SMS and Email sent',
    'admin.notificationsError': 'Error sending notifications',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Configure SMS and Email APIs',
    'settings.backToAdmin': 'Back to Dashboard',
    'settings.vonageTitle': 'Vonage SMS Configuration',
    'settings.vonageSubtitle': 'Configure Vonage API credentials to send SMS to clients.',
    'settings.smtpTitle': 'Email SMTP Configuration',
    'settings.smtpSubtitle': 'Configure SMTP server to send confirmation emails.',
    'settings.smtpHost': 'SMTP Server',
    'settings.smtpPort': 'Port',
    'settings.smtpUser': 'SMTP Username',
    'settings.smtpPass': 'Password',
    'settings.smtpPassHint': 'For Gmail, use an app-specific password',
    'settings.fromNumber': 'Sender Name/Number',
    'settings.fromEmail': 'Sender Email',
    'settings.configured': 'Configured',
    'settings.notConfigured': 'Not configured',
    'settings.save': 'Save',
    'settings.test': 'Test',
    'settings.vonageSaved': 'Vonage configuration saved',
    'settings.smtpSaved': 'SMTP configuration saved',
    'settings.saveError': 'Error saving',
    'settings.vonageTestSuccess': 'Vonage connection successful',
    'settings.vonageTestError': 'Error connecting to Vonage',
    'settings.smtpTestSuccess': 'SMTP connection successful',
    'settings.smtpTestError': 'Error connecting to SMTP',
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language') as Language
      return saved || 'es'
    }
    return 'es'
  })

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
