import 'server-only';
import { setCookies } from './set-cookies';
import { 
    decryptAccessToken, 
    decryptRefreshToken, 
    refreshTokens,
    verifyAccessToken
} from './auth-helpers';

export async function verifyAuth() {
    // First check if refresh token exists and is valid
    const refreshTokenData = await decryptRefreshToken();
    
    // If no refresh token or it's expired, authentication fails
    if (!refreshTokenData || refreshTokenData.isExpired) {
        console.log("No valid refresh token for verification");
        return {
            isAuthenticated: false,
            status: 'no_refresh_token'
        };
    }
    
    // Check access token
    const accessTokenData = await decryptAccessToken();
    
    // If no access token, auth fails
    if (!accessTokenData) {
        console.log("No access token for verification");
        return {
            isAuthenticated: false,
            status: 'no_access_token'
        };
    }
    
    // If access token is valid and not expired, verify it with the API
    if (!accessTokenData.isExpired) {
        console.log("Verifying access token with API");
        const verificationResult = await verifyAccessToken(accessTokenData.accessToken);
        
        if (verificationResult.isValid) {
            console.log("Access token verified successfully");
            return {
                isAuthenticated: true,
                status: 'token_verified'
            };
        }
        
        // If verification fails but not due to expiration, authentication fails
        if (verificationResult.status !== 401) {
            console.log("Access token verification failed with status:", verificationResult.status);
            return {
                isAuthenticated: false,
                status: 'verification_failed'
            };
        }
    }
    
    // If we reach here, either the token is expired or verification returned 401
    // Try to refresh tokens
    console.log("Access token expired or invalid, refreshing tokens");
    const refreshTokenResult = await refreshTokens();
    
    if (!refreshTokenResult) {
        // Failed to refresh tokens
        console.log("Failed to refresh tokens during verification");
        return {
            isAuthenticated: false,
            status: 'refresh_failed'
        };
    }
    
    // Successfully refreshed tokens
    console.log("Successfully refreshed tokens during verification");
    await setCookies(refreshTokenResult.response);
    
    return {
        isAuthenticated: true,
        status: 'tokens_refreshed'
    };
}
