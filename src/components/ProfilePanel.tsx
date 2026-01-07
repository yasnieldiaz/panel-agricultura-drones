import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  User,
  Phone,
  Building2,
  Lock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Save,
  Globe
} from 'lucide-react'
import { useLanguage, type Language } from '../contexts/LanguageContext'
import { authApi, type UserProfile } from '../lib/api'
import PhoneInput from './PhoneInput'

interface ProfilePanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
  const { language, setLanguage } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'profile' | 'password'>('profile')

  // Password change state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)

  // Translations
  const texts = {
    es: {
      title: 'Mi Perfil',
      personalInfo: 'Información Personal',
      contactInfo: 'Información de Contacto',
      fiscalInfo: 'Datos Fiscales',
      changePassword: 'Cambiar Contraseña',
      name: 'Nombre',
      email: 'Email',
      phone: 'Teléfono',
      address: 'Dirección',
      city: 'Ciudad',
      country: 'País',
      postalCode: 'Código Postal',
      companyName: 'Nombre de Empresa',
      taxId: 'NIF/CIF',
      currentPassword: 'Contraseña Actual',
      newPassword: 'Nueva Contraseña',
      confirmPassword: 'Confirmar Contraseña',
      save: 'Guardar Cambios',
      saving: 'Guardando...',
      changePasswordBtn: 'Cambiar Contraseña',
      changingPassword: 'Cambiando...',
      profileUpdated: 'Perfil actualizado correctamente',
      passwordChanged: 'Contraseña cambiada correctamente',
      passwordMismatch: 'Las contraseñas no coinciden',
      passwordTooShort: 'La contraseña debe tener al menos 6 caracteres',
      profile: 'Perfil',
      security: 'Seguridad',
      preferredLanguage: 'Idioma Preferido',
      languageNote: 'Este idioma se usará para emails y notificaciones'
    },
    en: {
      title: 'My Profile',
      personalInfo: 'Personal Information',
      contactInfo: 'Contact Information',
      fiscalInfo: 'Fiscal Data',
      changePassword: 'Change Password',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      city: 'City',
      country: 'Country',
      postalCode: 'Postal Code',
      companyName: 'Company Name',
      taxId: 'Tax ID',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      save: 'Save Changes',
      saving: 'Saving...',
      changePasswordBtn: 'Change Password',
      changingPassword: 'Changing...',
      profileUpdated: 'Profile updated successfully',
      passwordChanged: 'Password changed successfully',
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
      profile: 'Profile',
      security: 'Security',
      preferredLanguage: 'Preferred Language',
      languageNote: 'This language will be used for emails and notifications'
    },
    pl: {
      title: 'Mój Profil',
      personalInfo: 'Dane Osobowe',
      contactInfo: 'Dane Kontaktowe',
      fiscalInfo: 'Dane Podatkowe',
      changePassword: 'Zmień Hasło',
      name: 'Imię',
      email: 'Email',
      phone: 'Telefon',
      address: 'Adres',
      city: 'Miasto',
      country: 'Kraj',
      postalCode: 'Kod Pocztowy',
      companyName: 'Nazwa Firmy',
      taxId: 'NIP',
      currentPassword: 'Aktualne Hasło',
      newPassword: 'Nowe Hasło',
      confirmPassword: 'Potwierdź Hasło',
      save: 'Zapisz Zmiany',
      saving: 'Zapisywanie...',
      changePasswordBtn: 'Zmień Hasło',
      changingPassword: 'Zmienianie...',
      profileUpdated: 'Profil zaktualizowany pomyślnie',
      passwordChanged: 'Hasło zmienione pomyślnie',
      passwordMismatch: 'Hasła nie pasują do siebie',
      passwordTooShort: 'Hasło musi mieć co najmniej 6 znaków',
      profile: 'Profil',
      security: 'Bezpieczeństwo',
      preferredLanguage: 'Preferowany Język',
      languageNote: 'Ten język będzie używany do emaili i powiadomień'
    },
    cs: {
      title: 'Můj Profil',
      personalInfo: 'Osobní Údaje',
      contactInfo: 'Kontaktní Údaje',
      fiscalInfo: 'Daňové Údaje',
      changePassword: 'Změnit Heslo',
      name: 'Jméno',
      email: 'Email',
      phone: 'Telefon',
      address: 'Adresa',
      city: 'Město',
      country: 'Země',
      postalCode: 'PSČ',
      companyName: 'Název Firmy',
      taxId: 'IČO/DIČ',
      currentPassword: 'Současné Heslo',
      newPassword: 'Nové Heslo',
      confirmPassword: 'Potvrdit Heslo',
      save: 'Uložit Změny',
      saving: 'Ukládání...',
      changePasswordBtn: 'Změnit Heslo',
      changingPassword: 'Měním...',
      profileUpdated: 'Profil úspěšně aktualizován',
      passwordChanged: 'Heslo úspěšně změněno',
      passwordMismatch: 'Hesla se neshodují',
      passwordTooShort: 'Heslo musí mít alespoň 6 znaků',
      profile: 'Profil',
      security: 'Zabezpečení',
      preferredLanguage: 'Preferovaný Jazyk',
      languageNote: 'Tento jazyk bude použit pro emaily a oznámení'
    },
    sk: {
      title: 'Môj Profil',
      personalInfo: 'Osobné Údaje',
      contactInfo: 'Kontaktné Údaje',
      fiscalInfo: 'Daňové Údaje',
      changePassword: 'Zmeniť Heslo',
      name: 'Meno',
      email: 'Email',
      phone: 'Telefón',
      address: 'Adresa',
      city: 'Mesto',
      country: 'Krajina',
      postalCode: 'PSČ',
      companyName: 'Názov Firmy',
      taxId: 'IČO/DIČ',
      currentPassword: 'Súčasné Heslo',
      newPassword: 'Nové Heslo',
      confirmPassword: 'Potvrdiť Heslo',
      save: 'Uložiť Zmeny',
      saving: 'Ukladanie...',
      changePasswordBtn: 'Zmeniť Heslo',
      changingPassword: 'Mením...',
      profileUpdated: 'Profil úspešne aktualizovaný',
      passwordChanged: 'Heslo úspešne zmenené',
      passwordMismatch: 'Heslá sa nezhodujú',
      passwordTooShort: 'Heslo musí mať aspoň 6 znakov',
      profile: 'Profil',
      security: 'Zabezpečenie',
      preferredLanguage: 'Preferovaný Jazyk',
      languageNote: 'Tento jazyk sa použije pre emaily a oznámenia'
    },
    bg: {
      title: 'Моят Профил',
      personalInfo: 'Лична Информация',
      contactInfo: 'Контактна Информация',
      fiscalInfo: 'Данъчни Данни',
      changePassword: 'Промяна на Парола',
      name: 'Име',
      email: 'Имейл',
      phone: 'Телефон',
      address: 'Адрес',
      city: 'Град',
      country: 'Държава',
      postalCode: 'Пощенски Код',
      companyName: 'Име на Фирма',
      taxId: 'ЕИК/Булстат',
      currentPassword: 'Текуща Парола',
      newPassword: 'Нова Парола',
      confirmPassword: 'Потвърди Парола',
      save: 'Запази Промени',
      saving: 'Запазване...',
      changePasswordBtn: 'Промени Парола',
      changingPassword: 'Променяне...',
      profileUpdated: 'Профилът е актуализиран успешно',
      passwordChanged: 'Паролата е променена успешно',
      passwordMismatch: 'Паролите не съвпадат',
      passwordTooShort: 'Паролата трябва да е поне 6 символа',
      profile: 'Профил',
      security: 'Сигурност',
      preferredLanguage: 'Предпочитан Език',
      languageNote: 'Този език ще се използва за имейли и известия'
    }
  }

  const txt = texts[language as keyof typeof texts] || texts['es']

  // Language names translated in each language
  const languageNames: Record<string, Record<string, string>> = {
    es: { es: 'Español', en: 'Inglés', pl: 'Polaco', cs: 'Checo', sk: 'Eslovaco', bg: 'Búlgaro' },
    en: { es: 'Spanish', en: 'English', pl: 'Polish', cs: 'Czech', sk: 'Slovak', bg: 'Bulgarian' },
    pl: { es: 'Hiszpański', en: 'Angielski', pl: 'Polski', cs: 'Czeski', sk: 'Słowacki', bg: 'Bułgarski' },
    cs: { es: 'Španělština', en: 'Angličtina', pl: 'Polština', cs: 'Čeština', sk: 'Slovenština', bg: 'Bulharština' },
    sk: { es: 'Španielčina', en: 'Angličtina', pl: 'Poľština', cs: 'Čeština', sk: 'Slovenčina', bg: 'Bulharčina' },
    bg: { es: 'Испански', en: 'Английски', pl: 'Полски', cs: 'Чешки', sk: 'Словашки', bg: 'Български' }
  }

  // Fetch profile on open
  useEffect(() => {
    if (isOpen) {
      fetchProfile()
    }
  }, [isOpen])

  const fetchProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await authApi.getProfile()
      setProfile(data)
    } catch (err) {
      setError('Error loading profile')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    if (profile) {
      setProfile({ ...profile, [field]: value })
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { profile: updatedProfile } = await authApi.updateProfile({
        name: profile.name,
        phone: profile.phone,
        language: profile.language,
        address: profile.address,
        city: profile.city,
        country: profile.country,
        postal_code: profile.postal_code,
        company_name: profile.company_name,
        tax_id: profile.tax_id
      })
      setProfile(updatedProfile)
      // Update the UI language to match the saved profile language
      if (updatedProfile.language) {
        setLanguage(updatedProfile.language as Language)
      }
      setSuccess(txt.profileUpdated)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError(null)
    setPasswordSuccess(null)

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError(txt.passwordMismatch)
      return
    }

    if (passwords.newPassword.length < 6) {
      setPasswordError(txt.passwordTooShort)
      return
    }

    setChangingPassword(true)

    try {
      await authApi.changePassword(passwords.currentPassword, passwords.newPassword)
      setPasswordSuccess(txt.passwordChanged)
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPasswordSuccess(null), 3000)
    } catch (err: any) {
      setPasswordError(err.message || 'Error changing password')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-white/10 rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-slate-900">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                {txt.title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveSection('profile')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeSection === 'profile'
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                {txt.profile}
              </button>
              <button
                onClick={() => setActiveSection('password')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeSection === 'password'
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                {txt.security}
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              ) : activeSection === 'profile' ? (
                <div className="space-y-6">
                  {/* Success/Error Messages */}
                  {success && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                      {success}
                    </div>
                  )}
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 text-red-400">
                      <AlertCircle className="w-5 h-5" />
                      {error}
                    </div>
                  )}

                  {/* Personal Information */}
                  <div>
                    <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {txt.personalInfo}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/60 text-sm mb-1">{txt.name}</label>
                        <input
                          type="text"
                          value={profile?.name || ''}
                          onChange={(e) => handleProfileChange('name', e.target.value)}
                          className="input-glass w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">{txt.email}</label>
                        <input
                          type="email"
                          value={profile?.email || ''}
                          disabled
                          className="input-glass w-full opacity-50 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Language Preference */}
                  <div>
                    <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {txt.preferredLanguage}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <select
                          value={profile?.language || 'es'}
                          onChange={(e) => handleProfileChange('language', e.target.value)}
                          className="input-glass w-full cursor-pointer"
                        >
                          <option value="es">{languageNames[language]?.es || 'Español'}</option>
                          <option value="en">{languageNames[language]?.en || 'English'}</option>
                          <option value="pl">{languageNames[language]?.pl || 'Polski'}</option>
                          <option value="cs">{languageNames[language]?.cs || 'Čeština'}</option>
                          <option value="sk">{languageNames[language]?.sk || 'Slovenčina'}</option>
                          <option value="bg">{languageNames[language]?.bg || 'Български'}</option>
                        </select>
                        <p className="text-white/40 text-xs mt-2">{txt.languageNote}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {txt.contactInfo}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/60 text-sm mb-1">{txt.phone}</label>
                        <PhoneInput
                          value={profile?.phone || ''}
                          onChange={(phone) => handleProfileChange('phone', phone)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">{txt.address}</label>
                        <input
                          type="text"
                          value={profile?.address || ''}
                          onChange={(e) => handleProfileChange('address', e.target.value)}
                          className="input-glass w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">{txt.city}</label>
                        <input
                          type="text"
                          value={profile?.city || ''}
                          onChange={(e) => handleProfileChange('city', e.target.value)}
                          className="input-glass w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">{txt.postalCode}</label>
                        <input
                          type="text"
                          value={profile?.postal_code || ''}
                          onChange={(e) => handleProfileChange('postal_code', e.target.value)}
                          className="input-glass w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">{txt.country}</label>
                        <input
                          type="text"
                          value={profile?.country || ''}
                          onChange={(e) => handleProfileChange('country', e.target.value)}
                          className="input-glass w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fiscal Data */}
                  <div>
                    <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {txt.fiscalInfo}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/60 text-sm mb-1">{txt.companyName}</label>
                        <input
                          type="text"
                          value={profile?.company_name || ''}
                          onChange={(e) => handleProfileChange('company_name', e.target.value)}
                          className="input-glass w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">{txt.taxId}</label>
                        <input
                          type="text"
                          value={profile?.tax_id || ''}
                          onChange={(e) => handleProfileChange('tax_id', e.target.value)}
                          className="input-glass w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {txt.saving}
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {txt.save}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Password Change Section */}
                  <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    {txt.changePassword}
                  </h3>

                  {/* Success/Error Messages */}
                  {passwordSuccess && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                      {passwordSuccess}
                    </div>
                  )}
                  {passwordError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 text-red-400">
                      <AlertCircle className="w-5 h-5" />
                      {passwordError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/60 text-sm mb-1">{txt.currentPassword}</label>
                      <input
                        type="password"
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                        className="input-glass w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-1">{txt.newPassword}</label>
                      <input
                        type="password"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        className="input-glass w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-1">{txt.confirmPassword}</label>
                      <input
                        type="password"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        className="input-glass w-full"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handlePasswordChange}
                    disabled={changingPassword || !passwords.currentPassword || !passwords.newPassword}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {txt.changingPassword}
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        {txt.changePasswordBtn}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
