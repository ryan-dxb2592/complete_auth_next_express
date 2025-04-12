import RefreshTokenDebugger from "@/components/common/RefreshTokenDebugger";
import ManualRefreshButton from "@/components/common/ManualRefreshButton";
import { getMe } from "@/actions/user-actions";

const DashboardPage = async () => {
  const user = await getMe();

  console.log("User:", user);
 
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      
      
        <div>
          
          
          
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


