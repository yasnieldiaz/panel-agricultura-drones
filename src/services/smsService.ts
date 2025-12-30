// Notification Service - Communicates with the backend SMS & Email server

const API_URL = import.meta.env.VITE_SMS_API_URL || 'http://localhost:3001/api'

interface ConfirmServiceParams {
  phone: string
  email: string
  clientName: string
  service: string
  date: string
  time: string
  location: string
  area?: number
  language?: 'es' | 'en' | 'pl' | 'cs' | 'sk'
}

interface CompleteServiceParams {
  phone: string
  email: string
  clientName: string
  service: string
  language?: 'es' | 'en' | 'pl' | 'cs' | 'sk'
}

interface NotificationResponse {
  success: boolean
  messageId?: string
  error?: string
}

// Send SMS confirmation
export async function sendConfirmationSMS(params: ConfirmServiceParams): Promise<NotificationResponse> {
  try {
    const response = await fetch(`${API_URL}/sms/confirm-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send SMS')
    }

    return data
  } catch (error) {
    console.error('SMS Service Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Send Email confirmation
export async function sendConfirmationEmail(params: ConfirmServiceParams): Promise<NotificationResponse> {
  try {
    const response = await fetch(`${API_URL}/email/confirm-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email')
    }

    return data
  } catch (error) {
    console.error('Email Service Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Send SMS completion
export async function sendCompletionSMS(params: CompleteServiceParams): Promise<NotificationResponse> {
  try {
    const response = await fetch(`${API_URL}/sms/complete-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send SMS')
    }

    return data
  } catch (error) {
    console.error('SMS Service Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Send Email completion
export async function sendCompletionEmail(params: CompleteServiceParams): Promise<NotificationResponse> {
  try {
    const response = await fetch(`${API_URL}/email/complete-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email')
    }

    return data
  } catch (error) {
    console.error('Email Service Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Send both SMS and Email for confirmation
export async function sendConfirmationNotifications(params: ConfirmServiceParams): Promise<{
  sms: NotificationResponse
  email: NotificationResponse
}> {
  const [smsResult, emailResult] = await Promise.all([
    sendConfirmationSMS(params),
    sendConfirmationEmail(params)
  ])

  return { sms: smsResult, email: emailResult }
}

// Send both SMS and Email for completion
export async function sendCompletionNotifications(params: CompleteServiceParams): Promise<{
  sms: NotificationResponse
  email: NotificationResponse
}> {
  const [smsResult, emailResult] = await Promise.all([
    sendCompletionSMS(params),
    sendCompletionEmail(params)
  ])

  return { sms: smsResult, email: emailResult }
}

export async function checkServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}
