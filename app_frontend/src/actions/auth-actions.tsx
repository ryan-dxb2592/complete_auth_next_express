'use server'

import { cookies } from 'next/headers';
import { post } from './fetch-wrapper';
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
  'use server'
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
 * Manually triggers a refresh token request
 * @returns Response data from the refresh token endpoint
 */
export const refreshTokenManual = async (): Promise<RefreshTokenResponse> => {
  try {
    // Get current cookies to include in debug info
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
    
    // Make the request to refresh the token using our fetch wrapper
    const { data, error, response } = await post<RefreshTokenResponse>(
      AUTH_ENDPOINTS.REFRESH_TOKEN,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );
    
    if (error) {
      console.error("Token refresh error:", error);
      return {
        success: false,
        message: error.message || "Failed to refresh token",
      };
    }
    
    // If we have a response object, set the cookies
    if (response) {
      await setCookies(response);
    }
    
    return data || { success: false, message: "No data returned from server" };
  } catch (error) {
    console.error("Unexpected error during token refresh:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};

/**
 * Server action to refresh the token
 * This is used by the middleware
 * @returns The Response object from the refresh token endpoint
 */
export const refreshTokenAction = async (): Promise<Response> => {
  try {
    // Get current cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
    
    // Make the request to refresh the token
    const response = await fetch(`${API_ENDPOINT}${AUTH_ENDPOINTS.REFRESH_TOKEN}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json', 
        'Authorization': `Bearer ${accessToken}`,
      }
    });
    
    // Update cookies after refresh
    await setCookies(response);
    
    return response;
  } catch (error) {
    console.error("Error in refreshTokenAction:", error);
    throw error;
  }
};
