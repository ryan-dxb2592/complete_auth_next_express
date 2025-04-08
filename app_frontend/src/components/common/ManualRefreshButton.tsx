'use client';

import { useState } from 'react';
import { refreshTokenManual } from '@/actions/auth-actions';

type RefreshResult = {
  success: boolean;
  message: string;
  status?: number;
  cookiesBefore?: {
    accessToken: boolean;
    refreshToken: boolean;
  };
  cookiesAfter?: {
    accessToken: boolean;
    refreshToken: boolean;
  };
  error?: Record<string, unknown> | object;
};

export default function ManualRefreshButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RefreshResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const refreshResult = await refreshTokenManual();
      setResult(refreshResult);
      
      if (!refreshResult.success) {
        setError(refreshResult.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error refreshing token:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-slate-50 my-4">
      <h3 className="text-xl font-bold mb-2">Manual Token Refresh</h3>
      
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50 transition"
      >
        {isLoading ? 'Refreshing...' : 'Refresh Token Manually'}
      </button>
      
      {result && (
        <div className="mt-4">
          <h4 className="font-semibold">Result:</h4>
          <div className={`mt-2 px-3 py-2 rounded ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.success ? 'Success!' : 'Failed'}
            </p>
            <p className="text-sm mt-1">{result.message}</p>
            
            {result.cookiesBefore && (
              <div className="mt-2 text-sm">
                <p className="font-medium">Cookies Before:</p>
                <ul className="list-disc list-inside ml-2 mt-1">
                  <li>Access Token: {result.cookiesBefore.accessToken ? 'Present' : 'Not Present'}</li>
                  <li>Refresh Token: {result.cookiesBefore.refreshToken ? 'Present' : 'Not Present'}</li>
                </ul>
              </div>
            )}
            
            {result.cookiesAfter && (
              <div className="mt-2 text-sm">
                <p className="font-medium">Cookies After:</p>
                <ul className="list-disc list-inside ml-2 mt-1">
                  <li>Access Token: {result.cookiesAfter.accessToken ? 'Present' : 'Not Present'}</li>
                  <li>Refresh Token: {result.cookiesAfter.refreshToken ? 'Present' : 'Not Present'}</li>
                </ul>
              </div>
            )}
            
            {result.status && (
              <p className="text-sm mt-2">
                <span className="font-medium">Status Code:</span> {result.status}
              </p>
            )}
            
            {result.error && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">Error Details</summary>
                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(result.error, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}
      
      {error && !result && (
        <div className="mt-3 text-red-600 text-sm">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-4">
        Note: This button uses the server action <code>refreshTokenManual()</code> to trigger a token refresh.
        Refresh results are isolated to this component and won&apos;t automatically update other parts of the UI.
      </p>
    </div>
  );
} 