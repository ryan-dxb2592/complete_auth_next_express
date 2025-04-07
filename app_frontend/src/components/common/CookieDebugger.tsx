"use client";

import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';

const parseCookies = () => {
  if (typeof document === 'undefined') return {};
  
  return document.cookie
    .split(';')
    .map(cookie => cookie.trim())
    .reduce((acc, cookie) => {
      const [name, value] = cookie.split('=');
      if (name && value) {
        acc[name] = decodeURIComponent(value);
      }
      return acc;
    }, {} as Record<string, string>);
};

export default function CookieDebugger() {
  const [cookies, setCookies] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const updateCookies = () => {
      setCookies(parseCookies());
    };
    
    // Initial update
    updateCookies();
    
    // Set up interval to check for cookie changes
    const interval = setInterval(updateCookies, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const testRefreshToken = async () => {
    setLoading(true);
    setStatus('Testing refresh token...');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.post(
        `${apiUrl}/api/v1/auth/refresh-token`,
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      setStatus(`Success! Status: ${response.status}`);
      console.log('Refresh response:', response.data);
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      setStatus(`Error: ${axiosError.message || 'Unknown error'}`);
      console.error('Refresh error:', axiosError);
    } finally {
      setLoading(false);
    }
  };
  
  const clearAllCookies = () => {
    // Clear all cookies by setting them to expire
    Object.keys(cookies).forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
    setCookies({});
    setStatus('All cookies cleared');
  };
  
  return (
    <div className="border rounded-lg p-4 bg-slate-50 my-4">
      <h3 className="text-xl font-bold mb-2">Cookie Debugger</h3>
      
      <div className="my-4">
        <h4 className="font-semibold">Current Cookies:</h4>
        {Object.keys(cookies).length > 0 ? (
          <ul className="my-2 pl-4">
            {Object.entries(cookies).map(([name, value]) => (
              <li key={name} className="text-sm">
                <span className="font-medium">{name}:</span> {value.substring(0, 20)}{value.length > 20 ? '...' : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 my-2">No cookies found</p>
        )}
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={testRefreshToken}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Refresh Token'}
        </button>
        
        <button
          onClick={clearAllCookies}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
        >
          Clear All Cookies
        </button>
      </div>
      
      {status && (
        <div className="mt-3 text-sm">
          <span className="font-semibold">Status:</span> {status}
        </div>
      )}
    </div>
  );
} 