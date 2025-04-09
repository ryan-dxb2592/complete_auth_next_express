
import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getAccessToken } from './get-cookies';

// Create an axios instance with proper CORS credentials
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/',
  withCredentials: true, // This is critical for cookies to be sent and received
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Custom adapter to use Next.js fetch API
const customAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const { url, method, data, headers, baseURL } = config;
  
  // Construct the full URL
  const fullUrl = `${baseURL}${url}`;
  
  // Prepare the fetch options
  const fetchOptions: RequestInit = {
    method: method?.toUpperCase(),
    headers: headers as HeadersInit,
    credentials: 'include',
  };
  
  // Add body for non-GET requests
  if (data && method !== 'get') {
    fetchOptions.body = JSON.stringify(data);
  }
  
  // Use the Next.js fetch API
  const response = await fetch(fullUrl, fetchOptions);
  
  // Convert the response to the format expected by axios
  const responseData = await response.json();
  
  // Convert Headers to the format expected by axios
  const axiosHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    axiosHeaders[key] = value;
  });
  
  return {
    data: responseData,
    status: response.status,
    statusText: response.statusText,
    headers: axiosHeaders,
    config,
  } as AxiosResponse;
};

// Set the custom adapter
api.defaults.adapter = customAdapter;

// Request interceptor adds auth header when needed
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Only try to access cookies on the server side
  if (typeof window === 'undefined') {
    try {
      
      const accessToken = await getAccessToken();
      
      // Add access token to all requests if available
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.error('Error accessing cookies:', error);
    }
  } else {
    // On the client side, cookies are automatically included with credentials: 'include'
    // We can still check for the token in localStorage if needed
    const accessToken = await getAccessToken();
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
  }

  // Log key request details
  console.log('Request:', {
    url: config.url,
    method: config.method,
    hasAccessToken: !!config.headers['Authorization']
  });
  
  return config;
});

// Simplified response interceptor - no token refresh logic needed
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error details
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    
    return Promise.reject(error);
  }
);

export default api;
