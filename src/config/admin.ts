// Admin configuration
// In production, this should come from environment variables or a database

export const ADMIN_EMAILS = [
  'admin@drone-partss.com'
]

export const isAdminEmail = (email: string | undefined): boolean => {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
