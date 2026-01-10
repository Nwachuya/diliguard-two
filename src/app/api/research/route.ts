import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const {
      authToken,
      accountId,
      primary_name,
      entity_type,
      location,
      url,
      industry,
      tax_reg,
      known_aliases,
    } = body

    if (!authToken || !accountId || !primary_name || !entity_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL
    
    if (!pbUrl) {
      return NextResponse.json(
        { error: 'PocketBase URL not configured' },
        { status: 500 }
      )
    }

    // Initialize PocketBase with user's auth token
    const pb = new PocketBase(pbUrl)
    pb.authStore.save(authToken, null)

    if (!pb.authStore.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date().toISOString()

    // 1. Create research record
    const research = await pb.collection('research').create({
      account: accountId,
      date: now,
      scan_timestamp: now,
      status: 'Pending',
      primary_name: primary_name.trim(),
      entity_type,
      location: location?.trim() || null,
      url: url?.trim() || null,
      industry: industry?.trim() || null,
      tax_reg: tax_reg?.trim() || null,
      known_aliases: known_aliases?.trim() || null,
    })

    // 2. Increment monthly usage
    const account = await pb.collection('accounts').getOne(accountId)
    await pb.collection('accounts').update(accountId, {
      monthly_usage: (account.monthly_usage || 0) + 1,
    })

    // 3. Hardcoded webhook URL for now
    const webhookUrl = 'https://n8n.canvass.africa/webhook/diliguard'

    // 4. Send to webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        research_id: research.id,
        account_id: accountId,
        primary_name: primary_name.trim(),
        entity_type,
        location: location?.trim() || '',
        url: url?.trim() || '',
        industry: industry?.trim() || '',
        tax_reg: tax_reg?.trim() || '',
        known_aliases: known_aliases?.trim() || '',
      }),
    })

    if (!webhookResponse.ok) {
      await pb.collection('research').update(research.id, {
        status: 'Error',
        error_log: 'Webhook request failed',
      })
      
      return NextResponse.json(
        { error: 'Failed to initiate research' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      research_id: research.id,
    })

  } catch (error: any) {
    console.error('Research API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}