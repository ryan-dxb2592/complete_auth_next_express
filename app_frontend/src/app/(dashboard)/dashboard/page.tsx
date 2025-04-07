import { getMe } from "@/actions/user-actions";

const DashboardPage = async () => {

  const user = await getMe();
  
  return <div>{user ? <div>{user.email}</div> : <div>Loading...</div>}</div>;
};

export default DashboardPage;


