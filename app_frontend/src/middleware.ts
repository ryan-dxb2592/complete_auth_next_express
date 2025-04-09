import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINT, AUTH_ENDPOINTS, COOKIE_NAMES } from './constants';

// Track refresh token state to prevent multiple simultaneous refreshes
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

// Process the queue of failed requests after token refresh
const processQueue = (error?: unknown) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(undefined);
    }
  });
  failedQueue = [];
};

// Middleware function to handle token refresh
export async function middleware(request: NextRequest) {
  console.log("Middleware called for:", request.nextUrl.pathname);
  
  // Skip middleware for non-API routes and static assets
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Get the access token from cookies
  const accessToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  console.log("Access token present:", !!accessToken);
  
  // Clone the request to avoid modifying the original
  const requestHeaders = new Headers(request.headers);
  
  // Set the Authorization header if the access token exists
  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }
  
  // Create the modified request with the updated headers
  const requestClone = new Request(request.url, {
    method: request.method,
    headers: requestHeaders,
    body: request.body,
    redirect: 'manual', // Prevent auto-redirects
  });
  
  try {
    // Forward the request to the API
    console.log("Forwarding request to API:", request.url);
    const response = await fetch(requestClone);
    console.log("API response status:", response.status);
    
    // If the response is not 401 (Unauthorized), return it as is
    if (response.status !== 401) {
      return response;
    }
    
    console.log("Received 401 response, attempting token refresh");
    
    // If we're already refreshing the token, add this request to the queue
    if (isRefreshing) {
      console.log("Token refresh already in progress, adding to queue");
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        // After token refresh, retry the original request
        console.log("Retrying request after token refresh");
        return fetch(requestClone);
      });
    }
    
    // Set refreshing flag to prevent multiple simultaneous refreshes
    isRefreshing = true;
    
    try {
      console.log("Calling refresh token endpoint");
      // Call the refresh token endpoint
      const refreshResponse = await fetch(`${API_ENDPOINT}${AUTH_ENDPOINTS.REFRESH_TOKEN}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log("Refresh token response status:", refreshResponse.status);
      
      if (!refreshResponse.ok) {
        console.error("Token refresh failed with status:", refreshResponse.status);
        // Redirect to login if token refresh fails
        const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
        redirectResponse.cookies.delete(COOKIE_NAMES.ACCESS_TOKEN);
        redirectResponse.cookies.delete(COOKIE_NAMES.REFRESH_TOKEN);
        return redirectResponse;
      }
      
      // Get the new tokens from the response headers
      const setCookieHeaders = refreshResponse.headers.getSetCookie();
      console.log("Received cookies from refresh:", setCookieHeaders?.length || 0);
      
      if (!setCookieHeaders || setCookieHeaders.length < 2) {
        console.error("Missing cookies in refresh response");
        throw new Error('Token refresh response missing cookies');
      }
      
      // Process the queue of failed requests
      processQueue();
      
      // Create a new response with the original request
      console.log("Retrying original request with new token");
      const newResponse = await fetch(requestClone);
      console.log("Retry response status:", newResponse.status);
      
      // Add the new cookies to the response
      const responseWithCookies = new Response(newResponse.body, newResponse);
      setCookieHeaders.forEach(cookie => {
        responseWithCookies.headers.append('Set-Cookie', cookie);
      });
      
      return responseWithCookies;
    } catch (error) {
      console.error("Error during token refresh:", error);
      // Process the queue with the error
      processQueue(error);
      throw error;
    } finally {
      // Reset the refreshing flag
      isRefreshing = false;
    }
  } catch (error) {
    console.error("Error in middleware:", error);
    return NextResponse.error();
  }
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