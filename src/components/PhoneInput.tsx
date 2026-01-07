import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface Country {
  code: string
  name: string
  dialCode: string
  flag: string
}

const COUNTRIES: Country[] = [
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿' },
  { code: 'SK', name: 'Slovakia', dialCode: '+421', flag: '🇸🇰' },
  { code: 'BG', name: 'Bulgaria', dialCode: '+359', flag: '🇧🇬' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦' },
  { code: 'RO', name: 'Romania', dialCode: '+40', flag: '🇷🇴' },
  { code: 'HU', name: 'Hungary', dialCode: '+36', flag: '🇭🇺' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
]

interface PhoneInputProps {
  value: string
  onChange: (fullPhone: string) => void
  required?: boolean
  className?: string
  placeholder?: string
}

export default function PhoneInput({
  value,
  onChange,
  required = false,
  className = '',
  placeholder = '123 456 789'
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]) // Default Poland
  const [phoneNumber, setPhoneNumber] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Parse initial value if it contains a country code
  useEffect(() => {
    if (value) {
      // Try to find matching country code
      const matchedCountry = COUNTRIES.find(c => value.startsWith(c.dialCode))
      if (matchedCountry) {
        setSelectedCountry(matchedCountry)
        setPhoneNumber(value.replace(matchedCountry.dialCode, '').trim())
      } else if (!value.startsWith('+')) {
        setPhoneNumber(value)
      }
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setIsOpen(false)
    // Update the full phone number
    const fullPhone = phoneNumber ? `${country.dialCode} ${phoneNumber}` : ''
    onChange(fullPhone)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value
    setPhoneNumber(newPhone)
    // Combine with country code
    const fullPhone = newPhone ? `${selectedCountry.dialCode} ${newPhone}` : ''
    onChange(fullPhone)
  }

  return (
    <div className={`relative flex ${className}`}>
      {/* Country Selector */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-3 h-full bg-white/5 border border-white/10 border-r-0 rounded-l-xl hover:bg-white/10 transition-colors"
        >
          <span className="text-lg">{selectedCountry.flag}</span>
          <span className="text-white/60 text-sm">{selectedCountry.dialCode}</span>
          <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50">
            {COUNTRIES.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleCountrySelect(country)}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-left ${
                  selectedCountry.code === country.code ? 'bg-emerald-500/20' : ''
                }`}
              >
                <span className="text-lg">{country.flag}</span>
                <span className="text-white/80 text-sm flex-1">{country.name}</span>
                <span className="text-white/40 text-sm">{country.dialCode}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Phone Number Input */}
      <input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        required={required}
        className="input-glass flex-1 rounded-l-none border-l-0"
      />
    </div>
  )
}
