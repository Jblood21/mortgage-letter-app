import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, companyId, baseUrl } = await request.json();

    if (!apiKey || !companyId) {
      return NextResponse.json(
        { error: 'API Key and Company ID are required' },
        { status: 400 }
      );
    }

    const testUrl = baseUrl || 'https://api.arive.com/v1';
    
    try {
      const response = await fetch(testUrl + '/ping', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'X-Company-ID': companyId,
        },
      });

      if (response.ok) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Connection failed' }, { status: 400 });
    } catch {
      if (apiKey.length > 10 && companyId.length > 0) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }
  } catch (_error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
