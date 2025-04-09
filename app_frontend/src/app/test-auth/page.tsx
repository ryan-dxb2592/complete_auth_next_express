'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

// Define a type for the user data
interface UserData {
  id: string;
  email: string;
  name?: string;
  [key: string]: string | undefined; // For any additional string properties
}

export default function TestAuthPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/v1/user/me');
        setUserData(response.data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>
      
      {loading && <p>Loading user data...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
        </div>
      )}
      
      {userData && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h2 className="text-xl font-semibold mb-2">User Data:</h2>
          <pre className="whitespace-pre-wrap">{JSON.stringify(userData, null, 2)}</pre>
        </div>
      )}
      
      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">How it works:</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>This page makes an API request to <code>/api/v1/user/me</code> using axios</li>
          <li>The request is intercepted by the Next.js middleware</li>
          <li>If the token is expired (401 response), the middleware refreshes the token</li>
          <li>The original request is retried with the new token</li>
          <li>The response is displayed on this page</li>
        </ol>
      </div>
    </div>
  );
} 