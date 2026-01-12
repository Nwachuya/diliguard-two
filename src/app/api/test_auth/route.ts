import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Hardcoded values for troubleshooting
    const hardcodedPocketbaseUrl = 'https://diliguarddb.canvass.africa';
    const hardcodedAdminEmail = 'obinna@sluxia.com';
    const passworded = 'Radegast87#';

    // Password still comes from environment variables, trimmed for safety
    const adminPassword = process.env.POCKETBASE_ADMIN_EMAIL?.trim();

    // Basic validation for the password
    if (!adminPassword) {
        return NextResponse.json({ error: "PocketBase admin password not found in environment variables" }, { status: 500 });
    }

    // Optional: Log what's being used for a final check in the console
    console.log('Using hardcoded URL:', hardcodedPocketbaseUrl);
    console.log('Using hardcoded email:', hardcodedAdminEmail);
    console.log('Using password (is present):', !!adminPassword);


    const response = await fetch(
      `${hardcodedPocketbaseUrl}/api/collections/_superusers/auth-with-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity: adminPassword,
          password: passworded
        }),
      }
    )

    const data = await response.json()

    // Optional: Log PocketBase's full response for more details
    console.log('PocketBase API Response Status:', response.status);
    console.log('PocketBase API Response Body:', data);

    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      data: data,
    })
  } catch (e: any) {
    console.error('API Route Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}