import { getMe } from "@/actions/user-actions";
import RefreshTokenDebugger from "@/components/common/RefreshTokenDebugger";
import ManualRefreshButton from "@/components/common/ManualRefreshButton";
import CookieDebugger from "@/components/common/CookieDebugger";

const DashboardPage = async () => {
  const user = await getMe();
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      
      
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">User Information</h2>
            <div className="p-3 bg-white rounded shadow">
              <p><span className="font-medium">ID:</span> {user?.id}</p>
              <p><span className="font-medium">Email:</span> {user?.email}</p>
              {user?.name && <p><span className="font-medium">Name:</span> {user?.name}</p>}
              <p><span className="font-medium">Created:</span> {new Date(user?.createdAt).toLocaleDateString()}</p>
              <p><span className="font-medium">Last Updated:</span> {new Date(user?.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          {/* Server-side refresh token debugging */}
          <RefreshTokenDebugger />
          
          {/* Client-side manual refresh button */}
          <ManualRefreshButton />
          
          {/* Client-side cookie debugging */}
          {/* <CookieDebugger /> */}
        </div>
   
    </div>
  );
};

export default DashboardPage;


