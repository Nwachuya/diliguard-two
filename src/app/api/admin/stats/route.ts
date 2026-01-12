import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify the requesting user is an admin
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]



   
                    // Create admin client
                const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)
                pb.autoCancellation(false)

                // Try to authenticate, fall back to stored token
                try {
                await pb.collection('_superusers').authWithPassword(
                    process.env.POCKETBASE_ADMIN_EMAIL!,
                    process.env.POCKETBASE_ADMIN_PASSWORD!
                )
                } catch (authError) {
                console.error('Auth with password failed, using stored token:', authError)
                // Fallback to stored token
                if (process.env.POCKETBASE_SUPERUSER_TOKEN) {
                    pb.authStore.save(process.env.POCKETBASE_SUPERUSER_TOKEN, null)
                } else {
                    return NextResponse.json({ error: 'Database auth failed' }, { status: 500 })
                }
                }

    // Verify user token by decoding it
    let userId: string
    try {
      const tokenParts = token.split('.')
      if (tokenParts.length !== 3) {
        return NextResponse.json({ error: 'Invalid token format' }, { status: 401 })
      }
      
      const payload = JSON.parse(atob(tokenParts[1]))
      userId = payload.id
      
      if (!userId) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }

      await pb.collection('users').getOne(userId)
    } catch (e) {
      console.error('Token validation error:', e)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is admin
    let account
    try {
      account = await pb.collection('accounts').getFirstListItem(`user="${userId}"`)
    } catch (e) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    if (account.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get timeframe
    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '6')

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Basic counts
    const [usersResult, activeSubsResult, researchResult, pendingResult, failedResult] = await Promise.all([
      pb.collection('users').getList(1, 1),
      pb.collection('accounts').getList(1, 1, {
        filter: 'subscription_status="active" || subscription_status="trialing"'
      }),
      pb.collection('research').getList(1, 1),
      pb.collection('research').getList(1, 1, { filter: 'status="Pending"' }),
      pb.collection('research').getList(1, 1, { filter: 'status="Error"' }),
    ])

    const newUsersResult = await pb.collection('users').getList(1, 1, {
      filter: `created>="${startOfMonth.toISOString()}"`
    })

    const investigationsThisMonthResult = await pb.collection('research').getList(1, 1, {
      filter: `created>="${startOfMonth.toISOString()}"`
    })

    const allPayments = await pb.collection('payments').getFullList({
      filter: 'status="paid" || status="succeeded"'
    })
    const totalRevenue = allPayments.reduce((sum, p: any) => sum + (p.amount || 0), 0)

    // Revenue over time
    const revenueData: { month: string; revenue: number }[] = []
    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

      const payments = await pb.collection('payments').getFullList({
        filter: `created>="${startDate.toISOString()}" && created<="${endDate.toISOString()}" && (status="paid" || status="succeeded")`
      })

      const revenue = payments.reduce((sum, p: any) => sum + (p.amount || 0), 0)
      revenueData.push({
        month: startDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: revenue / 100,
      })
    }

    // Users over time
    const usersData: { month: string; users: number }[] = []
    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

      const result = await pb.collection('users').getList(1, 1, {
        filter: `created>="${startDate.toISOString()}" && created<="${endDate.toISOString()}"`
      })

      usersData.push({
        month: startDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        users: result.totalItems,
      })
    }

    // Risk distribution
    const riskLevels = [
      { name: 'Low', color: '#22c55e' },
      { name: 'Medium', color: '#eab308' },
      { name: 'High', color: '#f97316' },
      { name: 'Critical', color: '#ef4444' },
    ]

    const riskData: { name: string; value: number; color: string }[] = []
    for (const level of riskLevels) {
      const result = await pb.collection('research').getList(1, 1, {
        filter: `risk_level="${level.name}" && status="Complete"`
      })
      riskData.push({ name: level.name, value: result.totalItems, color: level.color })
    }

    // Subscription distribution
    const subscriptionData: { name: string; value: number; color: string }[] = []
    const plans = [
      { name: 'Free', filter: 'plan_name="Free" || plan_name="" || plan_name=null', color: '#94a3b8' },
      { name: 'Basic', filter: 'plan_name="Basic"', color: '#3b82f6' },
      { name: 'Pro', filter: 'plan_name="Pro"', color: '#8b5cf6' },
    ]
    for (const plan of plans) {
      const result = await pb.collection('accounts').getList(1, 1, { filter: plan.filter })
      subscriptionData.push({ name: plan.name, value: result.totalItems, color: plan.color })
    }

    // Recent data
    const recentUsersResult = await pb.collection('accounts').getList(1, 5, {
      sort: '-created',
      expand: 'user',
    })

    const recentPaymentsResult = await pb.collection('payments').getList(1, 5, {
      sort: '-created',
      expand: 'account,account.user',
    })

    const recentResearchResult = await pb.collection('research').getList(1, 5, {
      sort: '-created',
      expand: 'account,account.user',
    })

    return NextResponse.json({
      stats: {
        totalUsers: usersResult.totalItems,
        activeSubscriptions: activeSubsResult.totalItems,
        totalRevenue,
        totalInvestigations: researchResult.totalItems,
        newUsersThisMonth: newUsersResult.totalItems,
        investigationsThisMonth: investigationsThisMonthResult.totalItems,
        pendingInvestigations: pendingResult.totalItems,
        failedInvestigations: failedResult.totalItems,
      },
      revenueData,
      usersData,
      riskData,
      subscriptionData,
      recentUsers: recentUsersResult.items,
      recentPayments: recentPaymentsResult.items,
      recentResearch: recentResearchResult.items,
    })

  } catch (error: any) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin stats' },
      { status: 500 }
    )
  }
}