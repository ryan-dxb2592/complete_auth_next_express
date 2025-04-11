import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINT, AUTH_ENDPOINTS, COOKIE_NAMES } from '@/constants';

export async function POST(request: NextRequest) {
  try {
    // Get the refresh token from the request
    const refreshToken = request.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;
    
    
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token not found' },
        { status: 401 }
      );
    }
    
    // Make the request to the backend refresh token endpoint
    const response = await fetch(`${API_ENDPOINT}${AUTH_ENDPOINTS.REFRESH_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refreshToken=${refreshToken}`
      },
      credentials: 'include',
      cache: 'no-store'
    });

    
    // Get the response data
    const data = await response.json();

    
    
    // Create a new response
    return new Response(data, { status: response.status, headers: response.headers })
  } catch (error) {
    console.error('Error in refresh token route:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
