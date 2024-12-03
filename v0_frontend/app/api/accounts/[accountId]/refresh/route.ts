import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  try {
    const { accountId } = params;
    const response = await fetch(`${process.env.BACKEND_URL}/accounts/${accountId}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error refreshing account:', error);
    return NextResponse.json(
      { error: 'Failed to refresh account' },
      { status: 500 }
    );
  }
}
