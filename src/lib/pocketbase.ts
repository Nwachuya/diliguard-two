import PocketBase from 'pocketbase'
import type { 
  User, 
  Account, 
  Research, 
  Payment, 
  AdminConfig,
  AccountWithUser,
  ResearchWithAccount,
  PaymentWithAccount
} from '@/types'

// Initialize PocketBase client
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

// Enable auto cancellation for duplicate requests
pb.autoCancellation(false)

// ============================================================================
// AUTH HELPERS
// ============================================================================

export async function signUp(email: string, password: string, name: string) {
  const user = await pb.collection('users').create({
    email,
    password,
    passwordConfirm: password,
    name,
    emailVisibility: true,
  })
  
  await pb.collection('users').authWithPassword(email, password)
  document.cookie = pb.authStore.exportToCookie({ httpOnly: false })
  await pb.collection('users').requestVerification(email)
  
  return user
}

export async function signIn(email: string, password: string) {
  const authData = await pb.collection('users').authWithPassword(email, password)
  document.cookie = pb.authStore.exportToCookie({ httpOnly: false })
  return authData
}

export async function signOut() {
  pb.authStore.clear()
  document.cookie = "pb_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
  window.location.href = "/"
}

export async function resetPassword(email: string) {
  await pb.collection('users').requestPasswordReset(email)
}

export function getCurrentUser(): User | null {
  return pb.authStore.model as User | null
}

export function isAuthenticated(): boolean {
  return pb.authStore.isValid
}

// ============================================================================
// ACCOUNT HELPERS
// ============================================================================

export async function getAccount(userId: string): Promise<AccountWithUser | null> {
  try {
    const account = await pb.collection('accounts').getFirstListItem<AccountWithUser>(
      `user="${userId}"`,
      { expand: 'user' }
    )
    return account
  } catch (error) {
    return null
  }
}

export async function createAccount(userId: string, key: string): Promise<Account> {
  const account = await pb.collection('accounts').create<Account>({
    user: userId,
    role: 'user',
    key,
    account_status: 'active',
    monthly_usage: 0,
    last_reset_month: new Date().getMonth(),
  })
  return account
}

export async function updateAccount(accountId: string, data: Partial<Account>): Promise<Account> {
  const account = await pb.collection('accounts').update<Account>(accountId, data)
  return account
}

export async function checkAndResetMonthlyUsage(account: Account): Promise<Account> {
  const currentMonth = new Date().getMonth()
  
  if (account.last_reset_month !== currentMonth) {
    return await updateAccount(account.id, {
      monthly_usage: 0,
      last_reset_month: currentMonth,
    })
  }
  
  return account
}

export async function incrementMonthlyUsage(accountId: string): Promise<Account> {
  const account = await pb.collection('accounts').getOne<Account>(accountId)
  return await updateAccount(accountId, {
    monthly_usage: account.monthly_usage + 1,
  })
}

// ============================================================================
// RESEARCH HELPERS
// ============================================================================

export async function getResearchList(
  accountId: string,
  page: number = 1,
  perPage: number = 10,
  filter?: string
): Promise<{ items: Research[]; totalPages: number; totalItems: number }> {
  let filterQuery = `account="${accountId}"`
  
  if (filter) {
    filterQuery += ` && ${filter}`
  }
  
  const result = await pb.collection('research').getList<Research>(page, perPage, {
    filter: filterQuery,
    sort: '-created',
  })
  
  return {
    items: result.items,
    totalPages: result.totalPages,
    totalItems: result.totalItems,
  }
}

export async function getResearch(id: string): Promise<ResearchWithAccount> {
  const research = await pb.collection('research').getOne<ResearchWithAccount>(id, {
    expand: 'account',
  })
  return research
}

export async function createResearch(data: Partial<Research>): Promise<Research> {
  const research = await pb.collection('research').create<Research>(data)
  return research
}

export async function getAllResearch(
  page: number = 1,
  perPage: number = 10,
  filter?: string
): Promise<{ items: ResearchWithAccount[]; totalPages: number; totalItems: number }> {
  const result = await pb.collection('research').getList<ResearchWithAccount>(page, perPage, {
    filter: filter || '',
    sort: '-created',
    expand: 'account,account.user',
  })
  
  return {
    items: result.items,
    totalPages: result.totalPages,
    totalItems: result.totalItems,
  }
}

export async function deleteResearch(researchId: string): Promise<boolean> {
  await pb.collection('research').delete(researchId)
  return true
}

// ============================================================================
// PAYMENT HELPERS
// ============================================================================

export async function getPaymentList(
  accountId: string,
  page: number = 1,
  perPage: number = 10
): Promise<{ items: Payment[]; totalPages: number; totalItems: number }> {
  const result = await pb.collection('payments').getList<Payment>(page, perPage, {
    filter: `account="${accountId}"`,
    sort: '-created',
  })
  
  return {
    items: result.items,
    totalPages: result.totalPages,
    totalItems: result.totalItems,
  }
}

export async function getAllPayments(
  page: number = 1,
  perPage: number = 10,
  filter?: string
): Promise<{ items: PaymentWithAccount[]; totalPages: number; totalItems: number }> {
  const result = await pb.collection('payments').getList<PaymentWithAccount>(page, perPage, {
    filter: filter || '',
    sort: '-created',
    expand: 'account,account.user',
  })
  
  return {
    items: result.items,
    totalPages: result.totalPages,
    totalItems: result.totalItems,
  }
}

// ============================================================================
// ADMIN HELPERS
// ============================================================================

export async function getAdminConfig(): Promise<AdminConfig> {
  const config = await pb.collection('admin').getOne<AdminConfig>(
    process.env.NEXT_PUBLIC_ADMIN_CONFIG_ID || 'uzmp2ee8ir0sbcn'
  )
  return config
}

export async function updateAdminConfig(data: Partial<AdminConfig>): Promise<AdminConfig> {
  const config = await pb.collection('admin').update<AdminConfig>(
    process.env.NEXT_PUBLIC_ADMIN_CONFIG_ID || 'uzmp2ee8ir0sbcn',
    data
  )
  return config
}

export async function getAllUsers(
  page: number = 1,
  perPage: number = 10,
  search?: string
): Promise<{ items: User[]; totalPages: number; totalItems: number }> {
  const result = await pb.collection('users').getList<User>(page, perPage, {
    filter: search ? `name~"${search}" || email~"${search}"` : '',
    sort: '-created',
  })
  
  return {
    items: result.items,
    totalPages: result.totalPages,
    totalItems: result.totalItems,
  }
}

export async function getAllAccounts(
  page: number = 1,
  perPage: number = 10,
  filter?: string,
  search?: string
): Promise<{ items: AccountWithUser[]; totalPages: number; totalItems: number }> {
  let filterParts: string[] = []
  
  if (filter) {
    filterParts.push(filter)
  }
  
  if (search) {
    filterParts.push(`(user.name~"${search}" || user.email~"${search}")`)
  }
  
  const result = await pb.collection('accounts').getList<AccountWithUser>(page, perPage, {
    filter: filterParts.length > 0 ? filterParts.join(' && ') : '',
    sort: '-created',
    expand: 'user',
  })
  
  return {
    items: result.items,
    totalPages: result.totalPages,
    totalItems: result.totalItems,
  }
}

export async function suspendAccount(accountId: string): Promise<Account> {
  return await updateAccount(accountId, { account_status: 'suspended' })
}

export async function unsuspendAccount(accountId: string): Promise<Account> {
  return await updateAccount(accountId, { account_status: 'active' })
}

// ============================================================================
// ADMIN STATS HELPERS
// ============================================================================

export async function getAdminDashboardStats(): Promise<{
  totalUsers: number
  activeSubscriptions: number
  totalRevenue: number
  totalInvestigations: number
  newUsersThisMonth: number
  investigationsThisMonth: number
  pendingInvestigations: number
  failedInvestigations: number
}> {
  // Get total users
  const usersResult = await pb.collection('users').getList(1, 1)
  const totalUsers = usersResult.totalItems
  
  // Get active subscriptions
  const activeSubsResult = await pb.collection('accounts').getList(1, 1, {
    filter: 'subscription_status="active" || subscription_status="trialing"'
  })
  const activeSubscriptions = activeSubsResult.totalItems
  
  // Get total revenue (sum all payments)
  const allPayments = await pb.collection('payments').getFullList<Payment>({
    filter: 'status="paid" || status="succeeded"'
  })
  const totalRevenue = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  
  // Get total investigations
  const researchResult = await pb.collection('research').getList(1, 1)
  const totalInvestigations = researchResult.totalItems
  
  // Get new users this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const newUsersResult = await pb.collection('users').getList(1, 1, {
    filter: `created>="${startOfMonth.toISOString()}"`
  })
  const newUsersThisMonth = newUsersResult.totalItems
  
  // Get investigations this month
  const investigationsThisMonthResult = await pb.collection('research').getList(1, 1, {
    filter: `created>="${startOfMonth.toISOString()}"`
  })
  const investigationsThisMonth = investigationsThisMonthResult.totalItems
  
  // Get pending investigations
  const pendingResult = await pb.collection('research').getList(1, 1, {
    filter: 'status="Pending"'
  })
  const pendingInvestigations = pendingResult.totalItems
  
  // Get failed investigations
  const failedResult = await pb.collection('research').getList(1, 1, {
    filter: 'status="Error"'
  })
  const failedInvestigations = failedResult.totalItems
  
  return {
    totalUsers,
    activeSubscriptions,
    totalRevenue,
    totalInvestigations,
    newUsersThisMonth,
    investigationsThisMonth,
    pendingInvestigations,
    failedInvestigations,
  }
}

export async function getRevenueOverTime(months: number = 6): Promise<{ month: string; revenue: number }[]> {
  const data: { month: string; revenue: number }[] = []
  const now = new Date()
  
  for (let i = months - 1; i >= 0; i--) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    
    const payments = await pb.collection('payments').getFullList<Payment>({
      filter: `created>="${startDate.toISOString()}" && created<="${endDate.toISOString()}" && (status="paid" || status="succeeded")`
    })
    
    const revenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    
    data.push({
      month: startDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      revenue: revenue / 100, // Convert cents to dollars
    })
  }
  
  return data
}

export async function getNewUsersOverTime(months: number = 6): Promise<{ month: string; users: number }[]> {
  const data: { month: string; users: number }[] = []
  const now = new Date()
  
  for (let i = months - 1; i >= 0; i--) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    
    const result = await pb.collection('users').getList(1, 1, {
      filter: `created>="${startDate.toISOString()}" && created<="${endDate.toISOString()}"`
    })
    
    data.push({
      month: startDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      users: result.totalItems,
    })
  }
  
  return data
}

export async function getRiskDistribution(): Promise<{ name: string; value: number; color: string }[]> {
  const levels = [
    { name: 'Low', color: '#22c55e' },
    { name: 'Medium', color: '#eab308' },
    { name: 'High', color: '#f97316' },
    { name: 'Critical', color: '#ef4444' },
  ]
  
  const data: { name: string; value: number; color: string }[] = []
  
  for (const level of levels) {
    const result = await pb.collection('research').getList(1, 1, {
      filter: `risk_level="${level.name}" && status="Complete"`
    })
    data.push({
      name: level.name,
      value: result.totalItems,
      color: level.color,
    })
  }
  
  return data
}

export async function getSubscriptionDistribution(): Promise<{ name: string; value: number; color: string }[]> {
  const plans = [
    { name: 'Free', filter: 'plan_name="Free" || plan_name="" || plan_name=null', color: '#94a3b8' },
    { name: 'Basic', filter: 'plan_name="Basic"', color: '#3b82f6' },
    { name: 'Pro', filter: 'plan_name="Pro"', color: '#8b5cf6' },
  ]
  
  const data: { name: string; value: number; color: string }[] = []
  
  for (const plan of plans) {
    const result = await pb.collection('accounts').getList(1, 1, {
      filter: plan.filter
    })
    data.push({
      name: plan.name,
      value: result.totalItems,
      color: plan.color,
    })
  }
  
  return data
}

export async function getRecentUsers(limit: number = 5): Promise<AccountWithUser[]> {
  const result = await pb.collection('accounts').getList<AccountWithUser>(1, limit, {
    sort: '-created',
    expand: 'user',
  })
  return result.items
}

export async function getRecentPayments(limit: number = 5): Promise<PaymentWithAccount[]> {
  const result = await pb.collection('payments').getList<PaymentWithAccount>(1, limit, {
    sort: '-created',
    expand: 'account,account.user',
  })
  return result.items
}

export async function getRecentResearch(limit: number = 5): Promise<ResearchWithAccount[]> {
  const result = await pb.collection('research').getList<ResearchWithAccount>(1, limit, {
    sort: '-created',
    expand: 'account,account.user',
  })
  return result.items
}

// ============================================================================
// FEEDBACK HELPERS
// ============================================================================

export async function createFeedback(userId: string, feedbackText: string): Promise<any> {
  const feedback = await pb.collection('feedback').create({
    user: userId,
    feedback: feedbackText,
    stage: 'new',
  })
  return feedback
}

export async function getFeedbackCount(userId: string): Promise<number> {
  const result = await pb.collection('feedback').getList(1, 1, {
    filter: `user="${userId}"`,
  })
  return result.totalItems
}

// ============================================================================
// EXPORT
// ============================================================================

export default pb