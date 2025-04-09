
// import axios from 'axios';
import { refreshTokenManual } from '@/actions/auth-actions';
import { cookies } from 'next/headers';

const RefreshTokenDebugger = async () => {
  // Get cookies from the server-side
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;
  
  
  return (
    <div className="border rounded-lg p-4 bg-slate-50 my-4">
      <h3 className="text-xl font-bold mb-2">Server Refresh Token Debugger</h3>
      
      <div className="my-4">
        <h4 className="font-semibold">Refresh Token Status:</h4>
        <div className="flex items-center my-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${refreshToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{refreshToken ? 'Present' : 'Not Present'}</span>
        </div>
        
        {accessToken && (
          <div className="mt-2">
            <span className="font-medium">Access Token:</span> 
            <span className="text-xs ml-2 text-gray-600">
              {accessToken.substring(0, 15)}...
            </span>
          </div>
        )}
        
        {refreshToken && (
          <div className="mt-2">
            <span className="font-medium">Refresh Token:</span> 
            <span className="text-xs ml-2 text-gray-600">
              {refreshToken.substring(0, 15)}...
            </span>
          </div>
        )}
        
        {accessToken && refreshToken && (
          <div className="mt-3 text-sm">
            <details>
              <summary className="cursor-pointer font-medium">Token Response Data</summary>
              <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto text-xs">
                {JSON.stringify(accessToken, null, 2)}
                {JSON.stringify(refreshToken, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Note:</span> You can use the <code>refreshTokenManual()</code> server action from <code>auth-actions.tsx</code> to programmatically trigger a refresh token request.
          </p>
        </div>
      </div>

      {/* Button to refresh token on server side */}
      <button onClick={refreshTokenManual} className="bg-blue-500 text-white px-4 py-2 rounded-md">
        Refresh Token
      </button>
    </div>
  );
};

export default RefreshTokenDebugger; 