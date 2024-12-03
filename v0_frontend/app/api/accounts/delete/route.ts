import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    console.log('Frontend API - Account ID to delete:', accountId);

    if (!accountId || accountId === 'delete') {
      return NextResponse.json(
        { error: 'Invalid Account ID' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/accounts/${accountId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Backend delete error:', error);
      throw new Error(error.message || 'Failed to delete account');
    }

    return NextResponse.json({
      message: 'Account successfully deleted',
    });
  } catch (error: any) {
    console.error('Frontend API - Error deleting account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}
