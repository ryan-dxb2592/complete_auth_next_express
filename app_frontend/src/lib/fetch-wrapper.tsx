import { API_ENDPOINT } from '../constants';
import { cookies } from 'next/headers';

// Define types for the fetch options
type FetchOptions = RequestInit & {
  params?: Record<string, string>;
  noRedirect?: boolean; // Option to disable automatic redirect on 401
};

// Define the response type
type FetchResponse<T> = {
  data: T | null;
  error: Error | null;
  status: number;
  response?: Response; // Add the original Response object
};

// Define a type for request body data
type RequestData = Record<string, unknown> | string | number | boolean | null | undefined;

// Detect if code is running on server or client
const isServer = typeof window === 'undefined';

// Helper function to get the token
const getAccessToken = async () => {
  if (isServer) {
    const cookieStore = await cookies();
    return cookieStore.get("accessToken")?.value;
  } else {
    // Client-side token extraction
    const cookies = document.cookie.split(';');
    const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
    if (accessTokenCookie) {
      return accessTokenCookie.split('=')[1].trim();
    }
    return undefined;
  }
};

/**
 * A wrapper around the fetch API that handles common patterns like:
 * - Adding authentication headers
 * - Handling errors
 * - Parsing JSON responses
 * - Adding query parameters
 * 
 * @param endpoint - The API endpoint to fetch from
 * @param options - Fetch options including headers, method, body, etc.
 * @returns A promise that resolves to the data or rejects with an error
 */
export async function fetchWrapper<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  const {
    params,
    headers = {},
    noRedirect = false,
    ...restOptions
  } = options;

  // Get the access token
  const accessToken = await getAccessToken();

  // Construct the full URL with query parameters if provided
  let url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_ENDPOINT}${endpoint}`;

  if (params) {
    const queryParams = new URLSearchParams(params);
    url = `${url}${url.includes('?') ? '&' : '?'}${queryParams.toString()}`;
  }

  // Prepare headers
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };
  
  // Only add Authorization header if we have a token
  if (accessToken) {
    Object.assign(requestHeaders, { 'Authorization': `Bearer ${accessToken}` });
  }

  // Add credentials to include cookies
  const fetchOptions: RequestInit = {
    ...restOptions,
    headers: requestHeaders,
    credentials: 'include',
    cache: 'no-store',
  };

  try {
    // Make the fetch request
    const response = await fetch(url, fetchOptions);
    
    // Handle different response statuses
    if (response.status === 204) {
      return { data: null, error: null, status: response.status, response };
    }

    // If we get a 401 Unauthorized
    if (response.status === 401 && !noRedirect) {
      // Handle based on client/server
      if (isServer) {
        // Server-side handling - return an error object that indicates redirection is needed
        // Don't attempt to redirect directly in a data fetching function
        return {
          data: null,
          error: new Error('Unauthorized - Redirect needed'),
          status: response.status,
          response,
        };
      } else {
        // Client-side handling
        // Get the current path for redirect after login
        const currentPath = window.location.pathname;
        
        // Clear cookies
        document.cookie = 'accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        
        // Redirect to login with returnUrl parameter
        window.location.href = `/auth/signin?returnUrl=${encodeURIComponent(currentPath)}`;
      }
      
      return {
        data: null,
        error: new Error('Unauthorized - Please login'),
        status: response.status,
        response,
      };
    }

    // Parse the JSON response
    const data = await response.json();

    // Check if the response was successful
    if (!response.ok) {
      // Return the error with the response data
      return {
        data: null,
        error: new Error(data.message || 'An error occurred'),
        status: response.status,
        response,
      };
    }

    // Return the successful response
    return {
      data,
      error: null,
      status: response.status,
      response,
    };
  } catch (error) {
    // Handle network errors or JSON parsing errors
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
      status: 500,
    };
  }
}

/**
 * Helper function for GET requests
 */
export function get<T>(endpoint: string, options: Omit<FetchOptions, 'method'> = {}) {
  return fetchWrapper<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * Helper function for POST requests
 */
export function post<T>(endpoint: string, data?: RequestData, options: Omit<FetchOptions, 'method' | 'body'> = {}) {
  return fetchWrapper<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Helper function for PUT requests
 */
export function put<T>(endpoint: string, data?: RequestData, options: Omit<FetchOptions, 'method' | 'body'> = {}) {
  return fetchWrapper<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Helper function for PATCH requests
 */
export function patch<T>(endpoint: string, data?: RequestData, options: Omit<FetchOptions, 'method' | 'body'> = {}) {
  return fetchWrapper<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Helper function for DELETE requests
 */
export function del<T>(endpoint: string, options: Omit<FetchOptions, 'method'> = {}) {
  return fetchWrapper<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Helper function for uploading files
 */
export function uploadFile<T>(
  endpoint: string, 
  file: File | Blob, 
  options: Omit<FetchOptions, 'method' | 'body' | 'headers'> = {}
) {
  const formData = new FormData();
  formData.append('file', file);

  return fetchWrapper<T>(endpoint, {
    ...options,
    method: 'POST',
    body: formData,
    headers: {
      // Don't set Content-Type, let the browser set it with the boundary
    },
  });
}
