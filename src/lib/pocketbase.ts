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
  // Create user
  const user = await pb.collection('users').create({
    email,
    password,
    passwordConfirm: password,
    name,
    emailVisibility: true,
  })
  
  // Authenticate immediately
  await pb.collection('users').authWithPassword(email, password)
  
  // Generate API key
  const key = `dlg_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
  
  // Create account
  await pb.collection('accounts').create({
    user: user.id,
    role: 'user',
    key: key,
    account_status: 'active',
    monthly_usage: 0,
    last_reset_month: new Date().getMonth(),
  })
  
  // Send verification email
  await pb.collection('users').requestVerification(email)
  
  return user
}

export async function signIn(email: string, password: string) {
  const authData = await pb.collection('users').authWithPassword(email, password)
  return authData
}

export async function signOut() {
  pb.authStore.clear()
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
  perPage: number = 10
): Promise<{ items: PaymentWithAccount[]; totalPages: number; totalItems: number }> {
  const result = await pb.collection('payments').getList<PaymentWithAccount>(page, perPage, {
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
  perPage: number = 10
): Promise<{ items: AccountWithUser[]; totalPages: number; totalItems: number }> {
  const result = await pb.collection('accounts').getList<AccountWithUser>(page, perPage, {
    sort: '-created',
    expand: 'user',
  })
  
  return {
    items: result.items,
    totalPages: result.totalPages,
    totalItems: result.totalItems,
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default pb