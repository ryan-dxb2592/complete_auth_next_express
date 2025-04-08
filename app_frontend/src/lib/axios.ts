import axios, { InternalAxiosRequestConfig } from 'axios';
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';

// Create an axios instance with proper CORS credentials
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: true, // This is critical for cookies to be sent and received
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

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

// Request interceptor adds auth header when needed
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Don't log full config to avoid clutter, just log key details
  console.log(`Request: ${config.method?.toUpperCase()} ${config.url}`);
  console.log("WithCredentials:", config.withCredentials);
  
  // Only access cookies in browser context
  if (typeof window !== 'undefined') {
    // Log browser cookies for debugging
    console.log("Browser cookies:", document.cookie);
  } else {
    // Server-side context
    try {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('accessToken')?.value;

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        console.log("Added token to Authorization header (server-side)");
      } else {
        console.log("No accessToken found in cookies (server-side)");
      }
    } catch (error) {
      console.error("Error accessing cookies on server:", error);
    }
  }
  return config;
});

// Response interceptor handles token refresh
api.interceptors.response.use(
  async response => {

    // Server side response handling
    if (typeof window === 'undefined') {

    // Set the accessToken and refreshToken in the cookie store
    console.log("Response data on server side:", response.data);
    console.log("Response cookies on server side:", response.headers['set-cookie']);
    if (response.headers['set-cookie'] && response.headers['set-cookie'].length > 0) {
      
      const accessToken = response.headers['set-cookie'][0].split(';')[0].split('=')[1];
      const refreshToken = response.headers['set-cookie'][1].split(';')[0].split('=')[1];

      console.log("Access token on server side:", accessToken);
      console.log("Refresh token on server side:", refreshToken);
      const cookieStore = await cookies();
      cookieStore.set('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/',
        sameSite: 'lax',
      });
      cookieStore.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
        sameSite: 'lax',
      });
    }
  }

    // Client side response handling
    if (typeof window !== 'undefined') {
      console.log("Response on client side:", response);
    }
    return response;
  },
  async error => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and we haven't retried already
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for the current refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("Refreshing token...");
        
        // For browser environment, log cookies to debug
         // Client-side handling
         if (typeof window !== 'undefined') {
          // Use axios directly to maintain credentials
          const refreshResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh-token`,
            {},
            { withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              }
             }
          );
          console.log("Refreshed token on client-side:", refreshResponse.data);
          
          // For client-side, rely on cookies being set automatically
          return api(originalRequest);
        
        }
        
        // Server-side refresh handling
        const cookieStore = await cookies();
        //  Get the accessToken and refreshToken from the cookie store
        const accessToken = cookieStore.get('accessToken')?.value;
        const refreshToken = cookieStore.get('refreshToken')?.value;

        console.log("Access token from cookie store:", accessToken);
        console.log("Refresh token from cookie store:", refreshToken);


        const refreshResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh-token`,
          {},
          { withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'X-Refresh-Token': refreshToken
            }
          }
        );

        console.log("Token refreshed successfully on server-side", refreshResponse.data);
        
        // If tokens are returned in the response body (for mobile/SPA),
        // we need to handle them manually
        if (refreshResponse.data?.accessToken && refreshResponse.data?.refreshToken) {
          console.log("Tokens received in response body");
          
          // For server-side, we set them in the cookie store
          try {
            const cookieStore = await cookies();
            
            cookieStore.set('accessToken', refreshResponse.data.accessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: 15 * 60 * 1000, // 15 minutes
              path: '/',
              sameSite: 'lax',
            });
            
            cookieStore.set('refreshToken', refreshResponse.data.refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
              path: '/',
              sameSite: 'lax',
            });
          } catch (cookieError) {
            console.error("Error setting cookies after refresh:", cookieError);
          }
        }
        
        processQueue();
        
        // For server-side requests, we need to add the Authorization header
        try {
          const cookieStore = await cookies();
          const newAccessToken = cookieStore.get('accessToken')?.value;
          
          if (newAccessToken) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
        } catch (cookieError) {
          console.error("Error accessing cookies after refresh:", cookieError);
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
