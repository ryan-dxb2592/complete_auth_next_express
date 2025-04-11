import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, isAuthRoute, isProtectedRoute, clearAuthCookies } from './lib/middleware-helpers/check-auth';
import { verifyAuth } from './lib/middleware-helpers/verify-auth';

// Middleware function to handle token refresh
export async function middleware(request: NextRequest) {
  console.log("Middleware called for:", request.nextUrl.pathname);
  
  const pathname = request.nextUrl.pathname;
  
  // If it's an API route, just continue
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // For auth routes (login, register, etc.)
  if (isAuthRoute(pathname)) {
    // Check if user is already authenticated
    const authStatus = await verifyAuth();
      
    // If verified, redirect to returnUrl or dashboard
    if (authStatus.isAuthenticated) {
      console.log("User already authenticated, redirecting from auth route");
      // Get the returnUrl from the query parameters if it exists
      const returnUrl = request.nextUrl.searchParams.get('returnUrl');
      const redirectUrl = returnUrl ? returnUrl : '/dashboard';
      
      console.log("Return URL:", returnUrl);
      console.log("Redirect URL:", redirectUrl);
      
      // Create a response that redirects to the return URL or dashboard
      const response = NextResponse.redirect(new URL(redirectUrl, request.url));
      
      return response;
    }
  
    // Continue to auth page if verification fails
    console.log("User not authenticated, continuing to auth page");
    
    return NextResponse.next();
  }
  
  // For protected routes, check authentication
  if (isProtectedRoute(pathname)) {
    const authStatus = await checkAuth();
    
    if (!authStatus.isAuthenticated) {
      console.log(`Auth failed: ${authStatus.status}, redirecting to login`);
      
      // Check if this is a redirect from a failed API request with a returnUrl
      const returnUrl = request.nextUrl.searchParams.get('returnUrl');
      const loginUrl = new URL('/auth/signin', request.url);
      
      console.log("Return URL:", returnUrl);
      console.log("Login URL:", loginUrl);
      
      // Include the returnUrl if it exists
      if (returnUrl) {
        loginUrl.searchParams.set('returnUrl', returnUrl);
      } else {
        // Otherwise use the current path as the returnUrl
        loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname);
      }
      
      const response = NextResponse.redirect(loginUrl);
      
      // Clear cookies if auth failed
      if (authStatus.status === 'no_refresh_token' || authStatus.status === 'refresh_failed') {
        clearAuthCookies(response);
      }
      
      return response;
    }
    
    // Handle successful token refresh with returnUrl
    if (authStatus.status === 'tokens_refreshed') {
      const returnUrl = request.nextUrl.searchParams.get('returnUrl');
      
      if (returnUrl) {
        return NextResponse.redirect(new URL(returnUrl, request.url));
      }
    }
    
    // Continue with the request if authenticated
    return NextResponse.next();
  }
  
  // For all other routes, proceed normally
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Add paths that should be protected by the middleware
    '/api/:path*',
    // Exclude the refresh token endpoint to avoid infinite loops
    '/((?!auth/refresh|_next/static|_next/image|favicon.ico).*)',
  ],
}; 