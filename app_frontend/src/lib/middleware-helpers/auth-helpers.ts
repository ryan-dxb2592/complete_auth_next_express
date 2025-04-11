import 'server-only'
import { getAccessToken, getRefreshToken } from './get-cookies'
import { decodeJwt } from 'jose'
import { NextResponse } from 'next/server'
import { API_ENDPOINT, AUTH_ENDPOINTS } from '@/constants'

// Access Token Decryption
export const decryptAccessToken = async () => {
    const accessToken = await getAccessToken()
    if (!accessToken) {
        return null
    }

    console.log("accessToken", accessToken)

    const decoded = await decodeJwt(accessToken)

    // check if the token is expired
    const isExpired = decoded?.exp && decoded.exp < Date.now() / 1000
    console.log("Access Token isExpired", isExpired)

    return { decoded, isExpired, accessToken }
}

// Refresh Token Decryption
export const decryptRefreshToken = async () => {
    const refreshToken = await getRefreshToken()
    if (!refreshToken) {
        return null
    }

    const decoded = await decodeJwt(refreshToken)

    // check if token is expired
    const isExpired = decoded?.exp && decoded.exp < Date.now() / 1000
    console.log("Refresh Token isExpired", isExpired)

    return { decoded, isExpired, refreshToken }
}

export async function refreshTokens() {
    console.log("Refreshing tokens")
    const currentRefreshToken = await getRefreshToken()
    if (!currentRefreshToken) {
        return null
    }

    try {
        const response = await fetch(API_ENDPOINT + AUTH_ENDPOINTS.REFRESH_TOKEN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `refreshToken=${currentRefreshToken}`,
            },
            credentials: 'include',
        })

        if (!response.ok) {
            throw new Error('Failed to refresh tokens')
        }

        return {
            success: true,
            message: 'Tokens refreshed successfully',
            response: response,
        }
    } catch (error) {
        console.error('Error refreshing tokens:', error)
        return null
    }
}

// Verify access token with API
export async function verifyAccessToken(accessToken: string) {
    try {
        const response = await fetch(API_ENDPOINT + AUTH_ENDPOINTS.VERIFY_AUTH, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
            credentials: 'include',
        });
        
        return { 
            isValid: response.ok,
            status: response.status
        };
    } catch (error) {
        console.error('Error verifying access token:', error);
        return {
            isValid: false,
            status: 500
        };
    }
}

// Helper to clear auth cookies
export function clearAuthCookies(response: NextResponse) {
    response.cookies.delete('accessToken')
    response.cookies.delete('refreshToken')
    return response
}

export function isAuthRoute(pathname: string): boolean {
    return pathname.startsWith('/auth/')
}

export function isProtectedRoute(pathname: string): boolean {
    // Add your protected routes here
    const protectedPaths = [
        '/dashboard',
        '/profile',
        '/settings',
        // Add more protected routes as needed
    ]
    
    return protectedPaths.some(path => pathname.startsWith(path))
} 