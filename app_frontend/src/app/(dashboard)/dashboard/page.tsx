import { getMe } from "@/actions/user-actions";
import RefreshTokenDebugger from "@/components/common/RefreshTokenDebugger";
import ManualRefreshButton from "@/components/common/ManualRefreshButton";

const DashboardPage = async () => {
  const user = await getMe();
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      
      {user ? (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">User Information</h2>
            <div className="p-3 bg-white rounded shadow">
              <p><span className="font-medium">Email:</span> {user.email}</p>
            </div>
          </div>
          
          {/* Server-side refresh token debugging */}
          <RefreshTokenDebugger />
          
          {/* Client-side manual refresh button */}
          <ManualRefreshButton />
          
          {/* Client-side cookie debugging */}
          {/* <CookieDebugger /> */}
        </div>
      ) : (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading...</span>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;


