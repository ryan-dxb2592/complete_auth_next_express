# Authentication Flow System

This system handles authentication and token refresh in Next.js with middleware.

## Key Features

- Middleware-based token validation and refresh
- Redirection to original path after successful token refresh
- HTTP-only cookies for secure token storage
- Automatic handling of expired tokens
- Server and client-side authentication handling

## How It Works

### Authentication Flow

1. When a fetch request returns 401 (Unauthorized):
   - On the client side: The client clears existing cookies and redirects to login with a returnUrl parameter
   - On the server side: The Next.js redirect function is used to redirect to the login page

2. The middleware:
   - For auth routes (like signin), checks if the user is already authenticated
     - If authenticated, redirects to dashboard or other specified page
     - If not, allows access to the auth page

   - For protected routes:
     - Checks if refresh token exists and is valid
     - If not valid, redirects to login page
     - If valid but access token is expired, attempts to refresh tokens
     - After successful token refresh, redirects back to the original path

### Code Flow

1. User accesses a protected page or makes an API request
2. If tokens are invalid/expired, they get a 401 response
3. Fetch wrapper handles the 401 based on environment:
   - Client-side: Redirects to login with returnUrl parameter
   - Server-side: Uses Next.js redirect function
4. After login (or token refresh), middleware redirects back to original path
5. When the page loads, components naturally make their API requests again

## Server Actions

For server actions or server components that need special handling:

```tsx
// Add the noRedirect option to handle 401 responses manually
const { data, error, status } = await get<User>('/api/user/me', { noRedirect: true });

// Handle 401 status manually
if (status === 401) {
  redirect('/auth/signin');
}
```

## Protected Routes

Protected routes are defined in the `isProtectedRoute` function in `middleware-helpers/check-auth.ts`. Add your protected routes to this function to ensure they require authentication.

```tsx
export function isProtectedRoute(pathname: string): boolean {
  const protectedPaths = [
    '/dashboard',
    '/profile',
    '/settings',
    // Add more protected routes here
  ];
  
  return protectedPaths.some(path => pathname.startsWith(path));
}
```

## Configuration

The `middleware.ts` file configures which paths the middleware runs on:

```tsx
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!auth/refresh|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

This matcher ensures that the middleware runs on all paths except for static assets and specific excluded paths. 