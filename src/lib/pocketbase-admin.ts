import PocketBase from 'pocketbase'

let adminToken: string | null = process.env.POCKETBASE_SUPERUSER_TOKEN || null
let tokenExpiry: number | null = null

function getTokenExpiry(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

async function refreshToken(): Promise<string | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/_superusers/auth-with-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity: process.env.POCKETBASE_ADMIN_EMAIL,
          password: process.env.POCKETBASE_ADMIN_PASSWORD,
        }),
      }
    )
    
    if (!response.ok) {
      console.error('Failed to refresh admin token')
      return null
    }
    
    const data = await response.json()
    adminToken = data.token
    tokenExpiry = getTokenExpiry(data.token)
    return data.token
  } catch (e) {
    console.error('Token refresh error:', e)
    return null
  }
}

export async function getAdminPocketBase(): Promise<PocketBase> {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)
  pb.autoCancellation(false)
  
  // Check if token exists and is not expired (with 5 min buffer)
  const now = Date.now()
  const buffer = 5 * 60 * 1000 // 5 minutes
  
  if (!adminToken || !tokenExpiry || (tokenExpiry - buffer) < now) {
    const newToken = await refreshToken()
    if (newToken) {
      adminToken = newToken
      tokenExpiry = getTokenExpiry(newToken)
    }
  }
  
  if (adminToken) {
    pb.authStore.save(adminToken, null)
  }
  
  return pb
}