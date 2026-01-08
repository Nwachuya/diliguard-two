import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // TODO: Implement webhook logic here
  // For now, just acknowledge receipt
  console.log('Received Stripe webhook');
  return NextResponse.json({ received: true });
}
