import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

export const dynamic = 'force-dynamic'

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)
    pb.autoCancellation(false)
    pb.authStore.save(process.env.POCKETBASE_SUPERUSER_TOKEN!, null)

    // Verify user is admin
    let userId: string
    try {
      const tokenParts = token.split('.')
      const payload = JSON.parse(atob(tokenParts[1]))
      userId = payload.id
      await pb.collection('users').getOne(userId)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const account = await pb.collection('accounts').getFirstListItem(`user="${userId}"`)
    if (account.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const sort = searchParams.get('sort') || '-created'

    // Build filter
    let filter = ''
    const filters: string[] = []

    if (search) {
      filters.push(`(user.email~"${search}" || user.name~"${search}")`)
    }
    if (role) {
      filters.push(`role="${role}"`)
    }
    if (status) {
      filters.push(`subscription_status="${status}"`)
    }

    filter = filters.join(' && ')

    // Fetch accounts with user data
    const result = await pb.collection('accounts').getList(page, perPage, {
      filter,
      sort,
      expand: 'user',
    })

    return NextResponse.json({
      items: result.items,
      page: result.page,
      perPage: result.perPage,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    })

  } catch (error: any) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// PATCH - Update user
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)
    pb.autoCancellation(false)
    pb.authStore.save(process.env.POCKETBASE_SUPERUSER_TOKEN!, null)

    // Verify user is admin
    let userId: string
    try {
      const tokenParts = token.split('.')
      const payload = JSON.parse(atob(tokenParts[1]))
      userId = payload.id
      await pb.collection('users').getOne(userId)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const adminAccount = await pb.collection('accounts').getFirstListItem(`user="${userId}"`)
    if (adminAccount.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get update data
    const body = await request.json()
    const { accountId, updates } = body

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    // Allowed fields to update
    const allowedFields = ['role', 'subscription_status', 'plan_name', 'account_status']
    const sanitizedUpdates: Record<string, any> = {}
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field]
      }
    }

    const updated = await pb.collection('accounts').update(accountId, sanitizedUpdates)

    return NextResponse.json({ success: true, account: updated })

  } catch (error: any) {
    console.error('Admin update user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)
    pb.autoCancellation(false)
    pb.authStore.save(process.env.POCKETBASE_SUPERUSER_TOKEN!, null)

    // Verify user is admin
    let adminUserId: string
    try {
      const tokenParts = token.split('.')
      const payload = JSON.parse(atob(tokenParts[1]))
      adminUserId = payload.id
      await pb.collection('users').getOne(adminUserId)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const adminAccount = await pb.collection('accounts').getFirstListItem(`user="${adminUserId}"`)
    if (adminAccount.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get account to delete
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    // Get the account to find the user
    const account = await pb.collection('accounts').getOne(accountId)
    
    // Prevent self-deletion
    if (account.user === adminUserId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Delete account first, then user
    await pb.collection('accounts').delete(accountId)
    await pb.collection('users').delete(account.user)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Admin delete user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    )
  }
}