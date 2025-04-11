import 'server-only'

import { cookies } from 'next/headers';


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