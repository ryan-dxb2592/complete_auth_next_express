'use server'

import api from '../lib/axios';
import { cookies } from 'next/headers';
import { AxiosError } from 'axios';

// Google Sign In
export const googleSignIn = async (code: string) => {
  try {
    console.log("Starting Google Sign In with code");
    
    // Create a special config for this request to ensure it works properly with CORS
    const response = await api.post("/api/v1/auth/google-auth", 
      { code },
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
        
    // Log cookies to see if they're being set correctly
    const cookieStore = await cookies();
    console.log("Cookie store after auth:", cookieStore.getAll().map(c => c.name));
    
    // Important: no need to manually set cookies server-side
    // The browser will receive and store the cookies directly from the API response
    // The server actions shouldn't try to manipulate cookies that should be managed by the browser
    
    // Return the data from the response (without sensitive token information)
    const responseData = { ...response.data };
    // Remove sensitive token data if it exists in the response
    delete responseData.accessToken;
    delete responseData.refreshToken;
    
    return responseData;
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    throw error;
  }
};

/**
 * Manually triggers a refresh token request
 * @returns Response data from the refresh token endpoint
 */
export const refreshTokenManual = async () => {
  try {
    console.log("Manually triggering refresh token");
    
    // Get current cookies to include in debug info
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;
    
    const hasTokens = {
      accessToken: !!accessToken,
      refreshToken: !!refreshToken
    };
    
    console.log("Tokens present before refresh:", hasTokens);
    
    // Make the request to refresh the token
    const response = await api.post("/api/v1/auth/refresh-token", 
      {}, 
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    // Check cookies after refresh
    const updatedCookieStore = await cookies();
    console.log("Cookie store after refresh:", updatedCookieStore.getAll().map(c => c.name));
    
    // Return response data for debugging but remove sensitive info
    const responseData = { 
      success: true,
      message: response.data.message || "Token refreshed successfully",
      status: response.status,
      cookiesBefore: hasTokens,
      cookiesAfter: {
        accessToken: !!updatedCookieStore.get('accessToken')?.value,
        refreshToken: !!updatedCookieStore.get('refreshToken')?.value
      }
    };
    
    return responseData;
  } catch (error: unknown) {
    console.error("Error during manual token refresh:", error);
    
    const axiosError = error as AxiosError;
    
    // Return structured error response
    return {
      success: false,
      message: axiosError.message || "Failed to refresh token",
      status: axiosError.response?.status || 500,
      error: axiosError.response?.data || axiosError.message
    };
  }
};

