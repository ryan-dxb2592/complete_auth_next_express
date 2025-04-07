'use server'

import api from '../lib/axios';
import { cookies } from 'next/headers';

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
    
    console.log("Auth response status:", response.status);
    console.log("Auth response headers:", JSON.stringify(response.headers, null, 2));
    
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

