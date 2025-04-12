import 'server-only'
import { setCookies } from './set-cookies'
import { 
    decryptAccessToken, 
    decryptRefreshToken, 
    refreshTokens
} from './auth-helpers'

export async function checkAuth() {
    // First check if refresh token exists and is valid
    const refreshTokenData = await decryptRefreshToken()
    
    // If no refresh token or it's expired, return auth failed
    if (!refreshTokenData || refreshTokenData.isExpired) {
        console.log("No valid refresh token")
        return {
            isAuthenticated: false,
            status: 'no_refresh_token'
        }
    }
    
    // Check access token
    const accessTokenData = await decryptAccessToken()
    
    // If access token is valid, continue
    if (accessTokenData && !accessTokenData.isExpired) {
        console.log("Access token valid")
        return {
            isAuthenticated: true,
            status: 'valid_token'
        }
    }
    
    // Access token expired or missing, try to refresh
    console.log("Access token expired or missing, refreshing tokens")
    const refreshTokenResult = await refreshTokens()
    
    if (!refreshTokenResult) {
        // Failed to refresh tokens
        console.log("Failed to refresh tokens")
        return {
            isAuthenticated: false,
            status: 'refresh_failed'
        }
    }
    
    // Successfully refreshed tokens
    console.log("Successfully refreshed tokens")
    await setCookies(refreshTokenResult.response)
    

    // Send access token to the client
    const cookieHeaders = refreshTokenResult.response.headers.getSetCookie();

    const accessToken = cookieHeaders?.find(header => header.startsWith('accessToken='))?.split(';')[0].split('=')[1]

    return {
        isAuthenticated: true,
        status: 'tokens_refreshed',
        accessToken: accessToken
    }
}

// Re-export functions from auth-helpers to maintain backward compatibility
export { 
    isAuthRoute,
    isProtectedRoute,
    clearAuthCookies
} from './auth-helpers'


