import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

export const dynamic = 'force-dynamic'; // Ensure no caching for real-time data

// --- FIX 1: Replace atob/btoa with Node.js Buffer for base64 decoding ---
function decodeJwtPayload(token: string) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format (expected 3 parts)');
        }
        // Use Node.js Buffer for base64 decoding
        return JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    } catch (e: any) {
        console.error("Failed to decode token payload:", e.message);
        return null;
    }
}
// --- END FIX 1 ---

export async function GET(request: NextRequest) {
  // --- FIX 2: Initialize pb to null so it's always defined ---
  let pb: PocketBase | null = null;
  // --- END FIX 2 ---

  try {
    // 1. Establish INTERNAL PocketBase client with ADMIN credentials FIRST
    pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL); // Assign here
    pb.autoCancellation(false); // Recommended for server-side operations

    // --- FIX 3: Ensure environment variables are non-null for authWithPassword ---
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL?.trim();
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD?.trim();

    if (!adminEmail || !adminPassword) {
      console.error('Admin Payments API: Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD environment variables.');
      return NextResponse.json({ error: 'Server configuration error: Admin credentials missing' }, { status: 500 });
    }
    // --- END FIX 3 ---

    try {
      await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
    } catch (authError: any) {
      console.error('Admin Payments API: Internal PocketBase admin auth (email/password) failed:', authError.message);
      if (process.env.POCKETBASE_SUPERUSER_TOKEN) {
        // --- Also trim fallback token ---
        pb.authStore.save(process.env.POCKETBASE_SUPERUSER_TOKEN.trim(), null);
        try {
          await pb.collection('_superusers').authRefresh();
          console.log('Admin Payments API: Internal PocketBase admin auth successful using fallback token.');
        } catch (refreshError: any) {
          console.error('Admin Payments API: Internal PocketBase admin auth (fallback token refresh) failed:', refreshError.message);
          return NextResponse.json({ error: 'Server DB auth failed: Superuser token invalid or expired' }, { status: 500 });
        }
      } else {
        console.error('Admin Payments API: Server DB auth failed: No valid admin email/password or fallback superuser token configured.');
        return NextResponse.json({ error: 'Server DB authentication failed' }, { status: 500 });
      }
    }
    // --- SERVER'S INTERNAL POCKETBASE CLIENT IS NOW AUTHENTICATED AS SUPERUSER ---


    // 2. Validate the requesting CLIENT'S token and ADMIN ROLE
    // This part directly mirrors the logic in your working stats/route.ts.
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Admin Payments API: Client Unauthorized - Missing or invalid Authorization header.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientToken = authHeader.split(' ')[1];

    // Decode client token to extract userId using the corrected function
    const payload = decodeJwtPayload(clientToken);
    if (!payload || !payload.id || payload.collectionId !== 'users') {
        console.warn('Admin Payments API: Invalid client token payload or not a user token.');
        return NextResponse.json({ error: 'Invalid client token' }, { status: 401 });
    }
    const userId = payload.id;

    // Verify user existence with the superuser-authenticated 'pb' client
    // This will throw an error if the user ID from the token doesn't exist
    await pb.collection('users').getOne(userId);

    // Now, check if this user's associated account has the 'admin' role,
    // also using the superuser-authenticated 'pb' client.
    let account;
    try {
      account = await pb.collection('accounts').getFirstListItem(`user="${userId}"`);
    } catch (e: any) {
      console.warn(`Admin Payments API: Account not found for user ID: ${userId}. Error: ${e.message}`);
      return NextResponse.json({ error: 'Client account not found or not linked to a user' }, { status: 404 });
    }

    if (account.role !== 'admin') {
      console.warn(`Admin Payments API: User ${userId} (account ${account.id}) tried to access admin page without 'admin' role.`);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    // --- CLIENT TOKEN AND ADMIN ROLE VERIFIED ---


    // 3. Parse query parameters from the client request
    const { searchParams } = new URL(request.url); // request.nextUrl.searchParams is also an option for newer Next.js
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '10');
    const statusFilter = searchParams.get('statusFilter') as 'all' | 'succeeded' | 'paid' | 'pending' | 'failed' || 'all';
    const dateFilter = searchParams.get('dateFilter') as 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'all';
    const searchQuery = searchParams.get('searchQuery') || '';


    // 4. Build PocketBase filter string for the payments list
    const listFilters: string[] = [];
    const now = new Date();

    let startDateForList: Date | null = null;
    let endDateForList: Date | null = null;

    switch (dateFilter) {
      case 'this_month':
        startDateForList = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_month':
        startDateForList = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDateForList = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'last_3_months':
        startDateForList = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
    }

    if (startDateForList) {
      listFilters.push(`created>="${startDateForList.toISOString()}"`);
    }
    if (endDateForList) {
      listFilters.push(`created<="${endDateForList.toISOString()}"`);
    }

    if (statusFilter !== 'all') {
      listFilters.push(`status="${statusFilter}"`);
    }

    if (searchQuery.trim()) {
      // Searching by user email (requires expand) or payment IDs
      // Ensure 'expand.account.expand.user.email' is correct for your expanded relations
      // The `%` are wildcards for partial matches in PocketBase.
      listFilters.push(`(expand.account.expand.user.email~"%${searchQuery.trim()}%" || stripe_payment_id~"%${searchQuery.trim()}%" || id~"%${searchQuery.trim()}%")`);
    }

    const finalFilterString = listFilters.length > 0 ? listFilters.join(' && ') : undefined;


    // 5. Fetch statistics data and the paginated list concurrently
    // These dashboard-style stats are independent of the list's filters.
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      thisMonthPaymentsRaw,
      lastMonthPaymentsRaw,
      totalTransactionsResult,
      failedTransactionsResult,
      paymentsListResult // Fetch the paginated list concurrently
    ] = await Promise.all([
      // Revenue This Month (always current month, paid/succeeded)
      pb.collection('payments').getFullList({
        filter: `created>="${startOfThisMonth.toISOString()}" && (status="paid" || status="succeeded")`,
      }),
      // Revenue Last Month (always last month, paid/succeeded)
      pb.collection('payments').getFullList({
        filter: `created>="${startOfLastMonth.toISOString()}" && created<="${endOfLastMonth.toISOString()}" && (status="paid" || status="succeeded")`,
      }),
      // Total Transactions (total count, no filter)
      pb.collection('payments').getList(1, 1), // Only need totalItems from PocketBase's ListResult
      // Failed Transactions (total count for failed status)
      pb.collection('payments').getList(1, 1, { filter: 'status="failed"' }), // Only need totalItems
      // Paginated Payments List (uses client-provided filters)
      pb.collection('payments').getList(page, perPage, {
        filter: finalFilterString,
        sort: '-created', // Default sort by most recent creation date
        expand: 'account.user', // Critical for searching by user email and displaying it
      }),
    ]);

    const revenueThisMonth = thisMonthPaymentsRaw.reduce((sum, p: any) => sum + (p.amount || 0), 0);
    const revenueLastMonth = lastMonthPaymentsRaw.reduce((sum, p: any) => sum + (p.amount || 0), 0);
    const totalTransactions = totalTransactionsResult.totalItems;
    const failedTransactions = failedTransactionsResult.totalItems;


    // 6. Return combined JSON response
    return NextResponse.json({
      stats: {
        revenueThisMonth,
        revenueLastMonth,
        totalTransactions,
        failedTransactions,
      },
      payments: {
        items: paymentsListResult.items,
        page: paymentsListResult.page,
        perPage: paymentsListResult.perPage,
        totalItems: paymentsListResult.totalItems,
        totalPages: paymentsListResult.totalPages,
      },
    });

  } catch (error: any) {
    console.error('Admin Payments API experienced an error in catch block:', error);
    // Provide specific error messages and status codes to guide client-side handling
    if (error.status === 401) {
        return NextResponse.json({ error: 'Client token invalid or expired.' }, { status: 401 });
    }
    if (error.status === 403) {
        return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }
    if (error.status === 404 && (error.message.includes('Account not found') || error.message.includes('user not found'))) {
        return NextResponse.json({ error: 'User account or linked user not found for client token.' }, { status: 404 });
    }
    // General server error for unexpected issues
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin payments data due to server error.' },
      { status: error.status || 500 }
    );
  } finally {
    // Crucial: Clear the internal pb client's authStore after the request.
    // This prevents stale tokens or credential leakage across requests, as Next.js API routes are stateless.
    // Use optional chaining for pb as it might be null if construction failed.
    if (pb?.authStore.token) {
        pb.authStore.clear();
    }
  }
}