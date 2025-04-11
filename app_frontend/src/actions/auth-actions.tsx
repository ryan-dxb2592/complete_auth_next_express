'use server'

import { cookies } from 'next/headers';
import { post } from '../lib/fetch-wrapper';
import { API_ENDPOINT, AUTH_ENDPOINTS, COOKIE_NAMES } from '../constants';

// Define types for auth responses
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Sets cookies from a Response object
 * @param response The Response object containing Set-Cookie headers
 */
export const setCookies = async (response: Response) => {
  if (typeof window !== 'undefined') {
    return;
  }

  const cookieStore = await cookies();
  const cookieHeaders = response.headers.getSetCookie();
  
  cookieHeaders?.forEach(cookie => {
    const [cookieValue] = cookie.split(';');
    const [name, value] = cookieValue.split('=');
    cookieStore.set(name, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  });
};

/**
 * Handles Google Sign In
 * @param code The authorization code from Google
 * @returns The authentication response
 */
export const googleSignIn = async (code: string): Promise<AuthResponse> => {
  try {
    // Use the fetch wrapper to make the request
    const { data, error, response } = await post<AuthResponse>(
      AUTH_ENDPOINTS.GOOGLE_AUTH,
      { code }
    );
    
    if (data) {
      console.log("Google sign in response:", data);
    }
    
    if (error) {
      console.error("Google sign in error:", error);
      return {
        success: false,
        message: error.message || "Failed to sign in with Google",
      };
    }
    
    // If we have a response object, set the cookies
    if (response) {
      await setCookies(response);
    }
    
    return data || { success: false, message: "No data returned from server" };
  } catch (error) {
    console.error("Unexpected error during Google sign in:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};

/**
 * Server action to refresh the token
 * This is used by the middleware and fetch wrapper
 * @returns The Response object from the refresh token endpoint
 */
export const refreshTokenAction = async (): Promise<Response> => {
  'use server'
  try {
    // Get current cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
    const refreshToken = cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;
    
    // Make the request to refresh the token
    const response = await fetch(`${API_ENDPOINT}${AUTH_ENDPOINTS.REFRESH_TOKEN}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json', 
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': `refreshToken=${refreshToken}`
      }
    });

    console.log("Refresh Token Response:", response.headers);
    console.log("Refresh Token Response Cookies:", response.headers.getSetCookie());
    
    // Update cookies after refresh
    // await setCookies(response);

    if (typeof window !== 'undefined') {
      return response;
    }

    const cookieHeaders = response.headers.getSetCookie();

    cookieHeaders?.forEach(cookie => {
      const [cookieValue] = cookie.split(';');
      const [name, value] = cookieValue.split('=');
      cookieStore.set(name, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    });
    
    return response;
  } catch (error) {
    console.error("Error in refreshTokenAction:", error);
    throw error;
  }
};

/**
 * Manually triggers a refresh token request
 * @returns Response data from the refresh token endpoint
 */
export const refreshTokenManual = async (): Promise<RefreshTokenResponse> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  const refreshToken = cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;


  try {
    // Get the current URL to construct an absolute URL for the refresh endpoint
    const currentUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Call our API route handler to refresh the token with an absolute URL
    const response = await fetch(`${currentUrl}/api/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json', 
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': `refreshToken=${refreshToken}`
      },
      cache: 'no-store'
    });

    
    
    if (!response) {
      console.error("Token refresh error:", "Failed to refresh token");
      return {
        success: false,
        message:"Failed to refresh token",
      };
    }

    // Update cookies
    const setCookieHeaders = response.headers.getSetCookie();

    setCookieHeaders.forEach(cookie => {
      const [cookieValue] = cookie.split(';');
              const [name, value] = cookieValue.split('=');
      cookieStore.set(name, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    });



    return {
      success: true,
      message: "Token refreshed successfully",
         };
  } catch (error) {
    console.error("Unexpected error during token refresh:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};
