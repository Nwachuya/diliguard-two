// app/api/plans/route.ts (create this new file)

import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

export async function GET(req: NextRequest) {
  try {
    const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;

    if (!pbUrl) {
      return NextResponse.json(
        { error: 'PocketBase URL not configured' },
        { status: 500 }
      );
    }

    const pb = new PocketBase(pbUrl);

    // Fetch all plans from the 'plans' collection
    // No authentication needed for publicly viewable plans, but you could add
    // a listRule in PocketBase if you wanted to restrict access.
    const records = await pb.collection('plans').getFullList({
      sort: 'price', // Sort plans by price, e.g., free first, then cheapest to most expensive
    });

    // Ensure features are parsed correctly if stored as JSON string in PocketBase
    const plans = records.map(record => ({
      ...record,
      features: typeof record.features === 'string' 
                  ? JSON.parse(record.features) 
                  : record.features || [],
    }));

    return NextResponse.json(plans);

  } catch (error: any) {
    console.error('Failed to fetch plans:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve plans' },
      { status: 500 }
    );
  }
}